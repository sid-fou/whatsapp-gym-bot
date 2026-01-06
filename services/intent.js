// Intent detection using keyword matching
const INTENT_PATTERNS = {
  timings: ['timing', 'time', 'open', 'close', 'hours', 'schedule', 'when', 'holiday'],
  pricing: ['price', 'cost', 'fee', 'membership', 'plan', 'rate', 'charge', 'how much', 'monthly', 'yearly', 'quarterly', 'package', 'what does it cover', 'what is included'],
  trial: ['trial', 'demo', 'test', 'try', 'first day', 'visit', 'check out'],
  training: ['trainer', 'personal training', 'pt', 'coach', 'one on one', '1-on-1', 'personalized', 'is pt included', 'does membership include training'],
  booking: ['book', 'appointment', 'reserve', 'schedule', 'join', 'sign up', 'enroll'],
  location: ['location', 'address', 'where', 'directions', 'reach', 'how to get', 'landmark', 'parking', 'contact', 'phone', 'email'],
  rules: ['rule', 'dress', 'attire', 'towel', 'shoes', 'policy', 'bring', 'age limit', 'requirements', 'what to bring'],
  greeting: ['hi', 'hello', 'hey', 'good morning', 'good evening', 'namaste', 'yo'],
  services: ['services', 'classes', 'group class', 'yoga', 'zumba', 'steam', 'sauna', 'diet', 'nutrition', 'facilities', 'equipment', 'amenities']
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
