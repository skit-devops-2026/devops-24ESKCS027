const express = require('express');
const router = express.Router();
const {
  login,
  demoLogin,
  registerUser,
  getMe,
  getHostsList
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public auth routes
router.post('/login', login);
router.post('/register', registerUser);
router.post('/register-organizer', registerUser);
router.post('/demo-login', demoLogin);
router.post('/demo-organizer', demoLogin);
router.get('/hosts', getHostsList);

// Protected routes
router.get('/me', protect, getMe);

module.exports = router;
