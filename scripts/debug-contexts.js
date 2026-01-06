// Debug: Check what's in Context collection
require('dotenv').config();
const mongoose = require('mongoose');
const Context = require('../database/models/Context');

async function debugContexts() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  console.log('🔍 Debugging Context Collection...\n');
  
  const contexts = await Context.find({}).limit(3);
  
  console.log(`Found ${contexts.length} context documents\n`);
  
  contexts.forEach((ctx, idx) => {
    console.log(`--- Context ${idx + 1} ---`);
    console.log('userId:', ctx.userId);
    console.log('createdAt:', ctx.createdAt);
    console.log('lastActivity:', ctx.lastActivity);
    console.log('conversationHistory length:', ctx.conversationHistory?.length || 0);
    
    if (ctx.conversationHistory && ctx.conversationHistory.length > 0) {
      console.log('Sample messages:');
      ctx.conversationHistory.slice(0, 3).forEach((msg, i) => {
        console.log(`  ${i + 1}. [${msg.role}]: ${msg.content?.substring(0, 50)}...`);
      });
    } else {
      console.log('❌ No conversation history!');
    }
    
    console.log('Full document:', JSON.stringify(ctx, null, 2));
    console.log('\n');
  });
  
  await mongoose.connection.close();
  process.exit(0);
}

debugContexts();
