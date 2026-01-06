// Quick fix script
require('dotenv').config();
const mongoose = require('mongoose');

async function quickFix() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Staff = mongoose.connection.collection('staff');
  
  // Update any staff with wrong owner role
  const result = await Staff.updateMany(
    { name: /siddharth/i, role: { $ne: 'owner' } },
    { $set: { role: 'owner' } }
  );
  
  console.log('Updated:', result.modifiedCount);
  
  // Show current owner
  const owner = await Staff.findOne({ role: 'owner' });
  console.log('Owner:', owner);
  
  await mongoose.connection.close();
  process.exit(0);
}

quickFix().catch(console.error);
