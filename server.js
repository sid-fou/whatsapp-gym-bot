require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { checkEnvironment } = require('./config/environment');
const { connectDB } = require('./database/connection');
const Context = require('./database/models/Context');
const webhookRoutes = require('./routes/webhook');
const adminAuthRoutes = require('./routes/admin/auth');
const adminApiRoutes = require('./routes/admin/api');
const adminStaffRoutes = require('./routes/admin/staff');
const adminCustomersRoutes = require('./routes/admin/customers');
const handoffService = require('./services/handoff');
const escalationService = require('./services/escalation');

// Validate environment variables on startup
checkEnvironment();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for ngrok/reverse proxy (fixes rate limiter with X-Forwarded-For)
app.set('trust proxy', 1);

// CORS - Allow requests from dashboard (MUST be before rate limiter)
app.use(cors({
  origin: process.env.DASHBOARD_URL || 'http://localhost:3001',
  credentials: true
}));

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Higher rate limit for admin dashboard (authenticated endpoints)
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Much higher limit for admin dashboard auto-refresh
  message: 'Too many admin requests, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter to webhook routes only
app.use('/webhook', limiter);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes (admin routes use their own rate limiter)
app.use('/webhook', webhookRoutes);
app.use('/admin', adminLimiter, adminAuthRoutes);
app.use('/admin/api', adminLimiter, adminApiRoutes);
app.use('/admin/api/staff', adminLimiter, adminStaffRoutes);
app.use('/admin/api/customers', adminLimiter, adminCustomersRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'IronCore Fitness WhatsApp Bot',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
async function startServer() {
  try {
    // Connect to MongoDB first
    await connectDB();
    
    // Load active handoffs from database into cache
    await handoffService.initializeCache();
    
    // Start escalation system (checks for unaccepted handoffs every minute)
    escalationService.startEscalationSystem();
    
    // Schedule periodic cleanup every 15 minutes
    setInterval(async () => {
      try {
        await Context.cleanupOldContexts();
      } catch (error) {
        console.error('❌ Scheduled cleanup failed:', error.message);
      }
    }, 15 * 60 * 1000); // 15 minutes
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
      console.log(`${'='.repeat(50)}\n`);
      
      // Show notification status
      if (process.env.STAFF_WHATSAPP_NUMBERS) {
        console.log(`📲 WhatsApp notifications: ENABLED`);
      }
      if (process.env.EMAIL_USER) {
        console.log(`📧 Email notifications: ENABLED`);
      }
      if (process.env.MONGODB_URI) {
        console.log(`💾 Conversation memory: ENABLED (MongoDB)`);
      } else {
        console.log(`⚠️  Conversation memory: DISABLED (add MONGODB_URI)`);
      }
      console.log();
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n👋 SIGTERM received, shutting down gracefully...');
  const { disconnectDB } = require('./database/connection');
  await disconnectDB();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n👋 SIGINT received, shutting down gracefully...');
  const { disconnectDB } = require('./database/connection');
  await disconnectDB();
  process.exit(0);
});

startServer();
