# 🤖 IronCore Fitness WhatsApp Bot - Backend API

Intelligent WhatsApp chatbot with AI-powered responses, staff handoff system, and comprehensive admin API for gym automation.

![Status](https://img.shields.io/badge/Status-Production%20Ready-green)
![Node](https://img.shields.io/badge/Node.js-18+-green)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen)
![License](https://img.shields.io/badge/License-ISC-yellow)

**Related Repository:** [Admin Dashboard](https://github.com/sid-fou/ironcore-admin-dashboard)

---

## ✨ Features

### 🎯 Interactive Welcome Menu
- **Greeting detection** - Shows menu on every greeting (Hi, Hello, Hey, etc.)
- **Interactive list menu** with 6 quick options:
  - 🕐 Gym Timings - Mon-Sat 6 AM - 10 PM, Sun 8 AM - 2 PM
  - 💳 Membership Plans - ₹2,000/month, ₹5,500/quarter, ₹20,000/year
  - 🏋️ Facilities - Equipment, amenities, training options
  - 📍 Location & Contact - Sector 15, Gurugram + phone
  - 🎯 Book Trial Session - Auto-triggers handoff
  - 👤 Talk to Staff - Direct staff connection
- **Smart handoff** - Booking and staff requests trigger handoff automatically
- **Real gym data** - All responses sourced from `gym_knowledge.txt`

### 🤖 AI-Powered Chat
- **Meta Llama 3.1 8B** via OpenRouter for intelligent responses
- **Context-aware conversations** (last 10 messages stored)
- **Intent detection** (greetings, questions, bookings, pricing)
- **Gym knowledge base** integration (`data/gym_knowledge.txt`)
- **Guardrails** - Stays on-topic, no medical advice

### 🤝 Staff Handoff System
- **Smart handoff detection** (3-layer: keywords + AI + booking)
- **Staff notifications** (WhatsApp + Email)
- **Auto-assignment** (first to respond gets assigned)
- **Direct messaging** (staff replies auto-forward to customer)
- **Owner escalation** (5-minute timer if unaccepted)
- **Goodbye message** when handoff ends
- **10-minute cooldown** prevents re-triggers

### 👥 Staff Management
- **CRUD operations** for staff members
- **Role-based system** (Owner, Trainer, Staff)
- **Notification preferences** per staff
- **Protected owner** (cannot delete via UI)
- **MongoDB staff database**

### 💬 Customer Management
- **Conversation history** (full chat logs)
- **Customer database** (auto-created)
- **Message tracking** (counts, timestamps)
- **Context preservation** during handoffs

### 🚫 Ignore List (Spam Prevention)
- **Block numbers** by reason (spam, personal, manual)
- **MongoDB persistence**
- **Statistics** by reason
- **Silent mode** (no bot responses)

### 🔌 Admin API
- **24+ REST endpoints** for dashboard
- **Secure authentication** (admin key)
- **Bot control** (enable/disable remotely)
- **Statistics** (conversations, handoffs, staff, ignored)
- **Full CRUD** for all resources

---

## 🚀 Tech Stack

- **Runtime:** Node.js 18+ with Express.js
- **Database:** MongoDB Atlas (cloud)
- **AI:** Meta Llama 3.1 8B via OpenRouter
- **Messaging:** WhatsApp Business API (Meta)
- **Email:** Nodemailer with Gmail SMTP
- **Architecture:** RESTful API + Microservices

---

## 📁 Project Structure

```
whatsapp-chatbot-backend/
├── server.js                      # Express server + MongoDB connection
├── routes/
│   ├── webhook.js                 # WhatsApp webhook handlers (main logic)
│   └── admin/
│       ├── auth.js                # Admin authentication routes
│       └── api.js                 # Admin API endpoints (24+)
├── services/
│   ├── ai.js                      # Meta Llama API integration
│   ├── handoff.js                 # Handoff detection & queue management
│   ├── staff-management.js        # Staff CRUD operations
│   ├── context.js                 # MongoDB context management
│   ├── ignore-list.js             # Blocked numbers database
│   ├── bot-state.js               # Global bot enable/disable
│   ├── escalation.js              # Owner escalation (5-min timer)
│   ├── buttons.js                 # WhatsApp interactive buttons
│   ├── welcome-menu.js            # Interactive welcome menu (NEW!)
│   └── notifications/
│       ├── email.js               # Email notifications
│       └── whatsapp.js            # WhatsApp notifications
├── database/
│   ├── connection.js              # MongoDB connection + auto-reconnect
│   └── models/
│       ├── Context.js             # Conversation history model
│       ├── Handoff.js             # Handoff queue model
│       ├── Staff.js               # Staff members model
│       └── IgnoreList.js          # Blocked numbers model
├── middleware/
│   └── auth.js                    # Admin key verification
├── config/
│   └── environment.js             # Environment validation
├── data/
│   └── gym_knowledge.txt          # AI training data (gym info)
├── docs/
│   ├── API-DOCUMENTATION.md       # Complete API reference
│   ├── HANDOFF-SYSTEM.md          # Handoff system guide
│   └── STAFF-COMMANDS.md          # Staff WhatsApp commands
├── scripts/
│   └── ... (utility scripts)
├── test-*.js                      # Test suites
├── .gitignore
└── package.json
```

---

## 🚀 Installation

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- WhatsApp Business API access
- OpenRouter API key
- Gmail account (for email notifications)

### Step 1: Clone Repository
```bash
git clone https://github.com/sid-fou/whatsapp-bot-backend.git
cd whatsapp-bot-backend
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment

Create `.env` file

Edit `.env` with your credentials:
```env
# Server
PORT=3000

# WhatsApp Business API
WHATSAPP_TOKEN=your_meta_access_token
PHONE_NUMBER_ID=your_whatsapp_business_id
VERIFY_TOKEN=your_webhook_verify_token

# AI Service
OPENROUTER_API_KEY=your_openrouter_api_key

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# Admin Dashboard
ADMIN_KEY=ironcore_admin_2025_secure
DASHBOARD_URL=http://localhost:3001

# Email Notifications
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
OWNER_EMAIL=owner@gym.com

# Staff Notifications (comma-separated)
STAFF_WHATSAPP_NUMBERS=918755052568,918755225619
STAFF_EMAILS=staff1@gmail.com,staff2@gmail.com
```

### Step 4: Run Tests
```bash
# Test MongoDB connection
node check-mongodb.js

# Test full system
node test-full-system.js

# Test admin API
node test-admin-api.js
```

### Step 5: Start Server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server runs on: `http://localhost:3000`

---

## 🔌 API Endpoints

### Authentication (3)
- `POST /admin/login` - Login with admin key
- `GET /admin/verify` - Verify admin key
- `POST /admin/logout` - Logout

### Bot Control (3)
- `GET /admin/api/bot/status` - Get bot status
- `POST /admin/api/bot/enable` - Turn bot ON
- `POST /admin/api/bot/disable` - Turn bot OFF

### Statistics (1)
- `GET /admin/api/stats` - Get dashboard stats (includes staff count)

### Conversations (2)
- `GET /admin/api/conversations` - Get recent conversations
- `GET /admin/api/conversations/:userId` - Get specific conversation

### Customers (2)
- `GET /admin/api/customers` - Get all customers
- `GET /admin/api/customers/:userId` - Get customer details

### Staff Management (4)
- `GET /admin/api/staff` - Get all staff
- `POST /admin/api/staff` - Add staff member
- `PUT /admin/api/staff/:id` - Update staff member
- `DELETE /admin/api/staff/:id` - Delete staff member

### Handoffs (4)
- `GET /admin/api/handoffs` - Get handoff queue
- `POST /admin/api/handoffs/:userId/end` - End handoff
- `DELETE /admin/api/handoffs/:phoneNumber` - Remove handoff
- `POST /admin/api/handoffs/clear` - Clear all handoffs

### Ignore List (3)
- `GET /admin/api/ignored` - Get all ignored numbers
- `POST /admin/api/ignore` - Add to ignore list
- `DELETE /admin/api/ignore/:phoneNumber` - Remove from ignore list

**Total: 24 API Endpoints**

See [API-DOCUMENTATION.md](docs/API-DOCUMENTATION.md) for complete reference.

---

## 📝 Getting API Keys

### 1. WhatsApp Business API
1. Go to [Meta for Developers](https://developers.facebook.com)
2. Create app → Add WhatsApp product
3. Get Phone Number ID and Access Token
4. Configure webhook URL (when deploying)

### 2. OpenRouter API
1. Sign up at [OpenRouter](https://openrouter.ai)
2. Create API key
3. Add credits to account (free tier available)
4. Model used: `meta-llama/llama-3.1-8b-instruct`

### 3. MongoDB Atlas
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create cluster (free tier available)
3. Get connection string
4. Whitelist IP addresses (or allow all: 0.0.0.0/0)

### 4. Gmail App Password
1. Enable 2FA on Gmail account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Generate password for "Mail"
4. Use this in EMAIL_PASS

---

## 🧪 Testing

### Local Testing
```bash
# Test all systems
npm test

# Test specific modules
node test-context.js         # MongoDB context
node test-ignore-list.js     # Ignore list
node test-admin-api.js       # Admin API
```

### Webhook Testing with ngrok
```bash
# Terminal 1: Start server
npm start

# Terminal 2: Start ngrok
ngrok http 3000

# Use ngrok URL in Meta webhook settings
```

---

## 🎨 Customization

### Update Gym Information
Edit `data/gym_knowledge.txt`:
```
Gym Name: IronCore Fitness
Location: Sector 15, Gurugram, Haryana
Timings: Mon-Sat 6 AM - 10 PM, Sunday 8 AM - 2 PM
Membership: ₹2,000/month, ₹5,500/quarter, ₹20,000/year
Contact: +91-8755052568
```

### Customize Welcome Menu
Edit `services/welcome-menu.js`:

**Update Location (Line 101):**
```javascript
*Address:*
IronCore Fitness
[Your Actual Address Here]
Near [Your Landmark]
```

**Update Email (Line 109):**
```javascript
📧 Email: your@email.com
```

**Adjust Membership Pricing (Lines 43-67):**
```javascript
*Monthly Plan*
₹2,000/month  // Change as needed
```

### Modify Handoff Messages
In `services/handoff.js`:
```javascript
const handoffMessage = `Your custom message...`;
```

In `routes/webhook.js` (goodbye message):
```javascript
const goodbyeMessage = `Your custom goodbye...`;
```

### Change Escalation Time
In `services/escalation.js`:
```javascript
const ESCALATION_TIME_MS = 5 * 60 * 1000; // 5 minutes
```

### Add New Staff Commands
In `services/buttons.js` - Add button handlers
In `routes/webhook.js` - Add text command detection

---

## 🛡️ Security Features

- ✅ Environment variables for all secrets
- ✅ Admin key authentication
- ✅ MongoDB connection encryption
- ✅ Rate limiting (built-in Express)
- ✅ Input validation
- ✅ Error handling (no sensitive data leaked)
- ✅ CORS configured for dashboard
- ✅ No secrets in Git (.gitignore)

---

## 📊 Database Collections

### contexts
```javascript
{
  userId: String,              // WhatsApp number
  messages: [{
    role: String,              // 'user' | 'assistant'
    content: String,
    timestamp: Number
  }],
  metadata: {
    lastActivity: Number,
    inHandoff: Boolean,
    handoffReason: String,
    firstGreeting: Boolean
  }
}
```

### handoffs
```javascript
{
  userId: String,              // Customer number
  customerName: String,
  message: String,             // Trigger message
  reason: String,              // Handoff reason
  status: String,              // 'waiting' | 'active' | 'resolved'
  timestamp: Date,
  staffMember: String,         // Assigned staff number
  assignedAt: Date
}
```

### staffs
```javascript
{
  name: String,
  role: String,                // 'owner' | 'trainer' | 'staff'
  phoneNumber: String,
  email: String,
  specialization: String,
  receiveNotifications: Boolean,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### ignorelists
```javascript
{
  phoneNumber: String,
  reason: String,              // 'spam' | 'personal' | 'manual' | 'other'
  addedBy: String,
  note: String,
  addedAt: Date,
  lastMessageReceived: Date
}
```

---

## 🚀 Deployment

### Deploy to Render
1. Push code to GitHub
2. Create new Web Service on Render
3. Connect GitHub repo
4. Configure:
   - Build: `npm install`
   - Start: `npm start`
   - Environment: Add all .env variables
5. Deploy!

### Configure Webhook
After deployment:
1. Get Render URL: `https://your-app.onrender.com`
2. Go to Meta Developer Dashboard
3. Configure webhook: `https://your-app.onrender.com/webhook`
4. Set verify token (from .env)
5. Subscribe to messages


---

## 📚 Documentation

- [API Documentation](docs/API-DOCUMENTATION.md) - Complete API reference
- [Handoff System](docs/HANDOFF-SYSTEM.md) - How staff handoffs work
- [Staff Commands](docs/STAFF-COMMANDS.md) - WhatsApp commands for staff

---

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Check MONGODB_URI format
- Whitelist IP address (0.0.0.0/0 for public access)
- Verify cluster is running
- Check network access settings

### WhatsApp Not Responding
- Verify WHATSAPP_TOKEN is valid
- Check PHONE_NUMBER_ID is correct
- Ensure webhook is configured
- Check server logs for errors

### Staff Not Receiving Notifications
- Verify STAFF_WHATSAPP_NUMBERS format
- Check STAFF_EMAILS configuration
- Test email settings (EMAIL_USER, EMAIL_PASS)
- Verify staff members in database

### API Errors
- Check ADMIN_KEY matches
- Verify MongoDB connection
- Check server logs
- Test endpoints with curl/Postman

---

## 📄 License

ISC License

---

## 👥 Authors

Built for IronCore Fitness automation.

---

## 🙏 Acknowledgments

- [OpenRouter](https://openrouter.ai) - AI API Gateway
- [Meta AI](https://ai.meta.com) - Llama 3.1 Model
- [Meta](https://developers.facebook.com) - WhatsApp Business API
- [MongoDB](https://mongodb.com) - Database
- [Express.js](https://expressjs.com) - Web framework
- [Nodemailer](https://nodemailer.com) - Email service

---

**Version:** 2.0.0  
**Last Updated:** January 2026  
**Status:** Production Ready ✅  
Siddharth Singh - [@sid](https://x.com/sid_fou)

---

⭐ Star this repo if you found it helpful!
