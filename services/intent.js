// AI-powered intent detection with fallback to keyword matching

/**
 * Detect intent using AI (more accurate than keyword matching)
 * @param {string} message - User's message
 * @returns {Promise<Object>} Intent object { type, category }
 */
async function detectIntentWithAI(message) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
        'X-Title': 'IronCore Intent Detector'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct',
        messages: [
          {
            role: 'system',
            content: `You are an intent classifier for a gym chatbot. Classify the user's message into ONE of these categories:

            CATEGORIES:
            - greeting: Simple greetings like "hi", "hello", "hey", "good morning" (ONLY if the ENTIRE message is just a greeting with no other intent)
            - timings: Questions about gym hours, opening times, schedule
            - pricing: Questions about membership costs, plans, fees, pricing
            - trial: Questions about trial sessions, demos, testing the gym
            - training: Questions about personal training, trainers, PT
            - booking: Wants to book, reserve, schedule, or sign up for something
            - location: Questions about address, location, directions, contact info
            - rules: Questions about gym rules, policies, dress code, requirements
            - services: Questions about facilities, equipment, classes, amenities
            - general: Anything else

            CRITICAL RULES:
            1. If message contains ANY question or request AFTER a greeting, classify by the main intent, NOT as greeting
            2. "Hi, what are your prices?" → pricing (NOT greeting)
            3. "Hello, I need membership" → pricing (NOT greeting)
            4. "Hey, where are you located?" → location (NOT greeting)
            5. ONLY classify as "greeting" if the ENTIRE message is JUST a greeting with nothing else

            Respond with ONLY the category name, nothing else.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 10,
        temperature: 0.1
      })
    });

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const category = data.choices[0].message.content.trim().toLowerCase();
      
      // Map to type
      let type = 'general';
      if (category === 'greeting') {
        type = 'greeting';
      } else if (category === 'booking' || category === 'trial') {
        type = 'booking';
      } else if (['timings', 'pricing', 'training', 'location', 'rules', 'services'].includes(category)) {
        type = 'faq';
      }
      
      return { type, category };
    }
    
    // Fallback if AI fails
    return detectIntentKeyword(message);
    
  } catch (error) {
    console.error('❌ AI intent detection failed:', error.message);
    // Fallback to keyword matching
    return detectIntentKeyword(message);
  }
}

/**
 * Keyword-based intent detection (fallback)
 * @param {string} message - User's message
 * @returns {Object} Intent object { type, category }
 */
function detectIntentKeyword(message) {
  const lowerMessage = message.toLowerCase().trim();
  
  // CRITICAL: Only match greeting if it's JUST a greeting word, nothing else
  const greetingWords = ['hi', 'hello', 'hey', 'good morning', 'good evening', 'namaste', 'yo', 'sup', 'howdy'];
  const isJustGreeting = greetingWords.some(greeting => {
    // Check if message is exactly the greeting, or greeting with punctuation only
    const pattern = new RegExp(`^${greeting}[\\s!.,?]*$`, 'i');
    return pattern.test(lowerMessage);
  });
  
  if (isJustGreeting) {
    return { type: 'greeting', category: 'greeting' };
  }

  // Keyword patterns for other intents
  const patterns = {
    timings: ['timing', 'time', 'open', 'close', 'hours', 'schedule', 'when open', 'holiday'],
    pricing: ['price', 'cost', 'fee', 'membership', 'plan', 'rate', 'charge', 'how much', 'monthly', 'yearly', 'quarterly', 'package'],
    trial: ['trial', 'demo', 'test', 'try', 'first day', 'visit', 'check out'],
    training: ['trainer', 'personal training', 'pt', 'coach', 'one on one'],
    booking: ['book', 'appointment', 'reserve', 'schedule', 'join', 'sign up', 'enroll'],
    location: ['location', 'address', 'where', 'directions', 'reach', 'landmark', 'contact', 'phone', 'email'],
    rules: ['rule', 'dress', 'attire', 'policy', 'requirements'],
    services: ['services', 'classes', 'yoga', 'zumba', 'steam', 'sauna', 'diet', 'facilities', 'equipment', 'amenities']
  };

  // Check patterns (excluding greeting)
  for (const [category, keywords] of Object.entries(patterns)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      if (category === 'booking' || category === 'trial') {
        return { type: 'booking', category };
      }
      return { type: 'faq', category };
    }
  }

  return { type: 'general', category: null };
}

/**
 * Main intent detection function
 * Uses AI by default with keyword fallback
 */
async function detectIntent(message) {
  return await detectIntentWithAI(message);
}

module.exports = {
  detectIntent,
  detectIntentKeyword // Export for testing
};
