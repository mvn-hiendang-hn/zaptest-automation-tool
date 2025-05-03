// Get test run history for a user
exports.getRunHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const runs = await req.prisma.collectionRun.findMany({
      where: { userId: req.user.id },
      orderBy: { startedAt: 'desc' },
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

    const totalCount = await req.prisma.collectionRun.count({
      where: { userId: req.user.id },
    });

    // Format the runs data to match frontend expectations
    const formattedRuns = runs.map(run => ({
      id: run.id,
      collectionId: run.collectionId,
      collectionName: run.collection.name,
      timestamp: new Date(run.startedAt).getTime(),
      status: run.status === 'completed' ? 'completed' : 
             run.status === 'running' || run.status === 'in_progress' ? 'running' : 'failed',
      totalTests: run.totalTests || 0,
      successCount: run.successCount || 0,
      failureCount: run.failureCount || 0,
      duration: run.totalDuration || 0
    }));

    res.json({
      runs: formattedRuns,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    });
  } catch (error) {
    console.error('Get run history error:', error);
    res.status(500).json({ message: 'Error fetching run history' });
  }
};

// Get details of a specific run
exports.getRunDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const run = await req.prisma.collectionRun.findUnique({
      where: { id },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
          },
        },
        testResults: {
          include: {
            test: {
              select: {
                id: true,
                name: true,
                method: true,
                url: true,
              },
            },
          },
        },
      },
    });

    if (!run) {
      return res.status(404).json({ message: 'Run not found' });
    }

    // Check if user owns the run
    if (run.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Format the results
    const formattedResults = run.testResults.map(result => ({
      id: result.id,
      testId: result.test.id,
      testName: result.test.name,
      method: result.test.method,
      url: result.test.url,
      statusCode: result.statusCode,
      duration: result.duration,
      error: result.error || null,
      response: result.response || null,
    }));

    // Format the run data to match frontend expectations
    const formattedRun = {
      id: run.id,
      collectionId: run.collectionId,
      collectionName: run.collection.name,
      timestamp: new Date(run.startedAt).getTime(),
      status: run.status === 'completed' ? 'completed' : 
             run.status === 'running' || run.status === 'in_progress' ? 'running' : 'failed',
      totalTests: run.totalTests || 0,
      successCount: run.successCount || 0,
      failureCount: run.failureCount || 0,
      duration: run.totalDuration || 0
    };

    res.json({
      run: formattedRun,
      results: formattedResults,
    });
  } catch (error) {
    console.error('Get run details error:', error);
    res.status(500).json({ message: 'Error fetching run details' });
  }
};

// Send email report for a run
exports.sendEmailReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const run = await req.prisma.collectionRun.findUnique({
      where: { id },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
          },
        },
        testResults: {
          include: {
            test: {
              select: {
                id: true,
                name: true,
                method: true,
                url: true,
              },
            },
          },
        },
      },
    });

    if (!run) {
      return res.status(404).json({ message: 'Run not found' });
    }

    // Check if user owns the run
    if (run.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Send email report
    // Note: In a real application, you would implement email sending here
    // For this example, we'll just simulate it
    console.log(`Sending email report for run ${id} to ${email}`);

    res.json({ message: 'Email report sent' });
  } catch (error) {
    console.error('Send email report error:', error);
    res.status(500).json({ message: 'Error sending email report' });
  }
};
