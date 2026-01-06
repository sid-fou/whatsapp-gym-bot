const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../../middleware/auth');
const ignoreListService = require('../../services/ignore-list');
const contextService = require('../../services/context');
const handoffService = require('../../services/handoff');
const botState = require('../../services/bot-state');
const Context = require('../../database/models/Context');

// All routes require admin authentication
router.use(requireAdmin);

// ============================================
// IGNORE LIST ENDPOINTS
// ============================================

/**
 * GET /admin/api/ignored
 * Get all ignored numbers
 */
router.get('/ignored', async (req, res) => {
  try {
    const ignored = await ignoreListService.getAllIgnored();
    const stats = await ignoreListService.getIgnoreStats();
    
    res.json({
      success: true,
      data: ignored,
      stats: stats,
      count: ignored.length
    });
  } catch (error) {
    console.error('Error getting ignored list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve ignored numbers',
      message: error.message
    });
  }
});

/**
 * POST /admin/api/ignore
 * Add number to ignore list
 * Body: { phoneNumber, reason?, note?, name? }
 */
router.post('/ignore', async (req, res) => {
  try {
    const { phoneNumber, reason = 'manual', note = '', name = '' } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }
    
    const result = await ignoreListService.addToIgnoreList(
      phoneNumber,
      reason,
      'admin',
      note,
      name
    );
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Number added to ignore list',
        data: result.entry
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error adding to ignore list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add number to ignore list',
      message: error.message
    });
  }
});

/**
 * DELETE /admin/api/ignore/:phoneNumber
 * Remove number from ignore list
 */
router.delete('/ignore/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    
    const result = await ignoreListService.removeFromIgnoreList(phoneNumber);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Number removed from ignore list'
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error removing from ignore list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove number',
      message: error.message
    });
  }
});

/**
 * PUT /admin/api/ignore/:phoneNumber
 * Update ignored number details
 * Body: { name?, reason?, note?, enabled? }
 */
router.put('/ignore/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const { name, reason, note, enabled } = req.body;
    
    const IgnoreList = require('../../database/models/IgnoreList');
    const updated = await IgnoreList.findOneAndUpdate(
      { phoneNumber },
      { name, reason, note, enabled },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Number not found in ignore list'
      });
    }

    res.json({
      success: true,
      message: 'Number updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error updating ignored number:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update number',
      message: error.message
    });
  }
});

/**
 * PATCH /admin/api/ignore/:phoneNumber/toggle
 * Toggle enabled status of ignored number
 */
router.patch('/ignore/:phoneNumber/toggle', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    
    const IgnoreList = require('../../database/models/IgnoreList');
    const number = await IgnoreList.findOne({ phoneNumber });
    
    if (!number) {
      return res.status(404).json({
        success: false,
        error: 'Number not found in ignore list'
      });
    }

    number.enabled = !number.enabled;
    await number.save();

    res.json({
      success: true,
      message: `Number ${number.enabled ? 'enabled' : 'disabled'}`,
      data: number
    });
  } catch (error) {
    console.error('Error toggling number:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle number',
      message: error.message
    });
  }
});

// ============================================
// HANDOFF ENDPOINTS
// ============================================

/**
 * GET /admin/api/handoffs
 * Get current handoff queue status
 */
router.get('/handoffs', async (req, res) => {
  try {
    const queueStatus = await handoffService.getQueueStatus();
    
    res.json({
      success: true,
      data: queueStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting handoff queue:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve handoff queue',
      message: error.message
    });
  }
});

/**
 * POST /admin/api/handoffs/:userId/end
 * End handoff for a specific user
 */
router.post('/handoffs/:userId/end', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // End handoff in service
    handoffService.endHandoff(userId);
    
    // Update context status
    await contextService.setHandoffStatus(userId, false);
    
    // Send goodbye message to customer
    const fetch = require('node-fetch');
    const goodbyeMessage = `Thank you for contacting IronCore Fitness! 💪

Our automated assistant is now back online to help you. Feel free to reach out anytime!

Stay strong! 🏋️‍♂️`;
    
    const url = `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`;
    await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: userId,
        type: 'text',
        text: { body: goodbyeMessage }
      })
    });
    
    // Save goodbye message to context
    await contextService.addMessage(userId, 'assistant', goodbyeMessage);
    
    res.json({
      success: true,
      message: `Handoff ended for ${userId}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error ending handoff:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end handoff',
      message: error.message
    });
  }
});

/**
 * DELETE /admin/api/handoffs/:phoneNumber
 * End handoff for a phone number (REST-style)
 */
router.delete('/handoffs/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    
    // End handoff in service
    handoffService.endHandoff(phoneNumber);
    
    // Update context status
    await contextService.setHandoffStatus(phoneNumber, false);
    
    // Send goodbye message to customer
    const fetch = require('node-fetch');
    const goodbyeMessage = `Thank you for contacting IronCore Fitness! 💪

Our automated assistant is now back online to help you. Feel free to reach out anytime!

Stay strong! 🏋️‍♂️`;
    
    const url = `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`;
    await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: { body: goodbyeMessage }
      })
    });
    
    // Save goodbye message to context
    await contextService.addMessage(phoneNumber, 'assistant', goodbyeMessage);
    
    res.json({
      success: true,
      message: `Handoff ended for ${phoneNumber}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error ending handoff:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end handoff',
      message: error.message
    });
  }
});

