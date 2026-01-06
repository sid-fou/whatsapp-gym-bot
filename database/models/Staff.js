const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    enum: ['owner', 'manager', 'trainer', 'front_desk', 'staff'],
    default: 'staff'
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    trim: true
  },
  specialization: {
    type: String, // For trainers: "Yoga", "CrossFit", etc.
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  receiveNotifications: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Index for faster queries
staffSchema.index({ isActive: 1, receiveNotifications: 1 });

const Staff = mongoose.model('Staff', staffSchema);

module.exports = Staff;
