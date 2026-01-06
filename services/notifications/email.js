const nodemailer = require('nodemailer');
const staffManagement = require('../staff-management');

// Create email transporter
// Using Gmail as example - you can use any SMTP service
let transporter = null;

function initializeTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️  Email credentials not configured - notifications disabled');
    return null;
  }

  transporter = nodemailer.createTransport({
    service: 'gmail', // or 'outlook', 'yahoo', etc.
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS // Use App Password for Gmail
    }
  });

  console.log('✅ Email notifications enabled');
  return transporter;
}

/**
 * Notify staff via email (smart routing to specific staff or all)
 * @param {string} userId - Customer's WhatsApp number
 * @param {string} userMessage - Customer's message
 * @param {string} reason - Handoff reason
 * @param {string} specificStaffPhone - Optional: Only notify this staff member
 * @param {string} customerName - Optional: Customer's name from WhatsApp profile
 */
async function notifyStaff(userId, userMessage, reason, specificStaffPhone = null, customerName = null) {
  if (!transporter) {
    transporter = initializeTransporter();
  }

  if (!transporter) {
    console.log('📧 Email notification skipped - not configured');
    return false;
  }

  let staffEmails = [];
  
  if (specificStaffPhone) {
    // Notify only the requested staff member
    const staff = await staffManagement.getStaffByPhone(specificStaffPhone);
    if (staff && staff.email && staff.receiveNotifications) {
      staffEmails = [staff.email];
      console.log(`📧 Sending email to specific staff: ${staff.name} (${staff.email})`);
    } else {
      console.log(`⚠️  Requested staff has no email or notifications disabled`);
      return false;
    }
  } else {
    // Get all staff with notifications enabled from database (including owner if enabled)
    const notificationStaff = await staffManagement.getNotificationRecipients();
    const staffWithEmails = notificationStaff.filter(s => s.email); // Get all with emails (including owner)
    
    if (staffWithEmails.length > 0) {
      // Use database staff emails (includes owner if notifications enabled)
      staffEmails = staffWithEmails.map(s => s.email);
      console.log(`📧 Sending email to ${staffEmails.length} staff member(s) (including owner if enabled)`);
    } else if (notificationStaff.length === 0) {
      // Only fall back to env if NO staff in database at all
      const envEmails = process.env.STAFF_EMAILS?.split(',') || [];
      staffEmails = envEmails;
    } else {
      // Staff exists in database but have no emails - don't send
      console.log('ℹ️  Staff in database have no email addresses');
    }
  }
  
  if (staffEmails.length === 0) {
    console.warn('⚠️  No staff emails to notify');
    return false;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: staffEmails.join(','),
    subject: `🚨 Human Assistance Required - IronCore Fitness Bot`,
    html: `
      <h2>Customer Needs Assistance</h2>
      <p><strong>Customer Name:</strong> ${customerName || 'Unknown'}</p>
      <p><strong>Phone Number:</strong> ${userId}</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p><strong>Message:</strong> ${userMessage}</p>
      <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
      <hr>
      <p><strong>Action Required:</strong> Please respond to the customer on WhatsApp</p>
      <p><em>Customer has been informed that staff will contact them shortly.</em></p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Staff notification sent to ${staffEmails.length} email(s)`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email notification:', error.message);
    return false;
  }
}

/**
 * Notify owner (ESCALATION) when handoff is unaccepted for 5+ minutes
 * This is sent to owner EVEN IF they already received initial notification
 * @param {string} userId - Customer's WhatsApp number
 * @param {string} userMessage - Customer's message
 * @param {string} reason - Handoff reason
 * @param {number} minutesWaiting - How long customer has been waiting
 * @param {string} customerName - Optional: Customer's name from WhatsApp profile
 */
async function notifyOwnerEscalation(userId, userMessage, reason, minutesWaiting, customerName = null) {
  if (!transporter) {
    transporter = initializeTransporter();
  }

  if (!transporter) {
    return false;
  }

  // Get owner email
  const owner = await staffManagement.getAllStaff().then(staff => 
    staff.find(s => s.role === 'owner' && s.isActive)
  );

  if (!owner || !owner.email) {
    console.warn('⚠️  Owner email not found for escalation');
    return false;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: owner.email,
    subject: `⚠️ ESCALATION: Unaccepted Handoff - ${minutesWaiting} mins`,
    html: `
      <h2 style="color: #dc2626;">⚠️ Unaccepted Handoff Escalation</h2>
      <p><strong>Customer has been waiting for ${minutesWaiting} minutes without staff response.</strong></p>
      <hr>
      <p><strong>Customer Name:</strong> ${customerName || 'Unknown'}</p>
      <p><strong>Phone Number:</strong> ${userId}</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p><strong>Message:</strong> ${userMessage}</p>
      <p><strong>Waiting Since:</strong> ${minutesWaiting} minutes ago</p>
      <hr>
      <p><strong>Action Required:</strong> Please check the handoffs dashboard or respond to customer directly.</p>
      <p><em>This is an automated escalation notification.</em></p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Escalation email sent to owner: ${owner.email}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send escalation email:', error.message);
    return false;
  }
}

// Alternative: Send notification via Slack/Discord webhook
async function notifyViaWebhook(userId, userMessage, reason) {
  const webhookUrl = process.env.NOTIFICATION_WEBHOOK_URL;
  
  if (!webhookUrl) {
    return false;
  }

  const payload = {
    text: `🚨 *Human Assistance Required*`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Customer:* ${userId}\n*Reason:* ${reason}\n*Message:* ${userMessage}\n*Time:* ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`
        }
      }
    ]
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log('📢 Webhook notification sent');
      return true;
    }
  } catch (error) {
    console.error('❌ Webhook notification failed:', error.message);
  }
  
  return false;
}

module.exports = {
  notifyStaff,
  notifyOwnerEscalation,
  notifyViaWebhook
};
