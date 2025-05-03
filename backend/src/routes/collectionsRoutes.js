const express = require('express');
const router = express.Router();
const collectionsController = require('../controllers/collectionsController');
const authMiddleware = require('../middleware/authMiddleware');

// Áp dụng middleware cho từng route thay vì dùng router.use()
router.post('/check-name', authMiddleware, collectionsController.checkNameUniqueness);
router.post('/check-test-name', authMiddleware, collectionsController.checkTestNameUniqueness);
router.get('/', authMiddleware, collectionsController.getCollections);
router.post('/', authMiddleware, collectionsController.createCollection);
router.put('/:id', authMiddleware, collectionsController.updateCollection);
router.delete('/:id', authMiddleware, collectionsController.deleteCollection);
router.get('/:id/tests', authMiddleware, collectionsController.getTestsForCollection);
router.post('/add-test', authMiddleware, collectionsController.addTestToCollection);
router.post('/:id/run', authMiddleware, collectionsController.runCollection);

module.exports = router; 