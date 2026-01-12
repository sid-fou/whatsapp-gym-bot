const Context = require('../database/models/Context');
const { isDBConnected } = require('../database/connection');

/**
 * Get or create context for a user
 * @param {string} userId - User's WhatsApp number
 * @returns {Promise<Context|null>} Context document or null if DB not connected
 */
async function getOrCreateContext(userId) {
  if (!isDBConnected()) {
    console.warn('⚠️  MongoDB not connected - running without context');
    return null;
  }

  try {
    // Try to find existing context
    let context = await Context.findOne({ userId });

    // If found, check if it's still recent (within 30 min)
    if (context) {
      if (!context.isRecent()) {
        // Context expired, reset it
        console.log(`🔄 Context expired for ${userId}, resetting...`);
        context.messages = [];
        context.metadata.firstGreeting = false;
        context.metadata.inHandoff = false;
        context.metadata.handoffReason = null;
        context.metadata.lastActivity = Date.now();
        await context.save();
      }
      return context;
    }

    // Create new context if doesn't exist
    context = new Context({
      userId,
      messages: [],
      metadata: {
        firstGreeting: false,
        inHandoff: false,
        handoffReason: null,
        lastActivity: Date.now()
      }
    });

    await context.save();
    console.log(`✨ Created new context for ${userId}`);
    return context;

  } catch (error) {
    console.error(`❌ Error getting context for ${userId}:`, error.message);
    return null;
  }
}

/**
 * Add message to user's context
 * @param {string} userId - User's WhatsApp number
 * @param {string} role - 'user' or 'assistant'
 * @param {string} content - Message content
 */
async function addMessage(userId, role, content) {
  if (!isDBConnected()) {
    return false;
  }

  try {
    const context = await getOrCreateContext(userId);
    if (!context) return false;

    context.addMessage(role, content);
    await context.save();
    
    return true;
  } catch (error) {
    console.error(`❌ Error adding message for ${userId}:`, error.message);
    return false;
  }
}

/**
 * Get conversation history formatted for AI
 * @param {string} userId - User's WhatsApp number
 * @returns {Promise<Array|null>} Array of messages or null
 */
async function getContextForAI(userId) {
  if (!isDBConnected()) {
    return null;
  }

  try {
    const context = await Context.findOne({ userId });
    
    if (!context || !context.isRecent()) {
      return null; // No recent context
    }

    return context.getMessagesForAI();
  } catch (error) {
    console.error(`❌ Error getting context for AI (${userId}):`, error.message);
    return null;
  }
}

/**
 * Check if user has been greeted already
 * @param {string} userId - User's WhatsApp number
 * @returns {Promise<boolean>} True if already greeted
 */
async function hasBeenGreeted(userId) {
  if (!isDBConnected()) {
    return false;
  }

  try {
    const context = await Context.findOne({ userId });
    return context && context.isRecent() && context.metadata.firstGreeting;
  } catch (error) {
    console.error(`❌ Error checking greeting status:`, error.message);
    return false;
  }
}

/**
 * Mark user as greeted
 * @param {string} userId - User's WhatsApp number
 */
async function markAsGreeted(userId) {
  if (!isDBConnected()) {
    return false;
  }

  try {
    const context = await getOrCreateContext(userId);
    if (!context) return false;

    context.metadata.firstGreeting = true;
    await context.save();
    return true;
  } catch (error) {
    console.error(`❌ Error marking as greeted:`, error.message);
    return false;
  }
}

/**
 * Set handoff status for user
 * @param {string} userId - User's WhatsApp number
 * @param {boolean} inHandoff - True to start handoff, false to end
 * @param {string} reason - Reason for handoff (optional)
 */
