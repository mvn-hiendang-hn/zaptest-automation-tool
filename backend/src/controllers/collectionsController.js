const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Kiểm tra tên collection có tồn tại không
const checkNameUniqueness = async (req, res) => {
  try {
    const { name, id } = req.body;
    const userId = req.user.id;

    // Tìm collection có cùng tên và cùng user
    const existingCollection = await prisma.collection.findFirst({
      where: {
        name: name,
        userId: userId,
        NOT: {
          id: id || undefined
        }
      }
    });

    res.json({
      isUnique: !existingCollection
    });
  } catch (error) {
    console.error('Error checking collection name:', error);
    res.status(500).json({
      error: 'Lỗi kiểm tra tên collection'
    });
  }
};

// Kiểm tra tên test có tồn tại trong collection không
const checkTestNameUniqueness = async (req, res) => {
  try {
    const { name, collectionId } = req.body;
    const userId = req.user.id;

    // Tìm test có cùng tên trong cùng collection
    const existingTest = await prisma.test.findFirst({
      where: {
        name: name,
        collectionId: collectionId,
        collection: {
          userId: userId
        }
      }
    });

    res.json({
      isUnique: !existingTest
    });
  } catch (error) {
    console.error('Error checking test name:', error);
    res.status(500).json({
      error: 'Lỗi kiểm tra tên test'
    });
  }
};

// Lấy danh sách collections
const getCollections = async (req, res) => {
  try {
    const userId = req.user.id;
    const collections = await prisma.collection.findMany({
      where: {
        userId: userId
      },
      include: {
        _count: {
          select: {
            tests: true
          }
        }
      }
    });

    // Chuyển đổi dữ liệu để thêm testCount
    const formattedCollections = collections.map(collection => ({
      ...collection,
      testCount: collection._count.tests
    }));

    res.json({
      data: formattedCollections
    });
  } catch (error) {
    console.error('Error getting collections:', error);
    res.status(500).json({
      error: 'Lỗi lấy danh sách collections'
    });
  }
};

// Tạo collection mới
const createCollection = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!name?.trim()) {
      return res.status(400).json({
        error: 'Tên collection không được để trống'
      });
    }

    // Kiểm tra tên collection có tồn tại chưa
    const existingCollection = await prisma.collection.findFirst({
      where: {
        name: name.trim(),
        userId: userId
      }
    });

    if (existingCollection) {
      return res.status(400).json({
        error: 'Collection với tên này đã tồn tại'
      });
    }

    // Tạo collection mới
    const collection = await prisma.collection.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        userId
      }
    });

    // Trả về kết quả với format phù hợp
    return res.status(201).json({
      data: {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        userId: collection.userId,
        createdAt: collection.createdAt.getTime(),
        testCount: 0
      }
    });

  } catch (error) {
    console.error('Error creating collection:', error);
    return res.status(500).json({
      error: 'Lỗi khi tạo collection'
    });
  }
};

// Cập nhật collection
const updateCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const userId = req.user.id;

    const collection = await prisma.collection.update({
      where: {
        id,
        userId
      },
      data: {
        name,
        description
      }
    });

    res.json({
      data: collection
    });
  } catch (error) {
    console.error('Error updating collection:', error);
    res.status(500).json({
      error: 'Lỗi cập nhật collection'
    });
  }
};

// Xóa collection
const deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await prisma.collection.delete({
      where: {
        id,
        userId
      }
    });

    res.json({
      message: 'Xóa collection thành công'
    });
  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).json({
      error: 'Lỗi xóa collection'
    });
  }
};

// Lấy danh sách tests của một collection
const getTestsForCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const tests = await prisma.test.findMany({
      where: {
        collectionId: id,
        collection: {
          userId: userId
        }
      },
      select: {
        id: true,
        name: true,
        method: true,
        url: true,
        headers: true,
        body: true,
        statusCode: true,
        createdAt: true
      }
    });

    // Chuyển đổi dữ liệu về đúng cấu trúc
    const formattedTests = tests.map(test => ({
      id: test.id,
      name: test.name,
      timestamp: new Date(test.createdAt).getTime(),
      request: {
        method: test.method,
        url: test.url,
        headers: test.headers || {},
        body: test.body || ''
      },
      responseStatus: test.statusCode
    }));

    res.json(formattedTests);
  } catch (error) {
    console.error('Error getting tests for collection:', error);
    res.status(500).json({
      error: 'Lỗi lấy danh sách tests'
    });
  }
};

// Thêm test vào collection
const addTestToCollection = async (req, res) => {
  try {
    const { collectionId, testId } = req.body;
    const userId = req.user.id;

    // Kiểm tra xem collection có thuộc về user không
    const collection = await prisma.collection.findUnique({
      where: {
        id: collectionId,
        userId
      }
    });

    if (!collection) {
      return res.status(404).json({
        error: 'Không tìm thấy collection'
      });
    }

    // Kiểm tra xem test có thuộc về user không
    const test = await prisma.test.findUnique({
      where: {
        id: testId,
        userId
      }
    });

    if (!test) {
      return res.status(404).json({
        error: 'Không tìm thấy test'
      });
    }

    // Thêm test vào collection
    await prisma.test.update({
      where: {
        id: testId
      },
      data: {
        collectionId
      }
    });

    res.json({
      message: 'Đã thêm test vào collection'
    });
  } catch (error) {
    console.error('Error adding test to collection:', error);
    res.status(500).json({
      error: 'Lỗi thêm test vào collection'
    });
  }
};

// Chạy collection
const runCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Lấy collection và các tests của nó
    const collection = await prisma.collection.findUnique({
      where: {
        id,
        userId
      },
      include: {
        tests: true
      }
    });

    if (!collection) {
      return res.status(404).json({
        error: 'Không tìm thấy collection'
      });
    }

    // Tạo collection run mới
    const collectionRun = await prisma.collectionRun.create({
      data: {
        status: 'running',
        totalTests: collection.tests.length,
        userId,
        collectionId: id
      }
    });

    // Chạy từng test trong collection
    const testResults = [];
    let successCount = 0;
    let failureCount = 0;
    let totalDuration = 0;

    for (const test of collection.tests) {
      try {
        const startTime = Date.now();
        
        // Gọi API
        const response = await fetch(test.url, {
          method: test.method,
          headers: test.headers || {},
          body: test.body || undefined
        });

        const duration = Date.now() - startTime;
        totalDuration += duration;

        // Lưu kết quả
        const testResult = await prisma.testResult.create({
          data: {
            statusCode: response.status,
            duration,
            response: await response.json(),
            testId: test.id,
            collectionRunId: collectionRun.id
          }
        });

        testResults.push(testResult);
        if (response.ok) {
          successCount++;
        } else {
          failureCount++;
        }
      } catch (error) {
        failureCount++;
        await prisma.testResult.create({
          data: {
            statusCode: 0,
            duration: 0,
            error: error.message,
            testId: test.id,
            collectionRunId: collectionRun.id
          }
        });
      }
    }

    // Cập nhật collection run
    await prisma.collectionRun.update({
      where: {
        id: collectionRun.id
      },
      data: {
        status: 'completed',
        completedAt: new Date(),
        successCount,
        failureCount,
        totalDuration
      }
    });

    res.json({
      message: 'Chạy collection thành công',
      data: {
        collectionRun,
        testResults
      }
    });
  } catch (error) {
    console.error('Error running collection:', error);
    res.status(500).json({
      error: 'Lỗi chạy collection'
    });
  }
};

module.exports = {
  checkNameUniqueness,
  checkTestNameUniqueness,
  getCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  getTestsForCollection,
  addTestToCollection,
  runCollection
};