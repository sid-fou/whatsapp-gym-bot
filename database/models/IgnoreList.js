const mongoose = require('mongoose');

// Ignore List Schema
const ignoreListSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
    // Removed: index: true (keeping unique: true which creates index automatically)
  },
  
  additionalNumbers: {
    type: [String],
    default: []
  },
  
  name: {
    type: String,
    default: '',
    trim: true
  },
  
  enabled: {
    type: Boolean,
    default: true
  },
  
  reason: {
    type: String,
    enum: ['personal', 'spam', 'manual', 'other'],
    default: 'manual'
  },
  
  addedBy: {
    type: String,
    default: 'admin' // Could be 'admin', 'auto', or staff member ID
  },
  
  note: {
    type: String,
    default: ''
  },
  
  addedAt: {
    type: Date,
    default: Date.now
  },
  
  lastMessageReceived: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  collection: 'ignore_list'
});

// Index is already created by unique: true, no need to add again
// ignoreListSchema.index({ phoneNumber: 1 }); // REMOVED

// Static method: Check if number is ignored and enabled
ignoreListSchema.statics.isIgnored = async function(phoneNumber) {
  const entry = await this.findOne({ phoneNumber, enabled: true });
  return !!entry;
};

// Static method: Add number to ignore list
ignoreListSchema.statics.addToIgnoreList = async function(phoneNumber, reason = 'manual', addedBy = 'admin', note = '', name = '') {
  try {
    const existing = await this.findOne({ phoneNumber });
    
    if (existing) {
      console.log(`⚠️  ${phoneNumber} already in ignore list`);
      return { success: false, message: 'Number already ignored', entry: existing };
    }
    
    const entry = await this.create({
      phoneNumber,
      name,
      enabled: true,
      reason,
      addedBy,
      note
    });
    
    console.log(`🚫 Added ${phoneNumber} to ignore list`);
    return { success: true, message: 'Number added to ignore list', entry };
    
  } catch (error) {
    console.error(`❌ Error adding to ignore list:`, error.message);
    return { success: false, message: error.message };
  }
};

// Static method: Remove number from ignore list
ignoreListSchema.statics.removeFromIgnoreList = async function(phoneNumber) {
  try {
    const result = await this.deleteOne({ phoneNumber });
    
    if (result.deletedCount === 0) {
      console.log(`⚠️  ${phoneNumber} not found in ignore list`);
      return { success: false, message: 'Number not found in ignore list' };
    }
    
    console.log(`✅ Removed ${phoneNumber} from ignore list`);
    return { success: true, message: 'Number removed from ignore list' };
    
  } catch (error) {
    console.error(`❌ Error removing from ignore list:`, error.message);
    return { success: false, message: error.message };
  }
};

// Static method: Get all ignored numbers
ignoreListSchema.statics.getAllIgnored = async function() {
  try {
    const entries = await this.find().sort({ addedAt: -1 });
    return entries;
  } catch (error) {
    console.error(`❌ Error getting ignore list:`, error.message);
    return [];
  }
};

// Static method: Update last message time
ignoreListSchema.statics.updateLastMessage = async function(phoneNumber) {
  try {
    await this.updateOne(
      { phoneNumber },
      { lastMessageReceived: new Date() }
    );
  } catch (error) {
    console.error(`❌ Error updating last message:`, error.message);
  }
};

// Instance method: Update note
ignoreListSchema.methods.updateNote = async function(note) {
  this.note = note;
  await this.save();
};

const IgnoreList = mongoose.model('IgnoreList', ignoreListSchema);

module.exports = IgnoreList;
