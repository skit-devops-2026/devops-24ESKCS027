const express = require('express');
const router = express.Router();
const {
  submitEventRequest,
  getMyEventRequests,
  getStudentProfile,
  updateStudentProfile,
  getStudentStats
} = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');

// Student routes (protected)
router.use(protect);

router.post('/event-requests', submitEventRequest);
router.get('/event-requests', getMyEventRequests);
router.get('/profile', getStudentProfile);
router.put('/profile', updateStudentProfile);
router.get('/stats', getStudentStats);

module.exports = router;
