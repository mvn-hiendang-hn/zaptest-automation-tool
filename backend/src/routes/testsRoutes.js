const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Middleware xác thực
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // TODO: Xác thực token
  next();
};

// Lấy danh sách tests
router.get('/', authenticateToken, async (req, res) => {
  try {
    const tests = await prisma.test.findMany({
      where: {
        userId: req.user.id
      }
    });
    res.json(tests);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching tests' });
  }
});

// Tạo test mới
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, method, url, headers, body, collectionId } = req.body;
    
    const test = await prisma.test.create({
      data: {
        name,
        method,
        url,
        headers: JSON.stringify(headers),
        body: JSON.stringify(body),
        userId: req.user.id,
        collectionId
      }
    });

    res.status(201).json(test);
  } catch (error) {
    res.status(500).json({ error: 'Error creating test' });
  }
});

// Lấy test theo ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const test = await prisma.test.findUnique({
      where: {
        id: req.params.id
      }
    });

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    res.json(test);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching test' });
  }
});

// Cập nhật test
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, method, url, headers, body, collectionId } = req.body;
    
    const test = await prisma.test.update({
      where: {
        id: req.params.id
      },
      data: {
        name,
        method,
        url,
        headers: JSON.stringify(headers),
        body: JSON.stringify(body),
        collectionId
      }
    });

    res.json(test);
  } catch (error) {
    res.status(500).json({ error: 'Error updating test' });
  }
});

// Xóa test
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.test.delete({
      where: {
        id: req.params.id
      }
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting test' });
  }
});

module.exports = router; 