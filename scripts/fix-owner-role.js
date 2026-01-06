// Script to fix owner role in database
require('dotenv').config();
const mongoose = require('mongoose');
const Staff = require('../database/models/Staff');

async function fixOwnerRole() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find any staff with custom "owner" role
    const wrongOwner = await Staff.findOne({ 
      role: { $ne: 'owner' },
      name: /siddharth/i 
    });

    if (wrongOwner) {
      console.log('⚠️  Found owner with wrong role:');
      console.log(`   Name: ${wrongOwner.name}`);
      console.log(`   Current role: "${wrongOwner.role}"`);
      
      // Update to correct role
      wrongOwner.role = 'owner';
      await wrongOwner.save();
      
      console.log('✅ Fixed! Role updated to: "owner"\n');
    }

    // Verify owner exists with correct role
    const owner = await Staff.findOne({ role: 'owner' });
    
    if (owner) {
      console.log('✅ Owner account verified:');
      console.log(`   Name: ${owner.name}`);
      console.log(`   Role: ${owner.role}`);
      console.log(`   Phone: ${owner.phoneNumber}`);
      console.log(`   Notifications: ${owner.receiveNotifications ? 'ON' : 'OFF'}\n');
    } else {
      console.log('⚠️  No owner found in database. Run seed-owner.js first.\n');
    }

    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixOwnerRole();
