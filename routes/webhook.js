const express = require('express');
const router = express.Router();
const intentService = require('../services/intent');
const aiService = require('../services/ai');
const handoffService = require('../services/handoff');
const contextService = require('../services/context');
const buttonService = require('../services/buttons');
const welcomeMenu = require('../services/welcome-menu');
const staffHelper = require('../services/staff-helper');
const botState = require('../services/bot-state');
const ignoreListService = require('../services/ignore-list');
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

    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry[0];
      const changes = entry.changes[0];
      const value = changes.value;

      // Handle incoming messages
      if (value.messages && value.messages.length > 0) {
        const message = value.messages[0];
        const from = message.from;
        const text = message.text?.body;
        const interactive = message.interactive;
        
        // Extract contact name from WhatsApp profile (push name)
        const contactName = value.contacts?.[0]?.profile?.name || null;

        // Handle button clicks
        if (interactive) {
          await handleButtonClick(from, interactive, contactName);
          return;
        }

        // Handle text messages
        if (text) {
          console.log(`\n📱 Message from ${from}: "${text}"`);
          if (contactName) {
            console.log(`👤 Contact name: ${contactName}`);
          }
          await handleTextMessage(from, text, contactName);
        }
      }

      // Handle status updates (message delivered, read, etc.)
      if (value.statuses) {
        // Optionally log status updates
        // console.log('Status update received');
      }
    }
  } catch (error) {
    console.error('❌ Webhook error:', error.message);
    console.error('Stack:', error.stack);
  }
});

