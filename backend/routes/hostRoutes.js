const express = require('express');
const router = express.Router();
const {
  getHostDashboard,
  getAssignedEvents,
  checkEventConflict,
  approveEventRequest,
  rejectEventRequest,
  requestChanges
} = require('../controllers/hostController');
const { protect, requireHost } = require('../middleware/authMiddleware');

// All Host routes require authentication and Host/Teacher role
router.use(protect, requireHost);

router.get('/dashboard', getHostDashboard);
router.get('/events', getAssignedEvents);
router.post('/check-conflict', checkEventConflict);
router.post('/events/:id/approve', approveEventRequest);
router.post('/events/:id/reject', rejectEventRequest);
router.post('/events/:id/request-changes', requestChanges);

module.exports = router;
