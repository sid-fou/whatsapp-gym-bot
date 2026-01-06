// Staff message handling and helper responses
const buttonService = require('./buttons');
const botState = require('./bot-state');
const staffManagement = require('./staff-management');

// Track staff acknowledgments (so we don't spam them)
const staffAcknowledgments = new Map(); // userId -> timestamp

/**
 * Check if message is from staff member
 * Uses both MongoDB staff database and env fallback
 * @param {string} phoneNumber - Sender's phone number
 * @returns {Promise<boolean>}
 */
async function isStaffMessage(phoneNumber) {
  // Check MongoDB staff database first
  const isInDatabase = await staffManagement.isStaffNumber(phoneNumber);
  if (isInDatabase) return true;
  
  // Fallback to env variable (for backward compatibility)
  const staffNumbers = process.env.STAFF_WHATSAPP_NUMBERS?.split(',') || [];
  return staffNumbers.some(num => {
    const cleanNum = num.trim();
    return phoneNumber.includes(cleanNum) || cleanNum.includes(phoneNumber);
  });
}

/**
 * Check if staff recently acknowledged (within 5 minutes)
 * @param {string} staffId - Staff WhatsApp number
 * @returns {boolean}
 */
function hasRecentlyAcknowledged(staffId) {
  const lastAck = staffAcknowledgments.get(staffId);
  if (!lastAck) return false;
  
  const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
  return lastAck > fiveMinutesAgo;
}

/**
 * Mark staff as acknowledged
 * @param {string} staffId - Staff WhatsApp number
 */
function markAcknowledged(staffId) {
  staffAcknowledgments.set(staffId, Date.now());
}

/**
 * Detect if message is an acknowledgment (ok, okay, got it, etc.)
 * @param {string} message - Message text
 * @returns {boolean}
 */
function isAcknowledgment(message) {
  const ackPatterns = [
    'ok', 'okay', 'k', 'got it', 'noted', 'understood',
    'sure', 'alright', 'thanks', 'thank you', 'done',
    'yes', 'yup', 'yeah', 'ack', 'acknowledged'
  ];
  
  const lowerMsg = message.toLowerCase().trim();
  return ackPatterns.some(pattern => 
    lowerMsg === pattern || lowerMsg.startsWith(pattern + ' ')
  );
}

/**
 * Detect bot control commands
 * @param {string} message - Message text
 * @returns {string|null} 'bot_off', 'bot_on', or null
 */
function detectBotCommand(message) {
  const lowerMsg = message.toLowerCase().trim();
  
  const offCommands = ['bot off', 'turn bot off', 'turn off bot', 'disable bot', 'stop bot'];
  const onCommands = ['bot on', 'turn bot on', 'turn on bot', 'enable bot', 'start bot', 'resume bot'];
  
  if (offCommands.some(cmd => lowerMsg.includes(cmd))) {
    return 'bot_off';
  }
  
  if (onCommands.some(cmd => lowerMsg.includes(cmd))) {
    return 'bot_on';
  }
  
  return null;
}

/**
 * Parse staff command for ending handoff
 * @param {string} message - Message text
 * @returns {Object|null} { type: 'end_handoff', customerId: '91XXX' } or null
 */
function parseStaffCommand(message) {
  const lowerMsg = message.toLowerCase().trim();
  
  // Pattern: "end handoff 918791514008" or "end 918791514008"
  const endHandoffPattern = /end(?:\s+handoff)?\s+(\d{10,15})/i;
  const match = message.match(endHandoffPattern);
  
  if (match && match[1]) {
    return {
      type: 'end_handoff',
      customerId: match[1]
    };
  }
  
  // Pattern: "reply to 918791514008: message" or "reply 918791514008: message"
  const replyPattern = /reply(?:\s+to)?\s+(\d{10,15}):\s*(.+)/i;
  const replyMatch = message.match(replyPattern);
  
  if (replyMatch && replyMatch[1] && replyMatch[2]) {
    return {
      type: 'reply_to_customer',
      customerId: replyMatch[1],
      message: replyMatch[2].trim()
    };
  }
  
  return null;
}

/**
 * Handle staff acknowledgment - send button
 * @param {string} staffId - Staff WhatsApp number
 * @param {string} customerId - Customer WhatsApp number
 * @returns {Object|null} Button payload or null
 */
function handleAcknowledgment(staffId, customerId) {
  // Check if already acknowledged recently
  if (hasRecentlyAcknowledged(staffId)) {
    return null; // Don't send button again
  }
  
  // Mark as acknowledged
  markAcknowledged(staffId);
  
  // Return button payload
  return buttonService.createEndHandoffButton(customerId);
}

/**
 * Handle bot control command
 * @param {string} command - 'bot_off' or 'bot_on'
 * @returns {Object} Response with button
 */
function handleBotControl(command) {
  if (command === 'bot_off') {
    botState.disableBot();
    return buttonService.createBotOnButton();
  } else if (command === 'bot_on') {
    botState.enableBot();
    return buttonService.createBotOffButton();
  }
  
  return null;
}

module.exports = {
  isStaffMessage,
  isAcknowledgment,
  detectBotCommand,
  parseStaffCommand,
  handleAcknowledgment,
  handleBotControl,
  hasRecentlyAcknowledged
};
