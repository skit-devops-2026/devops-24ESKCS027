const express = require('express');

const {
  login,
  demoLogin,
  registerUser,
  registerOrganizer,
  getMe,
  getHostsList
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Login
router.post('/login', login);

// Demo login
router.post('/demo-login', demoLogin);

// Demo organizer login
router.post('/demo-organizer', (req, res) => {
  req.body = {
    ...(req.body || {}),
    role: 'organizer'
  };

  return demoLogin(req, res);
});

// General registration
router.post('/register', registerUser);

// Organizer registration
router.post('/register-organizer', registerOrganizer);

// Current user
router.get('/me', protect, getMe);

// Hosts list
router.get('/hosts', getHostsList);

module.exports = router;