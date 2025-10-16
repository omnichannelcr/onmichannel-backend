# WebSocket Integration Flow

## Updated Architecture with WebSocket Notifications

### **Inbound Message Flow (WITH WebSocket Notifications)**

```
WhatsApp/Facebook/Instagram/Telegram
           ↓ (webhook)
    Webhook Service
           ↓ (queue message)
    Inbound Processor
           ↓ (WebSocket notification)
    WebSocket Service → Connected Users
```

**Why WebSocket notifications for inbound?**
- ✅ Users need to know about NEW messages from customers
- ✅ Real-time updates for conversation list
- ✅ Multi-device synchronization
- ✅ Agent notifications

### **Outbound Message Flow (WITH WebSocket Notifications)**

```
👨‍💼 Agent A sends message → 📤 Outbound Processor → ✅ HTTP Response → 📱 Agent A's UI updates
                                                      ↓
                                              🔔 WebSocket Notification
                                                      ↓
                                              📱 Agent B's UI updates (real-time)
```

**Why WebSocket notifications for outbound?**
- ✅ Multi-agent collaboration - other agents see messages in real-time
- ✅ Multi-device sync - same user on different devices
- ✅ Team coordination - multiple agents working on same conversation
- ✅ Real-time conversation updates

## **Complete Message Flow**

### 1. **Inbound Message (Customer → Agent)**
```
Customer sends message on WhatsApp
    ↓
Webhook receives → stores in DB → queues for processing
    ↓
Inbound Processor processes → sends WebSocket notification
    ↓
Connected agents see new message in real-time
```

### 2. **Outbound Message (Agent → Customer)**
```
Agent A sends message via UI
    ↓
Outbound Processor sends to platform → stores in DB
    ↓
HTTP response confirms success → Agent A's UI updates immediately
    ↓
WebSocket notification sent to other agents
    ↓
Agent B's UI updates in real-time
```

## **WebSocket Notification Types**

### **Inbound Messages:**
- `new_message` - New message received from customer
- `conversation_assigned` - Conversation assigned to agent
- `typing_indicator` - Customer is typing

### **Outbound Messages:**
- `outbound_message` - Message sent by another agent (excludes sender)
- ✅ HTTP response handles success/failure for sender
- ✅ WebSocket notification updates other connected agents

## **Benefits of This Approach**

1. **Complete Real-time Experience**
   - WebSocket notifications for both inbound and outbound messages
   - Multi-agent collaboration and coordination

2. **Better User Experience**
   - Real-time notifications for new messages
   - Immediate feedback for sent messages (HTTP)
   - Real-time updates for other agents (WebSocket)

3. **Multi-user Support**
   - Multiple agents can work on same conversation
   - Real-time synchronization across devices
   - Team collaboration features

4. **Smart Notification Logic**
   - Sender gets immediate HTTP response
   - Other agents get WebSocket notifications
   - Excludes sender from WebSocket notifications to avoid duplication
