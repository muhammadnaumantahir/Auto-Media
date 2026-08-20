const express = require('express');
const sheetsController = require('../controllers/sheetsController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/preview', requireAuth, sheetsController.previewHeaders);
router.post('/connect', requireAuth, sheetsController.connect);
router.post('/disconnect', requireAuth, sheetsController.disconnect);

module.exports = router;