async function setHandoffStatus(userId, inHandoff, reason = null) {
  if (!isDBConnected()) {
    return false;
  }

  try {
    const context = await getOrCreateContext(userId);
    if (!context) return false;

    context.metadata.inHandoff = inHandoff;
    context.metadata.handoffReason = inHandoff ? reason : null;
    context.metadata.lastActivity = Date.now();
    
    // Track when handoff was ended (for cooldown period)
    if (!inHandoff) {
      context.metadata.lastHandoffEndedAt = Date.now();
    }
    
    await context.save();

    console.log(`🔄 Handoff status for ${userId}: ${inHandoff ? 'ON' : 'OFF'}`);
    return true;
  } catch (error) {
    console.error(`❌ Error setting handoff status:`, error.message);
    return false;
  }
}

/**
 * Check if user is in handoff mode
 * @param {string} userId - User's WhatsApp number
 * @returns {Promise<boolean>} True if in handoff
 */
async function isInHandoff(userId) {
  if (!isDBConnected()) {
    return false;
  }

  try {
    const context = await Context.findOne({ userId });
    
    // CRITICAL FIX: Handoff status should persist regardless of context age
    // Don't check isRecent() - handoff persists until explicitly ended
    if (context && context.metadata.inHandoff) {
      console.log(`🔒 User ${userId} is in handoff mode`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error checking handoff status:`, error.message);
    return false;
  }
}

/**
 * Check if user is in cooldown period after handoff ended
 * @param {string} userId - User's WhatsApp number
 * @param {number} cooldownMinutes - Cooldown duration in minutes (default: 10)
 * @returns {Promise<boolean>} True if in cooldown period
 */
async function isInHandoffCooldown(userId, cooldownMinutes = 10) {
  if (!isDBConnected()) {
    return false;
  }

  try {
    const context = await Context.findOne({ userId });
    if (!context?.metadata?.lastHandoffEndedAt) {
      return false;
    }

    const cooldownMs = cooldownMinutes * 60 * 1000;
    const timeSinceHandoffEnded = Date.now() - context.metadata.lastHandoffEndedAt;
    
    return timeSinceHandoffEnded < cooldownMs;
  } catch (error) {
    console.error(`❌ Error checking handoff cooldown:`, error.message);
    return false;
  }
}

/**
 * Clear context for a user (useful for testing or reset)
 * @param {string} userId - User's WhatsApp number
 */
async function clearContext(userId) {
  if (!isDBConnected()) {
    return false;
  }

  try {
    await Context.deleteOne({ userId });
    console.log(`🗑️  Context cleared for ${userId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error clearing context:`, error.message);
    return false;
  }
}

/**
 * Get all users currently in handoff
 * @returns {Promise<Array>} Array of userIds
 */
async function getUsersInHandoff() {
  if (!isDBConnected()) {
    return [];
  }

  try {
    const contexts = await Context.find({
      'metadata.inHandoff': true,
      'metadata.lastActivity': { $gt: Date.now() - (30 * 60 * 1000) }
    }).select('userId metadata.handoffReason');

    return contexts.map(ctx => ({
      userId: ctx.userId,
      reason: ctx.metadata.handoffReason
    }));
  } catch (error) {
    console.error(`❌ Error getting users in handoff:`, error.message);
    return [];
  }
}

/**
 * Get context statistics (for monitoring/debugging)
 * @returns {Promise<Object>} Statistics object
 */
async function getContextStats() {
  if (!isDBConnected()) {
    return { connected: false };
  }

  try {
    const total = await Context.countDocuments();
    const inHandoff = await Context.countDocuments({ 'metadata.inHandoff': true });
    const recent = await Context.countDocuments({
      'metadata.lastActivity': { $gt: Date.now() - (30 * 60 * 1000) }
    });

    return {
      connected: true,
      totalContexts: total,
      activeHandoffs: inHandoff,
      recentConversations: recent
    };
  } catch (error) {
    console.error(`❌ Error getting stats:`, error.message);
    return { connected: true, error: error.message };
  }
}

module.exports = {
  getOrCreateContext,
  addMessage,
  getContextForAI,
  hasBeenGreeted,
  markAsGreeted,
  setHandoffStatus,
  isInHandoff,
  isInHandoffCooldown,
  clearContext,
  getUsersInHandoff,
  getContextStats
};
