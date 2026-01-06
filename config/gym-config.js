// Central configuration for gym information
// This ensures consistency across all services

const GYM_CONFIG = {
  name: 'IronCore Fitness',
  
  contact: {
    phone: '+91 8755052568',
    email: 'siddharth.singh.25091998@gmail.com',
    address: '123 Fitness Street, Sector 15, Gurugram, Haryana 122001',
    landmark: 'Near City Mall, opposite Metro Station'
  },
  
  timings: {
    weekdays: 'Mon–Sat: 6 AM – 10 PM',
    sunday: 'Sunday: 8 AM – 2 PM',
    holidays: 'Closed on national holidays (announced in advance)'
  },
  
  pricing: {
    monthly: 2000,
    quarterly: 5500,
    yearly: 20000,
    personalTraining: 6000,
    groupClasses: 3000,
    dietConsultation: 4000
  }
};

// Get formatted contact info
function getContactInfo() {
  return `📞 Call: ${GYM_CONFIG.contact.phone}\n📧 Email: ${GYM_CONFIG.contact.email}`;
}

// Get full address
function getFullAddress() {
  return `📍 ${GYM_CONFIG.name}\nAddress: ${GYM_CONFIG.contact.address}\nLandmark: ${GYM_CONFIG.contact.landmark}\n${getContactInfo()}`;
}

module.exports = {
  GYM_CONFIG,
  getContactInfo,
  getFullAddress
};
