const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'hod', 'host', 'teacher', 'organizer', 'coordinator', 'student', 'public'],
      default: 'student'
    },
    department: { type: String, default: 'Computer Science & Engineering' },
    designation: { type: String, default: '' },
    rollNumber: { type: String, default: '' },
    semester: { type: String, default: '' },
    year: { type: String, default: '' },
    collegeId: { type: String, default: '' },
    isCollegeVerified: { type: Boolean, default: false },
    organization: { type: String, default: '' },
    phone: { type: String, default: '' },
    bio: { type: String, default: '' },
    avatar: { type: String, default: '' },
    website: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
