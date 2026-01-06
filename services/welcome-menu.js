// Welcome menu service - Interactive buttons with AI-generated responses

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
 * Convert menu selection to natural language query for AI
 * @param {string} menuId - Menu item ID
 * @returns {string} Natural language query
 */
function getQueryForMenuSelection(menuId) {
  const queries = {
    'menu_timings': 'What are your gym timings and opening hours?',
    'menu_membership': 'What are your membership plans and pricing?',
    'menu_facilities': 'What facilities and equipment do you have at the gym?',
    'menu_location': 'What is your gym location and how can I contact you?',
    'menu_trial': 'I want to book a trial session',
    'menu_staff': 'I want to talk to staff'
  };
  
  return queries[menuId] || null;
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
  getQueryForMenuSelection,
  shouldTriggerHandoffForMenu
};
