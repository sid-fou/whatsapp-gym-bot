# 🤖 WhatsApp Gym Chatbot - IronCore Fitness

An intelligent WhatsApp chatbot that automates gym inquiries using AI-powered responses with strict guardrails. Built with Node.js, Express, and OpenRouter AI.

![Demo](https://img.shields.io/badge/Status-Demo-blue)
![Node](https://img.shields.io/badge/Node.js-v18+-green)
![License](https://img.shields.io/badge/License-ISC-yellow)

## ✨ Features

- 🎯 **Intent Detection**: Automatically classifies user queries (timings, pricing, trials, booking)
- ⚡ **Fast FAQ Responses**: Instant replies for common questions
- 🤖 **AI-Powered**: Uses Claude 3.5 via OpenRouter for complex queries
- 🛡️ **Smart Guardrails**: Refuses to provide medical/fitness advice, stays on-topic
- 📊 **Conversation Logging**: Tracks all interactions for analytics
- 🔒 **Rate Limiting**: Prevents abuse
- 📱 **WhatsApp Business API**: Official integration

## 🎬 Demo Conversation

```
User: Hi
Bot: Hello! Welcome to IronCore Fitness. How can I assist you today?

User: What are your timings on weekend?
Bot: We're open Mon–Sat: 6 AM – 10 PM, and Sunday: 8 AM – 2 PM.

User: Can you give me workout tips?
Bot: I apologize, but I cannot provide workout advice. 
     For personalized guidance, book a session with our trainers.
```

## 🏗️ Project Structure

```
whatsapp-gym-bot/
├── server.js              # Express server with rate limiting
├── routes/
│   └── webhook.js        # WhatsApp webhook handlers
├── services/
│   ├── ai.js            # OpenRouter AI integration
│   ├── intent.js        # Intent detection engine
│   ├── faq.js           # Pre-defined responses
│   └── booking.js       # Booking logic
├── config/
│   └── environment.js   # Environment validation
├── data/
│   └── gym_knowledge.txt # Knowledge base
├── logs/
│   ├── conversations.js  # Logging module
│   └── conversation_data.json # Logged data
└── test.js              # Local testing script
```

## 🚀 Quick Start

### Prerequisites

- Node.js v18+ 
- WhatsApp Business Account
- OpenRouter API Key

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/whatsapp-gym-bot.git
cd whatsapp-gym-bot

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Run tests
npm test

# Start server
npm start
```

### Environment Variables

```env
PORT=3000
WHATSAPP_TOKEN=your_whatsapp_token
PHONE_NUMBER_ID=your_phone_number_id
VERIFY_TOKEN=your_custom_verify_token
OPENROUTER_API_KEY=your_openrouter_key
```

## 📝 Getting API Keys

### WhatsApp Business API

1. Create account at [Meta for Developers](https://developers.facebook.com)
2. Create new app → Add WhatsApp product
3. Get Phone Number ID and Access Token
4. Configure webhook URL

### OpenRouter API

1. Sign up at [OpenRouter](https://openrouter.ai)
2. Create API key
3. Add credits (starts with free tier)

## 🧪 Testing

### Local Testing (No WhatsApp Required)

```bash
node test.js
```

### Live Testing with WhatsApp

1. Install [ngrok](https://ngrok.com/download)
2. Start your server: `npm start`
3. In new terminal: `ngrok http 3000`
4. Configure webhook in Meta Dashboard with ngrok URL
5. Send messages to your WhatsApp test number

## 🎨 Customization

### Update Gym Information

Edit `data/gym_knowledge.txt`:

```
Gym Name: Your Gym Name
Timings: Your hours
Membership Plans: Your pricing
```

### Change AI Model

In `services/ai.js`, modify:

```javascript
model: 'anthropic/claude-3.5-sonnet'  // Premium
model: 'anthropic/claude-3-haiku'     // Balanced
model: 'meta-llama/llama-3.1-8b-instruct' // Budget
```

### Add More Intents

In `services/intent.js`:

```javascript
const INTENT_PATTERNS = {
  new_intent: ['keyword1', 'keyword2'],
  // ...
};
```

## 🚢 Deployment

### Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

### Deploy to Render

1. Connect GitHub repo
2. Add environment variables
3. Deploy automatically

### Deploy to Heroku

```bash
heroku create your-app-name
git push heroku main
heroku config:set WHATSAPP_TOKEN=xxx
```

## 🛡️ Security Features

- ✅ Environment variable validation
- ✅ Rate limiting (100 req/15min per IP)
- ✅ Input sanitization
- ✅ Error handling
- ✅ No sensitive data in logs
- ✅ `.env` files excluded from Git

## 📊 Analytics

Conversation logs stored in `logs/conversation_data.json`:

```json
{
  "userId": "919876543210",
  "userMessage": "What are your timings?",
  "botResponse": "We're open Mon–Sat...",
  "timestamp": "2025-12-29T04:10:00.000Z"
}
```

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

ISC License - see LICENSE file

## 🙏 Acknowledgments

- [OpenRouter](https://openrouter.ai) - AI API gateway
- [Meta WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [Express.js](https://expressjs.com)

## 📧 Contact

Your Name - [@yourtwitter](https://twitter.com/yourtwitter)

Project Link: [https://github.com/yourusername/whatsapp-gym-bot](https://github.com/yourusername/whatsapp-gym-bot)

---

⭐ Star this repo if you found it helpful!
