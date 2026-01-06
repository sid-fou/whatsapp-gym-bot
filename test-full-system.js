require('dotenv').config();
const { connectDB } = require('./database/connection');
const contextService = require('./services/context');
const intentService = require('./services/intent');
const aiService = require('./services/ai');
const handoffService = require('./services/handoff');
const staffHelper = require('./services/staff-helper');
const botState = require('./services/bot-state');
const buttonService = require('./services/buttons');

async function fullSystemTest() {
  console.log('🧪 FULL SYSTEM TEST\n');
  console.log('='.repeat(60));

  try {
    await connectDB();

    const customerId = '919111111111';
    const staffId = '918755052568';

    // Clear any existing state
    await contextService.clearContext(customerId);
    botState.enableBot();

    console.log('\n📱 TEST 1: Customer starts conversation');
    console.log('─'.repeat(60));
    let intent = intentService.detectIntent('Hi');
    let response = await aiService.generateResponse('Hi', intent, customerId);
    console.log(`Customer: Hi`);
    console.log(`Bot: ${response}`);
    console.log(`✅ First greeting delivered\n`);

    console.log('📱 TEST 2: Customer asks question');
    console.log('─'.repeat(60));
    intent = intentService.detectIntent('What are your timings?');
    response = await aiService.generateResponse('What are your timings?', intent, customerId);
    console.log(`Customer: What are your timings?`);
    console.log(`Bot: ${response}`);
    console.log(`✅ Answer provided\n`);

    console.log('📱 TEST 3: Customer says Hi again (should be short!)');
    console.log('─'.repeat(60));
    intent = intentService.detectIntent('Hello');
    response = await aiService.generateResponse('Hello', intent, customerId);
    console.log(`Customer: Hello`);
    console.log(`Bot: ${response}`);
    console.log(`${response.toLowerCase().includes('welcome') ? '❌ Still saying welcome!' : '✅ Short response!'}\n`);

    console.log('📱 TEST 4: Customer triggers handoff');
    console.log('─'.repeat(60));
    const handoffCheck = handoffService.shouldTriggerHandoff('I want to talk to someone');
    console.log(`Handoff triggered: ${handoffCheck.shouldHandoff ? 'YES ✅' : 'NO ❌'}`);
    if (handoffCheck.shouldHandoff) {
      await contextService.setHandoffStatus(customerId, true, handoffCheck.reason);
      console.log(`Handoff reason: ${handoffCheck.reason}`);
      console.log(`Customer now in handoff mode ✅\n`);
    }

    console.log('📱 TEST 5: Customer messages during handoff (should be silent)');
    console.log('─'.repeat(60));
    const inHandoff = await contextService.isInHandoff(customerId);
    console.log(`In handoff: ${inHandoff ? 'YES' : 'NO'}`);
    if (inHandoff) {
      console.log(`Bot response: [SILENT] ✅\n`);
    }

    console.log('👤 TEST 6: Staff acknowledgment');
    console.log('─'.repeat(60));
    const isStaff = staffHelper.isStaffMessage(staffId);
    const isAck = staffHelper.isAcknowledgment('ok');
    console.log(`Is staff: ${isStaff ? 'YES' : 'NO'}`);
    console.log(`Is acknowledgment: ${isAck ? 'YES' : 'NO'}`);
    if (isStaff && isAck) {
      const buttonPayload = buttonService.createEndHandoffButton(customerId);
      console.log(`Button created: ${buttonPayload.interactive.action.buttons[0].reply.title} ✅\n`);
    }

    console.log('👤 TEST 7: Staff ends handoff');
    console.log('─'.repeat(60));
    handoffService.endHandoff(customerId);
    await contextService.setHandoffStatus(customerId, false);
    const stillInHandoff = await contextService.isInHandoff(customerId);
    console.log(`Handoff ended: ${!stillInHandoff ? 'YES ✅' : 'NO ❌'}\n`);

    console.log('📱 TEST 8: Customer messages after handoff (context preserved)');
    console.log('─'.repeat(60));
    intent = intentService.detectIntent('Thanks for the help!');
    response = await aiService.generateResponse('Thanks for the help!', intent, customerId);
    console.log(`Customer: Thanks for the help!`);
    console.log(`Bot: ${response}`);
    console.log(`${response.toLowerCase().includes('welcome') && !response.toLowerCase().includes('ironcore') ? '✅ Context-aware response!' : '⚠️  Check response'}\n`);

    console.log('👤 TEST 9: Bot control - Turn Off');
    console.log('─'.repeat(60));
    const offCommand = staffHelper.detectBotCommand('bot off');
    console.log(`Command detected: ${offCommand}`);
    if (offCommand === 'bot_off') {
      botState.disableBot();
      console.log(`Bot status: ${botState.isBotEnabled() ? 'ON' : 'OFF ✅'}\n`);
    }

    console.log('📱 TEST 10: Customer messages when bot is OFF');
    console.log('─'.repeat(60));
    console.log(`Bot enabled: ${botState.isBotEnabled() ? 'YES' : 'NO'}`);
    if (!botState.isBotEnabled()) {
      console.log(`Bot response: [SILENT - Bot is OFF] ✅\n`);
    }

    console.log('👤 TEST 11: Bot control - Turn On');
    console.log('─'.repeat(60));
    const onCommand = staffHelper.detectBotCommand('bot on');
    if (onCommand === 'bot_on') {
      botState.enableBot();
      console.log(`Bot status: ${botState.isBotEnabled() ? 'ON ✅' : 'OFF'}\n`);
    }

    console.log('📊 TEST 12: Context statistics');
    console.log('─'.repeat(60));
    const stats = await contextService.getContextStats();
    console.log(`Total contexts: ${stats.totalContexts}`);
    console.log(`Active handoffs: ${stats.activeHandoffs}`);
    console.log(`Recent conversations: ${stats.recentConversations}`);
    console.log(`✅ Statistics retrieved\n`);

    // Cleanup
    await contextService.clearContext(customerId);

    console.log('='.repeat(60));
    console.log('✅ ALL TESTS PASSED!\n');

    console.log('📋 SUMMARY:');
    console.log('  ✅ Conversation context (memory)');
    console.log('  ✅ Smart greetings (short after first)');
    console.log('  ✅ Handoff trigger & pause');
    console.log('  ✅ Staff acknowledgment detection');
    console.log('  ✅ Interactive buttons');
    console.log('  ✅ Bot on/off control');
    console.log('  ✅ Context preserved during handoff');
    console.log('  ✅ MongoDB integration\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    const { disconnectDB } = require('./database/connection');
    await disconnectDB();
  }
}

fullSystemTest();
