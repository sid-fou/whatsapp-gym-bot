// Pre-defined FAQ responses for common queries
const FAQ_RESPONSES = {
  greeting: "Hello! Welcome to IronCore Fitness. How can I help you today?",
  
  timings: "We're open Mon–Sat: 6 AM – 10 PM, and Sunday: 8 AM – 2 PM.",
  
  pricing: `Our membership plans are:
• Monthly: ₹2,000
• Quarterly: ₹5,500
• Yearly: ₹20,000

Personal Training is available at ₹6,000 per month.`,
  
  trial: "We offer a free 1-day trial! Advance booking is required. Would you like to schedule one?",
  
  training: "Personal Training is available at ₹6,000 per month. Our certified trainers will create customized workout plans for you.",
  
  location: "I'll forward your query to our staff who can share our exact location and directions.",
  
  rules: `Please note our gym policies:
• Gym attire is mandatory
• Towels are required
• No outside shoes allowed`
};

function getFAQResponse(category) {
  return FAQ_RESPONSES[category] || null;
}

module.exports = {
  getFAQResponse
};
