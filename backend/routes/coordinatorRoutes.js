const express = require('express');
const router = express.Router();
const {
  getStudentRequests,
  createCoordinatorEvent,
  resubmitEventRequest,
  assignHostAndForward
} = require('../controllers/coordinatorController');
const { protect, requireCoordinator } = require('../middleware/authMiddleware');

// All coordinator routes require coordinator/organizer or admin role
router.use(protect, requireCoordinator);

router.get('/requests', getStudentRequests);
router.post('/events', createCoordinatorEvent);
router.put('/events/:id', resubmitEventRequest);
router.post('/events/:id/resubmit', resubmitEventRequest);
router.post('/events/:id/assign-host', assignHostAndForward);

module.exports = router;
