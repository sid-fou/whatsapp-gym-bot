const fs = require('fs');
const path = require('path');
const faqService = require('./faq');
const bookingService = require('./booking');
const contextService = require('./context');

// Load gym knowledge base
const gymKnowledge = fs.readFileSync(
  path.join(__dirname, '../data/gym_knowledge.txt'),
  'utf-8'
);

// Enhanced system prompt with context awareness
const SYSTEM_PROMPT = `You are IronCore Fitness's WhatsApp assistant.

CRITICAL RULES (NON-NEGOTIABLE):
1. Use ONLY the provided gym information below
2. If asked about medical conditions, injuries, health issues, or anything requiring human judgment, respond with EXACTLY: "HANDOFF_REQUIRED"
3. If user wants to speak with a human, staff, owner, manager, person, agent, representative, or anyone at the gym, respond with EXACTLY: "HANDOFF_REQUIRED"
4. If user says things like "talk to someone", "speak with", "contact", "reach", "get me", "connect me", respond with EXACTLY: "HANDOFF_REQUIRED"
5. Do NOT provide workout, diet, or medical advice under any circumstances
6. Keep all replies under 4 sentences
7. Be helpful and friendly
8. IMPORTANT: If continuing an existing conversation, acknowledge the context naturally WITHOUT repeating full greetings

BOOKING AND SCHEDULING RULES:
- You CANNOT book, schedule, or reserve trials, sessions, appointments, or classes
- If user wants to book anything, respond with EXACTLY: "HANDOFF_REQUIRED"
- Examples that require handoff:
  * "I want to book a trial" → HANDOFF_REQUIRED
  * "Can I schedule a session?" → HANDOFF_REQUIRED
  * "Book me for tomorrow" → HANDOFF_REQUIRED
  * "Reserve a trial" → HANDOFF_REQUIRED
- Do NOT pretend to book, confirm bookings, or accept appointment details
- You can provide general information about trials, but cannot book them

GREETING BEHAVIOR:
- First message from user: Give full welcome ("Welcome to IronCore Fitness! How can I help you?")
- Subsequent greetings in same conversation: Keep it short ("Yes, how can I assist you?" or "What else can I help with?")
- NEVER say "Welcome to IronCore Fitness" more than once per conversation

When you see ANY request for human contact OR booking request (even if phrased differently), you MUST respond with only: "HANDOFF_REQUIRED"

Examples that REQUIRE handoff:
- "Can I talk to your staff?" → HANDOFF_REQUIRED
- "I want to speak with the owner" → HANDOFF_REQUIRED
- "Let me talk to someone" → HANDOFF_REQUIRED
- "Connect me to a person" → HANDOFF_REQUIRED
- "Is there anyone I can speak to?" → HANDOFF_REQUIRED
- "I want to book a trial" → HANDOFF_REQUIRED
- "Schedule me for tomorrow" → HANDOFF_REQUIRED

Gym Information:
${gymKnowledge}`;

async function generateResponse(userMessage, intent, userId) {
  try {
    // Handle FAQ queries with pre-defined responses first (fastest)
    if (intent.type === 'faq') {
      const faqResponse = faqService.getFAQResponse(intent.category);
      if (faqResponse) {
        // Add to context
        await contextService.addMessage(userId, 'user', userMessage);
        await contextService.addMessage(userId, 'assistant', faqResponse);
        return faqResponse;
      }
    }

    // Handle booking intent
    if (intent.type === 'booking') {
      const response = bookingService.handleBooking(userMessage);
      await contextService.addMessage(userId, 'user', userMessage);
      await contextService.addMessage(userId, 'assistant', response);
      return response;
    }

    // Check if user has been greeted before
    const alreadyGreeted = await contextService.hasBeenGreeted(userId);
    
    // Get conversation context for AI
    const conversationHistory = await contextService.getContextForAI(userId);
    
    // Build messages for AI
    const messages = [
      {
        role: 'system',
        content: SYSTEM_PROMPT + (alreadyGreeted ? '\n\nNOTE: User has been greeted already in this conversation. Keep responses concise without repeating welcome messages.' : '')
      }
    ];

    // Add conversation history if exists
    if (conversationHistory && conversationHistory.length > 0) {
      messages.push(...conversationHistory);
    }

    // Add current message
    messages.push({
      role: 'user',
      content: userMessage
    });

    // Call AI with full context
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
        'X-Title': 'IronCore Gym Bot'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const aiResponse = data.choices[0].message.content.trim();
      
      // Check if AI detected handoff need
      if (aiResponse === 'HANDOFF_REQUIRED') {
        return null; // Signal to webhook that handoff is needed
      }
      
      // Store conversation in context
      await contextService.addMessage(userId, 'user', userMessage);
      await contextService.addMessage(userId, 'assistant', aiResponse);
      
      // Mark as greeted if this was a greeting
      if (intent.type === 'greeting' && !alreadyGreeted) {
        await contextService.markAsGreeted(userId);
      }
      
      return aiResponse;
    }

    return "I apologize, but I couldn't process your request. A staff member will assist you shortly.";
    
  } catch (error) {
    console.error('AI Service Error:', error);
    return "I'm experiencing technical difficulties. Please contact our staff directly at +91 8755052568.";
  }
}

module.exports = {
  generateResponse
};
