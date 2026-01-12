/**
 * Diagnostic script to test notification systems
 * Run locally: node scripts/diagnose-notifications.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function diagnose() {
  console.log('\n🔍 NOTIFICATION SYSTEM DIAGNOSTICS\n');
  console.log('='.repeat(50));
  
  // 1. Check environment variables
  console.log('\n📋 ENVIRONMENT VARIABLES:\n');
  
  const envVars = {
    'WHATSAPP_TOKEN': process.env.WHATSAPP_TOKEN ? '✅ SET (length: ' + process.env.WHATSAPP_TOKEN.length + ')' : '❌ MISSING',
    'PHONE_NUMBER_ID': process.env.PHONE_NUMBER_ID || '❌ MISSING',
    'STAFF_WHATSAPP_NUMBERS': process.env.STAFF_WHATSAPP_NUMBERS || '❌ MISSING',
    'EMAIL_USER': process.env.EMAIL_USER || '❌ MISSING',
    'EMAIL_PASS': process.env.EMAIL_PASS ? '✅ SET (length: ' + process.env.EMAIL_PASS.length + ')' : '❌ MISSING',
    'STAFF_EMAILS': process.env.STAFF_EMAILS || '❌ MISSING',
    'MONGODB_URI': process.env.MONGODB_URI ? '✅ SET' : '❌ MISSING',
  };
  
  for (const [key, value] of Object.entries(envVars)) {
    console.log(`  ${key}: ${value}`);
  }
  
  // 2. Connect to MongoDB and check staff
  console.log('\n📋 DATABASE CHECK:\n');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('  ✅ MongoDB connected');
    
    const Staff = require('../database/models/Staff');
    const allStaff = await Staff.find({ isActive: true });
    
    console.log(`  📊 Active staff members: ${allStaff.length}`);
    
    for (const staff of allStaff) {
      console.log(`\n  👤 ${staff.name} (${staff.role})`);
      console.log(`     Phone: ${staff.phoneNumber}`);
      console.log(`     Email: ${staff.email || 'NOT SET'}`);
      console.log(`     Notifications: ${staff.receiveNotifications ? '✅ ON' : '❌ OFF'}`);
    }
    
    // Check notification recipients
    const staffManagement = require('../services/staff-management');
    const recipients = await staffManagement.getNotificationRecipients();
    console.log(`\n  📬 Notification recipients: ${recipients.length}`);
    recipients.forEach(r => {
      console.log(`     - ${r.name}: Phone=${r.phoneNumber}, Email=${r.email || 'none'}`);
    });
    
  } catch (error) {
    console.log(`  ❌ MongoDB error: ${error.message}`);
  }
  
  // 3. Test WhatsApp API
  console.log('\n📋 WHATSAPP API TEST:\n');
  
  if (process.env.WHATSAPP_TOKEN && process.env.PHONE_NUMBER_ID) {
    try {
      const url = `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`  ✅ WhatsApp API accessible`);
        console.log(`  📱 Phone Number ID: ${data.id}`);
        console.log(`  📞 Display Phone: ${data.display_phone_number || 'N/A'}`);
      } else {
        const error = await response.json();
        console.log(`  ❌ WhatsApp API error: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      console.log(`  ❌ WhatsApp API test failed: ${error.message}`);
    }
  } else {
    console.log('  ⚠️  Skipped - Missing WHATSAPP_TOKEN or PHONE_NUMBER_ID');
  }
  
  // 4. Test Email
  console.log('\n📋 EMAIL TEST:\n');
  
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      
      // Verify connection
      await transporter.verify();
      console.log('  ✅ Email SMTP connection successful');
      console.log(`  📧 From: ${process.env.EMAIL_USER}`);
    } catch (error) {
      console.log(`  ❌ Email error: ${error.message}`);
      if (error.message.includes('Invalid login')) {
        console.log('  💡 Tip: Make sure you\'re using a Gmail App Password, not your regular password');
      }
    }
  } else {
    console.log('  ⚠️  Skipped - Missing EMAIL_USER or EMAIL_PASS');
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('DIAGNOSTICS COMPLETE\n');
  
  await mongoose.disconnect();
  process.exit(0);
}

diagnose().catch(console.error);
