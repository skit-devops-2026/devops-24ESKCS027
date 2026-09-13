const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAdmin, redirectIfAuthenticated } = require('../middleware/auth');

// Auth routes
router.get('/login', redirectIfAuthenticated, adminController.getLoginPage);
router.post('/login', redirectIfAuthenticated, adminController.postLogin);
router.get('/logout', adminController.logout);

// Protected HOD / Admin routes
router.use(requireAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// 1. User Management
router.get('/users', adminController.getUsers);
router.post('/users/:id/status', adminController.postToggleUserStatus);
router.post('/users/:id/delete', adminController.deleteUser);

// 2. Event Hosts / Teachers
router.get('/hosts', adminController.getHosts);

// 3. Organizer / Coordinator Management
router.get('/organizers', adminController.getOrganizers);

// 4. Events & HOD Final Approvals
router.get('/events', adminController.getEvents);
router.get('/approvals', (req, res) => res.redirect('/admin/events?status=HOD_REVIEW'));
router.post('/events/:id/approve', adminController.postHodApproveEvent);
router.post('/events/:id/hod-approve', adminController.postHodApproveEvent);
router.post('/events/:id/reject', adminController.postHodRejectEvent);
router.post('/events/:id/hod-reject', adminController.postHodRejectEvent);
router.post('/events/:id/request-changes', adminController.postHodRequestChanges);
router.post('/events/:id/delete', adminController.postDeleteEvent);

// 5. Schedule Conflict Alerts & Venue Matrix
router.get('/conflicts', adminController.getConflicts);
router.get('/venues', adminController.getVenues);

// 6. System Audit Logs
router.get('/audit-logs', adminController.getAuditLogs);

// 7. Service Providers & Applications (Preserved)
router.get('/providers', adminController.getProviders);
router.get('/applications', adminController.getApplications);

// 8. Notifications & Reports
router.get('/notifications', adminController.getNotifications);
router.post('/notifications/mark-read', adminController.postMarkNotificationsRead);
router.get('/reports', adminController.getReports);

module.exports = router;
