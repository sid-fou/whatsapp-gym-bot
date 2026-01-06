// Script to clear all collections in the database
require('dotenv').config();
const mongoose = require('mongoose');

async function clearDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    console.log(`\n📊 Found ${collections.length} collections:`);
    collections.forEach(c => console.log(`   - ${c.name}`));

    console.log('\n🗑️  Clearing all collections...\n');

    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      await db.collection(collection.name).deleteMany({});
      console.log(`✅ Cleared ${collection.name} (${count} documents deleted)`);
    }

    console.log('\n✨ Database cleared successfully!');
    console.log('🔄 All handoffs, contexts, and ignore list entries removed.\n');

    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

clearDatabase();
