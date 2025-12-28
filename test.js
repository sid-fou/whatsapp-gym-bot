require('dotenv').config();
const intentService = require('./services/intent');
const aiService = require('./services/ai');

async function testBot() {
  const testMessages = [
    "Hi there!",
    "What are your timings?",
    "How much is monthly membership?",
    "I want a free trial",
    "Do you have personal trainers?",
    "What should I bring to the gym?"
  ];

  console.log('🤖 Testing IronCore Fitness Bot...\n');

  for (const message of testMessages) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`👤 User: ${message}`);
    
    const intent = intentService.detectIntent(message);
    console.log(`🎯 Intent Detected: ${intent.type} → ${intent.category || 'N/A'}`);
    
    try {
      const response = await aiService.generateResponse(message, intent);
      console.log(`🤖 Bot Response:\n${response}`);
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ Testing complete!');
}

testBot().catch(console.error);