// Handle button/list clicks
async function handleButtonClick(customerId, interactive, contactName = null) {
  // Check if it's a menu selection
  const menuSelection = welcomeMenu.parseMenuSelection(interactive);
  if (menuSelection) {
    console.log(`📋 Menu selected: ${menuSelection.id} - ${menuSelection.title}`);
    await handleMenuSelection(customerId, menuSelection, contactName);
    return;
  }

  // Otherwise handle as regular button click
  const buttonData = buttonService.parseButtonClick(interactive);
  
  if (!buttonData) {
    console.log('⚠️  Unknown button click');
    return;
  }

  console.log(`🔘 Button clicked: ${buttonData.type}`);

  if (buttonData.type === 'end_handoff') {
    // End handoff for customer
    const targetCustomerId = buttonData.customerId;
    const staffId = customerId; // The person clicking the button is staff
    
    // CRITICAL: Check if handoff still exists and is active
    const handoffDetails = await handoffService.getHandoffDetails(targetCustomerId);
    
    if (!handoffDetails) {
      await sendWhatsAppMessage(staffId, {
        text: { body: `❌ This handoff no longer exists. It may have been closed already.` }
      });
      console.log(`⚠️  Staff tried to end non-existent handoff for ${targetCustomerId}`);
      return;
    }
    
    if (handoffDetails.status === 'resolved') {
      await sendWhatsAppMessage(staffId, {
        text: { body: `❌ This handoff was already closed. Customer is now being handled by the bot.` }
      });
      console.log(`⚠️  Staff tried to end already resolved handoff for ${targetCustomerId}`);
      return;
    }
    
    // Check if this staff member is the one assigned (if handoff is assigned)
    if (handoffDetails.staffMember && handoffDetails.staffMember !== staffId) {
      await sendWhatsAppMessage(staffId, {
        text: { body: `⚠️ This handoff is assigned to ${handoffDetails.staffMember}. Only they can end it.\n\nIf needed, you can end it from the dashboard.` }
      });
      console.log(`⚠️  Staff ${staffId} tried to end handoff assigned to ${handoffDetails.staffMember}`);
      return;
    }
    
    // All checks passed - end the handoff
    await handoffService.endHandoff(targetCustomerId);
    await contextService.setHandoffStatus(targetCustomerId, false);
    
    // Send goodbye message to customer
    const goodbyeMessage = `Thank you for contacting IronCore Fitness! 💪

Our automated assistant is now back online to help you. Feel free to reach out anytime!

Stay strong! 🏋️‍♂️`;
    
    await sendWhatsAppMessage(targetCustomerId, {
      text: { body: goodbyeMessage }
    });
    
    // Save goodbye message to context
    await contextService.addMessage(targetCustomerId, 'assistant', goodbyeMessage);
    
    await sendWhatsAppMessage(staffId, {
      text: { body: `✅ Handoff ended for ${targetCustomerId}\nBot is now active for this customer.` }
    });
    
  } else if (buttonData.type === 'assign') {
    // Assign handoff to this staff member
    const targetCustomerId = buttonData.customerId;
    const staffId = customerId; // The person clicking the button is staff
    
    // CRITICAL: Check if handoff still exists and is not resolved
    const handoffDetails = await handoffService.getHandoffDetails(targetCustomerId);
    
    if (!handoffDetails) {
      await sendWhatsAppMessage(staffId, {
        text: { body: `❌ This handoff no longer exists. It may have been closed already.` }
      });
      console.log(`⚠️  Staff tried to assign closed handoff for ${targetCustomerId}`);
      return;
    }
    
    if (handoffDetails.status === 'resolved') {
      await sendWhatsAppMessage(staffId, {
        text: { body: `❌ This handoff was already closed. Customer is now being handled by the bot.` }
      });
      console.log(`⚠️  Staff tried to assign resolved handoff for ${targetCustomerId}`);
      return;
    }
    
    if (handoffDetails.staffMember && handoffDetails.staffMember !== staffId) {
      await sendWhatsAppMessage(staffId, {
        text: { body: `❌ This handoff is already assigned to ${handoffDetails.staffMember}.` }
      });
      console.log(`⚠️  Staff ${staffId} tried to assign handoff already assigned to ${handoffDetails.staffMember}`);
      return;
    }
    
    // All checks passed - assign the handoff
    await handoffService.assignToStaff(targetCustomerId, staffId);
    
    // Send confirmation with end handoff button
    const endButton = buttonService.createEndHandoffButton(targetCustomerId);
    await sendWhatsAppMessage(staffId, endButton);
    
    console.log(`👤 Handoff for ${targetCustomerId} assigned to staff ${staffId} via button`);
    
  } else if (buttonData.type === 'bot_on') {
    const staffId = customerId; // The person clicking the button is staff
    botState.enableBot();
    const response = buttonService.createBotOffButton();
    await sendWhatsAppMessage(staffId, response);
    
  } else if (buttonData.type === 'bot_off') {
    const staffId = customerId; // The person clicking the button is staff
    botState.disableBot();
    const response = buttonService.createBotOnButton();
    await sendWhatsAppMessage(staffId, response);
  }
}

