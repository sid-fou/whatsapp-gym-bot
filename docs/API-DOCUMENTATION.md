# 🔌 Admin API Documentation

Complete API reference for IronCore Fitness WhatsApp Bot Admin Dashboard.

**Base URL:** `http://localhost:3000`  
**Authentication:** Include `x-admin-key` header with all protected requests

---

## 📑 Table of Contents

1. [Authentication](#authentication)
2. [Bot Control](#bot-control)
3. [Ignore List Management](#ignore-list-management)
4. [Handoff Management](#handoff-management)
5. [Conversations](#conversations)
6. [Statistics](#statistics)

---

## 🔐 Authentication

### Login
**POST** `/admin/login`

Authenticate and receive admin key for subsequent requests.

**Request Body:**
```json
{
  "password": "your_admin_key_from_env"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "adminKey": "ironcore_admin_2025_secure",
    "expiresIn": "7d"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": "Invalid password"
}
```

---

### Verify Admin Key
**GET** `/admin/verify`

Verify if the provided admin key is valid.

**Headers:**
```
x-admin-key: your_admin_key
```

**Success Response (200):**
```json
{
  "success": true,
  "valid": true
}
```

**Error Response (401):**
```json
{
  "success": false,
  "valid": false,
  "error": "Invalid admin key"
}
```

---

### Logout
**POST** `/admin/logout`

Logout (client-side only, just confirmation).

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## 🤖 Bot Control

All bot control endpoints require authentication via `x-admin-key` header.

### Get Bot Status
**GET** `/admin/api/bot/status`

Get current bot on/off status.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "status": "online"
  }
}
```

---

### Enable Bot
**POST** `/admin/api/bot/enable`

Turn the bot ON (will respond to customer messages).

**Success Response (200):**
```json
{
  "success": true,
  "message": "Bot enabled",
  "data": {
    "enabled": true
  }
}
```

---

### Disable Bot
**POST** `/admin/api/bot/disable`

Turn the bot OFF (will NOT respond to customer messages).

**Success Response (200):**
```json
{
  "success": true,
  "message": "Bot disabled",
  "data": {
    "enabled": false
  }
}
```

---

## 🚫 Ignore List Management

Manage numbers that should be completely ignored by the bot.

### Get All Ignored Numbers
**GET** `/admin/api/ignored`

Retrieve all numbers in the ignore list with statistics.

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "phoneNumber": "919999999999",
      "reason": "spam",
      "addedBy": "admin",
      "note": "Spam caller",
      "addedAt": "2025-01-01T10:00:00.000Z",
      "lastMessageReceived": "2025-01-01T12:30:00.000Z"
    }
  ],
  "stats": {
    "connected": true,
    "total": 5,
    "byReason": {
      "spam": 3,
      "personal": 1,
      "manual": 1
    },
    "recentlyActive": 2
  },
  "count": 5
}
```

---

### Add Number to Ignore List
**POST** `/admin/api/ignore`

Add a phone number to the ignore list.

**Request Body:**
```json
{
  "phoneNumber": "919999999999",
  "reason": "spam",
  "note": "Optional note about why"
}
```

**Fields:**
- `phoneNumber` (required): WhatsApp number with country code
- `reason` (optional): One of: `personal`, `spam`, `manual`, `other`
- `note` (optional): Additional information

**Success Response (200):**
```json
{
  "success": true,
  "message": "Number added to ignore list",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "phoneNumber": "919999999999",
    "reason": "spam",
    "addedBy": "admin",
    "note": "Optional note about why",
    "addedAt": "2025-01-01T10:00:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Number already ignored"
}
```

---

### Remove Number from Ignore List
**DELETE** `/admin/api/ignore/:phoneNumber`

Remove a phone number from the ignore list.

**URL Parameters:**
- `phoneNumber`: The WhatsApp number to remove (e.g., `919999999999`)

**Example:**
```
DELETE /admin/api/ignore/919999999999
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Number removed from ignore list"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Number not found in ignore list"
}
```

---

## 🤝 Handoff Management

Manage customer handoffs to human staff.

### Get Handoff Queue
**GET** `/admin/api/handoffs`

Get current handoff queue with all pending customer requests.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "queue": [
      {
        "userId": "919876543210",
        "lastMessage": "I need to speak with someone",
        "reason": "urgent",
        "addedAt": "2025-01-01T10:15:00.000Z"
      }
    ],
    "count": 1
  },
  "timestamp": "2025-01-01T10:30:00.000Z"
}
```

---

### End Handoff for User
**POST** `/admin/api/handoffs/:userId/end`

End handoff for a specific user and return them to bot.

**URL Parameters:**
- `userId`: The WhatsApp number of the user

**Example:**
```
POST /admin/api/handoffs/919876543210/end
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Handoff ended for 919876543210",
  "timestamp": "2025-01-01T10:35:00.000Z"
}
```

---

### Clear All Handoffs
**POST** `/admin/api/handoffs/clear`

Clear entire handoff queue (end all handoffs at once).

**Success Response (200):**
```json
{
  "success": true,
  "message": "Cleared 3 handoffs",
  "clearedCount": 3,
  "timestamp": "2025-01-01T10:40:00.000Z"
}
```

---

## 💬 Conversations

View and manage customer conversations.

### Get Recent Conversations
**GET** `/admin/api/conversations`

Get recent customer conversations with message previews.

**Query Parameters:**
- `limit` (optional): Number of conversations to return (default: 20)

**Example:**
```
GET /admin/api/conversations?limit=10
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "userId": "919876543210",
      "lastMessage": "Thanks for the information!",
      "messageCount": 5,
      "lastActivity": "2025-01-01T10:30:00.000Z",
      "inHandoff": false,
      "firstGreeting": true,
      "preview": [
        {
          "role": "user",
          "content": "What are your gym hours?"
        },
        {
          "role": "assistant",
          "content": "Our gym is open Monday-Saturday: 5:00 AM - 10:00 PM, Sunday: 6:00 AM - 8:00 PM"
        }
      ]
    }
  ],
  "count": 10
}
```

---

### Get Specific Conversation
**GET** `/admin/api/conversations/:userId`

Get full conversation history for a specific user.

**URL Parameters:**
- `userId`: The WhatsApp number of the user

**Example:**
```
GET /admin/api/conversations/919876543210
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "919876543210",
    "messages": [
      {
        "role": "user",
        "content": "What are your gym hours?",
        "timestamp": "2025-01-01T10:00:00.000Z"
      },
      {
        "role": "assistant",
        "content": "Our gym is open Monday-Saturday: 5:00 AM - 10:00 PM",
        "timestamp": "2025-01-01T10:00:05.000Z"
      }
    ],
    "metadata": {
      "lastActivity": "2025-01-01T10:30:00.000Z",
      "inHandoff": false,
      "firstGreeting": true
    }
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Conversation not found"
}
```

---

## 📊 Statistics

Get comprehensive dashboard statistics.

### Get Dashboard Stats
**GET** `/admin/api/stats`

Get all statistics for the admin dashboard.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "bot": {
      "enabled": true,
      "status": "online"
    },
    "conversations": {
      "total": 150,
      "recent": 45,
      "activeHandoffs": 3
    },
    "ignored": {
      "total": 8,
      "byReason": {
        "spam": 5,
        "personal": 2,
        "manual": 1
      },
      "recentlyActive": 2
    },
    "handoffs": {
      "active": 3,
      "users": [
        {
          "userId": "919876543210",
          "metadata": {
            "inHandoff": true,
            "handoffReason": "complex_query"
          }
        }
      ]
    }
  }
}
```

