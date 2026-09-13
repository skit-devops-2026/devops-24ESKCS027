/**
 * Mock Data Module for EventHive HOD / Admin Panel
 * Synchronized with the centralized DataStore in backend/models/store.js
 */

const store = require('../../backend/models/store');

// 1. Dashboard Stats for HOD
async function getDashboardStats() {
  const allEvents = store.events;
  const hodPending = allEvents.filter(e => e.status === 'HOD_REVIEW');
  const hostPending = allEvents.filter(e => e.status === 'HOST_REVIEW');
  const studentPending = allEvents.filter(e => e.status === 'SUBMITTED');
  const changesPending = allEvents.filter(e => e.status === 'CHANGES_REQUESTED');
  const approvedEvents = allEvents.filter(e => ['APPROVED', 'PUBLISHED', 'Published'].includes(e.status));

  // Detect conflicts across all pending requests
  let conflictAlertsCount = 0;
  for (const evt of allEvents) {
    if (['HOD_REVIEW', 'HOST_REVIEW', 'SUBMITTED'].includes(evt.status)) {
      const check = store.checkConflict(evt, evt._id);
      if (check.hasConflict) conflictAlertsCount++;
    }
  }

  const students = store.users.filter(u => u.role === 'student');
  const coordinators = store.users.filter(u => u.role === 'organizer');
  const hosts = store.hosts;

  return {
    collegeName: store.collegeName,
    totalUsers: store.users.length * 50,
    totalStudents: students.length * 150,
    totalOrganizers: coordinators.length,
    totalCoordinators: coordinators.length,
    totalHosts: hosts.length,
    totalEvents: allEvents.length,
    pendingHODApprovals: hodPending.length,
    pendingHostReviews: hostPending.length,
    pendingCoordinatorReviews: studentPending.length,
    changesRequestedCount: changesPending.length,
    pendingApprovals: hodPending.length + hostPending.length + studentPending.length,
    approvedEvents: approvedEvents.length,
    publicEvents: allEvents.filter(e => e.visibility === 'PUBLIC').length,
    collegeOnlyEvents: allEvents.filter(e => e.visibility === 'COLLEGE_ONLY').length,
    conflictAlertsCount,
    totalRegistrations: store.registrations.length,
    serviceProviders: 6,
    pendingApplications: 2
  };
}

// 2. Recent Events
async function getRecentEvents() {
  return store.events.slice(0, 8);
}

// 3. Pending Approvals list for HOD Dashboard
async function getPendingApprovals() {
  const list = [];

  store.events.filter(e => ['HOD_REVIEW', 'HOST_REVIEW', 'SUBMITTED', 'CHANGES_REQUESTED'].includes(e.status)).forEach(e => {
    const conflictCheck = store.checkConflict(e, e._id);
    list.push({
      id: e._id || e.id,
      type: 'event',
      title: e.title,
      category: e.category,
      department: e.department,
      venue: e.venue,
      date: e.date,
      time: `${e.startTime || '10:00'} - ${e.endTime || '16:00'}`,
      visibility: e.visibility,
      registrationAccess: e.registrationAccess || 'COLLEGE_STUDENTS_ONLY',
      status: e.status,
      hostName: e.hostName || 'Pending Assignment',
      hostDepartment: e.hostDepartment || 'Faculty',
      coordinatorName: e.coordinatorName || e.organizerName || 'Student Club',
      requestedBy: e.requestedByStudentName || e.organizerName || 'Student',
      requestedDate: e.createdAt ? e.createdAt.split('T')[0] : '2026-08-20',
      description: e.description,
      approvalHistory: e.approvalHistory || [],
      hasConflict: conflictCheck.hasConflict,
      conflictMessage: conflictCheck.hasConflict ? conflictCheck.conflicts[0].message : null,
      conflicts: conflictCheck.conflicts
    });
  });

  return list;
}

// 4. Conflicts list for HOD Review
async function getConflictAlerts() {
  const conflictsList = [];
  for (const evt of store.events) {
    if (!['CANCELLED', 'Cancelled', 'REJECTED', 'HOD_REJECTED', 'HOST_REJECTED'].includes(evt.status)) {
      const check = store.checkConflict(evt, evt._id);
      if (check.hasConflict) {
        conflictsList.push({
          event: evt,
          conflicts: check.conflicts
        });
      }
    }
  }
  return conflictsList;
}

