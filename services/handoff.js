// Human handoff triggers and management with MongoDB persistence
const { notifyStaff } = require('./notifications/email');
const { notifyStaffViaWhatsApp } = require('./notifications/whatsapp');
const { getContactInfo } = require('../config/gym-config');
const Handoff = require('../database/models/Handoff');
const aiHandoffDetector = require('./ai-handoff-detector');
const staffManagement = require('./staff-management');
const escalationService = require('./escalation');

const HANDOFF_TRIGGERS = {
  keywords: [
    'speak to human',
    'talk to someone',
    'talk to person',
    'talk to staff',
    'talk to your staff',
    'talk to the staff',
    'need to talk to staff',
    'want to talk to staff',
    'speak to staff',
    'speak to your staff',
    'real person',
    'customer service',
    'representative',
    'agent',
    'staff member',
    'manager',
    'gym owner',
    'talk to owner',
    'speak to owner',
    'complaint',
    'issue',
    'problem',
    'not satisfied',
    'cancel membership',
    'refund',
    'speak with',
    'talk with',
    'human help',
    'need help from staff',
    'contact staff',
    // Booking-related triggers
    'book a trial',
    'book trial',
    'trial booking',
    'schedule trial',
    'reserve trial',
    'trial session',
    'book a session',
    'book session',
    'schedule session',
    'reserve session',
    'book appointment',
    'schedule appointment',
    'make appointment',
    'book a class',
    'book class',
    'reserve class'
  ],
  
  complexQueries: [
    'injury',
    'injured',
    'medical condition',
    'health issue',
    'health problem',
    'pregnant',
    'pregnancy',
    'surgery',
    'disability',
    'disabled',
    'custom package',
    'corporate membership',
    'bulk discount',
    'medical',
    'doctor',
    'physiotherapist'
  ]
};

// In-memory cache for quick lookups (synced with DB)
const activeHandoffs = new Set();

// Initialize cache from database on startup
async function initializeCache() {
  try {
    const activeHandoffsInDb = await Handoff.find({ status: 'waiting' });
    activeHandoffs.clear();
    activeHandoffsInDb.forEach(handoff => {
      activeHandoffs.add(handoff.userId);
    });
    console.log(`🔄 Loaded ${activeHandoffs.size} active handoffs from database`);
  } catch (error) {
    console.error('❌ Failed to initialize handoff cache:', error.message);
  }
}

// Call this on server startup
initializeCache();

function shouldTriggerHandoff(message) {
  const lowerMessage = message.toLowerCase();
  
  // Check for direct human request (keyword matching - fast)
  const wantsHuman = HANDOFF_TRIGGERS.keywords.some(
    keyword => lowerMessage.includes(keyword)
  );
  
  // Check for complex queries
  const isComplex = HANDOFF_TRIGGERS.complexQueries.some(
    keyword => lowerMessage.includes(keyword)
  );
  
  // Debug logging
  if (wantsHuman || isComplex) {
    console.log(`🔍 Handoff keyword match detected in: "${message}"`);
  }
  
  return {
    shouldHandoff: wantsHuman || isComplex,
    reason: wantsHuman ? 'user_requested' : isComplex ? 'complex_query' : null,
    needsAICheck: !wantsHuman && !isComplex // If keywords didn't match, we should do AI check
  };
}

/**
 * Advanced handoff detection using AI (slower but smarter)
 * @param {string} message - User's message
 * @returns {Promise<Object>} { shouldHandoff, reason }
 */
async function shouldTriggerHandoffWithAI(message) {
  // First try keyword matching (fast)
  const keywordResult = shouldTriggerHandoff(message);
  
  if (keywordResult.shouldHandoff) {
    return keywordResult; // Keywords matched, no need for AI
  }
  
  // Keywords didn't match - use AI detection (slower but catches more cases)
  const aiDetected = await aiHandoffDetector.detectHandoffIntent(message);
  
  if (aiDetected) {
    console.log(`🤖 AI detected handoff request (keywords missed it)`);
    return {
      shouldHandoff: true,
      reason: 'user_requested',
      needsAICheck: false
    };
  }
  
  return {
    shouldHandoff: false,
    reason: null,
    needsAICheck: false
  };
}

