// Check staff in database
require('dotenv').config();
const mongoose = require('mongoose');
const Staff = require('../database/models/Staff');

async function checkStaff() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const allStaff = await Staff.find({});
  console.log('All staff in database:');
  console.log(JSON.stringify(allStaff, null, 2));
  
  const activeStaff = await Staff.find({ isActive: true });
  console.log('\nActive staff:', activeStaff.length);
  
  const notificationStaff = await Staff.find({ 
    isActive: true, 
    receiveNotifications: true 
  });
  console.log('Staff with notifications enabled:', notificationStaff.length);
  notificationStaff.forEach(s => {
    console.log(`  - ${s.name} (${s.role}): ${s.phoneNumber}, email: ${s.email || 'none'}`);
  });
  
  await mongoose.connection.close();
  process.exit(0);
}

checkStaff();
