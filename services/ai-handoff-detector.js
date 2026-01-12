// AI-powered handoff detection using OpenRouter
const fetch = require('node-fetch');

const HANDOFF_DETECTION_PROMPT = `You are a handoff detection system for IronCore Fitness gym's WhatsApp chatbot.

GYM STAFF:
- Owner: Siddharth Singh
- Staff members may include trainers and front desk personnel

Analyze the user's message and determine if they want to speak with a human staff member OR want to book/schedule something.

USER WANTS HUMAN CONTACT if they:
- Explicitly ask to speak with staff, owner, manager, human, person, representative, agent, trainer
- Want to talk to someone at the gym (Siddharth, staff member, trainer, etc.)
- Ask for human help or human assistance  
- Use phrases like "I want to talk to...", "Can I speak with...", "Connect me to..."
- Want to reach gym staff/owner/management/trainer

USER WANTS TO BOOK/SCHEDULE if they:
- Want to book a trial, session, appointment, or class
- Use words like "book", "schedule", "reserve", "appointment"
- Want to confirm a specific date/time for visiting
- Ask "can I book...", "schedule me for...", "reserve a..."
- Mention booking-related phrases

DO NOT TRIGGER HANDOFF if:
- Asking about random people not related to gym (friends, family, other businesses)
- Mentioning names in a different context (e.g., "My friend Rahul told me about your gym")
- Just asking general questions about the gym (hours, prices, facilities)

RESPOND WITH:
- "YES" if user clearly wants to talk to gym staff/owner/trainer/human OR wants to book/schedule something
- "NO" if talking about unrelated people or just asking general questions

Examples:
"Can I talk to staff?" → YES
"I want to speak with Siddharth" → YES (owner's name)
"Connect me to the trainer" → YES
"Talk to your manager" → YES
"Let me speak to a person" → YES
"I want to book a trial" → YES (booking request)
"Can I schedule a session tomorrow?" → YES (scheduling request)
"Book me for noon tomorrow" → YES (booking request)
"What are your gym hours?" → NO (general question)
"My friend Sunil recommended this gym" → NO (not asking to contact gym staff)
"Can I talk to Sunil?" → NO (Sunil is not gym staff)
"Rahul said you have good equipment" → NO (just mentioning someone)

USER MESSAGE: "{message}"

RESPONSE (YES or NO only):`;

/**
 * Use AI to detect if user wants human contact
 * @param {string} message - User's message
 * @returns {Promise<boolean>} True if handoff should be triggered
 */
async function detectHandoffIntent(message) {
  // CRITICAL: Skip AI detection for short affirmative/continuation messages
  // These are conversational responses, NOT handoff requests
  const skipPatterns = [
    /^(yes|yeah|yep|yup|sure|ok|okay|alright|right|correct|please|ya|yea|definitely|absolutely|of course|no|nope|nah|hmm?|huh|umm?|\?+|\.+|!+)[\s!.,?]*$/i
  ];
  
  const lowerMessage = message.toLowerCase().trim();
  
  for (const pattern of skipPatterns) {
    if (pattern.test(lowerMessage)) {
      console.log(`⚡ Skipping AI handoff detection for short message: "${message}"`);
      return false;
    }
  }
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/your-repo',
        'X-Title': 'IronCore Fitness Bot'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct', // Cheap and fast model
        messages: [
          {
            role: 'user',
            content: HANDOFF_DETECTION_PROMPT.replace('{message}', message)
          }
        ],
        max_tokens: 10,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      console.error('❌ AI handoff detection failed:', response.statusText);
      return false; // Fail gracefully - don't block user
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content.trim().toUpperCase();
    
    const shouldHandoff = aiResponse.includes('YES');
    
    if (shouldHandoff) {
      console.log(`🤖 AI detected handoff intent: "${message}"`);
    }
    
    return shouldHandoff;

  } catch (error) {
    console.error('❌ AI handoff detection error:', error.message);
    return false; // Fail gracefully
  }
}

module.exports = {
  detectHandoffIntent
};
