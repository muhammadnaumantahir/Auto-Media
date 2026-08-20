const express = require('express');
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', requireAuth, authController.me);
router.get('/google', authController.googleAuthUrl);
router.get('/google/callback', authController.googleCallback);

module.exports = router;
