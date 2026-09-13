const express = require('express');
const router = express.Router();
const {
  registerForEvent,
  externalRegisterForEvent,
  getMyRegisteredEvents,
  cancelEventRegistration
} = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');

// Public endpoint for External Visitors (only for PUBLIC events with registrationAccess === 'PUBLIC')
router.post('/external', externalRegisterForEvent);

// Protected endpoints for College Students
router.post('/', protect, registerForEvent);
router.get('/my-events', protect, getMyRegisteredEvents);
router.delete('/:eventId', protect, cancelEventRegistration);

module.exports = router;
