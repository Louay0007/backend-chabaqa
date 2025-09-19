## Direct Messages - Frontend Integration Guide

### Overview
- Two DM types:
  - COMMUNITY_DM: member ↔ community creator, only if the user is a member of that community
  - HELP_DM: any authenticated user ↔ platform admin (admin can be assigned automatically on first admin reply)
- Real-time via Socket.IO namespace `/dm`
- REST for starting conversations, listing inbox/messages, sending messages, marking as read, uploading attachments

### Auth
- All endpoints require JWT bearer. Include `Authorization: Bearer <token>` in REST and pass the same token to socket handshake:
  - Socket connect: `io('/dm', { auth: { token } })`

### REST Endpoints
- Start conversations
  - POST `/dm/community/start` body: `{ communityId: string }` → `{ conversation }`
  - POST `/dm/help/start` → `{ conversation }`

- Inbox and messages
  - GET `/dm/inbox?type=community|help&page=1&limit=20` → `{ items, page, total }`
  - GET `/dm/:conversationId/messages?page=1&limit=30` → `{ items, page, total }`

- Send message
  - POST `/dm/:conversationId/messages` body: `{ text?: string, attachments?: [{ url, type: 'image'|'file'|'video', size }] }` → `{ message }`
  - Rate limit: ~20 messages/min per user

- Mark as read
  - PATCH `/dm/:conversationId/read` → `{ ok: true, readAt }`

- Upload attachment and send
  - POST `/dm/:conversationId/attachments` form-data: `file` (single)
  - Returns `{ message }` with attachment; storage quota enforced by plan

- Admin (help queue)
  - GET `/dm/help/queue` (admin only) → `{ items: [conversation...] }`
  - PATCH `/dm/help/:conversationId/assign` (admin only) → `{ conversation }`

### WebSocket (Socket.IO)
- Connect
```ts
import { io } from 'socket.io-client';
const socket = io('/dm', { auth: { token: jwt } });

socket.on('connect', () => {
  // join conversation room optionally
  socket.emit('dm:join', { conversationId });
});
```

- Events
  - `dm:message:new` payload: `{ conversationId, message }`
  - `dm:message:read` payload: `{ conversationId, userId, readAt }`

### Common Flows
1) Community DM
```ts
// Start or get conversation
const { conversation } = await api.post('/dm/community/start', { communityId });

// Load history
const { items } = await api.get(`/dm/${conversation._id}/messages`, { params: { page: 1, limit: 30 } });

// Listen realtime
socket.emit('dm:join', { conversationId: conversation._id });
socket.on('dm:message:new', ({ conversationId, message }) => { /* update UI */ });

// Send text
await api.post(`/dm/${conversation._id}/messages`, { text: 'Hello!' });

// Mark read
await api.patch(`/dm/${conversation._id}/read`);
```

2) Help Chat (User side)
```ts
const { conversation } = await api.post('/dm/help/start');
// same as above for listing, joining, sending, reading
```

3) Help Chat (Admin side)
```ts
// List unassigned threads
const { items } = await api.get('/dm/help/queue');

// Assign a thread (optional; auto-assign occurs when admin replies the first time)
await api.patch(`/dm/help/${conversationId}/assign`);

// Reply (auto-assign if not assigned)
await api.post(`/dm/${conversationId}/messages`, { text: 'How can I help?' });
```

4) Attachments
```ts
const form = new FormData();
form.append('file', file); // File from input
const { message } = await api.post(`/dm/${conversationId}/attachments`, form, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

### Data Shapes (simplified)
- conversation
```ts
{
  _id: string,
  type: 'COMMUNITY_DM' | 'HELP_DM',
  participantA: string,
  participantB?: string,
  communityId?: string,
  lastMessageText: string,
  lastMessageAt?: string,
  unreadCountA: number,
  unreadCountB: number,
  isOpen: boolean
}
```

- message
```ts
{
  _id: string,
  conversationId: string,
  senderId: string,
  recipientId: string,
  text?: string,
  attachments: [{ url: string, type: 'image'|'file'|'video', size: number }],
  createdAt: string,
  readAt?: string
}
```

### Notes & Constraints
- Community DM requires the user to be a member of the target community; backend enforces this.
- Help threads: first admin reply auto-assigns the thread.
- Attachments: file types/sizes are validated; uploads count against the plan storage quota.
- Rate limits: sending is throttled; handle 429 cases with UI feedback/retry.
- Rooms: for best realtime UX, join `conv:{conversationId}` after loading a conversation.

### Error Handling (typical)
- 401/403: missing/invalid token, or not a participant
- 404: conversation not found
- 400: empty message body, invalid file type
- 429: throttled; show a message and retry later


