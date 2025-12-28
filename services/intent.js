// Intent detection using keyword matching
const INTENT_PATTERNS = {
  timings: ['timing', 'time', 'open', 'close', 'hours', 'schedule', 'when'],
  pricing: ['price', 'cost', 'fee', 'membership', 'plan', 'rate', 'charge', 'how much', 'monthly', 'yearly'],
  trial: ['trial', 'demo', 'test', 'try', 'first day', 'visit'],
  training: ['trainer', 'personal training', 'pt', 'coach'],
  booking: ['book', 'appointment', 'reserve', 'schedule', 'join'],
  location: ['location', 'address', 'where', 'directions', 'reach'],
  rules: ['rule', 'dress', 'attire', 'towel', 'shoes', 'policy', 'bring'],
  greeting: ['hi', 'hello', 'hey', 'good morning', 'good evening']
};

function detectIntent(message) {
  const lowerMessage = message.toLowerCase();
  
  // Check for greetings
  if (INTENT_PATTERNS.greeting.some(keyword => lowerMessage.includes(keyword))) {
    return { type: 'greeting', category: 'greeting' };
  }

  // Check for FAQ categories
  for (const [category, keywords] of Object.entries(INTENT_PATTERNS)) {
    if (category === 'greeting') continue;
    
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      // Check if it's a booking intent
      if (category === 'booking' || category === 'trial') {
        return { type: 'booking', category };
      }
      return { type: 'faq', category };
    }
  }

  // Default to general query
  return { type: 'general', category: null };
}

module.exports = {
  detectIntent
};
