// Escalation system for unaccepted handoffs
const Handoff = require('../database/models/Handoff');
const { notifyOwnerEscalation } = require('../services/notifications/email');

// Track which handoffs have been escalated
const escalatedHandoffs = new Set();

/**
 * Check for handoffs waiting more than 5 minutes without staff assignment
 * Notify owner if found (only once per handoff)
 */
async function checkUnacceptedHandoffs() {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    // Find handoffs that are waiting (not assigned) for more than 5 minutes
    const unacceptedHandoffs = await Handoff.find({
      status: 'waiting', // Not assigned yet
      timestamp: { $lt: fiveMinutesAgo },
      staffMember: null // No staff assigned
    });

    for (const handoff of unacceptedHandoffs) {
      // Skip if already escalated (ONLY SEND ONCE)
      if (escalatedHandoffs.has(handoff.userId)) {
        continue;
      }

      const minutesWaiting = Math.floor((Date.now() - handoff.timestamp) / 60000);
      
      console.log(`⚠️  Escalating unaccepted handoff for ${handoff.userId} (waiting ${minutesWaiting} mins)`);
      
      await notifyOwnerEscalation(
        handoff.userId,
        handoff.message,
        handoff.reason,
        minutesWaiting,
        handoff.customerName // Pass customer name to escalation
      );
      
      // Mark as escalated (prevents sending again)
      escalatedHandoffs.add(handoff.userId);
      console.log(`✅ Escalation sent (will not send again for this handoff)`);
    }
  } catch (error) {
    console.error('❌ Error checking unaccepted handoffs:', error.message);
  }
}

/**
 * Clear escalation flag when handoff is assigned or ended
 * @param {string} userId
 */
function clearEscalation(userId) {
  escalatedHandoffs.delete(userId);
}

/**
 * Start the escalation monitoring system
 * Checks every minute for unaccepted handoffs
 */
function startEscalationSystem() {
  // Check immediately on start
  checkUnacceptedHandoffs();
  
  // Then check every minute
  setInterval(checkUnacceptedHandoffs, 60 * 1000);
  
  console.log('✅ Escalation system started (checks every 1 minute)');
}

module.exports = {
  startEscalationSystem,
  clearEscalation
};
