
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getCollections,
  getCollection,
  createCollection,
  updateCollection,
  deleteCollection,
  runCollection,
  getTestsInCollection
} = require('../controllers/collectionController');

router.use(protect);

router.route('/')
  .get(getCollections)
  .post(createCollection);

router.route('/:id')
  .get(getCollection)
  .put(updateCollection)
  .delete(deleteCollection);

router.post('/:id/run', runCollection);
router.get('/:id/tests', getTestsInCollection);

module.exports = router;