async function addToHandoffQueue(userId, message, reason, customerName = null) {
  try {
    // CRITICAL: Check if handoff already exists for this user (prevents duplicate notifications)
    const existingHandoff = await Handoff.findOne({ 
      userId, 
      status: { $in: ['waiting', 'active'] } 
    });
    
    if (existingHandoff) {
      console.log(`⚠️  Handoff already exists for ${userId} (status: ${existingHandoff.status}) - Skipping duplicate`);
      // Still add to cache in case it was missing
      activeHandoffs.add(userId);
      return; // Don't send duplicate notifications
    }
    
    // Check if user is requesting a specific staff member
    const requestedStaff = await detectRequestedStaff(message);
    
    // Save to database (upsert to avoid duplicates)
    // IMPORTANT: Explicitly set staffMember to null for new handoffs
    await Handoff.findOneAndUpdate(
      { userId },
      {
        userId,
        customerName,
        message,
        reason,
        status: 'waiting',
        timestamp: new Date(),
        requestedStaffMember: requestedStaff?.name || null,
        staffMember: null,  // CRITICAL: Reset staff assignment for new handoff
        assignedAt: null    // Reset assignment time too
      },
      { upsert: true, new: true }
    );
    
    // Add to in-memory cache
    activeHandoffs.add(userId);
    
    console.log(`👤 User ${userId} added to handoff queue - Reason: ${reason}`);
    if (requestedStaff) {
      console.log(`🎯 Specific staff requested: ${requestedStaff.name} (${requestedStaff.role})`);
    }
    
    // Send notifications to staff
    console.log(`📣 About to send notifications for handoff...`);
    try {
      // If specific staff requested, notify only them
      if (requestedStaff) {
        console.log(`📲 Notifying specific staff: ${requestedStaff.phoneNumber}`);
        await notifyStaffViaWhatsApp(userId, message, reason, requestedStaff.phoneNumber, customerName);
        // Also send email to specific staff
        await notifyStaff(userId, message, reason, requestedStaff.phoneNumber, customerName);
      } else {
        // Otherwise notify all staff
        console.log(`📲 Notifying all staff via WhatsApp...`);
        await notifyStaffViaWhatsApp(userId, message, reason, null, customerName);
        console.log(`📧 Notifying all staff via Email...`);
        // Email notification to all staff (excluding owner initially)
        await notifyStaff(userId, message, reason, null, customerName);
      }
      console.log(`✅ Notification process completed`);
    } catch (error) {
      console.error('❌ Failed to notify staff:', error.message);
      console.error('   Stack:', error.stack);
    }
  } catch (error) {
    console.error('❌ Failed to add to handoff queue:', error.message);
  }
}

/**
 * Detect if user is requesting a specific staff member by name
 * @param {string} message - User's message
 * @returns {Promise<Object|null>} Staff member or null
 */
