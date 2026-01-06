// Test WhatsApp notification API directly
require('dotenv').config();
const fetch = require('node-fetch');

async function testWhatsAppNotification() {
  const testNumber = '918755052568'; // Owner's number
  const url = `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`;
  
  console.log('🧪 Testing WhatsApp Notification API...\n');
  console.log('Configuration:');
  console.log(`  Phone Number ID: ${process.env.PHONE_NUMBER_ID}`);
  console.log(`  Token: ${process.env.WHATSAPP_TOKEN ? '✅ Set' : '❌ Missing'}`);
  console.log(`  Test recipient: ${testNumber}\n`);
  
  // Test 1: Simple text message
  console.log('Test 1: Sending simple text message...');
  const textData = {
    messaging_product: 'whatsapp',
    to: testNumber,
    type: 'text',
    text: {
      body: '🧪 TEST: This is a test notification from IronCore Fitness bot. If you receive this, notifications are working!'
    }
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(textData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Text message sent successfully!');
      console.log('Response:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Text message failed');
      console.log('Error:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 2: Interactive message with button
  console.log('Test 2: Sending interactive message with button...');
  const interactiveData = {
    messaging_product: 'whatsapp',
    to: testNumber,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: {
        text: '🧪 TEST: Interactive button test. Click the button below if you see this.'
      },
      action: {
        buttons: [
          {
            type: 'reply',
            reply: {
              id: 'test_button',
              title: '✅ Test Button'
            }
          }
        ]
      }
    }
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(interactiveData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Interactive message sent successfully!');
      console.log('Response:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Interactive message failed');
      console.log('Error:', JSON.stringify(result, null, 2));
      
      if (result.error?.code === 131026) {
        console.log('\n💡 Interactive messages not supported. This usually means:');
        console.log('   - Business Account not fully approved');
        console.log('   - Need to use Message Templates instead');
        console.log('   - Plain text messages will work as fallback');
      }
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
  
  console.log('\n📋 Summary:');
  console.log('If you received the test message on WhatsApp, notifications are working!');
  console.log('Check your WhatsApp (918755052568) now.');
}

testWhatsAppNotification();
