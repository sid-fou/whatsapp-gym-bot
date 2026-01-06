// Pre-defined FAQ responses for common queries
const { getFullAddress, getContactInfo } = require('../config/gym-config');

const FAQ_RESPONSES = {
  greeting: "Hello! Welcome to IronCore Fitness. How can I help you today?",
  
  timings: "We're open Mon–Sat: 6 AM – 10 PM, and Sunday: 8 AM – 2 PM. We're closed on national holidays (announced in advance).",
  
  pricing: `Our membership plans are:
• Monthly: ₹2,000 (unlimited gym access)
• Quarterly: ₹5,500 (save ₹500)
• Yearly: ₹20,000 (save ₹4,000 + 1 month free PT)

Note: Membership covers basic gym access only. Personal training and group classes are additional.`,
  
  trial: "We offer a free 1-day trial! Advance booking is required. The trial includes a gym tour, equipment demo, and full facility access. Would you like to book one?",
  
  training: `Personal Training: ₹6,000/month (12 sessions)

Important: This is SEPARATE from gym membership. You need both:
• Gym membership: ₹2,000/month
• Personal training: ₹6,000/month
• Total: ₹8,000/month

Our certified trainers (5+ years experience) provide customized workout plans and one-on-one training.`,
  
  location: getFullAddress(), // Use centralized config
  
  rules: `Please note our gym policies:
✓ Gym attire mandatory (sports shoes, workout clothes)
✓ Towels required (bring your own or rent ₹50/session)
✓ No outside shoes in workout area
✓ Age limit: 16+ years
✓ Valid ID proof required for membership`,

  services: `Additional Services Available:
• Group Classes: ₹3,000/month (Yoga, Zumba, CrossFit, HIIT)
• Diet Consultation: ₹4,000/month (personalized meal plans)
• Steam & Sauna: ₹1,500/month
• Physiotherapy: ₹500 per session

${getContactInfo()}`
};

function getFAQResponse(category) {
  return FAQ_RESPONSES[category] || null;
}

module.exports = {
  getFAQResponse
};
