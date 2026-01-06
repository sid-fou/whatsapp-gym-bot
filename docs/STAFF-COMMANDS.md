# 📱 Staff WhatsApp Commands Guide

Quick reference for gym staff to manage the WhatsApp bot and customer handoffs.

---

## 🤖 Bot Control Commands

### Turn Bot Off (Pause for ALL customers)
Send any of:
- `bot off`
- `turn bot off`  
- `disable bot`
- `stop bot`

**Effect:** Bot stops responding to ALL customers. They'll need to wait for staff.

**Response:** Interactive button to turn bot back on

---

### Turn Bot On (Resume automation)
Send any of:
- `bot on`
- `turn bot on`
- `enable bot`
- `start bot`

**Effect:** Bot resumes responding to all customers automatically.

**Response:** Interactive button to turn bot off

---

## 🤝 Handoff Management

### When You Receive a Handoff Notification

You'll receive a message like:
```
🚨 CUSTOMER NEEDS ASSISTANCE
Customer: Mukesh (918791514008)
Message: "I need help with booking"
Reason: Booking request

[Assign to Me] button
```

### Claiming a Handoff

**Option 1: Click "Assign to Me" Button** (Easiest!)
- Instant assignment
- You'll get an "End Handoff" button

**Option 2: Text Acknowledgment**
Send any of:
- `ok`
- `got it`
- `on it`
- `will handle`

**Result:** You're assigned to that customer + you get "End Handoff" button

---

### Direct Messaging (After Assignment)

Once assigned, just reply normally! No commands needed:

```
✅ YOU (after assignment):
"Hi! How can I help you today?"

→ Customer receives: "Hi! How can I help you today?"

✅ Customer:
"I want to book a trial tomorrow"

→ You receive: "📱 Message from Mukesh: 'I want to book a trial tomorrow'"

✅ YOU:
"Perfect! What time works for you?"

→ Customer receives: "Perfect! What time works for you?"
```

All your messages auto-forward to the customer. No commands!

---

### Ending a Handoff

**Option 1: Click "End Handoff" Button** (Easiest!)
- One-click termination
- Customer gets goodbye message
- Bot resumes

**Option 2: Text Command**
```
end 918791514008
```
or
```
end handoff 918791514008
```

**Option 3: Dashboard**
- Log into admin dashboard
- Go to Handoffs page
- Click "End" button

**What Happens:**
1. Customer receives goodbye message:
   ```
   Thank you for contacting IronCore Fitness! 💪

   Our automated assistant is now back online to help you. 
   Feel free to reach out anytime!

   Stay strong! 🏋️‍♂️
   ```
2. Bot resumes responding to them
3. 10-minute cooldown starts (prevents immediate re-trigger)

---

## 📋 Command Reference

| Command | What it does | Example |
|---------|-------------|---------|
| `bot off` | Stop bot for ALL customers | `bot off` |
| `bot on` | Resume bot for ALL customers | `bot on` |
| Click **[Assign to Me]** | Claim handoff | *Click button* |
| `ok`, `got it`, etc. | Acknowledge handoff | `ok` |
| *Any text (after assigned)* | Auto-forward to customer | `What time works?` |
| Click **[End Handoff]** | Return customer to bot | *Click button* |
| `end 918791514008` | End handoff via text | `end 918791514008` |

---

## 💡 Usage Examples

### Example 1: Simple Handoff
```
1. You receive: "🚨 Customer needs help - 918791514008"
2. You click: [Assign to Me]
3. You type: "Hi! I'm here to help"
   → Auto-sent to customer
4. Customer: "I want to join the gym"
5. You: "Great! Let me help you with that"
   → Auto-sent to customer
6. You click: [End Handoff]
7. Customer gets goodbye message
```

### Example 2: Using Text Commands
```
1. Notification received
2. You type: "ok"
3. You get: [End Handoff] button
4. You type: "Hello! What can I help with?"
   → Auto-sent
5. Customer replies...
6. You type: "end 918791514008"
7. Customer gets goodbye message
```

### Example 3: Multiple Customers
```
Staff 1 handles Customer A
Staff 2 handles Customer B

Each staff member's messages go ONLY to their assigned customer.
No cross-contamination!
```

---

## ⚠️ Important Notes

### Phone Number Format
- **Include country code**: `918791514008` ✅
- **No spaces/dashes**: `91-879-151-4008` ❌
- **No + symbol**: `+918791514008` ❌

### Auto-Forward Rules
- Only works **after you're assigned**
- Each staff → One customer at a time
- Messages go to **your assigned customer only**

### Cooldown Period
- After handoff ends: 10-minute cooldown
- Bot won't re-trigger handoff immediately
- Exception: Customer explicitly requests ("talk to staff") always works

### Goodbye Message
- Sent automatically when handoff ends
- Customer knows bot is back online
- Professional sign-off

---

## 🔔 Owner Escalation

If no staff responds within **5 minutes**:
- Owner receives urgent escalation email
- Owner can claim handoff from dashboard
- Or any staff can still respond

**As staff, try to respond within 5 minutes!**

---

## 🆘 Quick Help

### Using Admin Dashboard

Instead of WhatsApp commands, you can:
1. Go to: http://localhost:3001 (or production URL)
2. Navigate to **Handoffs** page
3. See all active handoffs
4. Click **End** button to close any handoff
5. View full conversation history

### Multiple Staff Members

If multiple staff are online:
- **First to respond** gets assigned
- Others see "This handoff has been claimed"
- Owner gets escalation if no one responds

### When Customer Contacts You Again

After ending handoff:
- Customer can message bot normally
- If they need human help again, they can request
- 10-minute cooldown prevents accidental re-triggers

---

## 🎯 Best Practices

1. **Respond quickly** - Claim within 5 minutes if possible
2. **Be clear** - Customer knows they're talking to staff
3. **End properly** - Always use button or command to end
4. **Check dashboard** - For conversation history if needed
5. **Use buttons** - Faster than typing commands

---

## 📞 Support

Issues with commands or notifications?
1. Check you're in STAFF_WHATSAPP_NUMBERS (in server .env)
2. Ask admin to verify your number in system
3. Test with: `bot off` then `bot on`
4. Check admin dashboard for your account

---

**Last Updated:** January 2026  
**Quick Reference Card** - Keep this handy! 📌
