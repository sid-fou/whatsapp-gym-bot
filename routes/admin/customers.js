const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../../middleware/auth');
const Context = require('../../database/models/Context');

// All routes require admin authentication
router.use(requireAdmin);

/**
 * GET /admin/api/customers
 * Get all unique customers who have contacted the bot
 */
router.get('/', async (req, res) => {
  try {
    // Get all contexts and process
    const contexts = await Context.find({}).sort({ 'metadata.lastActivity': -1 });
    
    // Group by userId and calculate stats
    const customerMap = {};
    
    for (const context of contexts) {
      if (!customerMap[context.userId]) {
        const messages = context.messages || [];
        const lastUserMessage = messages.filter(m => m.role === 'user').pop();
        
        customerMap[context.userId] = {
          userId: context.userId,
          firstContact: context.createdAt,
          lastContact: new Date(context.metadata.lastActivity),
          totalMessages: messages.length,
          lastMessageText: lastUserMessage ? lastUserMessage.content : 'No messages'
        };
      }
    }
    
    // Convert to array and sort by last contact
    const customers = Object.values(customerMap).sort((a, b) => 
      new Date(b.lastContact).getTime() - new Date(a.lastContact).getTime()
    );

    res.json({
      success: true,
      data: customers,
      count: customers.length
    });
  } catch (error) {
    console.error('Error getting customers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve customers'
    });
  }
});

/**
 * GET /admin/api/customers/:userId
 * Get full conversation history for a specific customer
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const context = await Context.findOne({ userId });
    
    if (!context) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: {
        userId: context.userId,
        conversationHistory: context.messages || [], // Use 'messages' field
        lastActivity: new Date(context.metadata.lastActivity),
        inHandoff: context.metadata.inHandoff,
        createdAt: context.createdAt,
        updatedAt: context.updatedAt
      }
    });
  } catch (error) {
    console.error('Error getting customer details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve customer details'
    });
  }
});

module.exports = router;
