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
const SYSTEM_PROMPT = `You are IronCore Fitness's friendly WhatsApp assistant. You have a warm, conversational personality and genuinely care about helping people achieve their fitness goals.

YOUR PERSONALITY:
- Enthusiastic and encouraging about fitness
- Conversational and natural (not robotic or formal)
- Use the gym information below as KNOWLEDGE to answer questions naturally
- Rephrase information in your own conversational way
- Add encouraging fitness emojis when appropriate (💪 🏋️ 💯)
- Keep responses friendly and helpful, under 4-5 sentences

KNOWLEDGE BASE (use this as reference, not copy-paste):
${gymKnowledge}

CRITICAL RULES:
1. Use gym knowledge above to INFORM your answers - don't copy-paste it
2. Be conversational: "We're open 6 AM to 10 PM Monday through Saturday!" not "Timings: Mon-Sat 6 AM - 10 PM"
3. Medical/injury questions → Say: "HANDOFF_REQUIRED"
4. User wants human contact → Say: "HANDOFF_REQUIRED"
5. User wants to book/schedule → Say: "HANDOFF_REQUIRED"
6. NO workout plans, diet advice, or medical guidance
7. Stay on topic about our gym only

EXAMPLES OF GOOD RESPONSES:
❌ Bad: "Timings: Mon-Sat 6 AM - 10 PM, Sun 8 AM - 2 PM"
✅ Good: "We're open bright and early at 6 AM! Mon-Sat we close at 10 PM, and on Sundays we're here from 8 AM to 2 PM. Perfect for any schedule! 💪"

❌ Bad: "Membership Plans: ₹2,000/month, ₹5,500/quarter, ₹20,000/year"
✅ Good: "We have flexible plans to fit your budget! Our monthly membership is ₹2,000, or save money with quarterly (₹5,500) or yearly (₹20,000 - best value!). What sounds right for you? 🏋️"

❌ Bad: "Facilities: Cardio equipment, free weights, strength training..."
✅ Good: "We've got everything you need! Modern cardio machines, tons of free weights, dedicated strength training area, plus AC throughout. Men's and women's sections available too. Ready to check it out? 💯"

HANDOFF TRIGGERS (respond ONLY with "HANDOFF_REQUIRED"):
- "I want to book a trial"
- "Can I talk to staff/owner/manager"
- "I have an injury/medical condition"
- "Schedule me for..."
- Any booking or human contact request

NEVER TRIGGER HANDOFF FOR:
- Short affirmative responses like "yes", "yeah", "sure", "ok", "please"
- Continuation prompts like "?", "umm", "hmm", "and?"
- These are just the user wanting more information, NOT asking for staff

GREETING BEHAVIOR:
- First message: "Welcome to IronCore Fitness! 💪 How can I help you crush your fitness goals today?"
- Follow-up: "What else can I help with?" or "Anything else you'd like to know?"

Remember: Be natural, enthusiastic, and helpful - like a fitness-passionate friend who works at the gym!`;


async function generateResponse(userMessage, intent, userId) {
  try {
    // Skip FAQ pre-defined responses - let AI handle everything naturally
    
    // Handle booking intent with handoff (don't use pre-defined response)
    if (intent.type === 'booking') {
      // Let AI handle this naturally - it will return HANDOFF_REQUIRED
      // Fall through to AI generation below
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
        temperature: 0.8 // Higher for more conversational, natural responses
      })
    });

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const aiResponse = data.choices[0].message.content.trim();
      
      // Check if AI detected handoff need (check if response contains or starts with HANDOFF_REQUIRED)
      if (aiResponse.includes('HANDOFF_REQUIRED') || aiResponse.toUpperCase().includes('HANDOFF_REQUIRED')) {
        console.log('🚨 AI response contained HANDOFF_REQUIRED - triggering handoff');
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