// 5. Venue Occupancy Schedules
async function getVenueSchedules() {
  const schedules = {};
  for (const venue of require('../../backend/models/store').COLLEGE_VENUES) {
    schedules[venue] = store.events.filter(e =>
      e.venue === venue && !['CANCELLED', 'Cancelled', 'REJECTED', 'HOD_REJECTED', 'HOST_REJECTED'].includes(e.status)
    );
  }
  return schedules;
}

// 6. Users CRUD
async function getAllUsers(query = {}) {
  let result = [...store.users];
  if (query.search) {
    const q = query.search.toLowerCase();
    result = result.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.rollNumber && u.rollNumber.toLowerCase().includes(q)) ||
      (u.department && u.department.toLowerCase().includes(q))
    );
  }
  if (query.role && query.role !== 'All') {
    result = result.filter(u => u.role.toLowerCase() === query.role.toLowerCase());
  }
  return result;
}

async function toggleUserStatus(id) {
  const user = store.findUserById(id);
  if (user) {
    user.status = user.status === 'Active' ? 'Inactive' : 'Active';
    return user;
  }
  return null;
}

async function deleteUser(id) {
  const idx = store.users.findIndex(u => u._id === id || u.id === id);
  if (idx !== -1) {
    return store.users.splice(idx, 1)[0];
  }
  return null;
}

// 7. Organizers / Coordinators
async function getAllOrganizers(query = {}) {
  return store.users.filter(u => u.role === 'organizer' || u.role === 'coordinator');
}

// 8. Event Hosts / Teachers
async function getAllHosts() {
  return store.hosts;
}

// 9. Events CRUD & HOD Final Approvals
async function getAllEvents(query = {}) {
  let result = [...store.events];
  if (query.search) {
    const q = query.search.toLowerCase();
    result = result.filter(e =>
      e.title.toLowerCase().includes(q) ||
      (e.organizerName && e.organizerName.toLowerCase().includes(q)) ||
      (e.venue && e.venue.toLowerCase().includes(q)) ||
      (e.department && e.department.toLowerCase().includes(q))
    );
  }
  if (query.status && query.status !== 'All') {
    result = result.filter(e => e.status.toLowerCase() === query.status.toLowerCase());
  }
  if (query.visibility && query.visibility !== 'All') {
    result = result.filter(e => e.visibility === query.visibility);
  }
  if (query.category && query.category !== 'All') {
    result = result.filter(e => e.category && e.category.toLowerCase() === query.category.toLowerCase());
  }

  return result.map(e => {
    const conflictCheck = store.checkConflict(e, e._id);
    return {
      ...e,
      hasConflict: conflictCheck.hasConflict,
      conflicts: conflictCheck.conflicts
    };
  });
}

// HOD Final Approval
async function hodApproveEvent(id, { remarks, conflictOverride, overrideReason }) {
  const event = store.findEventById(id);
  if (!event) return null;

  // Check conflict
  const conflictCheck = store.checkConflict(event, event._id);
  if (conflictCheck.hasConflict && !conflictOverride) {
    return {
      error: true,
      hasConflict: true,
      conflicts: conflictCheck.conflicts,
      message: `Schedule Conflict Detected: ${conflictCheck.conflicts[0].message}`
    };
  }

  const updated = store.updateEvent(id, {
    status: 'PUBLISHED', // Officially Approved & Published
    hodApprovedBy: 'Dr. Arthur Pendelton (HOD / Admin)',
    hodApprovedAt: new Date().toISOString(),
    hodRemarks: remarks || 'Approved for campus execution.',
    conflictOverride: Boolean(conflictOverride),
    overrideReason: overrideReason || null,
    historyEntry: {
      actor: 'Dr. Arthur Pendelton',
      role: 'HOD / Admin',
      action: conflictOverride ? 'HOD_APPROVED_WITH_OVERRIDE' : 'HOD_APPROVED',
      comment: conflictOverride
        ? `HOD approved despite schedule conflict. Reason: ${overrideReason}`
        : (remarks || 'HOD final approval granted. Event published.')
    }
  });

  store.addAuditLog({
    actorId: 'hod_001',
    actorName: 'Dr. Arthur Pendelton',
    actorRole: 'HOD / Admin',
    action: conflictOverride ? 'HOD_APPROVED_WITH_OVERRIDE' : 'HOD_APPROVED',
    targetId: updated._id,
    targetTitle: updated.title,
    remarks: conflictOverride
      ? `HOD approved despite schedule conflict. Override Reason: ${overrideReason}`
      : (remarks || 'HOD final approval granted. Event published.')
  });

  if (updated.requestedByStudentId || updated.coordinatorId) {
    store.addNotification({
      userId: updated.requestedByStudentId || updated.coordinatorId,
      title: '🎉 Event Officially Approved by HOD!',
      message: `Your event proposal '${updated.title}' has received final HOD approval and is now published for registrations.`,
      link: '/student/my-events'
    });
  }

  return updated;
}

