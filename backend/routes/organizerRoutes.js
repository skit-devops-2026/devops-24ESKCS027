const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getOrganizerEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  updateEventStatus,
  getEventRegistrations,
  updateRegistrationStatus,
  getProfile,
  updateProfile,
} = require('../controllers/organizerController');
const { protect, requireOrganizer } = require('../middleware/authMiddleware');

// All organizer routes are protected and require organizer role
router.use(protect);
router.use(requireOrganizer);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// Profile
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Events CRUD & Status
router.get('/events', getOrganizerEvents);
router.post('/events', createEvent);
router.get('/events/:id', getEventById);
router.put('/events/:id', updateEvent);
router.delete('/events/:id', deleteEvent);
router.patch('/events/:id/status', updateEventStatus);

// Registrations for event
router.get('/events/:id/registrations', getEventRegistrations);
router.patch('/events/:id/registrations/:regId', updateRegistrationStatus);

module.exports = router;
