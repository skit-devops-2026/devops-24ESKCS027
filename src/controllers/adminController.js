const ejs = require('ejs');
const path = require('path');
const mockData = require('../data/mockData');

const viewsDir = path.join(__dirname, '..', 'views');

/**
 * Helper to render an EJS sub-view inside the adminLayout.
 */
async function renderAdminView(res, viewRelativePath, data = {}, layoutOptions = {}) {
  try {
    const notifications = await mockData.getNotifications();
    const unreadCount = notifications.filter(n => !n.read).length;
    const stats = await mockData.getDashboardStats();

    const content = await new Promise((resolve, reject) => {
      ejs.renderFile(
        path.join(viewsDir, viewRelativePath),
        { ...data, unreadCount, dashboardStats: stats },
        (err, str) => {
          if (err) return reject(err);
          resolve(str);
        }
      );
    });

    res.render('layouts/adminLayout', {
      pageTitle: layoutOptions.pageTitle || 'Admin',
      activePage: layoutOptions.activePage || 'dashboard',
      unreadCount,
      alert: layoutOptions.alert || null,
      adminUser: res.locals.adminUser || {
        name: 'Dr. Arthur Pendelton',
        email: 'admin@eventhive.com',
        role: 'HOD / Admin'
      },
      content
    });
  } catch (err) {
    console.error('Error rendering admin view:', err);
    res.status(500).send('Internal Server Error: ' + err.message);
  }
}

// =========================================================================
// 1. AUTHENTICATION
// =========================================================================

function getLoginPage(req, res) {
  const error = req.query.error || null;
  const message = req.query.message || null;
  res.render('admin/login', { error, message });
}

