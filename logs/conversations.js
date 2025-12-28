const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'conversation_data.json');

// Initialize log file if it doesn't exist
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, JSON.stringify({ conversations: [] }, null, 2));
}

function logConversation(userId, userMessage, botResponse) {
  try {
    const logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
    
    logs.conversations.push({
      userId,
      userMessage,
      botResponse,
      timestamp: new Date().toISOString()
    });

    // Keep only last 1000 conversations to prevent file bloat
    if (logs.conversations.length > 1000) {
      logs.conversations = logs.conversations.slice(-1000);
    }

    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('Error logging conversation:', error);
  }
}

function getConversationHistory(userId, limit = 10) {
  try {
    const logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
    return logs.conversations
      .filter(conv => conv.userId === userId)
      .slice(-limit);
  } catch (error) {
    console.error('Error retrieving conversation history:', error);
    return [];
  }
}

module.exports = {
  logConversation,
  getConversationHistory
};
