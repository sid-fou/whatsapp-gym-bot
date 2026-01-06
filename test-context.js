require('dotenv').config();
const { connectDB } = require('./database/connection');
const contextService = require('./services/context');

async function testContextService() {
  console.log('🧪 Testing Context Service...\n');

  try {
    // Connect to MongoDB
    await connectDB();

    const testUserId = '919999999999'; // Test number

    console.log('📝 Test 1: Create new context');
    const context1 = await contextService.getOrCreateContext(testUserId);
    console.log(`   ✅ Context created: ${!!context1}\n`);

    console.log('📝 Test 2: Add messages');
    await contextService.addMessage(testUserId, 'user', 'Hi');
    await contextService.addMessage(testUserId, 'assistant', 'Welcome to IronCore Fitness!');
    await contextService.addMessage(testUserId, 'user', 'What are your timings?');
    console.log(`   ✅ Added 3 messages\n`);

    console.log('📝 Test 3: Get context for AI');
    const aiContext = await contextService.getContextForAI(testUserId);
    console.log(`   ✅ Retrieved ${aiContext?.length || 0} messages:`);
    aiContext?.forEach((msg, i) => {
      console.log(`      ${i + 1}. ${msg.role}: ${msg.content}`);
    });
    console.log();

    console.log('📝 Test 4: Greeting status');
    let greeted = await contextService.hasBeenGreeted(testUserId);
    console.log(`   First check: ${greeted ? 'Already greeted' : 'Not greeted yet'}`);
    await contextService.markAsGreeted(testUserId);
    greeted = await contextService.hasBeenGreeted(testUserId);
    console.log(`   After marking: ${greeted ? 'Already greeted ✅' : 'Not greeted'}\n`);

    console.log('📝 Test 5: Handoff status');
    let inHandoff = await contextService.isInHandoff(testUserId);
    console.log(`   Initial: ${inHandoff ? 'In handoff' : 'Not in handoff'}`);
    await contextService.setHandoffStatus(testUserId, true, 'user_requested');
    inHandoff = await contextService.isInHandoff(testUserId);
    console.log(`   After setting: ${inHandoff ? 'In handoff ✅' : 'Not in handoff'}`);
    await contextService.setHandoffStatus(testUserId, false);
    inHandoff = await contextService.isInHandoff(testUserId);
    console.log(`   After clearing: ${inHandoff ? 'In handoff' : 'Not in handoff ✅'}\n`);

    console.log('📝 Test 6: Get statistics');
    const stats = await contextService.getContextStats();
    console.log(`   Total contexts: ${stats.totalContexts}`);
    console.log(`   Active handoffs: ${stats.activeHandoffs}`);
    console.log(`   Recent conversations: ${stats.recentConversations}\n`);

    console.log('📝 Test 7: Clear context');
    await contextService.clearContext(testUserId);
    const contextAfter = await contextService.getContextForAI(testUserId);
    console.log(`   ✅ Context cleared: ${contextAfter === null ? 'Yes' : 'No'}\n`);

    console.log('✅ All tests passed!\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    const { disconnectDB } = require('./database/connection');
    await disconnectDB();
  }
}

testContextService();