function postLogin(req, res) {
  const { email, password } = req.body;
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@eventhive.com';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';

  if (!email || !password) {
    return res.render('admin/login', {
      error: 'Please provide both email and password.',
      message: null
    });
  }

  if (email.trim().toLowerCase() === adminEmail.toLowerCase() && password === adminPass) {
    res.cookie('eh_admin_session', 'authenticated_admin_session_token', {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    return res.redirect('/admin/dashboard');
  }

  return res.render('admin/login', {
    error: 'Invalid administrator / HOD email or password.',
    message: null
  });
}

function logout(req, res) {
  res.clearCookie('eh_admin_session');
  res.redirect('/admin/login?message=' + encodeURIComponent('Logged out successfully.'));
}

// =========================================================================
// 2. HOD DASHBOARD
// =========================================================================

async function getDashboard(req, res) {
  try {
    const [stats, recentEvents, pendingApprovals, auditLogs] = await Promise.all([
      mockData.getDashboardStats(),
      mockData.getRecentEvents(),
      mockData.getPendingApprovals(),
      mockData.getAuditLogs()
    ]);

    await renderAdminView(
      res,
      'admin/dashboard.ejs',
      { stats, recentEvents, pendingApprovals, auditLogs },
      { pageTitle: 'HOD Approval Dashboard', activePage: 'dashboard' }
    );
  } catch (err) {
    console.error('getDashboard error:', err);
    res.status(500).send('Error loading dashboard');
  }
}

// =========================================================================
// 3. USER MANAGEMENT
// =========================================================================

async function getUsers(req, res) {
  try {
    const { search, role, status } = req.query;
    const users = await mockData.getAllUsers({ search, role, status });

    await renderAdminView(
      res,
      'admin/users.ejs',
      {
        users,
        filters: { search: search || '', role: role || 'All', status: status || 'All' },
        alert: req.query.alert || null
      },
      { pageTitle: 'College Users Directory', activePage: 'users' }
    );
  } catch (err) {
    res.status(500).send('Error loading users');
  }
}

async function postToggleUserStatus(req, res) {
  try {
    const user = await mockData.toggleUserStatus(req.params.id);
    const msg = user ? `User ${user.name} status updated.` : 'User not found.';
    res.redirect('/admin/users?alert=' + encodeURIComponent(msg));
  } catch (err) {
    res.redirect('/admin/users?alert=' + encodeURIComponent('Failed to update status.'));
  }
}

async function postDeleteUser(req, res) {
  try {
    const deleted = await mockData.deleteUser(req.params.id);
    const msg = deleted ? `User deleted successfully.` : 'User not found.';
    res.redirect('/admin/users?alert=' + encodeURIComponent(msg));
  } catch (err) {
    res.redirect('/admin/users?alert=' + encodeURIComponent('Failed to delete user.'));
  }
}

// =========================================================================
// 4. EVENT HOSTS / TEACHERS DIRECTORY
// =========================================================================

async function getHosts(req, res) {
  try {
    const hosts = await mockData.getAllHosts();
    await renderAdminView(
      res,
      'admin/hosts.ejs',
      { hosts, alert: req.query.alert || null },
      { pageTitle: 'Event Hosts & Faculty Mentors', activePage: 'hosts' }
    );
  } catch (err) {
    res.status(500).send('Error loading Event Hosts');
  }
}

// =========================================================================
// 5. EVENT MANAGEMENT & HOD FINAL APPROVALS
// =========================================================================

async function getEvents(req, res) {
  try {
    const { search, status, category, visibility } = req.query;
    const events = await mockData.getAllEvents({ search, status, category, visibility });

    await renderAdminView(
      res,
      'admin/events.ejs',
      {
        events,
        filters: {
          search: search || '',
          status: status || 'All',
          category: category || 'All',
          visibility: visibility || 'All'
        },
        alert: req.query.alert || null
      },
      { pageTitle: 'Event Pipeline & HOD Approvals', activePage: 'events' }
    );
  } catch (err) {
    res.status(500).send('Error loading events');
  }
}

// HOD Final Approval
async function postHodApproveEvent(req, res) {
  try {
    const { id } = req.params;
    const { remarks, conflictOverride, overrideReason } = req.body;

    const result = await mockData.hodApproveEvent(id, {
      remarks,
      conflictOverride: conflictOverride === 'true' || conflictOverride === true,
      overrideReason
    });

    if (result && result.error && result.hasConflict) {
      return res.redirect('/admin/events?alert=' + encodeURIComponent('⚠️ Schedule Conflict Blocked Approval: ' + result.message));
    }

    const msg = result
      ? `Event '${result.title}' officially approved and published for campus registrations!`
      : 'Event not found.';

    res.redirect('/admin/events?alert=' + encodeURIComponent(msg));
  } catch (err) {
    res.redirect('/admin/events?alert=' + encodeURIComponent('HOD Approval Failed.'));
  }
}

// HOD Rejection
async function postHodRejectEvent(req, res) {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const rejected = await mockData.hodRejectEvent(id, { remarks });
    const msg = rejected ? `Event '${rejected.title}' rejected by HOD.` : 'Event not found.';
    res.redirect('/admin/events?alert=' + encodeURIComponent(msg));
  } catch (err) {
    res.redirect('/admin/events?alert=' + encodeURIComponent('Rejection Failed.'));
  }
}

// HOD Requests Changes
async function postHodRequestChanges(req, res) {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const result = await mockData.hodRequestChanges(id, { remarks });
    const msg = result ? `Changes requested for event '${result.title}'. Proposal returned to Coordinator.` : 'Event not found.';
    res.redirect('/admin/events?alert=' + encodeURIComponent(msg));
  } catch (err) {
    res.redirect('/admin/events?alert=' + encodeURIComponent('Request Changes Failed.'));
  }
}

async function postDeleteEvent(req, res) {
  try {
    await mockData.deleteEvent(req.params.id);
    res.redirect('/admin/events?alert=' + encodeURIComponent('Event deleted successfully.'));
  } catch (err) {
    res.redirect('/admin/events?alert=' + encodeURIComponent('Delete failed.'));
  }
}

