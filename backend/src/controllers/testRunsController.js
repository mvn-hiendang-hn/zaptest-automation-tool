const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Lấy danh sách test runs
const getTestRuns = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, pageSize = 10 } = req.query;
    const skip = (page - 1) * pageSize;

    const [runs, totalCount] = await Promise.all([
      prisma.collectionRun.findMany({
        where: {
          userId: userId
        },
        include: {
          collection: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          startedAt: 'desc'
        },
        skip,
        take: parseInt(pageSize)
      }),
      prisma.collectionRun.count({
        where: {
          userId: userId
        }
      })
    ]);

    const formattedRuns = runs.map(run => ({
      id: run.id,
      collectionId: run.collectionId,
      collectionName: run.collection?.name || 'Unknown Collection',
      createdAt: run.startedAt,
      status: run.status,
      totalTests: run.totalTests,
      successCount: run.successCount,
      failureCount: run.failureCount,
      duration: run.totalDuration
    }));

    res.json({
      runs: formattedRuns,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize)
    });
  } catch (error) {
    console.error('Error getting test runs:', error);
    res.status(500).json({
      error: 'Lỗi lấy danh sách test runs'
    });
  }
};

// Lấy chi tiết test run
const getTestRunDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const run = await prisma.collectionRun.findUnique({
      where: {
        id,
        userId
      },
      include: {
        collection: {
          select: {
            name: true
          }
        },
        testResults: {
          include: {
            test: {
              select: {
                id: true,
                name: true,
                method: true,
                url: true
              }
            }
          }
        }
      }
    });

    if (!run) {
      return res.status(404).json({
        error: 'Không tìm thấy test run'
      });
    }

    const formattedRun = {
      id: run.id,
      collectionId: run.collectionId,
      collectionName: run.collection?.name || 'Unknown Collection',
      timestamp: new Date(run.startedAt).getTime(),
      status: run.status,
      totalTests: run.totalTests,
      successCount: run.successCount,
      failureCount: run.failureCount,
      duration: run.totalDuration
    };

    const formattedResults = run.testResults.map(result => ({
      id: result.id,
      testId: result.test.id,
      testName: result.test.name,
      method: result.test.method,
      url: result.test.url,
      statusCode: result.statusCode,
      duration: result.duration,
      error: result.error || null
    }));

    res.json({
      run: formattedRun,
      results: formattedResults
    });
  } catch (error) {
    console.error('Error getting test run details:', error);
    res.status(500).json({
      error: 'Lỗi lấy chi tiết test run'
    });
  }
};

module.exports = {
  getTestRuns,
  getTestRunDetails
}; 