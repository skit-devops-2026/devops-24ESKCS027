const store = require('../models/store');

/**
 * Event Host / Teacher Controller
 * Handles assigned event requests, conflict checks, and teacher verification.
 */

// @desc    Get Host Dashboard Statistics & Summary
// @route   GET /api/host/dashboard
// @access  Private (Host, Admin)
const getHostDashboard = async (req, res) => {
  try {
    const hostId = req.user._id;
    const assignedEvents = store.events.filter(e => e.hostId === hostId);

    const pendingReview = assignedEvents.filter(e => e.status === 'HOST_REVIEW');
    const approvedByHost = assignedEvents.filter(e => ['HOST_APPROVED', 'HOD_REVIEW', 'APPROVED', 'PUBLISHED'].includes(e.status));
    const rejectedByHost = assignedEvents.filter(e => e.status === 'HOST_REJECTED');
    const changesRequested = assignedEvents.filter(e => e.status === 'CHANGES_REQUESTED');

    // Run conflict checks on all pending events
    const conflictsSummary = [];
    for (const evt of pendingReview) {
      const conflictCheck = store.checkConflict(evt, evt._id);
      if (conflictCheck.hasConflict) {
        conflictsSummary.push({
          eventId: evt._id,
          eventTitle: evt.title,
          conflicts: conflictCheck.conflicts
        });
      }
    }

    return res.status(200).json({
      success: true,
      collegeName: store.collegeName,
      host: {
        id: req.user._id,
        name: req.user.name,
        department: req.user.department,
        designation: req.user.designation || 'Faculty Member'
      },
      stats: {
        totalAssigned: assignedEvents.length,
        pendingReviewCount: pendingReview.length,
        approvedCount: approvedByHost.length,
        rejectedCount: rejectedByHost.length,
        changesRequestedCount: changesRequested.length,
        conflictAlertsCount: conflictsSummary.length
      },
      pendingEvents: pendingReview,
      conflictAlerts: conflictsSummary
    });
  } catch (error) {
    console.error('Host Dashboard Error:', error);
    return res.status(500).json({ success: false, message: 'Error loading Host dashboard.' });
  }
};

// @desc    Get all events assigned to the current Event Host
// @route   GET /api/host/events
// @access  Private (Host, Admin)
const getAssignedEvents = async (req, res) => {
  try {
    const hostId = req.user._id;
    const { status } = req.query;

    let events = store.events.filter(e => e.hostId === hostId);

    if (status && status !== 'All') {
      events = events.filter(e => e.status.toLowerCase() === status.toLowerCase());
    }

    // Attach conflict info to each event
    const enriched = events.map(e => {
      const conflictCheck = store.checkConflict(e, e._id);
      return {
        ...e,
        hasConflict: conflictCheck.hasConflict,
        conflicts: conflictCheck.conflicts
      };
    });

    return res.status(200).json({
      success: true,
      count: enriched.length,
      events: enriched
    });
  } catch (error) {
    console.error('getAssignedEvents Error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching assigned events.' });
  }
};

// @desc    Check Date/Time/Venue and Teacher Schedule conflict for a requested event
// @route   POST /api/host/check-conflict
// @access  Private (Host, Coordinator, Admin)
const checkEventConflict = async (req, res) => {
  try {
    const { eventId, date, startTime, endTime, venue, hostId } = req.body;

    let eventData = { date, startTime, endTime, venue, hostId: hostId || (req.user ? req.user._id : null) };
    if (eventId && !date) {
      const existing = store.findEventById(eventId);
      if (existing) eventData = existing;
    }

    const result = store.checkConflict(eventData, eventId);

    return res.status(200).json({
      success: true,
      hasConflict: result.hasConflict,
      conflicts: result.conflicts,
      message: result.hasConflict
        ? `Schedule Conflict: ${result.conflicts[0].message}`
        : `No conflicts found. Venue '${eventData.venue}' is available on ${eventData.date} from ${eventData.startTime} to ${eventData.endTime}.`
    });
  } catch (error) {
    console.error('checkEventConflict Error:', error);
    return res.status(500).json({ success: false, message: 'Error checking schedule conflict.' });
  }
};

