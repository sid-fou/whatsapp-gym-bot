// Booking service for trial sessions and appointments

function handleBooking(message) {
  const lowerMessage = message.toLowerCase();
  
  // Check if user is asking about trial
  if (lowerMessage.includes('trial') || lowerMessage.includes('demo')) {
    return "Great! I'd love to help you book a free trial session. Please share your preferred date and our staff will confirm availability. What date works for you?";
  }
  
  // Check if user wants to join/book membership
  if (lowerMessage.includes('join') || lowerMessage.includes('membership')) {
    return "Excellent! To help you get started, our staff will reach out to complete your membership registration. Which plan interests you: Monthly (₹2,000), Quarterly (₹5,500), or Yearly (₹20,000)?";
  }
  
  // General booking inquiry
  return "I'll connect you with our staff to schedule your visit. Could you share your preferred date and time?";
}

module.exports = {
  handleBooking
};
