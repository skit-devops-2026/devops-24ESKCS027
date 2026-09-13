const store = require('../models/store');

/**
 * College Student & External Registration Controller
 * Manages event discovery, student/external registrations, and event proposals.
 */

// @desc    Submit a new College Event Request
// @route   POST /api/student/event-requests
// @access  Private (Verified Student / Coordinator)
const submitEventRequest = async (req, res) => {
  try {
    const studentUser = req.user;
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
        message: 'Please provide event title, description, date, and preferred venue.'
      });
    }

    const capacity = parseInt(expectedParticipants || maxCapacity || 100);

    let host = null;
    if (hostId) {
      host = store.hosts.find(h => h.id === hostId || h._id === hostId);
    }

    // Create event with SUBMITTED (or HOST_REVIEW if host selected)
    const newEvent = store.createEvent({
      title: title.trim(),
      description: description.trim(),
      category: category || 'Technical',
      eventType: eventType || category || 'Workshop',
      department: department || studentUser.department || 'Computer Science & Engineering',
      date: date.split('T')[0],
      startTime: startTime || '10:00',
      endTime: endTime || '16:00',
      venue: venue.trim(),
      capacity,
      maxCapacity: capacity,
      totalSeats: capacity,
      availableSeats: capacity,
      visibility: visibility === 'PUBLIC' ? 'PUBLIC' : 'COLLEGE_ONLY',
      registrationAccess: registrationAccess === 'PUBLIC' ? 'PUBLIC' : 'COLLEGE_STUDENTS_ONLY',
      purpose: purpose || description,
      requiredResources: requiredResources || 'Standard college equipment',
      status: host ? 'HOST_REVIEW' : 'SUBMITTED',
      requestedByStudentId: studentUser._id,
      requestedByStudentName: studentUser.name,
      requestedByEmail: studentUser.email,
      requestedByRoll: studentUser.rollNumber || studentUser.collegeId || '',
      organizerName: studentUser.name,
      hostId: host ? (host.id || host._id) : null,
      hostName: host ? host.name : null,
      hostDepartment: host ? host.department : null,
      approvalHistory: [
        {
          actor: studentUser.name,
          role: 'Student Coordinator',
          action: 'SUBMITTED',
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          comment: host ? `Proposal submitted requesting ${host.name} as Event Host.` : 'Proposal submitted for Coordinator review.'
        }
      ]
    });

    store.addAuditLog({
      actorId: studentUser._id,
      actorName: studentUser.name,
      actorRole: 'Student',
      action: 'EVENT_REQUESTED',
      targetId: newEvent._id,
      targetTitle: newEvent.title,
      remarks: `Student ${studentUser.name} submitted proposal for '${newEvent.title}' at ${newEvent.venue}.`
    });

    if (host) {
      store.addNotification({
        targetRole: 'host',
        userId: host.id || host._id,
        title: 'New Student Event Proposal Assigned',
        message: `${studentUser.name} submitted proposal '${newEvent.title}' requesting your faculty review.`,
        link: '/api/host/events'
      });
    } else {
      store.addNotification({
        targetRole: 'organizer',
        title: 'New Student Event Proposal Submitted',
        message: `${studentUser.name} requested approval for '${newEvent.title}'. Pending Coordinator review.`,
        link: '/api/coordinator/requests'
      });
    }

    return res.status(201).json({
      success: true,
      message: host
        ? 'Event request submitted and forwarded to selected Faculty Host for schedule review!'
        : 'Event request submitted successfully! It is now under review by the Event Coordinator.',
      request: newEvent
    });
  } catch (error) {
    console.error('submitEventRequest Error:', error);
    return res.status(500).json({ success: false, message: 'Error submitting event request.' });
  }
};

