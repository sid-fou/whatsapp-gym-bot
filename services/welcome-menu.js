// Welcome menu service - Interactive buttons for first-time customers

/**
 * Create welcome menu with quick options
 * @returns {Object} WhatsApp interactive list message
 */
function createWelcomeMenu() {
  return {
    type: 'interactive',
    interactive: {
      type: 'list',
      header: {
        type: 'text',
        text: 'Welcome to IronCore Fitness! 💪'
      },
      body: {
        text: 'Hello! How can I help you today? Choose an option below:'
      },
      action: {
        button: 'Quick Options',
        sections: [
          {
            title: 'Information',
            rows: [
              {
                id: 'menu_timings',
                title: '🕐 Gym Timings',
                description: 'Check our opening hours'
              },
              {
                id: 'menu_membership',
                title: '💳 Membership Plans',
                description: 'View pricing & packages'
              },
              {
                id: 'menu_facilities',
                title: '🏋️ Facilities',
                description: 'What we offer at our gym'
              },
              {
                id: 'menu_location',
                title: '📍 Location & Contact',
                description: 'How to reach us'
              }
            ]
          },
          {
            title: 'Get Started',
            rows: [
              {
                id: 'menu_trial',
                title: '🎯 Book Trial Session',
                description: 'Schedule your free trial'
              },
              {
                id: 'menu_staff',
                title: '👤 Talk to Staff',
                description: 'Speak with our team'
              }
            ]
          }
        ]
      }
    }
  };
}

/**
 * Parse menu selection from interactive message
 * @param {Object} interactive - WhatsApp interactive object
 * @returns {Object|null} Menu selection data
 */
function parseMenuSelection(interactive) {
  if (interactive.type === 'list_reply') {
    const listReply = interactive.list_reply;
    return {
      id: listReply.id,
      title: listReply.title
    };
  }
  return null;
}

/**
 * Get response for menu selection
 * @param {string} menuId - Menu item ID
 * @returns {string} Response text
 */
function getMenuResponse(menuId) {
  const responses = {
    'menu_timings': `📅 *Gym Timings:*

*Monday - Saturday*
6:00 AM - 10:00 PM

*Sunday*
8:00 AM - 2:00 PM

*Closed on:* National holidays (announced in advance)

We're open throughout the day! Feel free to visit anytime during these hours. 🏋️‍♂️`,

    'menu_membership': `💳 *Membership Plans:*

*Monthly Plan*
₹2,000/month
- Unlimited gym access
- Basic equipment usage
- Locker facility
- Does NOT include: Personal training, group classes, diet consultation

*Quarterly Plan*
₹5,500 (Save ₹500!)
- All monthly benefits for 3 months
- Does NOT include: Personal training, group classes

*Annual Plan*
₹20,000 (Save ₹4,000!)
- All monthly benefits for 12 months
- BONUS: 1 month free personal training
- Best value!

*Personal Training* (Separate Service)
₹6,000/month (12 sessions)
- Requires monthly membership
- Total: ₹2,000 (membership) + ₹6,000 (PT) = ₹8,000/month

*Additional Services:*
- Group Classes: ₹3,000/month (Yoga, Zumba, CrossFit, HIIT)
- Diet Consultation: ₹4,000/month
- Steam & Sauna: ₹1,500/month

Ready to join? Ask me anything else or say "book trial" to get started! 💪`,

    'menu_facilities': `🏋️ *Our Facilities:*

*Cardio Zone*
- Treadmills, ellipticals, bikes
- Modern, state-of-the-art equipment

*Strength Training*
- Free weights & dumbbells
- Full range of strength equipment
- Separate areas for men and women

*Amenities*
- Air-conditioned workout areas
- Clean washrooms & changing rooms
- Drinking water
- Protein shake bar
- Ample parking space

*Additional Features*
- Steam & Sauna available
- Certified trainers on-site
- Group classes (Yoga, Zumba, CrossFit, HIIT)
- Physiotherapy sessions available

What else would you like to know? 💪`,

    'menu_location': `📍 *Location & Contact:*

*Address:*
IronCore Fitness
123 Fitness Street, Sector 15
Gurugram, Haryana 122001

*Landmark:*
Near City Mall, opposite Metro Station

*Contact:*
📱 Phone: +91 8755052568
📧 Email: siddharth.singh.25091998@gmail.com

*Owner:*
Siddharth Singh

*How to Reach:*
Easily accessible by metro and public transport. Ample parking available on-site.

Need directions? Feel free to call us! 🚗`,

    'menu_trial': `🎯 *Free Trial Session*

Great! We offer a FREE 1-day trial so you can experience our gym firsthand.

*Trial Includes:*
- Complete gym tour
- Equipment demonstration
- Full facility access for the day
- Trainer guidance

*How to Book:*
Advance booking is required. Let me connect you with our staff who can schedule your trial at a convenient time.

One moment... 📞`,

    'menu_staff': `👤 *Connecting You to Staff*

No problem! I'm connecting you with our team who can personally assist you with any questions or help you get started.

Owner: Siddharth Singh
Phone: +91 8755052568

One moment please... 📞`
  };

  return responses[menuId] || null;
}

/**
 * Check if menu selection triggers handoff
 * @param {string} menuId - Menu item ID
 * @returns {boolean} True if handoff should trigger
 */
function shouldTriggerHandoffForMenu(menuId) {
  const handoffTriggers = ['menu_trial', 'menu_staff'];
  return handoffTriggers.includes(menuId);
}

module.exports = {
  createWelcomeMenu,
  parseMenuSelection,
  getMenuResponse,
  shouldTriggerHandoffForMenu
};
