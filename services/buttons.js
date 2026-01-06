// WhatsApp Interactive Button Service (Cloud API Format)

/**
 * Create "End Handoff" button for staff
 * @param {string} customerUserId - Customer's WhatsApp number
 * @returns {Object} WhatsApp button message payload
 */
function createEndHandoffButton(customerUserId) {
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    type: 'interactive',
    interactive: {
      type: 'button',
      body: {
        text: `✅ Acknowledged! Customer ${customerUserId} is being assisted.\n\nWhen you're done, click the button below to re-enable the bot.`
      },
      action: {
        buttons: [
          {
            type: 'reply',
            reply: {
              id: `end_handoff_${customerUserId}`,
              title: '✅ End Handoff'
            }
          }
        ]
      }
    }
  };
}

/**
 * Create simple "End Handoff" button without acknowledgment text
 * @param {string} customerUserId - Customer's WhatsApp number
 * @returns {Object} WhatsApp button message payload
 */
function createSimpleEndHandoffButton(customerUserId) {
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    type: 'interactive',
    interactive: {
      type: 'button',
      body: {
        text: `Customer: ${customerUserId}`
      },
      action: {
        buttons: [
          {
            type: 'reply',
            reply: {
              id: `end_handoff_${customerUserId}`,
              title: '✅ End Handoff'
            }
          }
        ]
      }
    }
  };
}

/**
 * Create "Turn Bot On" button
 * @returns {Object} WhatsApp button message payload
 */
function createBotOnButton() {
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    type: 'interactive',
    interactive: {
      type: 'button',
      body: {
        text: '🤖 Bot is now OFF for all customers.\n\nClick below when you want to turn it back on.'
      },
      action: {
        buttons: [
          {
            type: 'reply',
            reply: {
              id: 'bot_on',
              title: '🟢 Turn Bot On'
            }
          }
        ]
      }
    }
  };
}

/**
 * Create "Turn Bot Off" button
 * @returns {Object} WhatsApp button message payload
 */
function createBotOffButton() {
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    type: 'interactive',
    interactive: {
      type: 'button',
      body: {
        text: '🤖 Bot is now ON and handling customer messages.\n\nClick below if you want to turn it off.'
      },
      action: {
        buttons: [
          {
            type: 'reply',
            reply: {
              id: 'bot_off',
              title: '🔴 Turn Bot Off'
            }
          }
        ]
      }
    }
  };
}

/**
 * Parse button click from webhook
 * @param {Object} interactive - Interactive object from WhatsApp webhook
 * @returns {Object} Parsed button data { type, customerId }
 */
function parseButtonClick(interactive) {
  if (!interactive || interactive.type !== 'button_reply') {
    return null;
  }

  const buttonId = interactive.button_reply.id;

  // Assign button: "assign_919876543210"
  if (buttonId.startsWith('assign_')) {
    const customerId = buttonId.replace('assign_', '');
    return {
      type: 'assign',
      customerId
    };
  }

  // End handoff button: "end_handoff_919876543210"
  if (buttonId.startsWith('end_handoff_')) {
    const customerId = buttonId.replace('end_handoff_', '');
    return {
      type: 'end_handoff',
      customerId
    };
  }

  // Bot control buttons
  if (buttonId === 'bot_on') {
    return { type: 'bot_on' };
  }

  if (buttonId === 'bot_off') {
    return { type: 'bot_off' };
  }

  return null;
}

module.exports = {
  createEndHandoffButton,
  createSimpleEndHandoffButton,
  createBotOnButton,
  createBotOffButton,
  parseButtonClick
};