// @desc    Get all Event Requests submitted by current Student
// @route   GET /api/student/event-requests
// @access  Private (Student)
const getMyEventRequests = async (req, res) => {
  try {
    const studentId = req.user._id;
    const requests = store.events.filter(e =>
      e.requestedByStudentId === studentId ||
      e.requestedByEmail === req.user.email
    );

    const enriched = requests.map(r => {
      const workflowStages = [
        { stage: 'SUBMITTED', label: 'Proposal Submitted', completed: true, active: r.status === 'SUBMITTED' },
        {
          stage: 'COORDINATOR_REVIEW',
          label: 'Coordinator Verification & Host Assignment',
          completed: ['HOST_REVIEW', 'HOST_APPROVED', 'HOD_REVIEW', 'APPROVED', 'PUBLISHED'].includes(r.status),
          active: r.status === 'COORDINATOR_REVIEW'
        },
        {
          stage: 'HOST_REVIEW',
          label: 'Faculty Host Schedule & Conflict Check',
          completed: ['HOST_APPROVED', 'HOD_REVIEW', 'APPROVED', 'PUBLISHED'].includes(r.status),
          active: r.status === 'HOST_REVIEW',
          hostName: r.hostName || null
        },
        {
          stage: 'HOD_REVIEW',
          label: 'HOD Final Approval',
          completed: ['APPROVED', 'PUBLISHED'].includes(r.status),
          active: r.status === 'HOD_REVIEW'
        },
        {
          stage: 'PUBLISHED',
          label: 'Approved & Live on Campus',
          completed: ['APPROVED', 'PUBLISHED'].includes(r.status),
          active: ['APPROVED', 'PUBLISHED'].includes(r.status)
        }
      ];

      return {
        ...r,
        workflowTimeline: workflowStages,
        isRejected: ['REJECTED', 'HOST_REJECTED', 'HOD_REJECTED'].includes(r.status),
        isChangesRequested: r.status === 'CHANGES_REQUESTED'
      };
    });

    return res.status(200).json({
      success: true,
      count: enriched.length,
      requests: enriched
    });
  } catch (error) {
    console.error('getMyEventRequests Error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching your event requests.' });
  }
};

// @desc    Browse Approved / Published Events (Enforces Public vs College-Only)
// @route   GET /api/events
// @access  Public / Optional Auth
const browseEvents = async (req, res) => {
  try {
    const { category, department, search, visibility, registrationAccess } = req.query;
    const currentUser = req.user; // from optionalAuth

    // Only return live approved events for general browsing
    let events = store.events.filter(e =>
      ['PUBLISHED', 'APPROVED', 'Published', 'Upcoming'].includes(e.status)
    );

    // Enforce Visibility Rules:
    // Unauthenticated or external public users can ONLY view PUBLIC events!
    const isCollegeUser = currentUser && (
      currentUser.role === 'student' ||
      currentUser.isCollegeVerified ||
      ['admin', 'hod', 'host', 'organizer', 'coordinator'].includes(currentUser.role)
    );

    if (!isCollegeUser) {
      events = events.filter(e => e.visibility === 'PUBLIC');
    }

    if (visibility && visibility !== 'All') {
      events = events.filter(e => e.visibility === visibility);
    }

    if (registrationAccess && registrationAccess !== 'All') {
      events = events.filter(e => e.registrationAccess === registrationAccess);
    }

    if (category && category !== 'All') {
      events = events.filter(e => e.category && e.category.toLowerCase() === category.toLowerCase());
    }

    if (department && department !== 'All') {
      events = events.filter(e => e.department === department || e.department === 'All' || e.department === 'All Departments');
    }

    if (search) {
      const q = search.toLowerCase();
      events = events.filter(e =>
        e.title.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.venue && e.venue.toLowerCase().includes(q))
      );
    }

    return res.status(200).json(events);
  } catch (error) {
    console.error('browseEvents Error:', error);
    return res.status(500).json({ success: false, message: 'Error browsing events.' });
  }
};

// @desc    Get Event Details (Enforces 403 Forbidden for College-Only Events if not verified)
// @route   GET /api/events/:id
// @access  Public / Optional Auth
const getEventDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const event = store.findEventById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const isCollegeUser = currentUser && (
      currentUser.role === 'student' ||
      currentUser.isCollegeVerified ||
      ['admin', 'hod', 'host', 'organizer', 'coordinator'].includes(currentUser.role)
    );

    if (event.visibility === 'COLLEGE_ONLY' && !isCollegeUser) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: This is a College-Only event. You must be logged in as a verified college student to view details.'
      });
    }

    return res.status(200).json(event);
  } catch (error) {
    console.error('getEventDetails Error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching event details.' });
  }
};