// Handle menu selection (uses AI for natural responses)
async function handleMenuSelection(userId, menuSelection, contactName = null) {
  try {
    // Convert menu selection to natural language query
    const query = welcomeMenu.getQueryForMenuSelection(menuSelection.id);
    
    if (!query) {
      console.log(`⚠️  Unknown menu selection: ${menuSelection.id}`);
      return;
    }

    console.log(`🤖 Processing menu selection as AI query: "${query}"`);
    
    // CRITICAL: Check if this menu item triggers handoff FIRST
    // If it does, skip AI response entirely and go directly to handoff
    if (welcomeMenu.shouldTriggerHandoffForMenu(menuSelection.id)) {
      console.log(`🚨 Menu selection triggers handoff: ${menuSelection.id} - Skipping AI response`);
      
      // Save to context
      await contextService.addMessage(userId, 'user', query);
      
      // Trigger handoff directly
      const reason = menuSelection.id === 'menu_trial' ? 'booking' : 'user_requested';
      
      // CRITICAL: Set handoff status FIRST (before notifications which can timeout)
      await contextService.setHandoffStatus(userId, true, reason);
      
      // Send handoff message to customer IMMEDIATELY
      const handoffMessage = handoffService.getHandoffMessage(reason);
      await sendWhatsAppMessage(userId, { text: { body: handoffMessage } });
      await contextService.addMessage(userId, 'assistant', handoffMessage);
      
      console.log(`✅ Handoff triggered for menu selection: ${menuSelection.title}`);
      
      // NOW add to queue and send notifications (can be slow due to email timeouts)
      handoffService.addToHandoffQueue(userId, query, reason, contactName)
        .catch(err => console.error('❌ Background handoff queue error:', err.message));
      
      return; // Exit here - don't continue to AI response
    }
    
    // Detect intent for the query (using AI)
    const intent = await intentService.detectIntent(query);
    
    // Get AI response based on gym_knowledge.txt
    const response = await aiService.generateResponse(query, intent, userId);
    
    // Handle case where AI returns null (handoff needed)
    if (response === null) {
      console.log(`🚨 AI detected handoff need for menu query`);
      
      await contextService.addMessage(userId, 'user', query);
      
      const reason = 'ai_detected';
      
      // CRITICAL: Set handoff status FIRST
      await contextService.setHandoffStatus(userId, true, reason);
      
      const handoffMessage = handoffService.getHandoffMessage(reason);
      await sendWhatsAppMessage(userId, { text: { body: handoffMessage } });
      await contextService.addMessage(userId, 'assistant', handoffMessage);
      
      // Background notification (can be slow)
      handoffService.addToHandoffQueue(userId, query, reason, contactName)
        .catch(err => console.error('❌ Background handoff queue error:', err.message));
      
      return;
    }
    
    // Save to context (menu selection as user message)
    await contextService.addMessage(userId, 'user', query);
    await contextService.addMessage(userId, 'assistant', response);
    
    // Send AI-generated response
    await sendWhatsAppMessage(userId, { text: { body: response } });
    console.log(`✅ AI response sent for menu selection: ${menuSelection.title}`);
    
  } catch (error) {
    console.error('❌ Error handling menu selection:', error.message);
    // Fallback response
    await sendWhatsAppMessage(userId, { 
      text: { body: "I'm having trouble processing that right now. Please try asking your question directly, or type 'staff' to speak with our team." }
    });
  }
}

// Handle text messages
async function handleTextMessage(from, text, contactName = null) {
  // Check if message is from staff
  const isStaff = await staffHelper.isStaffMessage(from);

  if (isStaff) {
    await handleStaffMessage(from, text);
    return;
  }

  // CRITICAL: Check if number is in ignore list
  const isIgnored = await ignoreListService.isIgnored(from);
  if (isIgnored) {
    console.log(`🚫 Number ${from} is in ignore list - No response`);
    return; // Stay silent for ignored numbers
  }

  // Customer message - process normally
  await handleCustomerMessage(from, text, contactName);
}

