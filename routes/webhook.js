const express = require('express');
const router = express.Router();
const intentService = require('../services/intent');
const aiService = require('../services/ai');
const { logConversation } = require('../logs/conversations');

// WhatsApp webhook verification
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    console.log('✅ Webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    console.error('❌ Webhook verification failed');
    res.sendStatus(403);
  }
});

// Receive WhatsApp messages
router.post('/', async (req, res) => {
  // Always respond immediately to WhatsApp
  res.sendStatus(200);
  
  try {
    const body = req.body;

    // Log incoming webhook (for debugging)
    if (process.env.NODE_ENV === 'development') {
      console.log('📥 Webhook received:', JSON.stringify(body, null, 2));
    }

    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry[0];
      const changes = entry.changes[0];
      const value = changes.value;

      // Handle incoming messages
      if (value.messages && value.messages.length > 0) {
        const message = value.messages[0];
        const from = message.from;
        const messageId = message.id;
        const text = message.text?.body;

        if (text) {
          console.log(`\n📱 Message from ${from}: "${text}"`);
          
          // Process the message
          const response = await processMessage(text, from);
          
          // Send reply via WhatsApp API
          await sendWhatsAppMessage(from, response);
          
          console.log(`✅ Reply sent: "${response.substring(0, 50)}..."`);
        }
      }
      
      // Handle message status updates (optional)
      if (value.statuses) {
        console.log('📊 Status update received');
      }
    }
  } catch (error) {
    console.error('❌ Webhook error:', error.message);
    // Don't throw - we already sent 200 to WhatsApp
  }
});

async function processMessage(text, userId) {
  try {
    // Detect intent
    const intent = intentService.detectIntent(text);
    console.log(`🎯 Intent: ${intent.type} → ${intent.category || 'general'}`);
    
    // Get AI response based on intent
    const response = await aiService.generateResponse(text, intent);
    
    // Log conversation
    logConversation(userId, text, response);
    
    return response;
  } catch (error) {
    console.error('❌ Error processing message:', error.message);
    return "Sorry, I'm having trouble right now. A staff member will get back to you soon.";
  }
}

async function sendWhatsAppMessage(to, message) {
  const url = `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`;
  
  const data = {
    messaging_product: 'whatsapp',
    to: to,
    text: { body: message }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`WhatsApp API error: ${JSON.stringify(errorData)}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('❌ Error sending WhatsApp message:', error.message);
    throw error;
  }
}

module.exports = router;