// @desc    Register for an Event (Verified College Student)
// @route   POST /api/registrations
// @access  Private (Student)
const registerForEvent = async (req, res) => {
  try {
    const studentUser = req.user;
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({ success: false, message: 'Event ID is required.' });
    }

    const event = store.findEventById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    // 1. Check Event Status is Approved / Published
    if (!['PUBLISHED', 'APPROVED', 'Published', 'Upcoming'].includes(event.status)) {
      return res.status(400).json({
        success: false,
        message: `Registration is not available. Event status is '${event.status}'.`
      });
    }

    // 2. Check College-Only eligibility
    const isCollegeUser = studentUser.role === 'student' ||
                          studentUser.isCollegeVerified ||
                          ['admin', 'hod', 'host', 'organizer'].includes(studentUser.role);

    if (event.registrationAccess === 'COLLEGE_STUDENTS_ONLY' && !isCollegeUser) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: This event requires verified college student credentials.'
      });
    }

    // 3. Check Capacity
    const currentAvailable = event.availableSeats !== undefined
      ? event.availableSeats
      : ((event.capacity || event.totalSeats || 100) - (event.registeredCount || 0));

    if (currentAvailable <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Registration is full. No seats available for this event.'
      });
    }

    // 4. Duplicate Registration Check
    const existing = store.registrations.find(r =>
      (r.eventId === eventId) &&
      (r.studentId === studentUser._id || r.userId === studentUser._id || r.participantEmail.toLowerCase() === studentUser.email.toLowerCase()) &&
      r.status === 'Confirmed'
    );

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate Registration: You are already registered for this event.'
      });
    }

    // 5. Deduct seats & create registration
    event.registeredCount = (event.registeredCount || 0) + 1;
    event.availableSeats = Math.max(0, currentAvailable - 1);

    const newReg = store.createRegistration({
      eventId: event._id || event.id,
      eventTitle: event.title,
      participantName: studentUser.name,
      participantEmail: studentUser.email,
      participantPhone: studentUser.phone || '',
      studentId: studentUser._id,
      userId: studentUser._id,
      registrationType: 'CollegeStudent',
      ticketCode: `TK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      status: 'Confirmed'
    });

    store.addAuditLog({
      actorId: studentUser._id,
      actorName: studentUser.name,
      actorRole: 'Student',
      action: 'EVENT_REGISTERED',
      targetId: event._id,
      targetTitle: event.title,
      remarks: `Student registered for '${event.title}'. Seats remaining: ${event.availableSeats}.`
    });

    store.addNotification({
      userId: studentUser._id,
      title: 'Event Registration Confirmed!',
      message: `You are confirmed for '${event.title}' on ${event.date} at ${event.venue}.`,
      link: '/student/my-events'
    });

    return res.status(201).json({
      success: true,
      message: 'Registration confirmed successfully!',
      registration: { ...newReg, event }
    });
  } catch (error) {
    console.error('registerForEvent Error:', error);
    return res.status(500).json({ success: false, message: 'Error processing registration.' });
  }
};

// @desc    Register External Visitor for Public Events (Public Registration)
// @route   POST /api/registrations/external
// @access  Public
const externalRegisterForEvent = async (req, res) => {
  try {
    const { eventId, name, email, phone } = req.body;

    if (!eventId || !name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Event ID, full name, and email address are required for registration.'
      });
    }

    const event = store.findEventById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    // Check visibility and registration access
    if (event.visibility !== 'PUBLIC' || event.registrationAccess !== 'PUBLIC') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: This event is restricted to verified college students only. External registration is not permitted.'
      });
    }

    // Check status
    if (!['PUBLISHED', 'APPROVED', 'Published', 'Upcoming'].includes(event.status)) {
      return res.status(400).json({
        success: false,
        message: 'Registration is not currently open for this event.'
      });
    }

    // Check capacity
    const currentAvailable = event.availableSeats !== undefined
      ? event.availableSeats
      : ((event.capacity || event.totalSeats || 100) - (event.registeredCount || 0));

    if (currentAvailable <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Registration is full. No public seats remaining.'
      });
    }

    // Duplicate check by email
    const cleanEmail = email.trim().toLowerCase();
    const existing = store.registrations.find(r =>
      r.eventId === eventId &&
      r.participantEmail.toLowerCase() === cleanEmail &&
      r.status === 'Confirmed'
    );

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate Registration: An active registration already exists for this email.'
      });
    }

    event.registeredCount = (event.registeredCount || 0) + 1;
    event.availableSeats = Math.max(0, currentAvailable - 1);

    const newReg = store.createRegistration({
      eventId: event._id || event.id,
      eventTitle: event.title,
      participantName: name.trim(),
      participantEmail: cleanEmail,
      participantPhone: phone ? phone.trim() : '',
      studentId: '',
      userId: `ext_${Date.now()}`,
      registrationType: 'ExternalVisitor',
      ticketCode: `EXT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      status: 'Confirmed'
    });

    store.addAuditLog({
      actorId: 'guest_visitor',
      actorName: name.trim(),
      actorRole: 'External Visitor',
      action: 'EXTERNAL_REGISTRATION',
      targetId: event._id,
      targetTitle: event.title,
      remarks: `External visitor ${name} (${cleanEmail}) registered for public event.`
    });

    return res.status(201).json({
      success: true,
      message: 'External registration confirmed! Please keep your ticket code for entry.',
      ticketCode: newReg.ticketCode,
      registration: newReg
    });
  } catch (error) {
    console.error('externalRegisterForEvent Error:', error);
    return res.status(500).json({ success: false, message: 'Error processing external registration.' });
  }
};

