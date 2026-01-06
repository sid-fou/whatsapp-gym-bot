// Check exact number format being sent
require('dotenv').config();
const mongoose = require('mongoose');
const Staff = require('../database/models/Staff');

async function checkNumbers() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  console.log('📋 Checking phone number formats...\n');
  
  const staff = await Staff.find({ isActive: true, receiveNotifications: true });
  
  console.log('Numbers in DATABASE:');
  staff.forEach(s => {
    console.log(`  ${s.name}: "${s.phoneNumber}"`);
    console.log(`    Length: ${s.phoneNumber.length}`);
    console.log(`    Has +: ${s.phoneNumber.includes('+')}`);
    console.log(`    Has spaces: ${s.phoneNumber.includes(' ')}`);
  });
  
  console.log('\nNumbers in RECIPIENT LIST (Meta):');
  console.log('  Format shown: +91 87550 52568');
  console.log('  Without formatting: 918755052568');
  
  console.log('\n🔍 MISMATCH DETECTED:');
  console.log('  Database has: 918755052568 (no + or spaces)');
  console.log('  Meta expects: +918755052568 OR 918755052568');
  console.log('  Meta shows as: +91 87550 52568 (just for display)');
  
  console.log('\n💡 Solution:');
  console.log('  The format "918755052568" should work.');
  console.log('  But let\'s verify Meta\'s recipient list accepts it...');
  
  await mongoose.connection.close();
  process.exit(0);
}

checkNumbers();
