// Test welcome menu parsing
const menu = require('./services/welcome-menu');

console.log('=== TESTING WELCOME MENU ===\n');

console.log('1. TIMINGS:');
console.log(menu.getMenuResponse('menu_timings'));
console.log('\n---\n');

console.log('2. MEMBERSHIP:');
console.log(menu.getMenuResponse('menu_membership'));
console.log('\n---\n');

console.log('3. LOCATION:');
console.log(menu.getMenuResponse('menu_location'));
console.log('\n---\n');

console.log('4. FACILITIES:');
console.log(menu.getMenuResponse('menu_facilities'));

console.log('\n=== TEST COMPLETE ===');
