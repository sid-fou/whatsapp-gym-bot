const staffManagement = require('../staff-management');
const contextService = require('../context');

/**
 * Send staff notification via WhatsApp
 * 
 * IMPORTANT: WhatsApp has a 24-hour conversation window.
 * - If staff has messaged the business number in the last 24 hours, free-form messages work
 * - If not, only template messages will be delivered
 * 
 * To ensure notifications work:
 * 1. Have staff send any message to the business WhatsApp number to open the window
 * 2. OR create a custom notification template in Meta Business Suite
 */
async function notifyStaffViaWhatsApp(userId, userMessage, reason, specificStaffNumber = null, customerName = null) {
  console.log(`\n📣 Starting WhatsApp staff notification...`);
  console.log(`   Customer: ${userId}`);
  console.log(`   Reason: ${reason}`);
  console.log(`   Specific staff: ${specificStaffNumber || 'All staff'}`);
  
  // If specific staff requested, notify only them
  let staffNumbers = [];
  if (specificStaffNumber) {
    staffNumbers = [specificStaffNumber];
  } else {
    // Get all staff who should receive notifications from database
    const staff = await staffManagement.getNotificationRecipients();
    staffNumbers = staff.map(s => s.phoneNumber);
    console.log(`   Staff from DB: ${staffNumbers.length} recipients`);
    
    // Fallback to env if database is empty
    if (staffNumbers.length === 0) {
      staffNumbers = process.env.STAFF_WHATSAPP_NUMBERS?.split(',') || [];
      console.log(`   Fallback to env: ${staffNumbers.join(', ')}`);
    }
  }
  
  if (staffNumbers.length === 0) {
    console.warn('⚠️  No staff WhatsApp numbers configured - NO NOTIFICATIONS SENT');
    return false;
  }
  
  console.log(`   Will notify: ${staffNumbers.join(', ')}`);

  const url = `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`;

  // Get conversation context to help staff understand what customer needs
  const conversationSummary = await contextService.getConversationSummary(userId, 6);
  
  // Build notification message WITH context
  const notificationMessage = `🚨 *CUSTOMER NEEDS ASSISTANCE*

📱 Customer: ${userId}${customerName ? ` (${customerName})` : ''}
🔍 Reason: ${reason}
⏰ Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

📝 *Recent Conversation:*
${conversationSummary}

${specificStaffNumber ? '👤 You were specifically requested!' : 'Click "Assign to Me" to take this handoff.'}`;

  try {
    // Send notification to each staff member (EXCEPT the customer who triggered it)
    for (const staffNumber of staffNumbers) {
      const cleanStaffNumber = staffNumber.trim();
      
      // CRITICAL: Don't send staff notification to the customer themselves
      if (userId.includes(cleanStaffNumber) || cleanStaffNumber.includes(userId)) {
        console.log(`⏭️  Skipping notification to ${cleanStaffNumber} (is the customer)`);
        continue;
      }
      
      // Try interactive message with button
      const interactiveData = {
        messaging_product: 'whatsapp',
        to: cleanStaffNumber,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {
            text: notificationMessage
          },
          action: {
            buttons: [
              {
                type: 'reply',
                reply: {
                  id: `assign_${userId}`,
                  title: '✅ Assign to Me'
                }
              }
            ]
          }
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(interactiveData)
      });

      const result = await response.json();

      if (response.ok) {
        console.log(`📲 WhatsApp notification sent to ${cleanStaffNumber}`);
        console.log(`   Message ID: ${result.messages?.[0]?.id || 'unknown'}`);
        console.log(`   ℹ️  Note: Message will only be delivered if staff has messaged the business in last 24 hours`);
      } else {
        console.error(`❌ Failed to notify ${cleanStaffNumber}:`, JSON.stringify(result, null, 2));
        
        // Log specific error codes for debugging
        if (result.error) {
          console.error(`   Error code: ${result.error.code}`);
          console.error(`   Error message: ${result.error.message}`);
          
          if (result.error.code === 131047) {
            console.error(`   💡 24-hour window expired! Staff needs to message the business number first.`);
            
            // Fallback: Try template message
            console.log(`   🔄 Trying template message as fallback...`);
            const templateResponse = await sendTemplateNotification(url, cleanStaffNumber);
            if (templateResponse) {
              console.log(`   ✅ Template notification sent successfully`);
            }
          }
          if (result.error.code === 131030) {
            console.error(`   💡 This phone number may not be in your WhatsApp test recipients list`);
          }
          if (result.error.code === 190) {
            console.error(`   💡 Token may be expired - regenerate in Meta Business Suite`);
          }
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ WhatsApp staff notification failed:', error.message);
    console.error('   Stack:', error.stack);
    return false;
  }
}

/**
 * Send template notification as fallback when 24-hour window is closed
 */
async function sendTemplateNotification(url, staffNumber) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: staffNumber,
        type: 'template',
        template: {
          name: 'hello_world',
          language: { code: 'en_US' }
        }
      })
    });
    
    return response.ok;
  } catch (error) {
    console.error('   Template fallback failed:', error.message);
    return false;
  }
}

module.exports = {
  notifyStaffViaWhatsApp
};