---

## 🔒 Error Handling

All API errors follow a consistent format:

```json
{
  "success": false,
  "error": "Error message here",
  "message": "Optional detailed message"
}
```

### Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 400 | Bad Request | Check request body/parameters |
| 401 | Unauthorized | Provide valid admin key |
| 403 | Forbidden | Admin key is invalid |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Check server logs |

---

## 🧪 Testing the API

### Using cURL

```bash
# Login
curl -X POST http://localhost:3000/admin/login \
  -H "Content-Type: application/json" \
  -d '{"password":"ironcore_admin_2025_secure"}'

# Get bot status
curl -X GET http://localhost:3000/admin/api/bot/status \
  -H "x-admin-key: ironcore_admin_2025_secure"

# Add to ignore list
curl -X POST http://localhost:3000/admin/api/ignore \
  -H "Content-Type: application/json" \
  -H "x-admin-key: ironcore_admin_2025_secure" \
  -d '{"phoneNumber":"919999999999","reason":"spam"}'

# Get statistics
curl -X GET http://localhost:3000/admin/api/stats \
  -H "x-admin-key: ironcore_admin_2025_secure"
```

### Using the Test Script

Run the comprehensive test suite:

```bash
node test-admin-api.js
```

This will test all endpoints and provide detailed results.

---

## 📝 Notes

1. **Authentication**: All `/admin/api/*` endpoints require the `x-admin-key` header
2. **Phone Numbers**: Always include country code (e.g., `919876543210` for India)
3. **Timestamps**: All timestamps are in ISO 8601 format (UTC)
4. **Rate Limiting**: API is rate-limited to 100 requests per 15 minutes per IP
5. **Database**: Requires MongoDB connection (check `MONGODB_URI` in `.env`)

---

## 🚀 Quick Start Example

```javascript
// Login and get admin key
const loginResponse = await fetch('http://localhost:3000/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ password: 'ironcore_admin_2025_secure' })
});

const { data } = await loginResponse.json();
const adminKey = data.adminKey;

// Use admin key for subsequent requests
const statsResponse = await fetch('http://localhost:3000/admin/api/stats', {
  headers: { 'x-admin-key': adminKey }
});

const stats = await statsResponse.json();
console.log(stats);
```

---

## 📞 Support

For issues or questions about the API:
1. Check server logs for detailed error messages
2. Verify `.env` configuration (especially `ADMIN_KEY` and `MONGODB_URI`)
3. Use the test script to diagnose issues: `node test-admin-api.js`
4. Ensure MongoDB is connected and accessible

---

**Last Updated:** January 2025  
**API Version:** 1.0.0
