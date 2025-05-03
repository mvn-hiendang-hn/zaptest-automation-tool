// Get all tests for a user
exports.getTests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const tests = await req.prisma.test.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        collection: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const totalCount = await req.prisma.test.count({
      where: { userId: req.user.id },
    });

    res.json({
      data: tests,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    });
  } catch (error) {
    console.error('Get tests error:', error);
    res.status(500).json({ message: 'Error fetching tests' });
  }
};

// Validate test name in collection
exports.validateTestName = async (req, res) => {
  try {
    const { name, collectionId } = req.query;

    if (!name || !collectionId) {
      return res.status(400).json({ message: 'Name and collection ID are required' });
    }

    const existingTest = await req.prisma.test.findFirst({
      where: {
        name,
        collectionId,
        userId: req.user.id,
      },
    });

    res.json({ isDuplicate: !!existingTest });
  } catch (error) {
    console.error('Validate test name error:', error);
    res.status(500).json({ message: 'Error validating test name' });
  }
}

// Get tests in a collection
exports.getTestsInCollection = async (req, res) => {
  try {
    const { collectionId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    // Check if collection exists and user has access
    const collection = await req.prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    if (collection.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const tests = await req.prisma.test.findMany({
      where: {
        collectionId,
        userId: req.user.id,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    });

    const totalCount = await req.prisma.test.count({
      where: {
        collectionId,
        userId: req.user.id,
      },
    });

    res.json({
      data: tests,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    });
  } catch (error) {
    console.error('Get tests in collection error:', error);
    res.status(500).json({ message: 'Error fetching tests' });
  }
};

// Get a single test by ID
exports.getTest = async (req, res) => {
  try {
    const { id } = req.params;

    const test = await req.prisma.test.findUnique({
      where: { id },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Check if user owns the test
    if (test.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(test);
  } catch (error) {
    console.error('Get test error:', error);
    res.status(500).json({ message: 'Error fetching test' });
  }
};

// Create a new test
exports.createTest = async (req, res) => {
  try {
    const { name, method, url, headers, body, collectionId, statusCode } = req.body;

    if (!name || !method || !url) {
      return res.status(400).json({ message: 'Name, method, and URL are required' });
    }

    // Check if collection exists if provided
    if (collectionId) {
      const collection = await req.prisma.collection.findUnique({
        where: { id: collectionId },
      });

      if (!collection) {
        return res.status(404).json({ message: 'Collection not found' });
      }

      if (collection.userId !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to add to this collection' });
      }
    }

    // Check if test with same name exists in collection
    if (collectionId) {
      const existingTest = await req.prisma.test.findFirst({
        where: {
          name,
          collectionId,
          userId: req.user.id,
        },
      });

      if (existingTest) {
        return res.status(400).json({ message: 'Test with this name already exists in the collection' });
      }
    }

    const test = await req.prisma.test.create({
      data: {
        name,
        method,
        url,
        headers: headers || {},
        body,
        statusCode,
        userId: req.user.id,
        collectionId: collectionId || null,
      },
    });

    res.status(201).json(test);
  } catch (error) {
    console.error('Create test error:', error);
    res.status(500).json({ message: 'Error creating test' });
  }
};

// Update a test
exports.updateTest = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, method, url, headers, body, collectionId, statusCode } = req.body;

    // Check if test exists
    const test = await req.prisma.test.findUnique({
      where: { id },
    });

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Check if user owns the test
    if (test.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if collection exists if provided
    if (collectionId && collectionId !== test.collectionId) {
      const collection = await req.prisma.collection.findUnique({
        where: { id: collectionId },
      });

      if (!collection) {
        return res.status(404).json({ message: 'Collection not found' });
      }

      if (collection.userId !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to add to this collection' });
      }

      // Check if test with same name exists in new collection
      if (name) {
        const existingTest = await req.prisma.test.findFirst({
          where: {
            name,
            collectionId,
            userId: req.user.id,
            id: { not: id },
          },
        });

        if (existingTest) {
          return res.status(400).json({ message: 'Test with this name already exists in the collection' });
        }
      }
    }

    const updatedTest = await req.prisma.test.update({
      where: { id },
      data: {
        name: name || undefined,
        method: method || undefined,
        url: url || undefined,
        headers: headers !== undefined ? headers : undefined,
        body: body !== undefined ? body : undefined,
        statusCode: statusCode || undefined,
        collectionId: collectionId !== undefined ? collectionId : undefined,
      },
    });

    res.json(updatedTest);
  } catch (error) {
    console.error('Update test error:', error);
    res.status(500).json({ message: 'Error updating test' });
  }
};

// Delete a test
exports.deleteTest = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if test exists
    const test = await req.prisma.test.findUnique({
      where: { id },
    });

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Check if user owns the test
    if (test.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await req.prisma.test.delete({
      where: { id },
    });

    res.json({ message: 'Test deleted' });
  } catch (error) {
    console.error('Delete test error:', error);
    res.status(500).json({ message: 'Error deleting test' });
  }
};

// Run a single test
exports.runTest = async (req, res) => {
  try {
    const { id } = req.params;
    const { runService } = require('../services/runService');

    // Check if test exists
    const test = await req.prisma.test.findUnique({
      where: { id },
    });

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Check if user owns the test
    if (test.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Run the test
    const result = await runService.runSingleTest(req.prisma, test, req.user.id);

    res.json(result);
  } catch (error) {
    console.error('Run test error:', error);
    res.status(500).json({ message: 'Error running test' });
  }
};
