const express = require('express');
const router = express.Router();
const schedulesController = require('../controllers/schedulesController');
const authMiddleware = require('../middleware/authMiddleware');

// Áp dụng middleware cho từng route thay vì dùng router.use()
router.post('/check-name', authMiddleware, schedulesController.checkNameUniqueness);
router.get('/', authMiddleware, schedulesController.getSchedules);
router.post('/', authMiddleware, schedulesController.createSchedule);
router.put('/:id', authMiddleware, schedulesController.updateSchedule);
router.delete('/:id', authMiddleware, schedulesController.deleteSchedule);
router.put('/:id/status', authMiddleware, schedulesController.updateScheduleStatus);
router.post('/:id/run', authMiddleware, schedulesController.runSchedule);

module.exports = router; 