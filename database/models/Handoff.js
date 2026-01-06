const mongoose = require('mongoose');

const handoffSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  customerName: {
    type: String,
    default: null
  },
  message: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true,
    enum: ['user_requested', 'complex_query', 'ai_detected', 'manual']
  },
  status: {
    type: String,
    required: true,
    enum: ['waiting', 'active', 'resolved'],
    default: 'waiting'
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  endedAt: {
    type: Date
  },
  staffMember: {
    type: String,
    default: null
  },
  requestedStaffMember: {
    type: String, // Name of staff member customer asked for
    default: null
  },
  assignedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
handoffSchema.index({ status: 1, timestamp: -1 });

const Handoff = mongoose.model('Handoff', handoffSchema);

module.exports = Handoff;
