
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getRunHistory,
  getRunDetails,
  sendEmailReport
} = require('../controllers/runController');

router.use(protect);

router.get('/', getRunHistory);
router.get('/:id', getRunDetails);
router.post('/:id/email', sendEmailReport);

module.exports = router;