// HOD Rejection
async function hodRejectEvent(id, { remarks }) {
  const event = store.findEventById(id);
  if (!event) return null;

  const rejectionReason = remarks || 'Administrative decision by HOD.';

  const updated = store.updateEvent(id, {
    status: 'HOD_REJECTED',
    hodRemarks: rejectionReason,
    historyEntry: {
      actor: 'Dr. Arthur Pendelton',
      role: 'HOD / Admin',
      action: 'HOD_REJECTED',
      comment: rejectionReason
    }
  });

  store.addAuditLog({
    actorId: 'hod_001',
    actorName: 'Dr. Arthur Pendelton',
    actorRole: 'HOD / Admin',
    action: 'HOD_REJECTED',
    targetId: updated._id,
    targetTitle: updated.title,
    remarks: rejectionReason
  });

  if (updated.requestedByStudentId || updated.coordinatorId) {
    store.addNotification({
      userId: updated.requestedByStudentId || updated.coordinatorId,
      title: 'Event Proposal Rejected by HOD',
      message: `Your event '${updated.title}' was rejected during HOD final review. Reason: ${rejectionReason}`,
      link: '/coordinator/requests'
    });
  }

  return updated;
}

// HOD Requests Changes
async function hodRequestChanges(id, { remarks }) {
  const event = store.findEventById(id);
  if (!event) return null;

  const feedback = remarks || 'Please adjust schedule/capacity as requested.';

  const updated = store.updateEvent(id, {
    status: 'CHANGES_REQUESTED',
    hodRemarks: feedback,
    historyEntry: {
      actor: 'Dr. Arthur Pendelton',
      role: 'HOD / Admin',
      action: 'CHANGES_REQUESTED',
      comment: feedback
    }
  });

  store.addAuditLog({
    actorId: 'hod_001',
    actorName: 'Dr. Arthur Pendelton',
    actorRole: 'HOD / Admin',
    action: 'HOD_CHANGES_REQUESTED',
    targetId: updated._id,
    targetTitle: updated.title,
    remarks: feedback
  });

  if (updated.requestedByStudentId || updated.coordinatorId) {
    store.addNotification({
      userId: updated.requestedByStudentId || updated.coordinatorId,
      title: 'HOD Requested Changes for Event Proposal',
      message: `HOD requested adjustments on '${updated.title}': ${feedback}`,
      link: '/coordinator/requests'
    });
  }

  return updated;
}

async function deleteEvent(id) {
  return store.deleteEvent(id);
}

// 10. Audit Logs
async function getAuditLogs() {
  return store.auditLogs;
}

// 11. Notifications
async function getNotifications() {
  return store.notifications;
}

async function markAllNotificationsRead() {
  store.notifications.forEach(n => { n.read = true; });
  return true;
}

// 12. Service Providers & Applications (Preserved)
let serviceProviders = [
  { id: 1, name: 'Campus Bites & Caterers', category: 'Catering', contactPerson: 'Ramesh Gupta', email: 'contact@campusbites.com', phone: '+91 98765 43210', rating: 4.8, status: 'Approved', eventsServed: 18, services: 'Buffet, High Tea, Snacks' },
  { id: 2, name: 'Grand Royal Hotel & Suites', category: 'Hotel & Hospitality', contactPerson: 'Meera Deshmukh', email: 'reservations@grandroyal.com', phone: '+91 98234 56789', rating: 4.9, status: 'Approved', eventsServed: 6, services: 'VIP Guest Accommodation' },
  { id: 3, name: 'Apex Sound & Light Productions', category: 'Sound & Lighting', contactPerson: 'Sanjay Rawat', email: 'info@apexsound.in', phone: '+91 91234 56780', rating: 4.7, status: 'Approved', eventsServed: 24, services: 'Stage Lighting, Line Array Audio' },
  { id: 4, name: 'Shree Balaji Tent & Decorators', category: 'Tent & Staging', contactPerson: 'Rajesh Sharma', email: 'balajitents@gmail.com', phone: '+91 94567 89012', rating: 4.5, status: 'Pending', eventsServed: 0, services: 'Waterproof Pandals, Canopies' }
];

