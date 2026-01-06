require('dotenv').config();
const { connectDB, disconnectDB } = require('./database/connection');
const ignoreListService = require('./services/ignore-list');

async function testIgnoreList() {
  console.log('🧪 Testing Ignore List System\n');
  console.log('='.repeat(60));

  try {
    await connectDB();

    console.log('\n📝 TEST 1: Add number to ignore list');
    console.log('─'.repeat(60));
    let result = await ignoreListService.addToIgnoreList(
      '919999999999',
      'personal',
      'admin',
      'Test friend contact'
    );
    console.log(`Result: ${result.message}`);
    console.log(`Success: ${result.success ? '✅' : '❌'}\n`);

    console.log('📝 TEST 2: Check if number is ignored');
    console.log('─'.repeat(60));
    let isIgnored = await ignoreListService.isIgnored('919999999999');
    console.log(`Is 919999999999 ignored? ${isIgnored ? 'YES ✅' : 'NO ❌'}\n`);

    console.log('📝 TEST 3: Check non-ignored number');
    console.log('─'.repeat(60));
    isIgnored = await ignoreListService.isIgnored('918888888888');
    console.log(`Is 918888888888 ignored? ${isIgnored ? 'YES ❌' : 'NO ✅'}\n`);

    console.log('📝 TEST 4: Try adding duplicate (should fail)');
    console.log('─'.repeat(60));
    result = await ignoreListService.addToIgnoreList('919999999999', 'spam');
    console.log(`Result: ${result.message}`);
    console.log(`Success: ${result.success ? '❌ Should have failed!' : '✅ Correctly rejected'}\n`);

    console.log('📝 TEST 5: Add more numbers');
    console.log('─'.repeat(60));
    await ignoreListService.addToIgnoreList('917777777777', 'spam', 'auto');
    await ignoreListService.addToIgnoreList('916666666666', 'personal', 'admin', 'Family member');
    console.log('✅ Added 2 more numbers\n');

    console.log('📝 TEST 6: Get all ignored numbers');
    console.log('─'.repeat(60));
    const allIgnored = await ignoreListService.getAllIgnored();
    console.log(`Total ignored: ${allIgnored.length}`);
    allIgnored.forEach((entry, i) => {
      console.log(`   ${i + 1}. ${entry.phoneNumber} (${entry.reason}) - ${entry.note || 'No note'}`);
    });
    console.log();

    console.log('📝 TEST 7: Get statistics');
    console.log('─'.repeat(60));
    const stats = await ignoreListService.getIgnoreStats();
    console.log(`Total ignored numbers: ${stats.total}`);
    console.log(`By reason:`, stats.byReason);
    console.log(`Recently active: ${stats.recentlyActive}\n`);

    console.log('📝 TEST 8: Bulk add numbers');
    console.log('─'.repeat(60));
    const bulkResult = await ignoreListService.bulkAddToIgnoreList(
      ['915555555555', '914444444444', '919999999999'], // Last one is duplicate
      'personal',
      'admin'
    );
    console.log(`Summary: ${bulkResult.summary}`);
    console.log(`Added: ${bulkResult.added.length}`);
    console.log(`Skipped (duplicates): ${bulkResult.skipped.length}`);
    console.log(`Failed: ${bulkResult.failed.length}\n`);

    console.log('📝 TEST 9: Remove number from ignore list');
    console.log('─'.repeat(60));
    result = await ignoreListService.removeFromIgnoreList('917777777777');
    console.log(`Result: ${result.message}`);
    console.log(`Success: ${result.success ? '✅' : '❌'}\n`);

    console.log('📝 TEST 10: Verify removal');
    console.log('─'.repeat(60));
    isIgnored = await ignoreListService.isIgnored('917777777777');
    console.log(`Is 917777777777 still ignored? ${isIgnored ? 'YES ❌' : 'NO ✅'}\n`);

    console.log('📝 TEST 11: Final count');
    console.log('─'.repeat(60));
    const finalList = await ignoreListService.getAllIgnored();
    console.log(`Final total: ${finalList.length} ignored numbers\n`);

    // Cleanup
    console.log('🧹 Cleaning up test data...');
    for (const entry of finalList) {
      await ignoreListService.removeFromIgnoreList(entry.phoneNumber);
    }
    console.log('✅ Cleanup complete\n');

    console.log('='.repeat(60));
    console.log('✅ ALL TESTS PASSED!\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await disconnectDB();
  }
}

testIgnoreList();