// @desc    Host Approves event request -> Moves to HOD_REVIEW
// @route   POST /api/host/events/:id/approve
// @access  Private (Host, Admin)
const approveEventRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks, overrideConflict } = req.body;
    const hostUser = req.user;

    const event = store.findEventById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event request not found.' });
    }

    // Check conflict
    const conflictCheck = store.checkConflict(event, event._id);
    if (conflictCheck.hasConflict && !overrideConflict) {
      return res.status(409).json({
        success: false,
        hasConflict: true,
        conflicts: conflictCheck.conflicts,
        message: 'Schedule conflict detected. Please review overlapping event before approval.'
      });
    }

    // Update event status to HOD_REVIEW and record approval history
    const updated = store.updateEvent(id, {
      status: 'HOD_REVIEW',
      hostRemarks: remarks || 'Verified schedule and venue. Approved for HOD final review.',
      hostApprovedAt: new Date().toISOString(),
      conflictOverride: Boolean(overrideConflict),
      historyEntry: {
        actor: hostUser.name,
        role: 'Teacher / Host',
        action: 'HOST_APPROVED',
        comment: remarks || 'Host verified schedule and approved for HOD review.'
      }
    });

    // Create Audit Record
    store.addAuditLog({
      actorId: hostUser._id,
      actorName: hostUser.name,
      actorRole: 'Teacher / Host',
      action: 'HOST_APPROVED',
      targetId: updated._id,
      targetTitle: updated.title,
      remarks: remarks || 'Host approved event for HOD final approval.'
    });

    // Notify HOD
    store.addNotification({
      targetRole: 'admin',
      title: 'New Host-Approved Event Awaiting HOD Decision',
      message: `Teacher ${hostUser.name} verified and approved '${updated.title}'. Pending HOD final approval.`,
      link: '/admin/events?status=HOD_REVIEW'
    });

    // Notify Coordinator / Student
    if (updated.requestedByStudentId || updated.coordinatorId) {
      store.addNotification({
        userId: updated.requestedByStudentId || updated.coordinatorId,
        title: 'Event Proposal Approved by Faculty Host',
        message: `Teacher ${hostUser.name} approved '${updated.title}' and forwarded to HOD for final review.`,
        link: '/coordinator/requests'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Event verified and approved by Host. Forwarded to HOD for final approval.',
      event: updated
    });
  } catch (error) {
    console.error('approveEventRequest Error:', error);
    return res.status(500).json({ success: false, message: 'Error approving event request.' });
  }
};

// @desc    Host Rejects event request
// @route   POST /api/host/events/:id/reject
// @access  Private (Host, Admin)
const rejectEventRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const hostUser = req.user;

    if (!remarks || !remarks.trim()) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required.' });
    }

    const event = store.findEventById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event request not found.' });
    }

    const updated = store.updateEvent(id, {
      status: 'HOST_REJECTED',
      hostRemarks: remarks.trim(),
      historyEntry: {
        actor: hostUser.name,
        role: 'Teacher / Host',
        action: 'HOST_REJECTED',
        comment: remarks.trim()
      }
    });

    store.addAuditLog({
      actorId: hostUser._id,
      actorName: hostUser.name,
      actorRole: 'Teacher / Host',
      action: 'HOST_REJECTED',
      targetId: updated._id,
      targetTitle: updated.title,
      remarks: remarks.trim()
    });

    if (updated.requestedByStudentId || updated.coordinatorId) {
      store.addNotification({
        userId: updated.requestedByStudentId || updated.coordinatorId,
        title: 'Event Request Rejected by Teacher',
        message: `Your event proposal '${updated.title}' was rejected by ${hostUser.name}. Reason: ${remarks.trim()}`,
        link: '/coordinator/requests'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Event request rejected by Host.',
      event: updated
    });
  } catch (error) {
    console.error('rejectEventRequest Error:', error);
    return res.status(500).json({ success: false, message: 'Error rejecting event request.' });
  }
};

// @desc    Host Requests Changes from Coordinator / Student
// @route   POST /api/host/events/:id/request-changes
// @access  Private (Host, Admin)
const requestChanges = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const hostUser = req.user;

    if (!remarks || !remarks.trim()) {
      return res.status(400).json({ success: false, message: 'Change feedback comments are required.' });
    }

    const event = store.findEventById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event request not found.' });
    }

    const updated = store.updateEvent(id, {
      status: 'CHANGES_REQUESTED',
      hostRemarks: remarks.trim(),
      historyEntry: {
        actor: hostUser.name,
        role: 'Teacher / Host',
        action: 'CHANGES_REQUESTED',
        comment: remarks.trim()
      }
    });

    store.addAuditLog({
      actorId: hostUser._id,
      actorName: hostUser.name,
      actorRole: 'Teacher / Host',
      action: 'CHANGES_REQUESTED',
      targetId: updated._id,
      targetTitle: updated.title,
      remarks: remarks.trim()
    });

    if (updated.requestedByStudentId || updated.coordinatorId) {
      store.addNotification({
        userId: updated.requestedByStudentId || updated.coordinatorId,
        title: 'Changes Requested for Event Proposal',
        message: `Teacher ${hostUser.name} requested changes for '${updated.title}': ${remarks.trim()}`,
        link: '/coordinator/requests'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Changes requested from coordinator. Proposal status set to CHANGES_REQUESTED.',
      event: updated
    });
  } catch (error) {
    console.error('requestChanges Error:', error);
    return res.status(500).json({ success: false, message: 'Error requesting changes.' });
  }
};

module.exports = {
  getHostDashboard,
  getAssignedEvents,
  checkEventConflict,
  approveEventRequest,
  rejectEventRequest,
  requestChanges
};
