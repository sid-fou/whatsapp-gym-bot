// Script to add owner to staff database
require('dotenv').config();
const mongoose = require('mongoose');
const Staff = require('../database/models/Staff');

async function seedOwner() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check if owner already exists
    const existingOwner = await Staff.findOne({ role: 'owner' });
    
    if (existingOwner) {
      console.log('⚠️  Owner already exists:');
      console.log(`   Name: ${existingOwner.name}`);
      console.log(`   Phone: ${existingOwner.phoneNumber}`);
      console.log(`   Notifications: ${existingOwner.receiveNotifications ? 'ON' : 'OFF'}`);
      console.log('\nℹ️  You can edit the owner from the dashboard to change notification preferences.');
      
      await mongoose.connection.close();
      process.exit(0);
    }

    // Get owner info from gym config or env
    const ownerData = {
      name: process.env.OWNER_NAME || 'Siddharth Singh',
      role: 'owner',
      phoneNumber: process.env.STAFF_WHATSAPP_NUMBERS?.split(',')[0]?.trim() || '918755052568',
      email: process.env.EMAIL_USER || 'siddharth.singh.25091998@gmail.com',
      receiveNotifications: true, // Default to receiving notifications
      isActive: true
    };

    // Create owner
    const owner = new Staff(ownerData);
    await owner.save();

    console.log('✅ Owner added to staff database!\n');
    console.log('📋 Owner Details:');
    console.log(`   Name: ${owner.name}`);
    console.log(`   Role: ${owner.role}`);
    console.log(`   Phone: ${owner.phoneNumber}`);
    console.log(`   Email: ${owner.email}`);
    console.log(`   Notifications: ${owner.receiveNotifications ? 'ON' : 'OFF'}`);
    console.log('\n💡 You can now manage owner notification preferences from the dashboard!');
    console.log('   Go to: Dashboard → Staff → Edit Owner\n');

    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedOwner();
