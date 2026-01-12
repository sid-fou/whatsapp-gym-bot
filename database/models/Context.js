const mongoose = require('mongoose');

// Message sub-schema
const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Number,
    required: true,
    default: () => Date.now()
  }
}, { _id: false }); // Don't create _id for sub-documents

// Main context schema
const contextSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  
  messages: {
    type: [messageSchema],
    default: [],
    validate: {
      validator: function(messages) {
        return messages.length <= 10; // Max 10 messages
      },
      message: 'Cannot store more than 10 messages per user'
    }
  },
  
  metadata: {
    firstGreeting: {
      type: Boolean,
      default: false
    },
    inHandoff: {
      type: Boolean,
      default: false,
      index: true
    },
    handoffReason: {
      type: String,
      enum: ['user_requested', 'complex_query', 'ai_detected', 'booking', null],
      default: null
    },
    lastHandoffEndedAt: {
      type: Number,
      default: null
    },
    lastActivity: {
      type: Number,
      required: true,
      default: () => Date.now()
    }
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  collection: 'conversation_contexts'
});

// Index for cleanup queries (find old conversations)
contextSchema.index({ 'metadata.lastActivity': 1 });

// Static method: Cleanup old contexts (older than 30 minutes)
// CRITICAL: Does NOT delete contexts that are in active handoff
contextSchema.statics.cleanupOldContexts = async function() {
  const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
  
  try {
    const result = await this.deleteMany({
      'metadata.lastActivity': { $lt: thirtyMinutesAgo },
      'metadata.inHandoff': { $ne: true } // Don't delete if in handoff!
    });
    
    if (result.deletedCount > 0) {
      console.log(`🗑️  Cleaned up ${result.deletedCount} old conversation(s) (preserved handoffs)`);
    }
    
    return result.deletedCount;
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    return 0;
  }
};

// Instance method: Add message to context (maintains max 10)
contextSchema.methods.addMessage = function(role, content) {
  this.messages.push({
    role,
    content,
    timestamp: Date.now()
  });
  
  // Keep only last 10 messages
  if (this.messages.length > 10) {
    this.messages = this.messages.slice(-10);
  }
  
  // Update last activity
  this.metadata.lastActivity = Date.now();
};

// Instance method: Check if context is recent (within 30 min)
contextSchema.methods.isRecent = function() {
  const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
  return this.metadata.lastActivity > thirtyMinutesAgo;
};

// Instance method: Get formatted messages for AI
contextSchema.methods.getMessagesForAI = function() {
  return this.messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
};

const Context = mongoose.model('Context', contextSchema);

module.exports = Context;
