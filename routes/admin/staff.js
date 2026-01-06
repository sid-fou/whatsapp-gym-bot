const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../../middleware/auth');
const staffManagement = require('../../services/staff-management');

// All routes require admin authentication
router.use(requireAdmin);

/**
 * GET /admin/api/staff
 * Get all staff members
 */
router.get('/', async (req, res) => {
  try {
    const activeOnly = req.query.active === 'true';
    const staff = await staffManagement.getAllStaff(activeOnly);
    
    res.json({
      success: true,
      data: staff,
      count: staff.length
    });
  } catch (error) {
    console.error('Error getting staff:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve staff members'
    });
  }
});

/**
 * POST /admin/api/staff
 * Add new staff member
 * Body: { name, role, phoneNumber, email?, specialization?, receiveNotifications?, notes? }
 */
router.post('/', async (req, res) => {
  try {
    const { name, role, phoneNumber, email, specialization, receiveNotifications, notes } = req.body;
    
    if (!name || !role || !phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Name, role, and phone number are required'
      });
    }
    
    const result = await staffManagement.addStaff({
      name,
      role,
      phoneNumber,
      email,
      specialization,
      receiveNotifications: receiveNotifications !== false, // Default true
      notes
    });
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Staff member added successfully',
        data: result.staff
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error adding staff:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add staff member'
    });
  }
});

/**
 * PUT /admin/api/staff/:id
 * Update staff member
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Don't allow updating _id or timestamps
    delete updates._id;
    delete updates.createdAt;
    delete updates.updatedAt;
    
    const result = await staffManagement.updateStaff(id, updates);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Staff member updated successfully',
        data: result.staff
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error updating staff:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update staff member'
    });
  }
});

/**
 * DELETE /admin/api/staff/:id
 * Delete (deactivate) staff member
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await staffManagement.deleteStaff(id);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Staff member deactivated successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error deleting staff:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete staff member'
    });
  }
});

module.exports = router;
