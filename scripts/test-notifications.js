// Test notification routing
require('dotenv').config();
const mongoose = require('mongoose');
const Staff = require('../database/models/Staff');

async function testNotifications() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  console.log('🔍 Testing notification routing...\n');
  
  // Get notification recipients
  const notificationStaff = await Staff.find({ 
    isActive: true, 
    receiveNotifications: true 
  }).select('name phoneNumber role email');
  
  console.log('📋 Staff with notifications ENABLED:');
  notificationStaff.forEach(s => {
    console.log(`  ✅ ${s.name} (${s.role})`);
    console.log(`     📱 WhatsApp: ${s.phoneNumber}`);
    console.log(`     📧 Email: ${s.email || '❌ No email'}`);
  });
  
  console.log('\n📨 When handoff is triggered:');
  console.log('  WhatsApp notifications will be sent to:');
  notificationStaff.forEach(s => {
    console.log(`    - ${s.phoneNumber} (${s.name})`);
  });
  
  const staffWithEmails = notificationStaff.filter(s => s.email);
  console.log('\n  Email notifications will be sent to:');
  if (staffWithEmails.length > 0) {
    staffWithEmails.forEach(s => {
      console.log(`    - ${s.email} (${s.name}${s.role === 'owner' ? ' - OWNER' : ''})`);
    });
  } else {
    console.log('    - ❌ No staff have email addresses configured');
  }
  
  console.log('\n⏰ After 5 minutes if unaccepted:');
  const owner = notificationStaff.find(s => s.role === 'owner');
  if (owner && owner.email) {
    console.log(`  📧 ESCALATION email will be sent to: ${owner.email} (${owner.name})`);
  } else {
    console.log('  ⚠️  No owner with email configured for escalation');
  }
  
  await mongoose.connection.close();
  process.exit(0);
}

testNotifications();
