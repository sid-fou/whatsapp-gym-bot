// Verify Meta WhatsApp API setup
require('dotenv').config();
const fetch = require('node-fetch');

async function verifySetup() {
  console.log('🔍 Verifying WhatsApp API Setup...\n');
  
  console.log('1. Environment Variables:');
  console.log(`   PHONE_NUMBER_ID: ${process.env.PHONE_NUMBER_ID || '❌ MISSING'}`);
  console.log(`   WHATSAPP_TOKEN: ${process.env.WHATSAPP_TOKEN ? '✅ Set (' + process.env.WHATSAPP_TOKEN.length + ' chars)' : '❌ MISSING'}`);
  console.log(`   Test number: 15551409979\n`);
  
  // Test API with the TEST number (not your personal number)
  const url = `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`;
  
  console.log('2. Testing with official test number (15551409979)...');
  const testData = {
    messaging_product: 'whatsapp',
    to: '15551409979', // Official test number
    type: 'text',
    text: {
      body: 'Test message from IronCore Fitness Bot'
    }
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Test number works!');
      console.log('Response:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Test number failed');
      console.log('Error:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
  
  console.log('\n3. Testing with your number (918755052568)...');
  const yourData = {
    messaging_product: 'whatsapp',
    to: '918755052568',
    type: 'text',
    text: {
      body: 'Test message to Siddharth'
    }
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(yourData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Your number works!');
      console.log('Response:', JSON.stringify(result, null, 2));
      console.log('\n💡 Check your WhatsApp at 918755052568 NOW!');
    } else {
      console.log('❌ Your number failed');
      console.log('Error:', JSON.stringify(result, null, 2));
      
      if (result.error?.code === 131030) {
        console.log('\n⚠️  Your number (918755052568) is NOT in the allowed recipient list!');
        console.log('Add it here: https://developers.facebook.com → Your App → WhatsApp → Phone Numbers → Add recipient');
      } else if (result.error?.code === 200) {
        console.log('\n⚠️  API access issue detected. Possible causes:');
        console.log('   - Token expired or invalid');
        console.log('   - Phone Number ID doesn\'t match this token');
        console.log('   - App doesn\'t have permission for this phone number');
        console.log('\n🔧 Try: Regenerate the access token in Meta Developer Console');
      }
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
  
  console.log('\n4. Token Info:');
  console.log(`   Type: ${process.env.WHATSAPP_TOKEN.startsWith('EAAP') ? 'Temporary (24h)' : 'Permanent System User Token'}`);
  if (process.env.WHATSAPP_TOKEN.startsWith('EAAP')) {
    console.log('   ⚠️  WARNING: This token expires! Use System User Token for production.');
  }
}

verifySetup();
