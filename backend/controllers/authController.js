const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const store = require('../models/store');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COLLEGE_EMAIL_DOMAIN = process.env.COLLEGE_EMAIL_DOMAIN || 'college.edu';

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
};

// @desc    Authenticate User & get token (supports all 5 roles)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password || !email.trim() || !password.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = store.findUserByEmail(cleanEmail);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User with this email does not exist.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.',
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: `Login successful as ${user.role.toUpperCase()}`,
      token,
      user: {
        _id: user._id,
        id: user._id,
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
        bio: user.bio || '',
        avatar: user.avatar || '',
        isCollegeVerified: user.isCollegeVerified || false,
        collegeId: user.collegeId || user.rollNumber || ''
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login. Please try again.',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};

// @desc    Quick Demo Login for Testing (supports: admin, host, coordinator, student, public)
// @route   POST /api/auth/demo-login
// @access  Public
const demoLogin = async (req, res) => {
  try {
    const { role, email } = req.body || {};
    let targetUser;

    if (email && email.trim()) {
      targetUser = store.findUserByEmail(email.trim().toLowerCase());
    } else if (role) {
      const normalizedRole = role.toLowerCase();
      if (normalizedRole === 'admin' || normalizedRole === 'hod') {
        targetUser = store.users.find(u => u.role === 'admin');
      } else if (normalizedRole === 'host' || normalizedRole === 'teacher') {
        targetUser = store.users.find(u => u.role === 'host');
      } else if (normalizedRole === 'coordinator' || normalizedRole === 'organizer') {
        targetUser = store.users.find(u => u.role === 'organizer');
      } else if (normalizedRole === 'student') {
        targetUser = store.users.find(u => u.role === 'student');
      } else if (normalizedRole === 'public') {
        targetUser = store.users.find(u => u.role === 'public');
      }
    }

    if (!targetUser) {
      targetUser = store.users[0]; // fallback to admin
    }

    const token = generateToken(targetUser._id);

    return res.status(200).json({
      success: true,
      message: `Logged in as Demo [${targetUser.role.toUpperCase()}]: ${targetUser.name}`,
      token,
      user: {
        _id: targetUser._id,
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        department: targetUser.department || '',
        designation: targetUser.designation || '',
        rollNumber: targetUser.rollNumber || '',
        semester: targetUser.semester || '',
        year: targetUser.year || '',
        organization: targetUser.organization || '',
        phone: targetUser.phone || '',
        bio: targetUser.bio || '',
        avatar: targetUser.avatar || '',
        isCollegeVerified: targetUser.isCollegeVerified || false,
        collegeId: targetUser.collegeId || targetUser.rollNumber || ''
      },
    });
  } catch (error) {
    console.error('Demo login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error during demo login',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};

// @desc    Register a new User (Student, Organizer, or Public)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, department, rollNumber, semester, year, organization, phone } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }
    if (!password || !password.trim()) {
      return res.status(400).json({ success: false, message: 'Password is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const existing = store.findUserByEmail(cleanEmail);
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Auto-verify if email belongs to college domain or has roll number
    const isCollegeVerified = cleanEmail.endsWith(`@${COLLEGE_EMAIL_DOMAIN}`) ||
                             cleanEmail.endsWith('@eventhive.edu') ||
                             Boolean(rollNumber && rollNumber.trim());

    const assignedRole = (role && ['student', 'organizer', 'coordinator', 'host', 'public'].includes(role.toLowerCase()))
      ? role.toLowerCase()
      : (isCollegeVerified ? 'student' : 'public');

    const newUser = store.createUser({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: assignedRole === 'coordinator' ? 'organizer' : assignedRole,
      department: department || 'Computer Science & Engineering',
      rollNumber: rollNumber ? rollNumber.trim() : '',
      semester: semester || '1st Semester',
      year: year || '1st Year',
      organization: organization ? organization.trim() : '',
      phone: phone ? phone.trim() : '',
      isCollegeVerified,
      collegeId: rollNumber ? rollNumber.trim() : (isCollegeVerified ? `COL-${Math.floor(Math.random()*10000)}` : '')
    });

    const token = generateToken(newUser._id);

    return res.status(201).json({
      success: true,
      message: `Account registered successfully as ${newUser.role.toUpperCase()}!`,
      token,
      user: {
        _id: newUser._id,
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        rollNumber: newUser.rollNumber,
        isCollegeVerified: newUser.isCollegeVerified,
        collegeId: newUser.collegeId
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration.',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};

// @desc    Get Current Authenticated User Profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Not authorized. Invalid session.' });
    }

    const user = store.findUserById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department || '',
        designation: user.designation || '',
        rollNumber: user.rollNumber || '',
        semester: user.semester || '',
        year: user.year || '',
        organization: user.organization || '',
        phone: user.phone || '',
        bio: user.bio || '',
        avatar: user.avatar || '',
        isCollegeVerified: user.isCollegeVerified || false,
        collegeId: user.collegeId || user.rollNumber || ''
      },
    });
  } catch (error) {
    console.error('getMe error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching user profile' });
  }
};

// @desc    List all active Event Hosts / Teachers
// @route   GET /api/hosts or GET /api/auth/hosts
// @access  Public / Authenticated
const getHostsList = (req, res) => {
  res.status(200).json({
    success: true,
    count: store.hosts.length,
    hosts: store.hosts
  });
};

module.exports = {
  login,
  demoLogin,
  registerUser,
  registerOrganizer: registerUser,
  getMe,
  getHostsList
};
