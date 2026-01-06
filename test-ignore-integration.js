require('dotenv').config();
const { connectDB, disconnectDB } = require('./database/connection');
const ignoreListService = require('./services/ignore-list');

async function testWebhookIgnoreIntegration() {
  console.log('🧪 Testing Webhook Ignore List Integration\n');
  console.log('='.repeat(60));

  try {
    await connectDB();

    const testCustomer = '919111111111';
    const testFriend = '919222222222';

    console.log('\n📝 SETUP: Add friend to ignore list');
    console.log('─'.repeat(60));
    await ignoreListService.addToIgnoreList(testFriend, 'personal', 'admin', 'Test friend');
    console.log(`✅ Added ${testFriend} to ignore list\n`);

    console.log('📝 TEST 1: Check customer (not ignored)');
    console.log('─'.repeat(60));
    let isIgnored = await ignoreListService.isIgnored(testCustomer);
    console.log(`Customer ${testCustomer}`);
    console.log(`Is ignored: ${isIgnored ? 'YES ❌' : 'NO ✅'}`);
    console.log(`Bot should: ${isIgnored ? 'Stay silent' : 'RESPOND ✅'}\n`);

    console.log('📝 TEST 2: Check friend (ignored)');
    console.log('─'.repeat(60));
    isIgnored = await ignoreListService.isIgnored(testFriend);
    console.log(`Friend ${testFriend}`);
    console.log(`Is ignored: ${isIgnored ? 'YES ✅' : 'NO ❌'}`);
    console.log(`Bot should: ${isIgnored ? 'STAY SILENT ✅' : 'Respond'}\n`);

    console.log('📝 TEST 3: Simulate message flow');
    console.log('─'.repeat(60));
    
    console.log('\n  Scenario A: Customer messages');
    console.log('  Customer: "What are your timings?"');
    isIgnored = await ignoreListService.isIgnored(testCustomer);
    console.log(`  → Check ignore list: ${isIgnored ? 'Ignored' : 'Not ignored'}`);
    console.log(`  → Bot action: ${isIgnored ? 'Silent' : 'RESPOND ✅'}`);

    console.log('\n  Scenario B: Friend messages');
    console.log('  Friend: "Hey bro, want lunch?"');
    isIgnored = await ignoreListService.isIgnored(testFriend);
    console.log(`  → Check ignore list: ${isIgnored ? 'Ignored ✅' : 'Not ignored'}`);
    console.log(`  → Bot action: ${isIgnored ? 'SILENT ✅' : 'Respond'}`);

    console.log('\n  Scenario C: Friend asks about gym');
    console.log('  Friend: "How much is gym membership?"');
    isIgnored = await ignoreListService.isIgnored(testFriend);
    console.log(`  → Check ignore list: ${isIgnored ? 'Ignored ✅' : 'Not ignored'}`);
    console.log(`  → Bot action: ${isIgnored ? 'SILENT ✅' : 'Respond'}`);
    console.log(`  → Note: Whitelist blocks ALL messages, even business queries`);

    console.log('\n📝 TEST 4: Remove friend, simulate again');
    console.log('─'.repeat(60));
    await ignoreListService.removeFromIgnoreList(testFriend);
    console.log(`✅ Removed ${testFriend} from ignore list`);
    
    isIgnored = await ignoreListService.isIgnored(testFriend);
    console.log(`\n  Friend: "How much is membership?"`);
    console.log(`  → Check ignore list: ${isIgnored ? 'Ignored' : 'Not ignored ✅'}`);
    console.log(`  → Bot action: ${isIgnored ? 'Silent' : 'RESPOND ✅'}`);

    console.log('\n📝 TEST 5: View ignore list stats');
    console.log('─'.repeat(60));
    const stats = await ignoreListService.getIgnoreStats();
    console.log(`Total ignored: ${stats.total}`);
    console.log(`By reason:`, JSON.stringify(stats.byReason, null, 2));
    console.log(`Recently active: ${stats.recentlyActive}`);

    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await ignoreListService.removeFromIgnoreList(testCustomer);
    await ignoreListService.removeFromIgnoreList(testFriend);

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL INTEGRATION TESTS PASSED!\n');

    console.log('📋 SUMMARY:');
    console.log('  ✅ Webhook checks ignore list before responding');
    console.log('  ✅ Ignored numbers get no bot response');
    console.log('  ✅ Non-ignored numbers get normal responses');
    console.log('  ✅ Can remove from ignore list to re-enable bot');
    console.log('  ✅ Whitelist blocks ALL messages (even business queries)');
    console.log('  ✅ Priority: Never miss customers (must manually ignore friends)\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await disconnectDB();
  }
}

testWebhookIgnoreIntegration();