// Handle staff messages
async function handleStaffMessage(staffId, text) {
  console.log('👤 Message from staff');

  // Check for bot control commands
  const botCommand = staffHelper.detectBotCommand(text);
  if (botCommand) {
    const response = staffHelper.handleBotControl(botCommand);
    if (response) {
      await sendWhatsAppMessage(staffId, response);
    }
    return;
  }

  // Check for staff commands (end handoff, reply to customer)
  const staffCommand = staffHelper.parseStaffCommand(text);
  if (staffCommand) {
    if (staffCommand.type === 'end_handoff') {
      const customerId = staffCommand.customerId;
      await handoffService.endHandoff(customerId);
      await contextService.setHandoffStatus(customerId, false);
      
      await sendWhatsAppMessage(staffId, {
        text: { body: `✅ Handoff ended for ${customerId}\nBot is now active for this customer.` }
      });
      return;
    }
    
    if (staffCommand.type === 'reply_to_customer') {
      const customerId = staffCommand.customerId;
      const message = staffCommand.message;
      
      // Assign handoff to this staff member
      await handoffService.assignToStaff(customerId, staffId);
      
      // Send message to customer
      await sendWhatsAppMessage(customerId, {
        text: { body: `${message}\n\n_Message from staff_` }
      });
      
      // Confirm to staff
      await sendWhatsAppMessage(staffId, {
        text: { body: `✅ Message sent to ${customerId}` }
      });
      return;
    }
  }

  // Get users in handoff for acknowledgment and auto-forward checks
  const usersInHandoff = await contextService.getUsersInHandoff();

  // Check if it's an acknowledgment after notification (MUST CHECK BEFORE AUTO-FORWARD)
  // BUT ONLY if staff is NOT already assigned to a customer
  let assignedCustomer = null;
  for (const user of usersInHandoff) {
    const isAssigned = await handoffService.isAssignedToStaff(user.userId, staffId);
    if (isAssigned) {
      assignedCustomer = user.userId;
      break;
    }
  }
  
  // Only treat as acknowledgment if staff is NOT already assigned
  if (staffHelper.isAcknowledgment(text) && !assignedCustomer) {
    if (usersInHandoff.length > 0) {
      // Assume acknowledging the most recent handoff
      const customerId = usersInHandoff[0].userId;
      
      // Assign this handoff to the staff member
      await handoffService.assignToStaff(customerId, staffId);
      
      // Send acknowledgment button ONCE
      const buttonPayload = buttonService.createEndHandoffButton(customerId);
      
      if (buttonPayload) {
        await sendWhatsAppMessage(staffId, buttonPayload);
      }
    }
    return;
  }

  // Check if staff is replying without using command format
  // This allows staff to just reply normally and bot will forward to last customer they interacted with
  
  // If staff has an assigned customer, forward the message
  if (assignedCustomer) {
    await sendWhatsAppMessage(assignedCustomer, {
      text: { body: text }
    });
    
    // IMPORTANT: Save staff message to customer's context
    await contextService.addMessage(assignedCustomer, 'assistant', text);
    
    // Don't send button after staff messages - only customer messages will have buttons
    console.log(`📨 Forwarded message from staff ${staffId} to customer ${assignedCustomer}`);
    return;
  }

  // Other staff messages - don't respond (they're handling customers manually)
  console.log('⏭️  Staff message - no bot response');
}