let applications = [
  { id: 101, eventId: 'evt_101', eventTitle: 'HackHive 2026: Annual Campus Hackathon', providerId: 1, providerName: 'Campus Bites & Caterers', category: 'Catering', proposal: '24-hr midnight snacks and breakfast for 150 hackathon participants.', estimatedCost: '₹45,000', status: 'Accepted', appliedDate: '2026-08-15' },
  { id: 102, eventId: 'evt_103', eventTitle: 'Rhythm & Beats: Inter-College Cultural Fest', providerId: 3, providerName: 'Apex Sound & Light Productions', category: 'Sound & Lighting', proposal: 'Full stage concert audio setup and laser show.', estimatedCost: '₹85,000', status: 'Accepted', appliedDate: '2026-08-18' }
];

async function getAllProviders() { return serviceProviders; }
async function updateProviderStatus(id, status) {
  const p = serviceProviders.find(p => p.id === parseInt(id));
  if (p) p.status = status;
  return p;
}
async function getAllApplications() { return applications; }
async function updateApplicationStatus(id, status) {
  const a = applications.find(a => a.id === parseInt(id));
  if (a) a.status = status;
  return a;
}

// 13. Reports
async function getAdminReports() {
  const allEvents = store.events;
  const approved = allEvents.filter(e => ['APPROVED', 'PUBLISHED', 'Published'].includes(e.status)).length;
  const pending = allEvents.filter(e => ['HOD_REVIEW', 'HOST_REVIEW', 'SUBMITTED'].includes(e.status)).length;
  const rejected = allEvents.filter(e => ['REJECTED', 'HOST_REJECTED', 'HOD_REJECTED'].includes(e.status)).length;

  return {
    collegeName: store.collegeName,
    overview: {
      totalUsers: store.users.length * 50,
      totalStudents: store.users.filter(u => u.role === 'student').length * 150,
      totalOrganizers: store.users.filter(u => u.role === 'organizer').length,
      totalHosts: store.hosts.length,
      totalProviders: serviceProviders.length,
      totalEvents: allEvents.length,
      approvedEvents: approved,
      pendingEvents: pending,
      rejectedEvents: rejected,
      publicEvents: allEvents.filter(e => e.visibility === 'PUBLIC').length,
      collegeOnlyEvents: allEvents.filter(e => e.visibility === 'COLLEGE_ONLY').length,
      totalApplications: applications.length,
      acceptedApplications: applications.filter(a => a.status === 'Accepted').length
    },
    categoryBreakdown: [
      { category: 'Technical', count: 18, percentage: 40 },
      { category: 'Cultural', count: 12, percentage: 27 },
      { category: 'Workshops', count: 8, percentage: 18 },
      { category: 'Seminars', count: 4, percentage: 9 },
      { category: 'Sports', count: 3, percentage: 6 }
    ],
    monthlyTrend: [
      { month: 'Jun 2026', events: 12, attendance: 2400, applications: 8 },
      { month: 'Jul 2026', events: 18, attendance: 4200, applications: 14 },
      { month: 'Aug 2026', events: 25, attendance: 6100, applications: 20 }
    ],
    departmentParticipation: [
      { dept: 'Computer Science & Engineering', events: 15, students: 680 },
      { dept: 'Electronics & Communication', events: 10, students: 420 },
      { dept: 'Mechanical Engineering', events: 6, students: 260 },
      { dept: 'Management Studies', events: 8, students: 310 },
      { dept: 'Civil Engineering', events: 4, students: 180 }
    ]
  };
}

module.exports = {
  getDashboardStats,
  getRecentEvents,
  getPendingApprovals,
  getConflictAlerts,
  getVenueSchedules,
  getAllUsers,
  toggleUserStatus,
  deleteUser,
  getAllOrganizers,
  getAllHosts,
  getAllEvents,
  hodApproveEvent,
  hodRejectEvent,
  hodRequestChanges,
  deleteEvent,
  getAllProviders,
  updateProviderStatus,
  getAllApplications,
  updateApplicationStatus,
  getNotifications,
  markAllNotificationsRead,
  getAdminReports,
  getAuditLogs
};
