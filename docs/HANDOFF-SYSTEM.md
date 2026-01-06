# Handoff System Documentation

Complete guide to the customer-to-staff handoff system for IronCore Fitness WhatsApp Bot.

---

## Overview

The handoff system automatically detects when a customer needs human assistance and escalates their conversation to gym staff members. It includes smart detection, staff notifications, auto-assignment, and bidirectional messaging.

---

## How It Works

### 1. Handoff Detection (3-Layer System)

**Layer 1: Keyword Matching (Fast)**
- Direct requests: "talk to human", "speak to staff", "talk to owner"
- Booking keywords: "book trial", "trial booking", "schedule session"
- Complex queries: "injury", "medical condition", "custom package"

**Layer 2: AI Intent Detection (Smart)**
- Analyzes message context and intent
- Catches implicit handoff requests keywords might miss
- Example: "I'm not sure about this, can someone help?" → Detected

**Layer 3: Booking Intelligence**
- When booking keywords detected, provides gym timing FIRST
- Then triggers handoff for personalized assistance
- Example response:
  ```
  📅 Our gym is open:
  Monday-Saturday: 6:00 AM - 11:00 PM
  Sunday: 7:00 AM - 9:00 PM

  For trial bookings and membership details, our team will assist you personally. 
  Connecting you with staff now...
  ```

### 2. Staff Notifications

When handoff triggers, ALL staff members receive:

**WhatsApp Notification:**
```
🚨 CUSTOMER NEEDS ASSISTANCE
Customer: Mukesh (918791514008)
Message: "Can you help me with timings and booking"
Reason: Booking request

[Assign to Me] button
```

**Email Notification:**
- Subject: "🚨 Customer Needs Assistance - 918791514008"
- Includes customer details, message, and reason
- Sent to all staff emails in STAFF_EMAILS

### 3. Staff Assignment

**Option A: Click "Assign to Me" Button**
- Instant assignment
- Staff receives "End Handoff" button

**Option B: Text Acknowledgment**
- Staff sends: "ok", "got it", "on it", etc.
- Auto-assigned to that customer
- Receives "End Handoff" button

**First staff to respond gets assigned** - Other staff notified it's been claimed

### 4. Direct Messaging

After assignment, staff can reply without commands:

```
Customer: "I need to book a trial"
[Forwarded to assigned staff]

Staff: "Sure! What time works for you?"
[Auto-forwarded to customer]

Customer: "Tomorrow around noon"
[Forwarded to staff]

Staff: "Perfect, I'll book you for 12 PM tomorrow"
[Auto-forwarded to customer]
```

All messages are saved to conversation history.

### 5. Owner Escalation

If NO staff responds within 5 minutes:
- Owner receives escalation email
- Subject: "🔴 URGENT: Unaccepted Handoff"
- Includes customer details and waiting time
- **Sent once** (not repeatedly)

### 6. Ending Handoff

**Option A: Click "End Handoff" Button**
- One-click termination

**Option B: Text Command**
```
end 918791514008
```
or
```
end handoff 918791514008
```

**Option C: Dashboard**
- Admin can end any handoff from web dashboard

**When ended:**
- Customer receives goodbye message:
  ```
  Thank you for contacting IronCore Fitness! 💪

  Our automated assistant is now back online to help you. 
  Feel free to reach out anytime!

  Stay strong! 🏋️‍♂️
  ```
- Bot resumes responding to customer
- 10-minute cooldown before handoff can retrigger

---

## Message Flow

```
CUSTOMER TRIGGERS HANDOFF
       ↓
Bot provides timing info (if booking)
       ↓
All Staff Get Notification + [Assign to Me Button]
       ↓
Staff Clicks Button OR Types "ok"
       ↓
Staff Assigned + Gets [End Handoff Button]
       ↓
Customer Message → Forwarded to Assigned Staff
Staff Reply → Auto-forwarded to Customer
       ↓
(Conversation continues bidirectionally)
       ↓
5 Minutes Pass → Owner Escalation Email (if unclaimed)
       ↓
Staff Clicks [End Handoff] OR Uses Command
       ↓
Customer Gets Goodbye Message
       ↓
Bot Resumes for Customer
       ↓
10-Minute Cooldown Active
```

---

## Cooldown System

**10-Minute Cooldown** prevents immediate re-triggering:
- Starts when handoff ends
- Bot won't trigger new handoff for same customer
- **Exception**: Explicit staff requests ("talk to owner") ALWAYS bypass cooldown

