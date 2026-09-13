const express = require('express');
const router = express.Router();
const {
  browseEvents,
  getEventDetails
} = require('../controllers/studentController');
const { optionalAuth } = require('../middleware/authMiddleware');

// Public/Optional Auth for browsing events (enforces PUBLIC vs COLLEGE_ONLY)
router.get('/', optionalAuth, browseEvents);
router.get('/:id', optionalAuth, getEventDetails);

module.exports = router;
