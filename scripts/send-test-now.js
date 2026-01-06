// Send an easily identifiable test message
require('dotenv').config();
const fetch = require('node-fetch');

async function sendIdentifiableTest() {
  const url = `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`;
  
  const data = {
    messaging_product: 'whatsapp',
    to: '918755052568',
    type: 'text',
    text: {
      body: '🔴🔴🔴 SIDDHARTH - THIS IS YOUR BOT 🔴🔴🔴\n\nIf you see this message, your WhatsApp notifications are working!\n\nThis message was sent at: ' + new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    }
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  const result = await response.json();
  console.log('Response:', JSON.stringify(result, null, 2));
  
  if (response.ok) {
    console.log('\n✅ Message sent! Check WhatsApp NOW!');
    console.log('Look for a message with: "SIDDHARTH - THIS IS YOUR BOT"');
  } else {
    console.log('\n❌ Failed to send');
  }
}

sendIdentifiableTest();
