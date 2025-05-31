# Chat Messaging Socket Documentation

## Overview
The FriendsBook chat messaging system uses Socket.IO for real-time communication between users. It supports both matrimony and video calling profiles with comprehensive messaging features including text, images, PDFs, and virtual gifts.

## Connection Setup

### Socket Connection
```javascript
const socket = io('/socket/chat-messaging', {
    extraHeaders: {
        'Authorization': `${profileType}:${authToken}`
    }
});
```

### Authentication Headers
- **Format**: `{profileType}:{authToken}`
- **Profile Types**:
  - `matrimony_members` - For matrimonial service users
  - `video_calling_members` - For video calling service users  
- **Token**: 64-character hexadecimal authentication string

### Supported User Types
- **Matrimony Profile**: Users in matrimonial services with User model
- **Video Profile**: Users in video calling services with VideoProfile model

## Events Reference

### Client → Server Events

#### 1. `server:initialize-message`
**Purpose**: Initialize user's messaging system and join existing chat rooms  
**Authentication**: Required  
**Payload**: None

```javascript
socket.emit('server:initialize-message');
```

**Business Logic**:
- Loads user's existing chat rooms
- Automatically joins all connected rooms
- Returns list of active conversations
- For matrimony users: checks membership status (commented out)

---

#### 2. `server:open-message-room`
**Purpose**: Open or create a chat room with another user  
**Payload**: `messengerId` (string) - ObjectId of target user

```javascript
socket.emit('server:open-message-room', messengerId);
```

**Validation**:
- Cannot message yourself
- Target user must exist
- Creates new room if none exists
- Updates both users' connected rooms list

---

#### 3. `server:join-room`
**Purpose**: Join a specific messaging room  
**Payload**: `roomId` (string) - MongoDB ObjectId of the room

```javascript
socket.emit('server:join-room', roomId);
```

**Authorization**:
- User must be a member of the room
- Room must exist in database

---

#### 4. `server:send-message-event`
**Purpose**: Send a text message  
**Payload**:
- `message` (string) - Message content
- `msg_id` (string) - UUID for client-side tracking
- `roomId` (string) - Target room ObjectId

```javascript
socket.emit('server:send-message-event', message, msg_id, roomId);
```

**Message Validation Rules**:
- **Length**: 1-1000 characters
- **No character spam**: Max 6 consecutive identical characters
- **Security**: No script tags, MongoDB operators, or XSS attempts
- **Character set**: ASCII characters only
- **Trimmed**: Leading/trailing whitespace removed

---

#### 5. `server:send-image-event`
**Purpose**: Send an image message  
**Payload**:
- `url` (string) - Valid image URL
- `msg_id` (string) - UUID for tracking
- `roomId` (string) - Target room ObjectId

```javascript
socket.emit('server:send-image-event', imageUrl, msg_id, roomId);
```

**Validation**:
- URL must be valid format
- Room authorization required

---

#### 6. `server:send-pdf-event`
**Purpose**: Send a PDF document  
**Payload**:
- `pdf_id` (string) - UUID identifier for PDF
- `pdfName` (string) - Filename (1-120 characters)
- `msg_id` (string) - ObjectId for message tracking
- `roomId` (string) - Target room ObjectId

```javascript
socket.emit('server:send-pdf-event', pdf_id, pdfName, msg_id, roomId);
```

---

#### 7. `server:send-gift-event` *(Video Profiles Only)*
**Purpose**: Send virtual gift with coin transfer  
**Payload**:
- `gift_id` (string) - ObjectId of gift
- `msg_id` (string) - UUID for tracking
- `roomId` (string) - Target room ObjectId

```javascript
socket.emit('server:send-gift-event', gift_id, msg_id, roomId);
```

**Business Logic**:
- Only video profile users can send gifts
- Validates sender has sufficient coins
- Transfers coins from sender to receiver (currently commented out)
- Room must be video_calling_member type

---

#### 8. `server:typing-start`
**Purpose**: Indicate user started typing  
**Payload**: `roomId` (string) - Room ObjectId

```javascript
socket.emit('server:typing-start', roomId);
```

---

#### 9. `server:typing-end`
**Purpose**: Indicate user stopped typing  
**Payload**: `roomId` (string) - Room ObjectId