// Handle customer messages
async function handleCustomerMessage(userId, text, contactName = null) {
  try {
    // Check if bot is globally disabled
    if (!botState.isBotEnabled()) {
      console.log('🤖 Bot is OFF - No response');
      return;
    }

    // CRITICAL: Check handoff status FIRST, before anything else
    // This prevents bot from responding during active handoffs
    const inHandoff = await contextService.isInHandoff(userId);
    if (inHandoff) {
      console.log(`⏸️  User ${userId} in handoff - Bot paused`);
      
      // IMPORTANT: Save customer message to context even during handoff
      await contextService.addMessage(userId, 'user', text);
      
      // Forward customer message to assigned staff member
      const handoffDetails = await handoffService.getHandoffDetails(userId);
      if (handoffDetails && handoffDetails.staffMember) {
        // Use stored customer name or WhatsApp profile name
        const displayName = handoffDetails.customerName || contactName || userId;
        
        // Send customer message with End Handoff button
        await sendWhatsAppMessage(handoffDetails.staffMember, {
          type: 'interactive',
          interactive: {
            type: 'button',
            body: {
              text: `📱 Message from ${displayName}:\n\n"${text}"`
            },
            action: {
              buttons: [
                {
                  type: 'reply',
                  reply: {
                    id: `end_handoff_${userId}`,
                    title: '✅ End Handoff'
                  }
                }
              ]
            }
          }
        });
        console.log(`📨 Forwarded customer message to staff ${handoffDetails.staffMember}`);
      } else {
        // No staff assigned yet, send to all staff as notification
        const staffNumbers = process.env.STAFF_WHATSAPP_NUMBERS?.split(',') || [];
        for (const staffNum of staffNumbers) {
          await sendWhatsAppMessage(staffNum.trim(), {
            text: { 
              body: `📱 Message from customer ${userId} (in handoff):\n\n"${text}"\n\n_Type "ok" to take this handoff_` 
            }
          });
        }
        console.log(`📨 Broadcasted customer message to all staff (no assignment yet)`);
      }
      
      return; // Exit - don't process further during handoff
    }

    // Detect intent (only after confirming not in handoff)
    const intent = await intentService.detectIntent(text);
    console.log(`🎯 Intent: ${intent.type} → ${intent.category || 'general'}`);

    // Check if this is a greeting - send welcome menu
    if (intent.type === 'greeting') {
      console.log(`👋 Greeting detected from ${userId} - Sending welcome menu`);
      const welcomeMenuPayload = welcomeMenu.createWelcomeMenu();
      await sendWhatsAppMessage(userId, welcomeMenuPayload);
      
      // Save to context
      await contextService.addMessage(userId, 'user', text);
      await contextService.addMessage(userId, 'assistant', '[Welcome Menu Sent]');
      return;
    }

    // Check if user is requesting a specific staff member FIRST
    const requestedStaff = await handoffService.detectRequestedStaffFromMessage(text);
    const isSpecificStaffRequest = !!requestedStaff;
    
    if (isSpecificStaffRequest) {
      console.log(`🎯 Specific staff requested: ${requestedStaff.name}`);
    }
    
    // Check if handoff should be triggered (with AI detection)
    const handoffCheck = await handoffService.shouldTriggerHandoffWithAI(text);
    console.log(`🔍 Handoff check: shouldHandoff=${handoffCheck.shouldHandoff}, reason=${handoffCheck.reason}`);
    
    // If specific staff requested, force handoff trigger
    if (isSpecificStaffRequest && !handoffCheck.shouldHandoff) {
      console.log(`✅ Forcing handoff - Specific staff detected`);
      handoffCheck.shouldHandoff = true;
      handoffCheck.reason = 'user_requested';
    }
    
    // Check if it's a booking request - provide info FIRST
    const isBookingRequest = text.toLowerCase().match(/book|timing|schedule|reserve|appointment/i);
    if (handoffCheck.shouldHandoff && isBookingRequest) {
      // Provide timing info THEN trigger handoff
      const timingInfo = `📅 Our gym is open:
Monday-Saturday: 6:00 AM - 10:00 PM
Sunday: 8:00 AM - 2:00 PM

For trial bookings and membership details, our team will assist you personally. Connecting you with staff now...`;
      
      await sendWhatsAppMessage(userId, { text: { body: timingInfo } });
      await contextService.addMessage(userId, 'user', text);
      await contextService.addMessage(userId, 'assistant', timingInfo);
      
      // Small delay so messages don't arrive simultaneously
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Check if user is in cooldown period (prevents re-triggering right after handoff ends)
    const inCooldown = await contextService.isInHandoffCooldown(userId, 5); // 5 minute cooldown (reduced from 10)
    if (inCooldown) {
      console.log(`⏰ User in handoff cooldown period`);
    }
    
    // Determine if this should bypass cooldown
    // - Explicit staff requests always bypass
    // - Booking intents bypass (user wants to take action)
    // - Specific staff requests bypass
    const isBookingIntent = intent.type === 'booking' || intent.category === 'booking';
    const bypassCooldown = handoffCheck.reason === 'user_requested' || isSpecificStaffRequest || isBookingIntent;
    
    // ALWAYS allow explicit staff requests, booking intents, and specific staff requests, even during cooldown
    if (handoffCheck.shouldHandoff) {
      if (inCooldown && !bypassCooldown) {
        console.log(`⏸️  Handoff trigger blocked - User in cooldown (reason: ${handoffCheck.reason})`);
        // Continue with normal bot response instead
      } else {
        if (inCooldown && bypassCooldown) {
          console.log(`✅ Bypassing cooldown - ${isBookingIntent ? 'Booking intent' : isSpecificStaffRequest ? 'Specific staff request' : 'Explicit request'}`);
        }
        console.log(`🚨 Handoff triggered - Reason: ${handoffCheck.reason}`);
        
        // IMPORTANT: Save the handoff trigger message to context
        await contextService.addMessage(userId, 'user', text);
        
        // CRITICAL: Set handoff status FIRST (before notifications which can timeout)
        // This ensures bot pauses immediately for subsequent messages
        await contextService.setHandoffStatus(userId, true, handoffCheck.reason);
        
        // Send handoff message to customer IMMEDIATELY
        const handoffMessage = handoffService.getHandoffMessage(handoffCheck.reason);
        await sendWhatsAppMessage(userId, { text: { body: handoffMessage } });
        
        // Save handoff response message to context
        await contextService.addMessage(userId, 'assistant', handoffMessage);
        
        logConversation(userId, text, handoffMessage);
        
        // NOW add to queue and send notifications (can be slow due to email timeouts)
        // This runs after customer already sees handoff message and bot is paused
        handoffService.addToHandoffQueue(userId, text, handoffCheck.reason, contactName)
          .catch(err => console.error('❌ Background handoff queue error:', err.message));
        
        return; // Exit here - don't continue to AI response
      }
    }

    // Get AI response with context
    const response = await aiService.generateResponse(text, intent, userId);

    // Check if AI detected handoff need
    if (response === null) {
      // Don't trigger handoff for simple acknowledgments or if in cooldown
      const simpleMessages = ['ok', 'okay', 'k', 'yes', 'no', 'thanks', 'thank you', 'bye'];
      const isSimpleMessage = simpleMessages.includes(text.toLowerCase().trim());
      
      // IMPORTANT: Check if we already processed this as a specific staff request above
      if (isSpecificStaffRequest) {
        console.log(`⏭️  Skipping AI handoff - already handled as specific staff request`);
        return;
      }
      
      if (isSimpleMessage) {
        console.log(`⏸️  AI handoff blocked - Simple message`);
        // Send a contextual acknowledgment instead
        const simpleResponse = "Got it! If you need anything else, just let me know. You can also type 'staff' to speak with our team directly.";
        await sendWhatsAppMessage(userId, { text: { body: simpleResponse } });
        await contextService.addMessage(userId, 'user', text);
        await contextService.addMessage(userId, 'assistant', simpleResponse);
        logConversation(userId, text, simpleResponse);
        return;
      }
      
      // If in cooldown but AI wants handoff, let user know they can request staff
      if (inCooldown) {
        console.log(`⏸️  AI handoff blocked - Cooldown period (but informing user)`);
        const cooldownResponse = "I'd be happy to connect you with our team for this! Just type 'staff' or 'talk to staff' and I'll get someone to help you right away. 💪";
        await sendWhatsAppMessage(userId, { text: { body: cooldownResponse } });
        await contextService.addMessage(userId, 'user', text);
        await contextService.addMessage(userId, 'assistant', cooldownResponse);
        logConversation(userId, text, cooldownResponse);
        return;
      }
      
      console.log(`🚨 Handoff triggered by AI`);
      
      // CRITICAL: Set handoff status FIRST
      await contextService.setHandoffStatus(userId, true, 'ai_detected');
      
      const handoffMessage = handoffService.getHandoffMessage('ai_detected');
      await sendWhatsAppMessage(userId, { text: { body: handoffMessage } });
      logConversation(userId, text, handoffMessage);
      
      // Background notification (can be slow)
      handoffService.addToHandoffQueue(userId, text, 'ai_detected', contactName)
        .catch(err => console.error('❌ Background handoff queue error:', err.message));
      
      return;
    }

    // Send response
    await sendWhatsAppMessage(userId, { text: { body: response } });
    logConversation(userId, text, response);
    console.log(`✅ Reply sent`);

  } catch (error) {
    console.error('❌ Error processing customer message:', error.message);
    const fallbackMessage = "Sorry, I'm having trouble right now. Please call us at +91 8755052568.";
    await sendWhatsAppMessage(userId, { text: { body: fallbackMessage } });
  }
}

// Send WhatsApp message (supports text and interactive)
async function sendWhatsAppMessage(to, payload) {
  const url = `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`;

  // Build complete payload
  const data = {
    messaging_product: 'whatsapp',
    to: to,
    ...payload
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
