// Send WhatsApp message to staff when handoff occurs
const staffManagement = require('../staff-management');

async function notifyStaffViaWhatsApp(userId, userMessage, reason, specificStaffNumber = null, customerName = null) {
  // If specific staff requested, notify only them
  let staffNumbers = [];
  if (specificStaffNumber) {
    staffNumbers = [specificStaffNumber];
  } else {
    // Get all staff who should receive notifications from database
    const staff = await staffManagement.getNotificationRecipients();
    staffNumbers = staff.map(s => s.phoneNumber);
    
    // Fallback to env if database is empty
    if (staffNumbers.length === 0) {
      staffNumbers = process.env.STAFF_WHATSAPP_NUMBERS?.split(',') || [];
    }
  }
  
  if (staffNumbers.length === 0) {
    console.warn('⚠️  No staff WhatsApp numbers configured');
    return false;
  }

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
        console.log(`📲 WhatsApp notification sent to ${cleanStaffNumber}`);
      } else {
        const errorData = await response.json();
        console.error(`❌ Failed to notify ${cleanStaffNumber}:`, errorData);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ WhatsApp staff notification failed:', error.message);
    return false;
  }
}

module.exports = {
  notifyStaffViaWhatsApp
};