/**
 * POST /admin/api/handoffs/clear
 * Clear entire handoff queue
 */
router.post('/handoffs/clear', async (req, res) => {
  try {
    const queueStatus = handoffService.getQueueStatus();
    const clearedCount = queueStatus.count;
    
    // Clear all handoffs
    for (const user of queueStatus.queue) {
      handoffService.endHandoff(user.userId);
      await contextService.setHandoffStatus(user.userId, false);
    }
    
    res.json({
      success: true,
      message: `Cleared ${clearedCount} handoffs`,
      clearedCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing handoff queue:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear handoff queue',
      message: error.message
    });
  }
});

// ============================================
// CONVERSATION ENDPOINTS
// ============================================

/**
 * GET /admin/api/conversations
 * Get recent conversations
 * Query params: limit (default: 20)
 */
router.get('/conversations', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    const conversations = await Context.find()
      .sort({ 'metadata.lastActivity': -1 })
      .limit(limit)
      .select('userId messages metadata createdAt updatedAt');
    
    // Format for frontend
    const formatted = conversations.map(conv => ({
      userId: conv.userId,
      lastMessage: conv.messages[conv.messages.length - 1]?.content || '',
      messageCount: conv.messages.length,
      lastActivity: conv.metadata.lastActivity,
      inHandoff: conv.metadata.inHandoff,
      firstGreeting: conv.metadata.firstGreeting,
      preview: conv.messages.slice(-3).map(m => ({
        role: m.role,
        content: m.content.substring(0, 100)
      }))
    }));
    
    res.json({
      success: true,
      data: formatted,
      count: formatted.length
    });
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve conversations',
      message: error.message
    });
  }
});

/**
 * GET /admin/api/conversations/:userId
 * Get full conversation for a specific user
 */
router.get('/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const conversation = await Context.findOne({ userId });
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }
    
    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Error getting conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve conversation',
      message: error.message
    });
  }
});

// ============================================
// BOT CONTROL ENDPOINTS
// ============================================

/**
 * GET /admin/api/bot/status
 * Get current bot status
 */
router.get('/bot/status', (req, res) => {
  try {
    const enabled = botState.isBotEnabled();
    
    res.json({
      success: true,
      data: {
        enabled,
        status: enabled ? 'online' : 'offline'
      }
    });
  } catch (error) {
    console.error('Error getting bot status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get bot status',
      message: error.message
    });
  }
});

/**
 * POST /admin/api/bot/enable
 * Enable bot (turn on)
 */
router.post('/bot/enable', (req, res) => {
  try {
    botState.enableBot();
    
    res.json({
      success: true,
      message: 'Bot enabled',
      data: { enabled: true }
    });
  } catch (error) {
    console.error('Error enabling bot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to enable bot',
      message: error.message
    });
  }
});

/**
 * POST /admin/api/bot/disable
 * Disable bot (turn off)
 */
router.post('/bot/disable', (req, res) => {
  try {
    botState.disableBot();
    
    res.json({
      success: true,
      message: 'Bot disabled',
      data: { enabled: false }
    });
  } catch (error) {
    console.error('Error disabling bot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disable bot',
      message: error.message
    });
  }
});

// ============================================
// STATISTICS ENDPOINTS
// ============================================

/**
 * GET /admin/api/stats
 * Get dashboard statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const contextStats = await contextService.getContextStats();
    const ignoreStats = await ignoreListService.getIgnoreStats();
    const usersInHandoff = await contextService.getUsersInHandoff();
    
    // Get staff count
    const staffManagement = require('../../services/staff-management');
    const allStaff = await staffManagement.getAllStaff();
    const activeStaff = allStaff.filter(s => s.isActive);
    
    res.json({
      success: true,
      data: {
        bot: {
          enabled: botState.isBotEnabled(),
          status: botState.isBotEnabled() ? 'online' : 'offline'
        },
        conversations: {
          total: contextStats.totalContexts || 0,
          recent: contextStats.recentConversations || 0,
          activeHandoffs: contextStats.activeHandoffs || 0
        },
        ignored: {
          total: ignoreStats.total || 0,
          byReason: ignoreStats.byReason || {},
          recentlyActive: ignoreStats.recentlyActive || 0
        },
        handoffs: {
          active: usersInHandoff.length,
          users: usersInHandoff
        },
        staff: {
          total: activeStaff.length,
          owners: activeStaff.filter(s => s.role === 'owner').length,
          trainers: activeStaff.filter(s => s.role === 'trainer').length,
          staff: activeStaff.filter(s => s.role === 'staff').length
        }
      }
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve statistics',
      message: error.message
    });
  }
});

module.exports = router;
