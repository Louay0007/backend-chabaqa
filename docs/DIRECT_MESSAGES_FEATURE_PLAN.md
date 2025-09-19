## Direct Messages Feature Plan (Community DMs + Help Chat)

### Goals
- Enable private 1:1 messaging for:
  - Community Member ↔ Community Creator (only if the user is a member of that community)
  - Any Authenticated User ↔ Platform Admin (Help Chat)
- Real-time delivery (via WebSocket), persistence, pagination, unread counts, and notifications.

### High-Level Architecture
- Data layer (MongoDB/Mongoose): `Conversation`, `Message`, `HelpThread` (alias of `Conversation` with special type) schemas
- API (REST): Start/get conversations, list history, send messages, mark read, list inboxes
- Real-time (Gateway): Socket events for message delivery and read receipts
- Policy checks: Community membership gating for Community DMs; Admin role gating for Help Chat admin inbox
- Notifications: Optional email on first message if recipient offline; push future-proofing

### Conversation Types
- COMMUNITY_DM: `memberUserId` ↔ `creatorUserId` constrained by `communityId`
- HELP_DM: `endUserId` ↔ `adminUserId` (admin assigned, or unassigned queue with round-robin/claim)

### Data Model
- Conversation
  - id (string, unique)
  - type: 'COMMUNITY_DM' | 'HELP_DM'
  - participantA: Types.ObjectId (User)
  - participantB: Types.ObjectId (User)
  - communityId?: Types.ObjectId (Community) for COMMUNITY_DM
  - lastMessageAt: Date (indexed desc)
  - lastMessageText: string (for fast previews)
  - unreadCountA: number
  - unreadCountB: number
  - isOpen: boolean (for help threads; creator/member DMs always open)
  - createdAt/updatedAt
  - Indexes: (type, participantA, participantB, communityId unique composite), lastMessageAt desc

- Message
  - id (string, unique)
  - conversationId: Types.ObjectId (Conversation)
  - senderId: Types.ObjectId (User)
  - recipientId: Types.ObjectId (User)
  - text: string (optional if attachments)
  - attachments?: [{ url: string, type: 'image'|'file'|'video', size: number }]
  - sentAt: Date
  - readAt?: Date
  - editedAt?: Date
  - deletedFor?: [Types.ObjectId] soft-delete per user
  - Indexes: (conversationId, sentAt), (recipientId, readAt)

### Access & Policy
- COMMUNITY_DM:
  - Guard: sender must be member of `communityId`
  - Other participant must be the community's creator (from community record)
  - Only 1 conversation per (member, creator, community)
- HELP_DM:
  - Any authenticated user can create/open a help thread
  - Admins see queue: unassigned threads and assigned-to-me
  - Assignment: first admin to send message becomes `participantB` (or explicit claim endpoint)

### Endpoints (REST)
- POST /dm/community/start { communityId } → returns conversation
- POST /dm/help/start → returns conversation (help thread)
- GET /dm/inbox?type=community|help&page=&limit= → list conversations for current user
- GET /dm/:conversationId/messages?page=&limit= → paginated messages
- POST /dm/:conversationId/messages { text, attachments? } → send
- PATCH /dm/:conversationId/read → mark all as read
- Admin-only:
  - GET /dm/help/queue → unassigned threads
  - PATCH /dm/help/:conversationId/assign → claim thread

### WebSocket Events (Gateway)
- dm:message:new { conversationId, message }
- dm:message:read { conversationId, userId, readAt }
- dm:conversation:assigned { conversationId, adminUserId }

### Services
- DmService
  - startCommunityConversation(userId, communityId)
  - startHelpConversation(userId)
  - sendMessage(conversationId, senderId, payload)
  - listInbox(userId, type, pagination)
  - listMessages(conversationId, userId, pagination)
  - markRead(conversationId, userId)
  - assignHelpThread(conversationId, adminId)
- DmGateway
  - handle connection auth via JWT, join rooms by userId and conversationId
  - emit events to participants

### Storage & Uploads
- Reuse `UploadService` for attachments; enforce storage quotas via `PolicyService`
- Validate attachment size/type; store URLs in message documents

### Notifications
- EmailService integration: on first message and user offline → send email
- Throttle per user to avoid email spam

### Rate Limiting & Abuse Prevention
- Per-user send rate: e.g., 20 msgs / minute
- Profanity/spam placeholder hook for future moderation
- Blocklist table (future)

### Auditing & Privacy
- Soft delete per user; retain audit trail for admins
- Read receipts at conversation granularity (mark all up to last message)

### Testing Plan
- Unit: services (start, send, mark read, assign), policy checks
- E2E: REST flows + WebSocket delivery
- Load: inbox pagination and message list queries

### Rollout
- Phase 1: REST + basic WebSocket without attachments
- Phase 2: Attachments + email notifications
- Phase 3: Help queue assignment and admin tools

---

## Step-by-Step Tasks

1) Schemas & Indexes
- Create `conversation.schema.ts`, `message.schema.ts`
- Add indexes and unique constraints
- Wire into `AppModule` via `MongooseModule.forFeature`

2) Module & Wiring
- Create `dm` module with controller, service, gateway
- Import `AuthModule`, `UploadModule`, `PolicyModule`

3) Community DM Flow
- Implement `startCommunityConversation` with membership checks
- Implement send/list/read endpoints

4) Help Chat Flow
- Implement thread creation for any user
- Admin queue listing and assignment
- Send/list/read endpoints shared with community DM

5) WebSocket Gateway
- JWT auth on connect
- Rooms by `user:{userId}` and `conv:{conversationId}`
- Broadcast message and read receipt events

6) Attachments & Uploads
- Accept multipart/form-data or pre-upload then reference URLs
- Validate via `UploadService` and `PolicyService`

7) Notifications
- Email on first message if recipient offline
- Config flag to enable/disable in `.env`

8) Rate Limiting & Guards
- Per-route throttling (Nest Throttler) on send
- Guards for membership and admin access

9) Docs
- Update API docs (Swagger decorators)
- Add usage guide for frontend (payloads + socket events)

10) Testing
- Unit tests for service logic
- E2E tests for critical endpoints and WS events

11) Deployment
- Env toggles: DM_FEATURE_ENABLED, EMAIL_NOTIFICATIONS_ENABLED
- Migrations: ensure indexes are built

---

## API Contracts (Draft)

POST /dm/community/start
Request: { communityId: string }
Response: { conversation: { id, type, communityId, participantA, participantB } }

POST /dm/help/start
Response: { conversation: { id, type, participantA, participantB?, isOpen } }

GET /dm/inbox?type=community|help&page=&limit=
Response: { items: [{ id, lastMessageText, lastMessageAt, unreadCount }], page, total }

GET /dm/:conversationId/messages?page=&limit=
Response: { items: [{ id, senderId, text, attachments, sentAt, readAt }], page, total }

POST /dm/:conversationId/messages
Request: { text?: string, attachments?: [{ url, type, size }] }
Response: { message }

PATCH /dm/:conversationId/read
Response: { ok: true, readAt }

Admin
GET /dm/help/queue → { items: [conversation...] }
PATCH /dm/help/:conversationId/assign → { conversation }


