// Send WhatsApp message to staff when handoff occurs
const staffManagement = require('../staff-management');

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

  // Use the EXACT format that was working on 3/1/2026
  const notificationMessage = `🚨 *CUSTOMER NEEDS ASSISTANCE*

📱 Customer: ${userId}${customerName ? ` (${customerName})` : ''}
🔍 Reason: ${reason}
💬 Message: "${userMessage}"
⏰ Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

${specificStaffNumber ? '👤 You were specifically requested!' : 'Click "Assign to Me" to take this handoff, or reply with "ok" to acknowledge.'}`;

  const url = `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`;

  try {
    // Send notification to each staff member (EXCEPT the customer who triggered it)
    for (const staffNumber of staffNumbers) {
      const cleanStaffNumber = staffNumber.trim();
      
      // CRITICAL: Don't send staff notification to the customer themselves
      if (userId.includes(cleanStaffNumber) || cleanStaffNumber.includes(userId)) {
        console.log(`⏭️  Skipping notification to ${cleanStaffNumber} (is the customer)`);
        continue;
      }
      
      // Use EXACT format that worked on 3/1/2026
      const data = {
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
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`📲 WhatsApp notification sent to ${cleanStaffNumber}`);
        console.log(`   Message ID: ${result.messages?.[0]?.id || 'unknown'}`);
      } else {
        const errorData = await response.json();
        console.error(`❌ Failed to notify ${cleanStaffNumber}:`, JSON.stringify(errorData, null, 2));
        
        // Log specific error codes for debugging
        if (errorData.error) {
          console.error(`   Error code: ${errorData.error.code}`);
          console.error(`   Error message: ${errorData.error.message}`);
          if (errorData.error.code === 131030) {
            console.error(`   💡 This phone number may not be in your WhatsApp test recipients list`);
          }
          if (errorData.error.code === 190) {
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

module.exports = {
  notifyStaffViaWhatsApp
};
