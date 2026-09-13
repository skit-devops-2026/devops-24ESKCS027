const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, index: true },
    eventTitle: { type: String, required: true },
    participantName: { type: String, required: true, trim: true },
    participantEmail: { type: String, required: true, lowercase: true, trim: true },
    participantPhone: { type: String, default: '' },
    studentId: { type: String, default: '' },
    userId: { type: String, default: '' },
    registrationType: {
      type: String,
      enum: ['CollegeStudent', 'ExternalVisitor'],
      default: 'CollegeStudent'
    },
    ticketCode: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ['Confirmed', 'Pending', 'Attended', 'Cancelled'],
      default: 'Confirmed',
    },
    registeredAt: { type: Date, default: Date.now },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Registration || mongoose.model('Registration', registrationSchema);
