const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const testController = require('../controllers/testController');

router.use(authMiddleware);

router.get('/validate', testController.validateTestName);
router.get('/', testController.getTests);
router.post('/', testController.createTest);
router.get('/collection/:collectionId', testController.getTestsInCollection);
router.get('/:id', testController.getTest);
router.put('/:id', testController.updateTest);
router.delete('/:id', testController.deleteTest);
router.post('/:id/run', testController.runTest);

module.exports = router;
