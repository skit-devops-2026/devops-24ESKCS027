const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true, default: 'Technical' },
    eventType: { type: String, default: 'Workshop' },
    department: { type: String, default: 'Computer Science & Engineering' },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    venue: { type: String, required: true },
    locationType: { type: String, enum: ['In-Person', 'Online', 'Hybrid'], default: 'In-Person' },
    maxCapacity: { type: Number, required: true, min: 1 },
    capacity: { type: Number },
    totalSeats: { type: Number },
    registeredCount: { type: Number, default: 0 },
    availableSeats: { type: Number },
    visibility: {
      type: String,
      enum: ['PUBLIC', 'COLLEGE_ONLY'],
      default: 'COLLEGE_ONLY'
    },
    registrationAccess: {
      type: String,
      enum: ['PUBLIC', 'COLLEGE_STUDENTS_ONLY'],
      default: 'COLLEGE_STUDENTS_ONLY'
    },
    purpose: { type: String, default: '' },
    requiredResources: { type: String, default: '' },
    bannerUrl: { type: String, default: '' },
    registrationDeadline: { type: String, required: true },
    contactEmail: { type: String, required: true },
    contactPhone: { type: String, default: '' },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'SUBMITTED',
        'HOST_REVIEW',
        'HOST_REJECTED',
        'CHANGES_REQUESTED',
        'HOST_APPROVED',
        'HOD_REVIEW',
        'HOD_REJECTED',
        'APPROVED',
        'PUBLISHED',
        'REGISTRATION_OPEN',
        'REGISTRATION_CLOSED',
        'ONGOING',
        'COMPLETED',
        'CANCELLED',
        'Draft',
        'Published',
        'Ongoing',
        'Completed',
        'Cancelled'
      ],
      default: 'SUBMITTED',
    },
    // Student requester / Coordinator
    requestedByStudentId: { type: String, default: null },
    requestedByStudentName: { type: String, default: null },
    requestedByEmail: { type: String, default: null },
    requestedByRoll: { type: String, default: null },
    organizerId: { type: String, required: true, index: true },
    organizerName: { type: String, required: true },
    coordinatorId: { type: String, default: null },
    coordinatorName: { type: String, default: null },
    coordinatorRemarks: { type: String, default: '' },
    // Event Host / Teacher
    hostId: { type: String, default: null },
    hostName: { type: String, default: null },
    hostDepartment: { type: String, default: null },
    hostRemarks: { type: String, default: '' },
    hostApprovedAt: { type: String, default: null },
    // HOD / Admin
    hodApprovedBy: { type: String, default: null },
    hodApprovedAt: { type: String, default: null },
    hodRemarks: { type: String, default: '' },
    // Conflict override
    conflictOverride: { type: Boolean, default: false },
    overrideReason: { type: String, default: '' },
    // Approval history audit trail
    approvalHistory: [
      {
        actor: { type: String },
        role: { type: String },
        action: { type: String },
        timestamp: { type: String },
        comment: { type: String }
      }
    ],
    tags: [{ type: String }],
    price: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Event || mongoose.model('Event', eventSchema);
