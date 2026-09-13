const store = require('../models/store');

/**
 * Event Coordinator Controller
 * Manages student coordinator proposals, host selections, change requests, and resubmissions.
 */

// @desc    Get all Student Event Requests for Coordinator
// @route   GET /api/coordinator/requests
// @access  Private (Coordinator, Admin)
const getStudentRequests = async (req, res) => {
  try {
    const { status, search, category } = req.query;

    let requests = store.events.filter(e =>
      Boolean(e.requestedByStudentId || e.coordinatorId || ['SUBMITTED', 'COORDINATOR_REVIEW', 'HOST_REVIEW', 'CHANGES_REQUESTED', 'HOST_APPROVED', 'HOD_REVIEW', 'APPROVED', 'PUBLISHED', 'REJECTED', 'HOST_REJECTED', 'HOD_REJECTED'].includes(e.status))
    );

    if (status && status !== 'All') {
      requests = requests.filter(r => r.status.toLowerCase() === status.toLowerCase());
    }

    if (category && category !== 'All') {
      requests = requests.filter(r => r.category && r.category.toLowerCase() === category.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      requests = requests.filter(r =>
        r.title.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        (r.requestedByStudentName && r.requestedByStudentName.toLowerCase().includes(q))
      );
    }

    // Attach conflict info to requests
    const enriched = requests.map(r => {
      const conflictCheck = store.checkConflict(r, r._id);
      return {
        ...r,
        hasConflict: conflictCheck.hasConflict,
        conflicts: conflictCheck.conflicts
      };
    });

    return res.status(200).json({
      success: true,
      collegeName: store.collegeName,
      count: enriched.length,
      requests: enriched,
      availableHosts: store.hosts,
      availableVenues: require('../models/store').COLLEGE_VENUES,
      availableDepartments: require('../models/store').COLLEGE_DEPARTMENTS
    });
  } catch (error) {
    console.error('getStudentRequests Error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching student requests.' });
  }
};

// @desc    Coordinator Creates / Submits a New Event Proposal
// @route   POST /api/coordinator/events
// @access  Private (Coordinator, Admin)
const createCoordinatorEvent = async (req, res) => {
  try {
    const coordinatorUser = req.user;
    const {
      title,
      description,
      category,
      eventType,
      department,
      date,
      startTime,
      endTime,
      venue,
      expectedParticipants,
      maxCapacity,
      visibility,
      registrationAccess,
      purpose,
      requiredResources,
      hostId
    } = req.body;

    if (!title || !description || !date || !venue) {
      return res.status(400).json({
        success: false,
        message: 'Please provide event title, description, date, and venue.'
      });
    }

    const capacity = parseInt(expectedParticipants || maxCapacity || 100);

    // Look up selected host if provided
    let host = null;
    if (hostId) {
      host = store.hosts.find(h => h.id === hostId || h._id === hostId);
    }

    const newEvent = store.createEvent({
      title: title.trim(),
      description: description.trim(),
      category: category || 'Technical',
      eventType: eventType || category || 'Workshop',
      department: department || coordinatorUser.department || 'Computer Science & Engineering',
      date: date.split('T')[0],
      startTime: startTime || '09:00',
      endTime: endTime || '17:00',
      venue: venue.trim(),
      capacity,
      maxCapacity: capacity,
      totalSeats: capacity,
      availableSeats: capacity,
      visibility: visibility === 'PUBLIC' ? 'PUBLIC' : 'COLLEGE_ONLY',
      registrationAccess: registrationAccess === 'PUBLIC' ? 'PUBLIC' : 'COLLEGE_STUDENTS_ONLY',
      purpose: purpose || description,
      requiredResources: requiredResources || 'Standard hall equipment',
      status: host ? 'HOST_REVIEW' : 'SUBMITTED',
      organizerId: coordinatorUser._id,
      organizerName: coordinatorUser.name,
      coordinatorId: coordinatorUser._id,
      coordinatorName: coordinatorUser.name,
      hostId: host ? (host.id || host._id) : null,
      hostName: host ? host.name : null,
      hostDepartment: host ? host.department : null,
      approvalHistory: [
        {
          actor: coordinatorUser.name,
          role: 'Coordinator',
          action: 'SUBMITTED',
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          comment: host ? `Proposal submitted with ${host.name} selected as Host.` : 'Proposal submitted.'
        }
      ]
    });

    store.addAuditLog({
      actorId: coordinatorUser._id,
      actorName: coordinatorUser.name,
      actorRole: 'Coordinator',
      action: 'EVENT_REQUESTED',
      targetId: newEvent._id,
      targetTitle: newEvent.title,
      remarks: `Coordinator created proposal for '${newEvent.title}'.`
    });

    if (host) {
      store.addNotification({
        targetRole: 'host',
        userId: host.id || host._id,
        title: 'New Event Proposal Assigned for Review',
        message: `Coordinator ${coordinatorUser.name} submitted '${newEvent.title}' requesting your faculty review.`,
        link: '/api/host/events'
      });
    }

    return res.status(201).json({
      success: true,
      message: host
        ? `Event proposal created and forwarded to Teacher ${host.name} for schedule review.`
        : 'Event proposal created successfully.',
      event: newEvent
    });
  } catch (error) {
    console.error('createCoordinatorEvent Error:', error);
    return res.status(500).json({ success: false, message: 'Error creating event proposal.' });
  }
};

