// Get all collections for a user with pagination
exports.getCollections = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    // Get collections with test count
    const collections = await req.prisma.collection.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // Count total collections for pagination
    const totalCount = await req.prisma.collection.count({
      where: { userId: req.user.id },
    });

    // Get test counts for each collection
    const collectionsWithCounts = await Promise.all(
      collections.map(async (collection) => {
        const testCount = await req.prisma.test.count({
          where: { collectionId: collection.id },
        });
        return {
          ...collection,
          testCount,
        };
      })
    );

    res.json({
      data: collectionsWithCounts,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    });
  } catch (error) {
    console.error('Get collections error:', error);
    res.status(500).json({ message: 'Lỗi khi tải collections: ' + error.message });
  }
};

// Get a single collection by ID
exports.getCollection = async (req, res) => {
  try {
    const { id } = req.params;

    const collection = await req.prisma.collection.findUnique({
      where: { id },
      include: {
        tests: true,
      },
    });

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    // Check if user owns the collection
    if (collection.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(collection);
  } catch (error) {
    console.error('Get collection error:', error);
    res.status(500).json({ message: 'Error fetching collection' });
  }
};

// Create a new collection
exports.createCollection = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    // Check if collection with same name exists
    const existingCollection = await req.prisma.collection.findFirst({
      where: {
        name,
        userId: req.user.id,
      },
    });

    if (existingCollection) {
      return res.status(400).json({ message: 'Collection with this name already exists' });
    }

    const collection = await req.prisma.collection.create({
      data: {
        name,
        description,
        userId: req.user.id,
      },
    });

    // Return collection with additional info needed by frontend
    const result = {
      id: collection.id,
      name: collection.name,
      description: collection.description,
      createdAt: collection.createdAt.getTime(),
      testCount: 0,
    };

    return res.status(201).json(result);
  } catch (error) {
    console.error('Create collection error:', error);
    return res.status(500).json({ message: 'Error creating collection' });
  }
};

// Update a collection
exports.updateCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Check if collection exists
    const collection = await req.prisma.collection.findUnique({
      where: { id },
    });

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    // Check if user owns the collection
    if (collection.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check for name uniqueness if changing name
    if (name && name !== collection.name) {
      const existingCollection = await req.prisma.collection.findFirst({
        where: {
          name,
          userId: req.user.id,
          id: { not: id },
        },
      });

      if (existingCollection) {
        return res.status(400).json({ message: 'Collection with this name already exists' });
      }
    }

    const updatedCollection = await req.prisma.collection.update({
      where: { id },
      data: {
        name: name || undefined,
        description: description !== undefined ? description : undefined,
      },
    });

    res.json(updatedCollection);
  } catch (error) {
    console.error('Update collection error:', error);
    res.status(500).json({ message: 'Error updating collection' });
  }
};

// Delete a collection
exports.deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if collection exists
    const collection = await req.prisma.collection.findUnique({
      where: { id },
    });

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    // Check if user owns the collection
    if (collection.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await req.prisma.collection.delete({
      where: { id },
    });

    res.json({ message: 'Collection deleted' });
  } catch (error) {
    console.error('Delete collection error:', error);
    res.status(500).json({ message: 'Error deleting collection' });
  }
};

// Run a collection
exports.runCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { runService } = require('../services/runService');

    // Check if collection exists
    const collection = await req.prisma.collection.findUnique({
      where: { id },
      include: {
        tests: true,
      },
    });

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    // Check if user owns the collection
    if (collection.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if collection has tests
    if (collection.tests.length === 0) {
      return res.status(400).json({ message: 'Collection has no tests' });
    }

    // Run the collection
    const result = await runService.runCollection(req.prisma, collection, req.user.id);

    res.json(result);
  } catch (error) {
    console.error('Run collection error:', error);
    res.status(500).json({ message: 'Error running collection' });
  }
};

// Get tests in a collection
exports.getTestsInCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    // Check if collection exists and user has access
    const collection = await req.prisma.collection.findUnique({
      where: { id },
    });

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    if (collection.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const tests = await req.prisma.test.findMany({
      where: {
        collectionId: id,
        userId: req.user.id,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    });

    const totalCount = await req.prisma.test.count({
      where: {
        collectionId: id,
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
