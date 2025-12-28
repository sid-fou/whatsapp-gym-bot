const fs = require('fs');
const path = require('path');
const faqService = require('./faq');
const bookingService = require('./booking');

// Load gym knowledge base
const gymKnowledge = fs.readFileSync(
  path.join(__dirname, '../data/gym_knowledge.txt'),
  'utf-8'
);

// System prompt with strict guardrails
const SYSTEM_PROMPT = `You are IronCore Fitness's WhatsApp assistant.
Use only the provided gym information.
If the answer is not present, politely say you will forward the query to staff.
Do not give fitness, medical, or diet advice.
Keep replies under 4 sentences.

Gym Information:
${gymKnowledge}`;

async function generateResponse(userMessage, intent) {
  try {
    // Handle FAQ queries with pre-defined responses
    if (intent.type === 'faq') {
      const faqResponse = faqService.getFAQResponse(intent.category);
      if (faqResponse) return faqResponse;
    }

    // Handle booking intent
    if (intent.type === 'booking') {
      return bookingService.handleBooking(userMessage);
    }

    // Use OpenRouter for complex queries
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000', // Optional
        'X-Title': 'IronCore Gym Bot' // Optional
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet', // You can also use other models
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        max_tokens: 1000
      })
    });

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    }

    return "I apologize, but I couldn't process your request. A staff member will assist you shortly.";
  } catch (error) {
    console.error('AI Service Error:', error);
    return "I'm experiencing technical difficulties. Please contact our staff directly.";
  }
}

module.exports = {
  generateResponse
};
