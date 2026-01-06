require('dotenv').config();
const { connectDB } = require('./database/connection');
const intentService = require('./services/intent');
const aiService = require('./services/ai');
const contextService = require('./services/context');

async function testContextAwareAI() {
  console.log('🧪 Testing Context-Aware AI...\n');

  try {
    await connectDB();

    const testUserId = '918888888888';
    
    // Clear any existing context
    await contextService.clearContext(testUserId);

    console.log('📝 Conversation 1: First greeting');
    let intent = intentService.detectIntent('Hi');
    let response = await aiService.generateResponse('Hi', intent, testUserId);
    console.log(`   User: Hi`);
    console.log(`   Bot: ${response}\n`);

    console.log('📝 Conversation 2: Ask question');
    intent = intentService.detectIntent('What are your timings?');
    response = await aiService.generateResponse('What are your timings?', intent, testUserId);
    console.log(`   User: What are your timings?`);
    console.log(`   Bot: ${response}\n`);

    console.log('📝 Conversation 3: Second greeting (should be short!)');
    intent = intentService.detectIntent('Hello');
    response = await aiService.generateResponse('Hello', intent, testUserId);
    console.log(`   User: Hello`);
    console.log(`   Bot: ${response}`);
    console.log(`   ✅ Should NOT say "Welcome to IronCore" again!\n`);

    console.log('📝 Conversation 4: Thank you (context-aware)');
    intent = intentService.detectIntent('Thanks!');
    response = await aiService.generateResponse('Thanks!', intent, testUserId);
    console.log(`   User: Thanks!`);
    console.log(`   Bot: ${response}`);
    console.log(`   ✅ Should acknowledge previous conversation!\n`);

    // Check context
    const context = await contextService.getContextForAI(testUserId);
    console.log(`📊 Stored ${context?.length || 0} messages in context\n`);

    // Cleanup
    await contextService.clearContext(testUserId);
    console.log('✅ Test complete!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    const { disconnectDB } = require('./database/connection');
    await disconnectDB();
  }
}

testContextAwareAI();
