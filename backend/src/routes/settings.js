const express = require('express');
const settingsController = require('../controllers/settingsController');

const router = express.Router();

router.get('/', settingsController.get);
router.put('/', settingsController.update);
router.post('/test', settingsController.test);

module.exports = router;
