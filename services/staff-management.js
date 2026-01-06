// Staff management service
const Staff = require('../database/models/Staff');

/**
 * Get all staff members
 * @param {boolean} activeOnly - Only return active staff
 * @returns {Promise<Array>}
 */
async function getAllStaff(activeOnly = false) {
  try {
    const query = activeOnly ? { isActive: true } : {};
    return await Staff.find(query).sort({ role: 1, name: 1 });
  } catch (error) {
    console.error('❌ Error getting staff:', error.message);
    return [];
  }
}

/**
 * Get staff member by name (case-insensitive)
 * @param {string} name - Staff member's name
 * @returns {Promise<Object|null>}
 */
async function getStaffByName(name) {
  try {
    return await Staff.findOne({ 
      name: new RegExp(`^${name}$`, 'i'),
      isActive: true 
    });
  } catch (error) {
    console.error('❌ Error finding staff by name:', error.message);
    return null;
  }
}

/**
 * Get staff member by phone number
 * @param {string} phoneNumber
 * @returns {Promise<Object|null>}
 */
async function getStaffByPhone(phoneNumber) {
  try {
    return await Staff.findOne({ phoneNumber, isActive: true });
  } catch (error) {
    console.error('❌ Error finding staff by phone:', error.message);
    return null;
  }
}

/**
 * Get all staff who should receive notifications
 * @returns {Promise<Array>}
 */
async function getNotificationRecipients() {
  try {
    return await Staff.find({ 
      isActive: true, 
      receiveNotifications: true 
    }).select('name phoneNumber role email'); // Include email field!
  } catch (error) {
    console.error('❌ Error getting notification recipients:', error.message);
    return [];
  }
}

/**
 * Delete staff member (soft delete - set isActive to false)
 * If re-adding same phone number, reactivate instead of creating new
 * @param {string} staffId - Staff member ID
 * @returns {Promise<Object>}
 */
async function deleteStaff(staffId) {
  try {
    const staff = await Staff.findByIdAndUpdate(
      staffId, 
      { isActive: false },
      { new: true }
    );
    if (!staff) {
      return { success: false, error: 'Staff member not found' };
    }
    console.log(`✅ Deactivated staff member: ${staff.name}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting staff:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Update staff member
 * @param {string} staffId - Staff member ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>}
 */
async function updateStaff(staffId, updates) {
  try {
    // Convert empty strings to null for optional fields
    if (updates.email === '') updates.email = null;
    if (updates.specialization === '') updates.specialization = null;
    if (updates.notes === '') updates.notes = null;
    
    const staff = await Staff.findByIdAndUpdate(staffId, updates, { new: true });
    if (!staff) {
      return { success: false, error: 'Staff member not found' };
    }
    console.log(`✅ Updated staff member: ${staff.name}`);
    return { success: true, staff };
  } catch (error) {
    console.error('❌ Error updating staff:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Add new staff member (or reactivate if phone number exists)
 * Merges new information with existing data when reactivating
 * @param {Object} staffData - Staff information
 * @returns {Promise<Object>}
 */
async function addStaff(staffData) {
  try {
    // Check if staff with this phone number exists (active or inactive)
    const existingStaff = await Staff.findOne({ 
      phoneNumber: staffData.phoneNumber
    });

    if (existingStaff) {
      // Reactivate and merge new data with existing
      existingStaff.name = staffData.name || existingStaff.name;
      existingStaff.role = staffData.role || existingStaff.role;
      existingStaff.email = staffData.email || existingStaff.email;
      existingStaff.specialization = staffData.specialization || existingStaff.specialization;
      existingStaff.notes = staffData.notes || existingStaff.notes;
      existingStaff.receiveNotifications = staffData.receiveNotifications ?? existingStaff.receiveNotifications;
      existingStaff.isActive = true; // Reactivate
      
      await existingStaff.save();
      console.log(`✅ Reactivated and updated staff member: ${existingStaff.name} (${existingStaff.role})`);
      return { success: true, staff: existingStaff, reactivated: true };
    }

    // Create new staff
    const staff = new Staff(staffData);
    await staff.save();
    console.log(`✅ Added staff member: ${staff.name} (${staff.role})`);
    return { success: true, staff, reactivated: false };
  } catch (error) {
    console.error('❌ Error adding staff:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Check if a phone number belongs to a staff member
 * @param {string} phoneNumber
 * @returns {Promise<boolean>}
 */
async function isStaffNumber(phoneNumber) {
  try {
    const staff = await Staff.findOne({ phoneNumber, isActive: true });
    return !!staff;
  } catch (error) {
    return false;
  }
}

module.exports = {
  getAllStaff,
  getStaffByName,
  getStaffByPhone,
  getNotificationRecipients,
  addStaff,
  updateStaff,
  deleteStaff,
  isStaffNumber
};
