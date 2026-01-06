const IgnoreList = require('../database/models/IgnoreList');
const { isDBConnected } = require('../database/connection');

/**
 * Check if a phone number is in the ignore list
 * @param {string} phoneNumber - WhatsApp phone number
 * @returns {Promise<boolean>}
 */
async function isIgnored(phoneNumber) {
  if (!isDBConnected()) {
    return false; // If DB not connected, don't ignore anyone
  }

  try {
    const ignored = await IgnoreList.isIgnored(phoneNumber);
    
    // If ignored, update last message time
    if (ignored) {
      await IgnoreList.updateLastMessage(phoneNumber);
    }
    
    return ignored;
  } catch (error) {
    console.error(`❌ Error checking ignore list:`, error.message);
    return false; // On error, don't ignore (better to respond than miss customer)
  }
}

/**
 * Add number to ignore list
 * @param {string} phoneNumber - WhatsApp phone number
 * @param {string} reason - Why it's ignored: 'personal', 'spam', 'manual', 'other'
 * @param {string} addedBy - Who added it: 'admin', 'staff', 'auto'
 * @param {string} note - Optional note
 * @param {string} name - Optional contact name
 * @returns {Promise<Object>}
 */
async function addToIgnoreList(phoneNumber, reason = 'manual', addedBy = 'admin', note = '', name = '') {
  if (!isDBConnected()) {
    return { success: false, message: 'Database not connected' };
  }

  return await IgnoreList.addToIgnoreList(phoneNumber, reason, addedBy, note, name);
}

/**
 * Remove number from ignore list
 * @param {string} phoneNumber - WhatsApp phone number
 * @returns {Promise<Object>}
 */
async function removeFromIgnoreList(phoneNumber) {
  if (!isDBConnected()) {
    return { success: false, message: 'Database not connected' };
  }

  return await IgnoreList.removeFromIgnoreList(phoneNumber);
}

/**
 * Get all ignored numbers
 * @returns {Promise<Array>}
 */
async function getAllIgnored() {
  if (!isDBConnected()) {
    return [];
  }

  return await IgnoreList.getAllIgnored();
}

/**
 * Get ignore list statistics
 * @returns {Promise<Object>}
 */
async function getIgnoreStats() {
  if (!isDBConnected()) {
    return { connected: false };
  }

  try {
    const total = await IgnoreList.countDocuments();
    const byReason = await IgnoreList.aggregate([
      {
        $group: {
          _id: '$reason',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Count recently messaged (within last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentlyActive = await IgnoreList.countDocuments({
      lastMessageReceived: { $gte: sevenDaysAgo }
    });

    return {
      connected: true,
      total,
      byReason: byReason.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      recentlyActive
    };
  } catch (error) {
    console.error(`❌ Error getting ignore stats:`, error.message);
    return { connected: true, error: error.message };
  }
}

/**
 * Bulk add numbers to ignore list
 * @param {Array<string>} phoneNumbers - Array of phone numbers
 * @param {string} reason - Reason for ignoring
 * @param {string} addedBy - Who added them
 * @returns {Promise<Object>}
 */
async function bulkAddToIgnoreList(phoneNumbers, reason = 'manual', addedBy = 'admin') {
  if (!isDBConnected()) {
    return { success: false, message: 'Database not connected' };
  }

  try {
    const results = {
      added: [],
      skipped: [],
      failed: []
    };

    for (const phoneNumber of phoneNumbers) {
      const result = await addToIgnoreList(phoneNumber, reason, addedBy);
      
      if (result.success) {
        results.added.push(phoneNumber);
      } else if (result.message.includes('already')) {
        results.skipped.push(phoneNumber);
      } else {
        results.failed.push(phoneNumber);
      }
    }

    return {
      success: true,
      ...results,
      summary: `Added ${results.added.length}, Skipped ${results.skipped.length}, Failed ${results.failed.length}`
    };
  } catch (error) {
    console.error(`❌ Error bulk adding to ignore list:`, error.message);
    return { success: false, message: error.message };
  }
}

module.exports = {
  isIgnored,
  addToIgnoreList,
  removeFromIgnoreList,
  getAllIgnored,
  getIgnoreStats,
  bulkAddToIgnoreList
};
