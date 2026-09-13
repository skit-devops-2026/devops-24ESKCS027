const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const COMMIT_SHA = process.env.GITHUB_SHA || 'unknown';

// --- View Engine Setup ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- Routes ---

// Health check endpoint
app.get('/health', (req, res) => {
  const commit = COMMIT_SHA;

  res.json({
    status: 'ok',
    commit: commit
  });
});

// Admin routes
const adminRoutes = require('./src/routes/adminRoutes');
app.use('/admin', adminRoutes);

// Root redirect to admin dashboard
app.get('/', (req, res) => {
  res.redirect('/admin/dashboard');
});

// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// --- Error Handler ---
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).send('Internal Server Error');
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`EventHive server running on http://localhost:${PORT}`);
  console.log(`Admin dashboard: http://localhost:${PORT}/admin/dashboard`);
});

module.exports = app;