async function detectRequestedStaff(message) {
  try {
    const allStaff = await staffManagement.getAllStaff(true); // Only active staff
    
    // Check if any staff member's name is mentioned in the message
    for (const staff of allStaff) {
      const nameLower = staff.name.toLowerCase();
      const messageLower = message.toLowerCase();
      
      if (messageLower.includes(nameLower)) {
        return staff;
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error detecting requested staff:', error.message);
    return null;
  }
}

function isInHandoffMode(userId) {
  return activeHandoffs.has(userId);
}

async function endHandoff(userId) {
  try {
    // Update database
    await Handoff.findOneAndUpdate(
      { userId },
      {
        status: 'resolved',
        endedAt: new Date()
      }
    );
    
    // Remove from in-memory cache
    activeHandoffs.delete(userId);
    
    // Clear escalation flag
    escalationService.clearEscalation(userId);
    
    console.log(`✅ Handoff ended for user ${userId} - Bot re-enabled`);
  } catch (error) {
    console.error('❌ Failed to end handoff:', error.message);
  }
}

function getHandoffMessage(reason) {
  const contactInfo = getContactInfo(); // Use centralized config
  const baseMessage = "I understand you need personalized assistance from our team.";
  
  const messages = {
    user_requested: `${baseMessage} I've notified our staff who will respond to you shortly on this WhatsApp number.

For immediate assistance:
${contactInfo}

⏸️ Our automated bot will pause until our team assists you.`,
    
    complex_query: `${baseMessage} This requires expert attention from our team. A staff member will reach out to you within 30 minutes.

For urgent matters:
${contactInfo}

⏸️ Our automated bot will pause until our team assists you.`,
    
    ai_detected: `${baseMessage} Based on your request, I've notified our team who will contact you shortly.

For urgent help:
${contactInfo}

⏸️ Our automated bot will pause until our team assists you.`,
    
    default: `${baseMessage} Our team has been notified and will contact you shortly.

For immediate help:
${contactInfo}

⏸️ Our automated bot will pause until our team assists you.`
  };
  
  return messages[reason] || messages.default;
}

async function getQueueStatus() {
  try {
    // Get both waiting and active handoffs (not resolved)
    const handoffs = await Handoff.find({ 
      status: { $in: ['waiting', 'active'] } 
    }).sort({ timestamp: 1 });
    
    return {
      waiting: handoffs.map(h => ({
        userId: h.userId,
        customerName: h.customerName || null,
        message: h.message,
        reason: h.reason,
        timestamp: h.timestamp.toISOString(),
        status: h.status,
        staffMember: h.staffMember || null,
        assignedAt: h.assignedAt ? h.assignedAt.toISOString() : null
      })),
      activeCount: handoffs.length
    };
  } catch (error) {
    console.error('❌ Failed to get queue status:', error.message);
    return {
      waiting: [],
      activeCount: 0
    };
  }
}

async function removeFromQueue(userId) {
  try {
    const result = await Handoff.findOneAndDelete({ userId });
    
    if (result) {
      activeHandoffs.delete(userId);
      console.log(`✅ User ${userId} removed from handoff queue`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Failed to remove from queue:', error.message);
    return false;
  }
}

/**
 * Assign handoff to a staff member
 * @param {string} userId - Customer user ID
 * @param {string} staffId - Staff WhatsApp number
 */
async function assignToStaff(userId, staffId) {
  try {
    await Handoff.findOneAndUpdate(
      { userId },
      {
        staffMember: staffId,
        assignedAt: new Date(),
        status: 'active'
      }
    );
    
    console.log(`👤 Handoff for ${userId} assigned to staff ${staffId}`);
    
    // Clear escalation flag since handoff is now assigned
    escalationService.clearEscalation(userId);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to assign handoff:', error.message);
    return false;
  }
}

/**
 * Check if a handoff is assigned to specific staff
 * @param {string} userId - Customer user ID
 * @param {string} staffId - Staff WhatsApp number
 * @returns {Promise<boolean>}
 */
async function isAssignedToStaff(userId, staffId) {
  try {
    const handoff = await Handoff.findOne({ userId, staffMember: staffId });
    return !!handoff;
  } catch (error) {
    console.error('❌ Failed to check assignment:', error.message);
    return false;
  }
}

/**
 * Get handoff details for a customer
 * @param {string} userId - Customer user ID
 * @returns {Promise<Object|null>}
 */
async function getHandoffDetails(userId) {
  try {
    return await Handoff.findOne({ userId });
  } catch (error) {
    console.error('❌ Failed to get handoff details:', error.message);
    return null;
  }
}

/**
 * Detect if user is requesting a specific staff member by name (public version)
 * @param {string} message - User's message
 * @returns {Promise<Object|null>} Staff member or null
 */
async function detectRequestedStaffFromMessage(message) {
  return await detectRequestedStaff(message);
}

module.exports = {
  shouldTriggerHandoff,
  shouldTriggerHandoffWithAI,
  addToHandoffQueue,
  isInHandoffMode,
  endHandoff,
  getHandoffMessage,
  getQueueStatus,
  removeFromQueue,
  initializeCache,
  assignToStaff,
  isAssignedToStaff,
  getHandoffDetails,
  detectRequestedStaffFromMessage
};
