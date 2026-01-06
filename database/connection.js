const mongoose = require('mongoose');

let isConnected = false;

async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('✅ Using existing MongoDB connection');
    return;
  }

  if (!process.env.MONGODB_URI) {
    console.warn('⚠️  MongoDB URI not configured - context storage disabled');
    console.warn('💡 Add MONGODB_URI to .env to enable conversation memory');
    return;
  }

  try {
    // Disconnect if connection exists but is in bad state
    if (mongoose.connection.readyState !== 0) {
      console.log('🔄 Closing stale MongoDB connection...');
      await mongoose.connection.close();
    }
    
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'ironcore_fitness_bot', // Database name
      // Connection options
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ironcore_fitness_bot`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
      isConnected = false;
      // Auto-reconnect on error
      setTimeout(() => {
        console.log('🔄 Attempting to reconnect to MongoDB...');
        connectDB();
      }, 5000);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
      isConnected = false;
      // Auto-reconnect on disconnect
      setTimeout(() => {
        console.log('🔄 Attempting to reconnect to MongoDB...');
        connectDB();
      }, 5000);
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected successfully');
      isConnected = true;
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.warn('⚠️  Bot will run without conversation memory');
    isConnected = false;
  }
}

function isDBConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

async function disconnectDB() {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('👋 MongoDB disconnected');
  }
}

module.exports = {
  connectDB,
  isDBConnected,
  disconnectDB
};