// @desc    Coordinator Edits & Resubmits Proposal after CHANGES_REQUESTED
// @route   PUT /api/coordinator/events/:id or POST /api/coordinator/events/:id/resubmit
// @access  Private (Coordinator, Admin)
const resubmitEventRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const coordinatorUser = req.user;
    const {
      title,
      description,
      category,
      eventType,
      department,
      date,
      startTime,
      endTime,
      venue,
      expectedParticipants,
      maxCapacity,
      visibility,
      registrationAccess,
      purpose,
      requiredResources,
      hostId,
      resubmissionComment
    } = req.body;

    const event = store.findEventById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event proposal not found.' });
    }

    let host = null;
    if (hostId) {
      host = store.hosts.find(h => h.id === hostId || h._id === hostId);
    } else if (event.hostId) {
      host = store.hosts.find(h => h.id === event.hostId || h._id === event.hostId);
    }

    const capacity = parseInt(expectedParticipants || maxCapacity || event.capacity || 100);

    const updated = store.updateEvent(id, {
      ...(title && { title: title.trim() }),
      ...(description && { description: description.trim() }),
      ...(category && { category }),
      ...(eventType && { eventType }),
      ...(department && { department }),
      ...(date && { date: date.split('T')[0] }),
      ...(startTime && { startTime }),
      ...(endTime && { endTime }),
      ...(venue && { venue: venue.trim() }),
      capacity,
      maxCapacity: capacity,
      totalSeats: capacity,
      availableSeats: capacity,
      ...(visibility && { visibility: visibility === 'PUBLIC' ? 'PUBLIC' : 'COLLEGE_ONLY' }),
      ...(registrationAccess && { registrationAccess: registrationAccess === 'PUBLIC' ? 'PUBLIC' : 'COLLEGE_STUDENTS_ONLY' }),
      ...(purpose && { purpose }),
      ...(requiredResources && { requiredResources }),
      ...(host && {
        hostId: host.id || host._id,
        hostName: host.name,
        hostDepartment: host.department
      }),
      status: 'HOST_REVIEW', // Resets to Host Review
      historyEntry: {
        actor: coordinatorUser.name,
        role: 'Coordinator',
        action: 'RESUBMITTED',
        comment: resubmissionComment || 'Proposal updated and resubmitted to Event Host for review.'
      }
    });

    store.addAuditLog({
      actorId: coordinatorUser._id,
      actorName: coordinatorUser.name,
      actorRole: 'Coordinator',
      action: 'EVENT_RESUBMITTED',
      targetId: updated._id,
      targetTitle: updated.title,
      remarks: resubmissionComment || 'Coordinator adjusted details and resubmitted.'
    });

    if (updated.hostId) {
      store.addNotification({
        targetRole: 'host',
        userId: updated.hostId,
        title: 'Event Proposal Resubmitted with Changes',
        message: `Coordinator ${coordinatorUser.name} resubmitted '${updated.title}' for your review.`,
        link: '/api/host/events'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Event proposal resubmitted to Event Host for schedule review.',
      event: updated
    });
  } catch (error) {
    console.error('resubmitEventRequest Error:', error);
    return res.status(500).json({ success: false, message: 'Error resubmitting proposal.' });
  }
};

// @desc    Coordinator Assigns Event Host / Teacher and Forwards Request
// @route   POST /api/coordinator/events/:id/assign-host
// @access  Private (Coordinator, Admin)
const assignHostAndForward = async (req, res) => {
  try {
    const { id } = req.params;
    const { hostId, remarks } = req.body;
    const coordinatorUser = req.user;

    if (!hostId) {
      return res.status(400).json({ success: false, message: 'Please select an Event Host / Teacher.' });
    }

    const host = store.hosts.find(h => h.id === hostId || h._id === hostId);
    if (!host) {
      return res.status(404).json({ success: false, message: 'Selected Event Host not found.' });
    }

    const event = store.findEventById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event request not found.' });
    }

    const updated = store.updateEvent(id, {
      coordinatorId: coordinatorUser._id,
      coordinatorName: coordinatorUser.name,
      coordinatorRemarks: remarks || 'Verified proposal. Assigned faculty mentor for conflict check.',
      hostId: host.id || host._id,
      hostName: host.name,
      hostDepartment: host.department,
      status: 'HOST_REVIEW',
      historyEntry: {
        actor: coordinatorUser.name,
        role: 'Coordinator',
        action: 'HOST_ASSIGNED',
        comment: `Assigned Teacher ${host.name} (${host.department}).`
      }
    });

    store.addAuditLog({
      actorId: coordinatorUser._id,
      actorName: coordinatorUser.name,
      actorRole: 'Coordinator',
      action: 'HOST_ASSIGNED',
      targetId: updated._id,
      targetTitle: updated.title,
      remarks: `Coordinator assigned Event Host ${host.name} (${host.department}).`
    });

    store.addNotification({
      targetRole: 'host',
      userId: host.id || host._id,
      title: 'New Event Proposal Assigned for Review',
      message: `Coordinator ${coordinatorUser.name} assigned you to review '${updated.title}'.`,
      link: '/api/host/events'
    });

    return res.status(200).json({
      success: true,
      message: `Event proposal verified and assigned to Host ${host.name}.`,
      event: updated
    });
  } catch (error) {
    console.error('assignHostAndForward Error:', error);
    return res.status(500).json({ success: false, message: 'Error assigning Event Host.' });
  }
};

module.exports = {
  getStudentRequests,
  createCoordinatorEvent,
  resubmitEventRequest,
  assignHostAndForward
};