```javascript
socket.emit('server:typing-end', roomId);
```

---

#### 10. `server:check-msg` *(Video Profiles Only)*
**Purpose**: Retrieve message history from a specific date  
**Payload**:
- `fromDate` (string) - ISO date string
- `roomId` (string) - Room ObjectId

```javascript
socket.emit('server:check-msg', fromDate, roomId);
```

**Constraints**:
- Only for video calling members
- Date must be in the past
- Returns messages from others (excludes sender's messages)

## Server → Client Events

### Success Response Events

#### 1. `client:connected`
**Trigger**: On successful socket connection  
**Data**:
```typescript
{
    message: 'connection SuccessFull'
}
```

#### 2. `client:message-initialization-completed`
**Trigger**: After successful message initialization  
**Data**:
```typescript
interface ActiveRoom {
    userName: string;
    userId: string;
    room: string;
}

socket.on('client:message-initialization-completed', (activeRooms: ActiveRoom[]) => {
    // Handle active rooms list
});
```

#### 3. `client:messaging-room-opened`
**Trigger**: When room is successfully opened/created  
**Data**:
```typescript
interface RoomOpened {
    roomId: string;
    otherUser: {
        name: string;
        profileImage: string;
        _id: string;
        socket_ids?: {
            messaging_socket: string;
        }
    };
    messengerId: string;
}

socket.on('client:messaging-room-opened', (data: RoomOpened) => {
    // Handle room opening
});
```

#### 4. `client:joined-room`
**Trigger**: After successfully joining a room  
**Data**:
```typescript
{
    roomId: string;
}
```

#### 5. `client:message-send-successful`
**Trigger**: Text message sent successfully  
**Data**:
```typescript
{
    msg_id: string;
    message_id: string;
    roomId: string;
}
```

#### 6. `client:image-send-successful`
**Trigger**: Image sent successfully  
**Data**:
```typescript
{
    message_id: string;
    msg_id: string;
    roomId: string;
}
```

#### 7. `client:pdf-send-successful`
**Trigger**: PDF sent successfully  
**Data**:
```typescript
{
    message_id: string;
    msg_id: string;
    roomId: string;
}
```

#### 8. `client:gift-send-successful`
**Trigger**: Gift sent successfully  
**Data**:
```typescript
{
    msg_id: string;
    message_id: string;
    roomId: string;
    remaining_coins: number;
}
```

#### 9. `client:found-prev-message`
**Trigger**: Message history retrieved successfully  
**Data**:
```typescript
{
    roomId: string;
    messages: Array<{
        _id: string;
        type: 'text' | 'image' | 'pdf' | 'gift';
        content: string;
        msg_id: string;
    }>;
    fromDate: Date;
}
```

### Real-time Notification Events

#### 1. `client:unseen-message`
**Trigger**: When receiving a new text message  
**Data**:
```typescript
interface UnseenMessage {
    message: string;
    msg_id: string;
    message_id: string;
    sender: string;
    roomId: string;
}

socket.on('client:unseen-message', (data: UnseenMessage) => {
    // Display new message
});
```

#### 2. `client:unseen-image`
**Trigger**: When receiving a new image  
**Data**:
```typescript
{
    image: string; // URL
    msg_id: string;
    message_id: string;
    sender: string;
    roomId: string;
}
```

#### 3. `client:unseen-pdf`
**Trigger**: When receiving a new PDF  
**Data**:
```typescript
{
    pdf_id: string;
    pdfName: string;
    message_id: string;
    msg_id: string;
    sender: string;
    roomId: string;
}
```

#### 4. `client:received-gift`
**Trigger**: When receiving a virtual gift  
**Data**:
```typescript
{
    gift_id: string;
    gift_name: string;
    gift_image: string;
    msg_id: string;
    message_id: string;
    sender: string;
    senderName: string;
    roomId: string;
}
```

#### 5. `client:user-typing`
**Trigger**: When another user starts typing  
**Data**:
```typescript
{
    userId: string;
    roomId: string;
}
```

#### 6. `client:user-stopped-typing`
**Trigger**: When another user stops typing  
**Data**:
```typescript
{
    userId: string;
    roomId: string;
}
```

### Error Events

#### 1. `client:initialize-message-error`
**Data**: `{ message: string }`

#### 2. `client:message-room-opening-error`
**Data**: `{ messengerId: string, message: string }`

#### 3. `client:join-room-error`
**Data**: `{ message: string }`

#### 4. `client:sent-message-failed`
**Data**: `{ msg_id: string }`

#### 5. `client:sent-image-failed`
**Data**: `{ msg_id: string }`

#### 6. `client:sent-pdf-failed`
**Data**: `{ msg_id: string }`

#### 7. `client:sent-gift-failed`
**Data**: `{ message?: string, gift_id?: string }`

#### 8. `client:check-msg-error`
**Data**: `{ message: null }`

## Database Models

### MessagingRoom
```typescript
interface MessagingRoom {
    _id: ObjectId;
    members: ObjectId[]; // Array of user IDs
    memberType: 'matrimony_member' | 'video_calling_member';
    createdAt: Date;
    updatedAt: Date;
}
```

### Message
```typescript
interface Message {
    _id: ObjectId;
    room: ObjectId; // Reference to MessagingRoom
    sender: ObjectId; // User ID
    type: 'text' | 'image' | 'pdf' | 'gift';
    content: string; // Message content or resource ID
    id: string; // Client-generated UUID
    createdAt: Date;
}
```

### User (Matrimony Profile)
```typescript
interface User {
    _id: ObjectId;
    name: string;
    profileImage: string;
    socket_ids: {
        messaging_socket: string | null;
    };
    messagingRooms: {
        connectedRooms: ObjectId[];
    };
    membership?: {
        currentMembership?: {
            membership_exipation_date: Date;
        };
    };
}
```

### VideoProfile (Video Calling Profile)
```typescript
interface VideoProfile {
    _id: ObjectId;
    name: string;
    profileImage: string;
    socket_ids: {
        messaging_socket: string | null;
    };
    messagingRooms: {
        connectedRooms: ObjectId[];
    };
    video_calling_coins: number;
}
```

### Gifts (Virtual Gifts)
```typescript
interface Gift {
    _id: ObjectId;
    name: string;
    image: string;
    coins: number; // Cost in virtual coins
}
```

## Complete Implementation Example

```javascript
// Connection setup
const socket = io('/socket/chat-messaging', {
    extraHeaders: {
        'Authorization': `matrimony_members:${authToken}`
    }
});

// Connection handling
socket.on('connect', () => {
    console.log('Connected to messaging socket');
    socket.emit('server:initialize-message');
});

socket.on('client:connected', (data) => {
    console.log(data.message);
});

// Initialize messaging
socket.on('client:message-initialization-completed', (activeRooms) => {
    console.log('Active rooms:', activeRooms);
    activeRooms.forEach(room => {
        displayRoomInUI(room);
    });
});

socket.on('client:initialize-message-error', (error) => {
    console.error('Initialization failed:', error.message);
});

// Room management
function openChatRoom(userId) {
    socket.emit('server:open-message-room', userId);
}

socket.on('client:messaging-room-opened', (data) => {
    console.log('Room opened:', data);
    joinRoom(data.roomId);
    displayChatInterface(data);
});

function joinRoom(roomId) {
    socket.emit('server:join-room', roomId);
}

socket.on('client:joined-room', (data) => {
    console.log('Joined room:', data.roomId);
});

// Send messages
function sendTextMessage(roomId, message) {
    const msg_id = crypto.randomUUID();
    socket.emit('server:send-message-event', message, msg_id, roomId);
    
    // Add to UI with pending status
    addMessageToUI({
        id: msg_id,
        content: message,
        type: 'text',
        status: 'pending',
        timestamp: new Date()
    });
}

function sendImage(roomId, imageUrl) {
    const msg_id = crypto.randomUUID();
    socket.emit('server:send-image-event', imageUrl, msg_id, roomId);
}

function sendPDF(roomId, pdfId, pdfName) {
    const msg_id = crypto.randomUUID();
    socket.emit('server:send-pdf-event', pdfId, pdfName, msg_id, roomId);
}

// Video profile only - send gift
function sendGift(roomId, giftId) {
    const msg_id = crypto.randomUUID();
    socket.emit('server:send-gift-event', giftId, msg_id, roomId);
}

// Handle message confirmations
socket.on('client:message-send-successful', (data) => {
    updateMessageStatus(data.msg_id, 'sent', data.message_id);
});

socket.on('client:sent-message-failed', (data) => {
    updateMessageStatus(data.msg_id, 'failed');
});

// Receive messages
socket.on('client:unseen-message', (data) => {
    addMessageToUI({
        id: data.msg_id,
        content: data.message,
        type: 'text',
        sender: data.sender,
        timestamp: new Date(),
        messageId: data.message_id
    });
});

socket.on('client:unseen-image', (data) => {
    addMessageToUI({
        id: data.msg_id,
        content: data.image,
        type: 'image',
        sender: data.sender,
        timestamp: new Date()
    });
});

socket.on('client:received-gift', (data) => {
    addGiftToUI({
        id: data.msg_id,
        giftId: data.gift_id,
        giftName: data.gift_name,
        giftImage: data.gift_image,
        sender: data.sender,
        senderName: data.senderName,
        timestamp: new Date()
    });
});

// Typing indicators
let typingTimer;

function handleTypingStart(roomId) {
    socket.emit('server:typing-start', roomId);
    
    // Auto-stop typing after 3 seconds of inactivity
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
        socket.emit('server:typing-end', roomId);
    }, 3000);
}

function handleTypingStop(roomId) {
    clearTimeout(typingTimer);
    socket.emit('server:typing-end', roomId);
}

socket.on('client:user-typing', (data) => {
    showTypingIndicator(data.userId, data.roomId);
});

socket.on('client:user-stopped-typing', (data) => {
    hideTypingIndicator(data.userId, data.roomId);
});

// Message history (Video profiles only)
function loadMessageHistory(roomId, fromDate) {
    socket.emit('server:check-msg', fromDate.toISOString(), roomId);
}

socket.on('client:found-prev-message', (data) => {
    console.log('Previous messages:', data.messages);
    data.messages.forEach(message => {
        addMessageToUI({
            id: message.msg_id,
            content: message.content,
            type: message.type,
            timestamp: new Date(), // You might want to use actual message timestamp
            isHistorical: true
        });
    });
});

// Error handling
socket.on('connect_error', (error) => {
    console.error('Connection failed:', error);
});

socket.on('disconnect', (reason) => {
    console.log('Disconnected:', reason);
});

// Helper functions (implement based on your UI framework)
function displayRoomInUI(room) {
    // Add room to chat list
}

function displayChatInterface(roomData) {
    // Show chat interface for the room
}

function addMessageToUI(message) {
    // Add message to chat display
}

function updateMessageStatus(msgId, status, messageId = null) {
    // Update message status in UI
}

function showTypingIndicator(userId, roomId) {
    // Show "User is typing..." indicator
}

function hideTypingIndicator(userId, roomId) {
    // Hide typing indicator
}

function addGiftToUI(gift) {
    // Display received gift in chat
}
```

## Security Features

### Input Validation
- **Message Content**: Length limits, character restrictions, XSS prevention
- **File Uploads**: URL validation for images, filename restrictions for PDFs
- **MongoDB Injection**: Filters out MongoDB operators and malicious patterns
- **Script Prevention**: Blocks `<script>` tags and executable content

### Authorization
- **Room Access**: Users can only join rooms they're members of
- **Message Sending**: Validates room membership before allowing messages
- **Profile-based Restrictions**: Gift sending limited to video profiles

### Rate Limiting Considerations
The current implementation doesn't include rate limiting. Consider adding:
- Message frequency limits per user
- Connection attempt limits
- Typing event throttling

## Error Handling Best Practices

1. **Always handle failed events** on the client side
2. **Implement retry logic** for critical operations
3. **Validate data** before emitting events
4. **Show user-friendly error messages** instead of raw error data
5. **Log errors** for debugging purposes

## Performance Considerations

1. **Room Management**: Users automatically join all their connected rooms on initialization
2. **Message History**: Limited to video profiles and requires date filtering
3. **Socket Storage**: User socket IDs are stored and cleaned up on disconnect
4. **Broadcasting**: Messages are broadcast only to room members, not globally

This documentation provides a comprehensive guide for implementing and integrating with the FriendsBook chat messaging system.