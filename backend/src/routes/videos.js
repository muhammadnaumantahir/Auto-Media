const express = require('express');
const videosController = require('../controllers/videosController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, videosController.list);

module.exports = router;
