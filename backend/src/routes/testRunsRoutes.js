const express = require('express');
const router = express.Router();
const testRunsController = require('../controllers/testRunsController');
const authMiddleware = require('../middleware/authMiddleware');

// Áp dụng middleware cho từng route thay vì dùng router.use()
router.get('/', authMiddleware, testRunsController.getTestRuns);
router.get('/:id', authMiddleware, testRunsController.getTestRunDetails);

module.exports = router; 