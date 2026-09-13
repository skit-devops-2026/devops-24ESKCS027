const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const store = require('./models/store');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database if URI available (built-in in-memory fallback is automatic)
connectDB();

// View Engine Setup for Admin / HOD Panel (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'src', 'views'));

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing with clean JSON error handling
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static Assets (for Admin Panel & Frontend)
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')));

// Middleware to catch JSON parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Malformed JSON payload received.',
    });
  }
  next(err);
});

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'EventHive One-College Event Management Platform',
    timestamp: new Date().toISOString(),
    workflow: 'Student (Request) -> Coordinator (Assign) -> Host (Conflict Check) -> HOD (Final Approval) -> Published (Registration)',
    roles: {
      hod: 'HOD / Admin (Final Approval at /admin)',
      host: 'Event Host / Faculty Mentors (/api/host)',
      coordinator: 'Event Coordinator / Organizers (/api/coordinator, /api/organizer)',
      student: 'College Students (/api/student, /api/events, /api/registrations)',
      public: 'External Guests (Public events only at /api/events)'
    },
    counts: {
      events: store.events.length,
      hosts: store.hosts.length,
      users: store.users.length,
      registrations: store.registrations.length,
      auditLogs: store.auditLogs.length
    }
  });
});

// --- MOUNT ROUTES ---

// 1. Auth Routes (supports all 5 roles + demo logins)
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// 2. Event Host / Teacher Routes
const hostRoutes = require('./routes/hostRoutes');
app.use('/api/host', hostRoutes);

// 3. Coordinator / Organizer Routes
const coordinatorRoutes = require('./routes/coordinatorRoutes');
app.use('/api/coordinator', coordinatorRoutes);

const organizerRoutes = require('./routes/organizerRoutes');
app.use('/api/organizer', organizerRoutes);

// 4. Student Routes
const studentRoutes = require('./routes/studentRoutes');
app.use('/api/student', studentRoutes);

// 5. Public & College Events Discovery Routes
const eventRoutes = require('./routes/eventRoutes');
app.use('/api/events', eventRoutes);

// 6. Registrations Routes
const registrationRoutes = require('./routes/registrationRoutes');
app.use('/api/registrations', registrationRoutes);

// 7. General Notifications Endpoint
app.get('/api/notifications', (req, res) => {
  res.json(store.notifications);
});

app.put('/api/notifications/mark-read', (req, res) => {
  store.notifications.forEach(n => { n.read = true; });
  res.json({ success: true, message: 'Notifications marked as read' });
});

// 8. General Hosts Endpoint
app.get('/api/hosts', (req, res) => {
  res.json({ success: true, count: store.hosts.length, hosts: store.hosts });
});

// 9. Admin / HOD MVC Routes
try {
  const adminRoutes = require('../src/routes/adminRoutes');
  app.use('/admin', adminRoutes);
} catch (e) {
  console.warn('Admin routes notice:', e.message);
}

// Root / Welcome Endpoint
app.get('/', (req, res) => {
  if (req.accepts('html')) {
    return res.redirect('/admin/dashboard');
  }
  res.json({
    name: 'EventHive One-College Event Management API',
    version: '2.0.0',
    description: 'AI-Powered College Event Management Platform',
    portals: {
      admin: 'http://localhost:5000/admin/dashboard',
      health: 'http://localhost:5000/api/health',
      hosts: 'http://localhost:5000/api/hosts'
    }
  });
});

// Global 404 Handler for APIs
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`================================================================`);
    console.log(`🐝 EventHive One-College Event Management Platform Running on Port ${PORT}`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`📊 HOD / Admin Panel: http://localhost:${PORT}/admin/dashboard`);
    console.log(`👨‍🏫 Host / Teacher APIs: http://localhost:${PORT}/api/host`);
    console.log(`🏢 Coordinator APIs: http://localhost:${PORT}/api/coordinator`);
    console.log(`🎓 Student APIs: http://localhost:${PORT}/api/student`);
    console.log(`🎪 Campus Events: http://localhost:${PORT}/api/events`);
    console.log(`🩺 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`================================================================`);
  });
}

module.exports = app;
