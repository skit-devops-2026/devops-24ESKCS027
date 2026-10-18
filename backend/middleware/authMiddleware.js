
const jwt = require('jsonwebtoken');
const store = require('../models/store');

const JWT_SECRET = process.env.JWT_SECRET;

function parseCookies(req) {
  const list = {};
  const cookieHeader = req.headers.cookie;

  if (!cookieHeader) return list;

  cookieHeader.split(';').forEach(cookie => {
    const separatorIndex = cookie.indexOf('=');

    if (separatorIndex === -1) return;

    const name = cookie.slice(0, separatorIndex).trim();
    const value = cookie.slice(separatorIndex + 1).trim();

    if (!name || !value) return;

    try {
      list[name] = decodeURIComponent(value);
    } catch {
      // Ignore malformed cookie values.
    }
  });

  return list;
}

function getToken(req) {
  const authorization = req.headers.authorization;

  if (authorization && /^Bearer\s+/i.test(authorization)) {
    return authorization.replace(/^Bearer\s+/i, '').trim();
  }

  const cookies = parseCookies(req);
  return cookies.eventhive_token || null;
}

function sendUnauthorized(res, message = 'Authentication required.') {
  return res.status(401).json({
    success: false,
    message
  });
}

// Verify a JWT and attach the authenticated user to req.user.
const protect = (req, res, next) => {
  const token = getToken(req);

  if (!token) {
    return sendUnauthorized(
      res,
      'No authorization token provided.'
    );
  }

  if (!JWT_SECRET) {
    console.error('JWT_SECRET is not configured.');
    return res.status(500).json({
      success: false,
      message: 'Authentication service is not configured.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded || !decoded.id) {
      return sendUnauthorized(res, 'Invalid authorization token.');
    }

    const user = store.findUserById(decoded.id);

    if (!user) {
      return sendUnauthorized(
        res,
        'User no longer exists. Authorization denied.'
      );
    }

    req.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department:
        user.department || 'Computer Science & Engineering',
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
    if (error.name !== 'JsonWebTokenError' &&
        error.name !== 'TokenExpiredError' &&
        error.name !== 'NotBeforeError') {
      console.error('Authentication verification failed:', error.message);
    }

    return sendUnauthorized(
      res,
      'Invalid or expired authorization token.'
    );
  }
};

// Optional authentication for public routes.
const optionalAuth = (req, res, next) => {
  const token = getToken(req);

  if (!token || !JWT_SECRET) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded || !decoded.id) {
      return next();
    }

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
  } catch {
    // Public routes continue without an authenticated user.
  }

  return next();
};

// Generic role-based authorization.
const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendUnauthorized(res, 'Authentication required.');
    }

    const userRole = (req.user.role || '').toLowerCase();
    const isAllowed = allowedRoles.some(
      role => role.toLowerCase() === userRole
    );

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource.'
      });
    }

    return next();
  };
};

// Specific role helpers.
const requireHOD = requireRole(['admin', 'hod']);

const requireHost = requireRole([
  'host',
  'teacher',
  'admin',
  'hod'
]);

const requireCoordinator = requireRole([
  'organizer',
  'coordinator',
  'admin',
  'hod'
]);

const requireCollegeStudent = (req, res, next) => {
  if (!req.user) {
    return sendUnauthorized(
      res,
      'Student authentication required.'
    );
  }

  const role = (req.user.role || '').toLowerCase();

  if (
    role !== 'student' &&
    !req.user.isCollegeVerified &&
    !['admin', 'organizer', 'host'].includes(role)
  ) {
    return res.status(403).json({
      success: false,
      message:
        'Access restricted to verified college students and college faculty.'
    });
  }

  return next();
};

// Backward-compatible requireOrganizer.
const requireOrganizer = requireRole([
  'organizer',
  'coordinator',
  'admin',
  'hod'
]);

module.exports = {
  protect,
  optionalAuth,
  requireRole,
  requireHOD,
  requireHost,
  requireCoordinator,
  requireCollegeStudent,
  requireOrganizer,
  JWT_SECRET
};
