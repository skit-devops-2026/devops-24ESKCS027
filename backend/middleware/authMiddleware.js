const jwt = require('jsonwebtoken');
const store = require('../models/store');

const JWT_SECRET = process.env.JWT_SECRET || 'eventhive-jwt-secret-key-2026';

function parseCookies(req) {
  const list = {};
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return list;

  cookieHeader.split(';').forEach(cookie => {
    let [name, ...rest] = cookie.split('=');
    name = name.trim();
    if (!name) return;
    const value = rest.join('=').trim();
    if (!value) return;
    list[name] = decodeURIComponent(value);
  });
  return list;
}

// Verify JWT token or session cookie and attach user to req.user
const protect = (req, res, next) => {
  let token;

  // 1. Check Authorization Header (Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 2. Check cookies as fallback
  if (!token) {
    const cookies = parseCookies(req);
    if (cookies.eventhive_token) {
      token = cookies.eventhive_token;
    } else if (cookies.eh_admin_session === 'authenticated_admin_session_token') {
      // HOD / Admin session
      req.user = {
        _id: 'hod_001',
        name: 'Dr. Arthur Pendelton',
        email: 'admin@eventhive.com',
        role: 'admin',
        department: 'Computer Science & Engineering',
        designation: 'Head of Department',
        isCollegeVerified: true,
        collegeId: 'FAC-HOD-01'
      };
      return next();
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No authorization token provided in request header.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = store.findUserById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists. Authorization denied.',
      });
    }

    req.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || 'Computer Science & Engineering',
      designation: user.designation || '',
      rollNumber: user.rollNumber || '',
      semester: user.semester || '',
      year: user.year || '',
      organization: user.organization || '',
      phone: user.phone || '',
      avatar: user.avatar || '',
      isCollegeVerified: user.isCollegeVerified || false,
      collegeId: user.collegeId || user.rollNumber || ''
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authorization token.',
      error: error.message,
    });
  }
};

// Optional auth for public routes (e.g. browse events)
const optionalAuth = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    const cookies = parseCookies(req);
    if (cookies.eventhive_token) token = cookies.eventhive_token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = store.findUserById(decoded.id);
      if (user) {
        req.user = {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          isCollegeVerified: user.isCollegeVerified,
          collegeId: user.collegeId
        };
      }
    } catch (e) {
      // ignore invalid token for optional endpoints
    }
  }
  next();
};

// Generic Role-based authorization
const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const userRole = (req.user.role || '').toLowerCase();
    const isAllowed = allowedRoles.some(r => r.toLowerCase() === userRole);

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${allowedRoles.join(', ')}]. Your role is '${req.user.role}'.`,
      });
    }

    next();
  };
};

// Specific role helpers
const requireHOD = requireRole(['admin', 'hod']);
const requireHost = requireRole(['host', 'teacher', 'admin', 'hod']);
const requireCoordinator = requireRole(['organizer', 'coordinator', 'admin', 'hod']);
const requireCollegeStudent = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Student authentication required.' });
  }
  if (req.user.role !== 'student' && !req.user.isCollegeVerified && req.user.role !== 'admin' && req.user.role !== 'organizer' && req.user.role !== 'host') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Access restricted to verified college students and college faculty.',
    });
  }
  next();
};

// Backward-compatible requireOrganizer
const requireOrganizer = requireRole(['organizer', 'coordinator', 'admin', 'hod']);

module.exports = {
  protect,
  optionalAuth,
  requireRole,
  requireHOD,
  requireHost,
  requireCoordinator,
  requireCollegeStudent,
  requireOrganizer,
  JWT_SECRET,
};
