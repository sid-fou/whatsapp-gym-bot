require('dotenv').config();
const mongoose = require('mongoose');

async function checkMongoDB() {
  console.log('🔍 Checking MongoDB connection and existing data...\n');

  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in .env file');
    process.exit(1);
  }

  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ Connected successfully\n');

    // Get database name from connection
    const dbName = mongoose.connection.db.databaseName;
    console.log(`📊 Database: ${dbName}`);

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`\n📁 Existing collections (${collections.length}):`);
    
    if (collections.length === 0) {
      console.log('   No collections found - Fresh database! ✅');
    } else {
      collections.forEach((col, index) => {
        console.log(`   ${index + 1}. ${col.name}`);
      });
    }

    // Check if conversation_contexts exists
    const contextCollectionExists = collections.some(
      col => col.name === 'conversation_contexts'
    );

    if (contextCollectionExists) {
      console.log('\n⚠️  "conversation_contexts" collection already exists!');
      
      // Get document count
      const count = await mongoose.connection.db
        .collection('conversation_contexts')
        .countDocuments();
      
      console.log(`   Documents in collection: ${count}`);
      
      if (count > 0) {
        // Sample one document
        const sample = await mongoose.connection.db
          .collection('conversation_contexts')
          .findOne();
        
        console.log('\n📄 Sample document structure:');
        console.log(JSON.stringify(sample, null, 2));
      }
    } else {
      console.log('\n✅ "conversation_contexts" collection does NOT exist - Will be created on first use');
    }

    console.log('\n✅ Diagnostic complete!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.name === 'MongooseServerSelectionError') {
      console.error('\n💡 Possible issues:');
      console.error('   1. Wrong connection string');
      console.error('   2. IP not whitelisted (add 0.0.0.0/0)');
      console.error('   3. Wrong username/password');
    }
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

checkMongoDB();
