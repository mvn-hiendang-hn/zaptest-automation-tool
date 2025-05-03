
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getSchedules,
  getSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  toggleScheduleStatus,
  runSchedule
} = require('../controllers/scheduleController');

router.use(protect);

router.route('/')
  .get(getSchedules)
  .post(createSchedule);

router.route('/:id')
  .get(getSchedule)
  .put(updateSchedule)
  .delete(deleteSchedule);

router.patch('/:id/toggle', toggleScheduleStatus);
router.post('/:id/run', runSchedule);

module.exports = router;