// @desc    Get Student's Registered Events
// @route   GET /api/registrations/my-events
// @access  Private (Student)
const getMyRegisteredEvents = async (req, res) => {
  try {
    const studentUser = req.user;
    const studentRegs = store.registrations.filter(r =>
      (r.studentId === studentUser._id || r.userId === studentUser._id || r.participantEmail === studentUser.email) &&
      r.status === 'Confirmed'
    );

    const myEvents = studentRegs.map(reg => {
      const event = store.findEventById(reg.eventId);
      return {
        ...reg,
        event: event || null
      };
    });

    return res.status(200).json(myEvents);
  } catch (error) {
    console.error('getMyRegisteredEvents Error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching registrations.' });
  }
};

// @desc    Cancel an existing Event Registration
// @route   DELETE /api/registrations/:eventId
// @access  Private (Student)
const cancelEventRegistration = async (req, res) => {
  try {
    const studentUser = req.user;
    const { eventId } = req.params;

    const cancelled = store.cancelRegistration(eventId, studentUser._id);
    if (!cancelled) {
      return res.status(404).json({ success: false, message: 'Active registration not found.' });
    }

    const event = store.findEventById(eventId);
    if (event) {
      event.registeredCount = Math.max(0, (event.registeredCount || 1) - 1);
      event.availableSeats = (event.availableSeats || 0) + 1;
    }

    store.addAuditLog({
      actorId: studentUser._id,
      actorName: studentUser.name,
      actorRole: 'Student',
      action: 'REGISTRATION_CANCELLED',
      targetId: eventId,
      targetTitle: event ? event.title : 'Event',
      remarks: `Student cancelled registration for '${event ? event.title : eventId}'.`
    });

    return res.status(200).json({
      success: true,
      message: 'Registration cancelled successfully.'
    });
  } catch (error) {
    console.error('cancelEventRegistration Error:', error);
    return res.status(500).json({ success: false, message: 'Error cancelling registration.' });
  }
};

// @desc    Get / Update Student Profile
// @route   GET / PUT /api/student/profile
// @access  Private (Student)
const getStudentProfile = async (req, res) => {
  try {
    const user = store.findUserById(req.user._id) || req.user;
    return res.status(200).json({
      ...user,
      collegeName: store.collegeName
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error loading profile.' });
  }
};

const updateStudentProfile = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { name, department, rollNumber, semester, year, bio, phone } = req.body;

    const user = store.findUserById(studentId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (name) user.name = name;
    if (department) user.department = department;
    if (rollNumber) {
      user.rollNumber = rollNumber;
      user.collegeId = rollNumber;
      user.isCollegeVerified = true;
    }
    if (semester) user.semester = semester;
    if (year) user.year = year;
    if (bio) user.bio = bio;
    if (phone) user.phone = phone;

    return res.status(200).json({
      success: true,
      message: 'Student profile updated successfully.',
      profile: user
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error updating profile.' });
  }
};

// @desc    Student Statistics
// @route   GET /api/student/stats
// @access  Private (Student)
const getStudentStats = async (req, res) => {
  try {
    const studentId = req.user._id;
    const studentRegs = store.registrations.filter(r =>
      (r.studentId === studentId || r.userId === studentId) && r.status === 'Confirmed'
    );
    const myRequests = store.events.filter(e => e.requestedByStudentId === studentId);
    const now = new Date().toISOString().split('T')[0];

    const upcomingCount = studentRegs.filter(r => {
      const evt = store.findEventById(r.eventId);
      return evt && (evt.date || '2026-09-15') >= now;
    }).length;

    const completedCount = studentRegs.filter(r => {
      const evt = store.findEventById(r.eventId);
      return (evt && (evt.date || '2026-09-15') < now) || r.status === 'Attended';
    }).length;

    return res.status(200).json({
      collegeName: store.collegeName,
      registeredEvents: studentRegs.length,
      upcomingEvents: upcomingCount,
      completedEvents: completedCount,
      submittedRequestsCount: myRequests.length,
      approvedRequestsCount: myRequests.filter(r => ['APPROVED', 'PUBLISHED'].includes(r.status)).length,
      availableCampusEvents: store.events.filter(e => ['APPROVED', 'PUBLISHED'].includes(e.status)).length
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching stats.' });
  }
};

module.exports = {
  submitEventRequest,
  getMyEventRequests,
  browseEvents,
  getEventDetails,
  registerForEvent,
  externalRegisterForEvent,
  getMyRegisteredEvents,
  cancelEventRegistration,
  getStudentProfile,
  updateStudentProfile,
  getStudentStats
};
