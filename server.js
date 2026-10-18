
const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables before any modules that read them at load time.
dotenv.config();

const client = require('prom-client');
const { connectDB } = require('./backend/config/db');
const store = require('./backend/models/store');

const app = express();
const PORT = process.env.PORT || 5000;
const COMMIT_SHA = process.env.GITHUB_SHA || process.env.COMMIT_SHA || 'unknown';

// Connect to database if configured; otherwise use the built-in store
connectDB();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// Prometheus metrics
client.collectDefaultMetrics({
  prefix: 'eventhive_',
  register: client.register,
});

new client.Gauge({
  name: 'eventhive_process_uptime_seconds',
  help: 'Time in seconds since the EventHive process started',
  collect() {
    this.set(process.uptime());
  },
});

const httpRequestCounter = new client.Counter({
  name: 'eventhive_http_requests_total',
  help: 'Total number of HTTP requests processed by EventHive',
  labelNames: ['method', 'route', 'status_code'],
});

const httpRequestDuration = new client.Histogram({
  name: 'eventhive_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

new client.Gauge({
  name: 'eventhive_events_count',
  help: 'Total number of events stored in EventHive',
  collect() {
    this.set(store.events ? store.events.length : 0);
  },
});

new client.Gauge({
  name: 'eventhive_registrations_count',
  help: 'Total number of student and guest registrations',
  collect() {
    this.set(store.registrations ? store.registrations.length : 0);
  },
});

// Middleware
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5000')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Request timing and metrics
app.use((req, res, next) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationInSeconds = diff[0] + diff[1] / 1e9;
    const route = req.baseUrl + (req.route ? req.route.path : req.path);

    httpRequestCounter.inc({
      method: req.method,
      route,
      status_code: String(res.statusCode),
    });

    httpRequestDuration.observe({
      method: req.method,
      route,
      status_code: String(res.statusCode),
    }, durationInSeconds);
  });

  next();
});

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Malformed JSON error handling
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Malformed JSON payload received.',
    });
  }

  next(err);
});

// Root entry point MUST be before static middleware
app.get('/', (req, res) => {
  if (req.accepts('html')) {
    return res.redirect('/admin/dashboard');
  }

  return res.json({
    name: 'EventHive One-College Event Management API',
    version: '2.0.0',
    description: 'AI-Powered College Event Management Platform',
    portals: {
      admin: `http://localhost:${PORT}/admin/dashboard`,
      health: `http://localhost:${PORT}/health`,
      apiHealth: `http://localhost:${PORT}/api/health`,
      metrics: `http://localhost:${PORT}/metrics`,
      events: `http://localhost:${PORT}/api/events`,
    },
  });
});

// Static assets
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));

// Health check for Docker and Kubernetes
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'eventhive',
    commit: COMMIT_SHA,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Detailed API health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'EventHive One-College Event Management Platform',
    commit: COMMIT_SHA,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    workflow: 'Student (Request) -> Coordinator (Assign) -> Host (Conflict Check) -> HOD (Final Approval) -> Published (Registration)',
    roles: {
      hod: 'HOD / Admin (Final Approval at /admin)',
      host: 'Event Host / Faculty Mentors (/api/host)',
      coordinator: 'Event Coordinator / Organizers (/api/coordinator, /api/organizer)',
      student: 'College Students (/api/student, /api/events, /api/registrations)',
      public: 'External Guests (Public events only at /api/events)',
    },
    counts: {
      events: store.events.length,
      hosts: store.hosts.length,
      users: store.users.length,
      registrations: store.registrations.length,
      auditLogs: store.auditLogs.length,
    },
  });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});

// Mount application and API routes
app.use('/api/auth', require('./backend/routes/authRoutes'));
app.use('/api/host', require('./backend/routes/hostRoutes'));
app.use('/api/coordinator', require('./backend/routes/coordinatorRoutes'));
app.use('/api/organizer', require('./backend/routes/organizerRoutes'));
app.use('/api/student', require('./backend/routes/studentRoutes'));
app.use('/api/events', require('./backend/routes/eventRoutes'));
app.use('/api/registrations', require('./backend/routes/registrationRoutes'));

// General notifications API
app.get('/api/notifications', (req, res) => {
  res.json(store.notifications);
});

app.put('/api/notifications/mark-read', (req, res) => {
  store.notifications.forEach((notification) => {
    notification.read = true;
  });

  res.json({
    success: true,
    message: 'Notifications marked as read',
  });
});

// General hosts API
app.get('/api/hosts', (req, res) => {
  res.json({
    success: true,
    count: store.hosts.length,
    hosts: store.hosts,
  });
});

// Admin / HOD routes
app.use('/admin', require('./src/routes/adminRoutes'));

// 404 for unmatched API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// General 404 handler
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);

  if (req.originalUrl && req.originalUrl.startsWith('/api/')) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal Server Error',
      error: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
  }

  res.status(500).send('Internal Server Error');
});

// Start server only when executed directly
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log('================================================================');
    console.log(`EventHive Platform Running on Port ${PORT}`);
    console.log(`URL: http://localhost:${PORT}`);
    console.log(`HOD / Admin Panel: http://localhost:${PORT}/admin/dashboard`);
    console.log(`Health Check: http://localhost:${PORT}/health`);
    console.log(`Prometheus Metrics: http://localhost:${PORT}/metrics`);
    console.log('================================================================');
  });
}

module.exports = app;
