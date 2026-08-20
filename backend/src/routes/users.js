const express = require('express');
const usersController = require('../controllers/usersController');

const router = express.Router();

// No login required — this app is opened directly and users (clients)
// are added/managed from here.
router.get('/', usersController.list);
router.post('/', usersController.create);
router.get('/:id', usersController.get);
router.delete('/:id', usersController.remove);

router.post('/:id/sheet/preview', usersController.previewSheet);
router.post('/:id/sheet', usersController.linkSheet);
router.delete('/:id/sheet', usersController.unlinkSheet);

router.put('/:id/platforms', usersController.setPlatforms);

module.exports = router;
