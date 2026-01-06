/**
 * Admin API Test Script
 * Tests all admin endpoints to ensure they work correctly
 * 
 * Usage: node test-admin-api.js
 */

require('dotenv').config();

const BASE_URL = 'http://localhost:3000';
const ADMIN_KEY = process.env.ADMIN_KEY;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function makeRequest(method, path, body = null) {
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': ADMIN_KEY
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    return {
      status: response.status,
      ok: response.ok,
      data
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

async function testEndpoint(name, method, path, body = null, expectedStatus = 200) {
  log(`\n📍 Testing: ${name}`, 'cyan');
  log(`   ${method} ${path}`, 'blue');
  
  const result = await makeRequest(method, path, body);
  
  if (result.status === expectedStatus) {
    log(`   ✅ Status: ${result.status} (Expected: ${expectedStatus})`, 'green');
    log(`   Response: ${JSON.stringify(result.data, null, 2)}`, 'reset');
    return true;
  } else {
    log(`   ❌ Status: ${result.status} (Expected: ${expectedStatus})`, 'red');
    log(`   Response: ${JSON.stringify(result.data || result.error, null, 2)}`, 'red');
    return false;
  }
}

async function runTests() {
  log('='.repeat(60), 'yellow');
  log('🧪 ADMIN API COMPREHENSIVE TEST SUITE', 'yellow');
  log('='.repeat(60), 'yellow');
  
  if (!ADMIN_KEY) {
    log('\n❌ ADMIN_KEY not found in .env file!', 'red');
    log('Please add ADMIN_KEY to your .env file', 'red');
    return;
  }
  
  log(`\n🔑 Using ADMIN_KEY: ${ADMIN_KEY.substring(0, 10)}...`, 'blue');
  
  let passed = 0;
  let failed = 0;
  
  // ============================================
  // AUTHENTICATION TESTS
  // ============================================
  log('\n' + '='.repeat(60), 'yellow');
  log('🔐 AUTHENTICATION TESTS', 'yellow');
  log('='.repeat(60), 'yellow');
  
  // Test 1: Login with correct password
  if (await testEndpoint(
    'Login with correct password',
    'POST',
    '/admin/login',
    { password: ADMIN_KEY }
  )) passed++; else failed++;
  
  // Test 2: Login with wrong password
  if (await testEndpoint(
    'Login with wrong password',
    'POST',
    '/admin/login',
    { password: 'wrong_password' },
    401
  )) passed++; else failed++;
  
  // Test 3: Verify admin key
  if (await testEndpoint(
    'Verify admin key',
    'GET',
    '/admin/verify'
  )) passed++; else failed++;
  
  // ============================================
  // BOT CONTROL TESTS
  // ============================================
  log('\n' + '='.repeat(60), 'yellow');
  log('🤖 BOT CONTROL TESTS', 'yellow');
  log('='.repeat(60), 'yellow');
  
  // Test 4: Get bot status
  if (await testEndpoint(
    'Get bot status',
    'GET',
    '/admin/api/bot/status'
  )) passed++; else failed++;
  
  // Test 5: Disable bot
  if (await testEndpoint(
    'Disable bot',
    'POST',
    '/admin/api/bot/disable'
  )) passed++; else failed++;
  
  // Test 6: Enable bot
  if (await testEndpoint(
    'Enable bot',
    'POST',
    '/admin/api/bot/enable'
  )) passed++; else failed++;
  
  // ============================================
  // IGNORE LIST TESTS
  // ============================================
  log('\n' + '='.repeat(60), 'yellow');
  log('🚫 IGNORE LIST TESTS', 'yellow');
  log('='.repeat(60), 'yellow');
  
  const testNumber = '919999999999';
  
  // Test 7: Add number to ignore list
  if (await testEndpoint(
    'Add number to ignore list',
    'POST',
    '/admin/api/ignore',
    {
      phoneNumber: testNumber,
      reason: 'spam',
      note: 'Test number for API testing'
    }
  )) passed++; else failed++;
  
  // Test 8: Get all ignored numbers
  if (await testEndpoint(
    'Get all ignored numbers',
    'GET',
    '/admin/api/ignored'
  )) passed++; else failed++;
  
  // Test 9: Remove number from ignore list
  if (await testEndpoint(
    'Remove number from ignore list',
    'DELETE',
    `/admin/api/ignore/${testNumber}`
  )) passed++; else failed++;
  
  // ============================================
  // HANDOFF TESTS
  // ============================================
  log('\n' + '='.repeat(60), 'yellow');
  log('🤝 HANDOFF TESTS', 'yellow');
  log('='.repeat(60), 'yellow');
  
  // Test 10: Get handoff queue
  if (await testEndpoint(
    'Get handoff queue',
    'GET',
    '/admin/api/handoffs'
  )) passed++; else failed++;
  
  // ============================================
  // CONVERSATION TESTS
  // ============================================
  log('\n' + '='.repeat(60), 'yellow');
  log('💬 CONVERSATION TESTS', 'yellow');
  log('='.repeat(60), 'yellow');
  
  // Test 11: Get recent conversations
  if (await testEndpoint(
    'Get recent conversations',
    'GET',
    '/admin/api/conversations?limit=10'
  )) passed++; else failed++;
  
  // ============================================
  // STATISTICS TESTS
  // ============================================
  log('\n' + '='.repeat(60), 'yellow');
  log('📊 STATISTICS TESTS', 'yellow');
  log('='.repeat(60), 'yellow');
  
  // Test 12: Get dashboard statistics
  if (await testEndpoint(
    'Get dashboard statistics',
    'GET',
    '/admin/api/stats'
  )) passed++; else failed++;
  
  // ============================================
  // FINAL RESULTS
  // ============================================
  log('\n' + '='.repeat(60), 'yellow');
  log('📋 TEST RESULTS SUMMARY', 'yellow');
  log('='.repeat(60), 'yellow');
  
  const total = passed + failed;
  const percentage = ((passed / total) * 100).toFixed(1);
  
  log(`\nTotal Tests: ${total}`, 'blue');
  log(`✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`📈 Success Rate: ${percentage}%`, percentage === '100.0' ? 'green' : 'yellow');
  
  if (failed === 0) {
    log('\n🎉 ALL TESTS PASSED! API is working correctly!', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please check the errors above.', 'red');
  }
  
  log('\n' + '='.repeat(60), 'yellow');
}

// Run the tests
runTests().catch(error => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});