**Why:** Prevents handoff loops from simple follow-up messages

---

## Specific Staff Requests

Customer can request specific staff by name:
```
Customer: "Can I talk to Siddharth?"
```

**System Response:**
- Detects staff name in message
- Sends notification ONLY to that staff member
- Same workflow applies (assignment, messaging, ending)

---

## Staff Commands

### Bot Control (Global)
```
bot off    - Disable bot for ALL customers
bot on     - Re-enable bot
```

### Handoff Management
```
end 918791514008              - End handoff, return to bot
reply 918791514008: message   - Send message to customer
[Any text after assignment]   - Auto-forwards to customer
```

### Acknowledgments (Trigger Assignment)
```
ok
got it
on it
will handle this
```

---

## Technical Details

### Database Schema (Handoff Collection)
```javascript
{
  userId: String,              // Customer WhatsApp number
  customerName: String,        // Customer name (if known)
  message: String,             // Triggering message
  reason: String,              // handoff reason
  status: String,              // 'waiting', 'active', 'resolved'
  timestamp: Date,             // When handoff was triggered
  staffMember: String,         // Assigned staff number
  assignedAt: Date,            // When assignment happened
  requestedStaffMember: String // If customer requested specific staff
}
```

### Handoff Reasons
- `user_requested` - Customer explicitly asked
- `complex_query` - Complex question detected
- `ai_detected` - AI determined need for human
- `booking` - Booking-related request

### Context Updates
All messages (customer + staff) saved to MongoDB Context:
```javascript
{
  userId: String,
  messages: [
    { role: 'user', content: String, timestamp: Number },
    { role: 'assistant', content: String, timestamp: Number }
  ],
  metadata: {
    lastActivity: Number,
    inHandoff: Boolean,
    handoffReason: String
  }
}
```

---

## Configuration

### Environment Variables
```bash
# Staff WhatsApp Numbers (comma-separated)
STAFF_WHATSAPP_NUMBERS=918755052568,918755225619

# Staff Emails (comma-separated)
STAFF_EMAILS=siddharth.singh.25091998@gmail.com,staff2@example.com

# Owner (for escalation)
OWNER_EMAIL=owner@example.com

# Email Service
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_specific_password
```

### Customization

**Handoff Message** (in `services/handoff.js`):
```javascript
const handoffMessage = `I understand you need personalized assistance from our team...`;
```

**Goodbye Message** (in `routes/webhook.js`):
```javascript
const goodbyeMessage = `Thank you for contacting IronCore Fitness! 💪...`;
```

**Escalation Time** (in `services/escalation.js`):
```javascript
const ESCALATION_TIME_MS = 5 * 60 * 1000; // 5 minutes
```

**Cooldown Period** (in `routes/webhook.js`):
```javascript
const inCooldown = await contextService.isInHandoffCooldown(userId, 10); // 10 minutes
```

---

## Testing Checklist

- [ ] Customer triggers handoff → Staff gets WhatsApp + email
- [ ] Staff clicks "Assign to Me" → Gets end button
- [ ] Customer sends message → Staff receives it
- [ ] Staff replies → Customer receives it
- [ ] Multiple exchanges work smoothly
- [ ] 5 minutes pass → Owner gets escalation email
- [ ] Staff ends handoff → Customer gets goodbye message
- [ ] Bot resumes responding
- [ ] Cooldown prevents immediate re-trigger
- [ ] Explicit request bypasses cooldown

---

## Troubleshooting

### Staff Not Receiving Notifications
- Check STAFF_WHATSAPP_NUMBERS in .env
- Check STAFF_EMAILS in .env
- Verify email configuration (EMAIL_USER, EMAIL_PASS)
- Check MongoDB connection (staff database)

### Messages Not Forwarding
- Verify staff is assigned (check MongoDB handoff collection)
- Check staffMember field is populated
- Review server logs for errors

### Handoff Not Triggering
- Test with explicit keywords: "talk to staff"
- Check cooldown status in logs
- Verify handoff detection in logs
- Check AI API is working

### Owner Not Getting Escalation
- Verify OWNER_EMAIL in .env
- Check escalation service logs
- Confirm 5 minutes have passed
- Check handoff status is still 'waiting'

---

**Last Updated:** January 2026  
**Version:** 2.0 (With owner escalation & goodbye messages)
