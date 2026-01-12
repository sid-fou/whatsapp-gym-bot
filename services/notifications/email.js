/**
 * Email Notification Service
 * Primary: Resend (fast, reliable, works on serverless)
 * Fallback: Gmail SMTP (if Resend not configured)
 */

const nodemailer = require('nodemailer');
const staffManagement = require('../staff-management');

// Try to import Resend (may not be installed)
let Resend;
try {
  Resend = require('resend').Resend;
} catch (e) {
  console.log('ℹ️  Resend not installed, will use Gmail SMTP only');
}

let resendClient = null;
let nodemailerTransporter = null;

/**
 * Initialize email service
 * Prefers Resend if API key is set, falls back to Gmail
 */
function initializeEmailService() {
  // Try Resend first (faster, more reliable on serverless)
  if (process.env.RESEND_API_KEY && Resend) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
    console.log('✅ Email notifications enabled (Resend)');
    return 'resend';
  }
  
  // Fallback to Gmail SMTP
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    nodemailerTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
    console.log('✅ Email notifications enabled (Gmail SMTP)');
    return 'gmail';
  }
  
  console.warn('⚠️  Email credentials not configured - notifications disabled');
  return null;
}

/**
 * Send email via Resend
 */
async function sendViaResend(to, subject, html) {
  if (!resendClient) return false;
  
  try {
    const { data, error } = await resendClient.emails.send({
      from: 'IronCore Fitness <onboarding@resend.dev>', // Use your verified domain in production
      to: Array.isArray(to) ? to : [to],
      subject: subject,
      html: html,
    });
    
    if (error) {
      console.error('❌ Resend error:', error);
      return false;
    }
    
    console.log(`📧 Email sent via Resend - ID: ${data.id}`);
    return true;
  } catch (error) {
    console.error('❌ Resend exception:', error.message);
    return false;
  }
}

/**
 * Send email via Gmail SMTP (fallback)
 */
async function sendViaGmail(to, subject, html) {
  if (!nodemailerTransporter) return false;
  
  try {
    await nodemailerTransporter.sendMail({
      from: `"IronCore Fitness Bot" <${process.env.EMAIL_USER}>`,
      to: Array.isArray(to) ? to.join(',') : to,
      subject: subject,
      html: html,
    });
    
    console.log(`📧 Email sent via Gmail`);
    return true;
  } catch (error) {
    console.error('❌ Gmail error:', error.message);
    return false;
  }
}

/**
 * Notify staff via email (smart routing to specific staff or all)
 */
async function notifyStaff(userId, userMessage, reason, specificStaffPhone = null, customerName = null) {
  // Initialize if not done
  const provider = initializeEmailService();
  if (!provider) {
    console.log('📧 Email notification skipped - not configured');
    return false;
  }

  let staffEmails = [];
  
  if (specificStaffPhone) {
    const staff = await staffManagement.getStaffByPhone(specificStaffPhone);
    if (staff && staff.email && staff.receiveNotifications) {
      staffEmails = [staff.email];
      console.log(`📧 Will notify specific staff: ${staff.email}`);
    }
  } else {
    const allStaff = await staffManagement.getNotificationRecipients();
    staffEmails = allStaff.map(s => s.email).filter(Boolean);
    console.log(`📧 Will notify ${staffEmails.length} staff member(s)`);
    
    // Add owner email from env if configured
    if (process.env.OWNER_EMAIL && !staffEmails.includes(process.env.OWNER_EMAIL)) {
      staffEmails.push(process.env.OWNER_EMAIL);
    }
  }
  
  if (staffEmails.length === 0) {
    console.log('📧 No staff emails configured');
    return false;
  }

  console.log(`📧 Sending email to ${staffEmails.length} staff member(s) (including owner if enabled)`);

  const subject = `🚨 Human Assistance Required - IronCore Fitness Bot`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #e74c3c;">🚨 Customer Needs Assistance</h2>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>👤 Customer Name:</strong> ${customerName || 'Unknown'}</p>
        <p><strong>📱 Phone Number:</strong> ${userId}</p>
        <p><strong>🔍 Reason:</strong> ${reason}</p>
        <p><strong>💬 Message:</strong> "${userMessage}"</p>
        <p><strong>⏰ Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
      </div>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p><strong>⚡ Action Required:</strong> Please respond to the customer on WhatsApp</p>
      <p style="color: #666; font-size: 14px;"><em>Customer has been informed that staff will contact them shortly.</em></p>
    </div>
  `;

  // Try Resend first (faster), then Gmail
  if (resendClient) {
    const success = await sendViaResend(staffEmails, subject, html);
    if (success) return true;
    console.log('🔄 Resend failed, trying Gmail fallback...');
  }
  
  if (nodemailerTransporter) {
    return await sendViaGmail(staffEmails, subject, html);
  }
  
  return false;
}

/**
 * Notify owner (ESCALATION) when handoff is unaccepted for 5+ minutes
 */
async function notifyOwnerEscalation(userId, userMessage, reason, minutesWaiting, customerName = null) {
  const provider = initializeEmailService();
  if (!provider) return false;

  const owner = await staffManagement.getAllStaff().then(staff => 
    staff.find(s => s.role === 'owner' && s.isActive)
  );

  if (!owner || !owner.email) {
    console.warn('⚠️  Owner email not found for escalation');
    return false;
  }

  const subject = `🔴 URGENT: Customer Waiting ${minutesWaiting}+ Minutes - IronCore Fitness`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #c0392b;">🔴 URGENT ESCALATION</h2>
      <p style="color: #e74c3c; font-size: 18px;">A customer has been waiting for <strong>${minutesWaiting} minutes</strong> without staff response!</p>
      <div style="background: #fdf2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #e74c3c; margin: 20px 0;">
        <p><strong>👤 Customer Name:</strong> ${customerName || 'Unknown'}</p>
        <p><strong>📱 Phone Number:</strong> ${userId}</p>
        <p><strong>🔍 Reason:</strong> ${reason}</p>
        <p><strong>💬 Message:</strong> "${userMessage}"</p>
        <p><strong>⏰ Waiting Since:</strong> ${new Date(Date.now() - minutesWaiting * 60000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
      </div>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p><strong>⚡ Immediate Action Required!</strong></p>
    </div>
  `;

  if (resendClient) {
    const success = await sendViaResend(owner.email, subject, html);
    if (success) return true;
  }
  
  if (nodemailerTransporter) {
    return await sendViaGmail(owner.email, subject, html);
  }
  
  return false;
}

module.exports = {
  notifyStaff,
  notifyOwnerEscalation,
  initializeEmailService
};