// =========================================================================
// 6. CONFLICT ALERTS & VENUE SCHEDULES
// =========================================================================

async function getConflicts(req, res) {
  try {
    const conflicts = await mockData.getConflictAlerts();
    await renderAdminView(
      res,
      'admin/conflicts.ejs',
      { conflicts, alert: req.query.alert || null },
      { pageTitle: 'Schedule Conflict Alerts', activePage: 'conflicts' }
    );
  } catch (err) {
    res.status(500).send('Error loading conflict alerts');
  }
}

async function getVenues(req, res) {
  try {
    const schedules = await mockData.getVenueSchedules();
    await renderAdminView(
      res,
      'admin/venues.ejs',
      { schedules, alert: req.query.alert || null },
      { pageTitle: 'Campus Venue Schedules', activePage: 'venues' }
    );
  } catch (err) {
    res.status(500).send('Error loading venue schedules');
  }
}

// =========================================================================
// 7. AUDIT LOGS
// =========================================================================

async function getAuditLogs(req, res) {
  try {
    const logs = await mockData.getAuditLogs();
    await renderAdminView(
      res,
      'admin/auditLogs.ejs',
      { logs, alert: req.query.alert || null },
      { pageTitle: 'Event Governance Audit Trail', activePage: 'auditLogs' }
    );
  } catch (err) {
    res.status(500).send('Error loading audit logs');
  }
}

// =========================================================================
// 8. ORGANIZERS, SERVICE PROVIDERS, NOTIFICATIONS & REPORTS
// =========================================================================

async function getOrganizers(req, res) {
  const organizers = await mockData.getAllOrganizers(req.query);
  await renderAdminView(
    res,
    'admin/organizers.ejs',
    { organizers, filters: { search: req.query.search || '', status: req.query.status || 'All' } },
    { pageTitle: 'Coordinators & Student Clubs', activePage: 'organizers' }
  );
}

async function getProviders(req, res) {
  const providers = await mockData.getAllProviders();
  await renderAdminView(
    res,
    'admin/providers.ejs',
    { providers, filters: { search: '', category: 'All', status: 'All' } },
    { pageTitle: 'Campus Service Providers', activePage: 'providers' }
  );
}

async function getApplications(req, res) {
  const applications = await mockData.getAllApplications();
  const events = await mockData.getAllEvents();
  await renderAdminView(
    res,
    'admin/applications.ejs',
    { applications, events, filters: { search: '', status: 'All', eventId: 'All' } },
    { pageTitle: 'Event Vendor Applications', activePage: 'applications' }
  );
}

async function getNotifications(req, res) {
  const notifications = await mockData.getNotifications();
  await renderAdminView(
    res,
    'admin/notifications.ejs',
    { notifications, alert: req.query.alert || null },
    { pageTitle: 'Admin Notifications', activePage: 'notifications' }
  );
}

async function postMarkNotificationsRead(req, res) {
  await mockData.markAllNotificationsRead();
  res.redirect('/admin/notifications');
}

async function getReports(req, res) {
  const reports = await mockData.getAdminReports();
  await renderAdminView(
    res,
    'admin/reports.ejs',
    { reports },
    { pageTitle: 'Campus Reports & Analytics', activePage: 'reports' }
  );
}

module.exports = {
  getLoginPage,
  postLogin,
  logout,
  getDashboard,
  getUsers,
  postToggleUserStatus,
  deleteUser: postDeleteUser,
  getHosts,
  getEvents,
  postApproveEvent: postHodApproveEvent,
  postHodApproveEvent,
  postRejectEvent: postHodRejectEvent,
  postHodRejectEvent,
  postHodRequestChanges,
  postDeleteEvent,
  getConflicts,
  getVenues,
  getAuditLogs,
  getOrganizers,
  getProviders,
  getApplications,
  getNotifications,
  postMarkNotificationsRead,
  getReports
};
