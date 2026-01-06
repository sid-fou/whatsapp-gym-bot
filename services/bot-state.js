// Global bot state management

let botEnabled = true; // Bot starts enabled

/**
 * Check if bot is currently enabled
 * @returns {boolean}
 */
function isBotEnabled() {
  return botEnabled;
}

/**
 * Turn bot on (resume auto-responses)
 */
function enableBot() {
  botEnabled = true;
  console.log('🟢 Bot enabled - Auto-responding to customers');
}

/**
 * Turn bot off (stop auto-responses for all)
 */
function disableBot() {
  botEnabled = false;
  console.log('🔴 Bot disabled - All messages go to staff');
}

/**
 * Toggle bot state
 * @returns {boolean} New state
 */
function toggleBot() {
  botEnabled = !botEnabled;
  console.log(`🔄 Bot ${botEnabled ? 'enabled' : 'disabled'}`);
  return botEnabled;
}

module.exports = {
  isBotEnabled,
  enableBot,
  disableBot,
  toggleBot
};
