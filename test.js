require('dotenv').config();
const intentService = require('./services/intent');
const aiService = require('./services/ai');
const handoffService = require('./services/handoff');

async function testBot() {
  const testMessages = [
    // Basic queries
    "Hi there!",
    "What are your timings?",
    "How much is monthly membership?",
    "What does the membership include?",
    
    // Personal training queries
    "Do you have personal trainers?",
    "Is personal training included in membership?",
    
    // Location queries
    "What's your address?",
    "Where are you located?",
    
    // Additional services
    "What other services do you have?",
    "Do you have yoga classes?",
    
    // Trial and booking
    "I want a free trial",
    
    // Human handoff triggers
    "I want to speak to a real person",
    "I have a medical condition",
    
    // Rules
    "What should I bring to the gym?"
  ];

  console.log('🤖 Testing IronCore Fitness Bot with Enhanced Features...\n');
  console.log('=' .repeat(70));

  for (const message of testMessages) {
    console.log(`\n👤 User: ${message}`);
    
    // Check for handoff trigger first
    const handoffCheck = handoffService.shouldTriggerHandoff(message);
    if (handoffCheck.shouldHandoff) {
      console.log(`🚨 HANDOFF TRIGGERED - Reason: ${handoffCheck.reason}`);
      const handoffMsg = handoffService.getHandoffMessage(handoffCheck.reason);
      console.log(`🤖 Bot Response:\n${handoffMsg}`);
      console.log('=' .repeat(70));
      continue;
    }
    
    const intent = intentService.detectIntent(message);
    console.log(`🎯 Intent: ${intent.type} → ${intent.category || 'N/A'}`);
    
    try {
      const response = await aiService.generateResponse(message, intent);
      console.log(`🤖 Bot Response:\n${response}`);
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log('=' .repeat(70));
    
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n✅ Testing complete!');
  
  // Show handoff queue status
  const queue = handoffService.getQueueStatus();
  if (queue.length > 0) {
    console.log(`\n📋 Handoff Queue (${queue.length} users waiting):`);
    queue.forEach(item => {
      console.log(`   - User: ${item.userId}, Reason: ${item.reason}`);
    });
  }
}

testBot().catch(console.error);
