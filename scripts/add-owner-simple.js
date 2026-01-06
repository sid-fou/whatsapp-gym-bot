// Add owner with error handling
require('dotenv').config();
const mongoose = require('mongoose');
const Staff = require('../database/models/Staff');

async function addOwner() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const owner = new Staff({
      name: 'Siddharth Singh',
      role: 'owner',
      phoneNumber: '918755052568',
      email: 'siddharth.singh.25091998@gmail.com',
      receiveNotifications: true,
      isActive: true
    });
    
    await owner.save();
    console.log('✅ Owner created:', owner.toObject());
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addOwner();
