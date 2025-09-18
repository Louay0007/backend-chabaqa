## Chabaqa Pricing, Plans, Payments, and Access Guide

This document summarizes what is implemented today and what remains, aligned with the platform guide.

### Core Concepts (Implemented)
- Creators can create unlimited content; activation/publish requires an active/trial subscription.
- Plan limits enforced via `PolicyService`:
  - CommunitiesMax, MembersMax, CoursesActivationMax (implemented).
  - AdminsMax (implemented with endpoints to add/remove admins).
  - Storage quotas (implemented, plan-based and persisted).
- Platform fees are calculated per transaction using `FeeService` and stored on `Order`.
- Promo codes are supported across content types via `PromoService`.
- Orders record amount, platform fee, creator net, promo code, discount, status, paymentId, paymentMethod.

### Plans and Limits
- STARTER: 1 community, 100 members, up to 3 activated courses, ~2GB storage, higher fees.
- GROWTH: 3 communities, 10,000 total members, no activation limit for courses, 50GB storage.
- PRO: unlimited communities/members/courses; AdminsMax=3, higher features.
- ENTERPRISE: custom.

Limits are cached in subscriptions and returned by `PolicyService.getEffectiveLimitsForCreator()`.

### Community Models and Access (Implemented)
- Free community: some free, some paid content. Free courses are accessible to community members without separate purchase.
- Paid community: checkout grants membership; free courses included; paid courses remain separate purchase.
- Standalone purchases: challenges, products, sessions, events do not require community membership.

### Storage Quotas (Implemented)
- `UploadService` enforces plan-based storage using `StorageUsage` collection.
- Quota is checked on upload; usage is persisted per user.

### Fees and Orders (Implemented)
- `FeeService` computes `platformFeeDT` and `creatorNetDT` by creator plan.
- `Order` schema captures: buyerId, creatorId, contentType, contentId, amountDT, platformPercent, platformFixedDT, platformFeeDT, creatorNetDT, promoCode, discountDT, status, paymentId, paymentMethod.

### Promo Codes (Implemented)
- `PromoCode` schema; `PromoService.validateAndApply()` applied in all init flows.
- Stored on `Order` as `promoCode` and `discountDT`.

---

## Payment Flows (Flouci)

Chabaqa uses Flouci for payment initiation and verification. Funds currently settle to the platform wallet; payouts to creators are handled later (planned) via transfer API or manual settlements.

Environment (set in `.env`):
- `FLOUCI_BASE_URL=https://developers.flouci.com/api/`
- `FLOUCI_APP_TOKEN=...` (public)
- `FLOUCI_APP_SECRET=...` (private)
- `FLOUCI_DEVELOPER_TRACKING_ID=...`
- `FRONTEND_URL=http://localhost:3000` (or production)
- `PAYMENT_MODE=instant` (default; set to `offline` to simulate manual approvals)
- `FLOUCI_WEBHOOK_SECRET=...` (optional; enables HMAC signature validation)

Services/Controllers:
- `FlouciPaymentService` (init/verify using axios)
- `PaymentController` (init + verify endpoints)

### Endpoints Summary

Flouci init (creates pending `Order`, returns link/QR):
- POST `/payments/init/community`
  - body: `{ communityId: string, userId: string }`
  - query: `promoCode?: string`
  - creates pending `Order` with `contentType=community`
- POST `/payments/init/course`
  - body: `{ courseId: string, userId: string }`
  - query: `promoCode?: string`
  - creates pending `Order` with `contentType=course`
- POST `/payments/init/challenge`
  - body: `{ challengeId: string, userId: string }`
  - query: `promoCode?: string`
  - creates pending `Order` with `contentType=challenge`
- POST `/payments/init/event`
  - body: `{ eventId: string, ticketType: string, userId: string }`
  - query: `promoCode?: string`
  - creates pending `Order` with `contentType=event`
- POST `/payments/init/product`
  - body: `{ productId: string, userId: string }`
  - query: `promoCode?: string`
  - creates pending `Order` with `contentType=product`
- POST `/payments/init/session`
  - body: `{ sessionId: string, userId: string }`
  - query: `promoCode?: string`
  - creates pending `Order` with `contentType=session`

- POST `/payments/init/subscription`
  - body: `{ userId: string, tier: 'STARTER'|'GROWTH'|'PRO' }`
  - creates pending `Order` with `contentType=subscription` where `contentId=tier`

Verification and webhook:
- GET `/payments/verify?paymentId=...`
  - On SUCCESS: marks `Order` paid and grants access:
    - community: add member
    - course: enroll
    - challenge: join
    - subscription: upgrade plan to the purchased tier
    - (event/product/session: order is paid; grant flow can be extended to auto-register/book/download)
  - If `PAYMENT_MODE=offline`, verify will mark paid (used for manual approvals; currently no admin endpoints are exposed by choice).
- POST `/payments/webhook` (HMAC-secured)
  - header: `x-flouci-signature` computed with `FLOUCI_WEBHOOK_SECRET`
  - body: `{ payment_id: string }`
  - server validates signature and reconciles by calling `verify`

Notes:
- Event `ticketType` should be stored in `Order` metadata to auto-register on verify (planned extension).
- For product digital download, the platform currently records the Order; download granting can be tied to paid status.

---

## Access Logic (Implemented)

- Course chapter access:
  - If chapter is free (preview): accessible to anyone.
  - If course is free: accessible to community members (creator/admin/member) without purchase.
  - If paid: requires enrollment (or paid order).
- Community membership via paid checkout grants access to free courses within that community.
- Standalone flows: challenges, sessions, products, events can be purchased independently.

---

## Admins and Team Power (Implemented)
- `AdminsMax` enforced via `PolicyService.canAddAdmin` and community service/controller endpoints:
  - POST `/community-aff-crea-join/:id/admins/:userId` add admin (respecting AdminsMax)
  - POST `/community-aff-crea-join/:id/admins/:userId/remove` remove admin (creator only)

---

## What’s Missing / Planned

1) Payouts to creators (important)
- Today: funds settle to platform wallet. We record `creatorNetDT` in `Order`.
- Next: implement payout ledger + transfer API to send `creatorNetDT` to the creator’s Flouci wallet on schedule.

2) Webhooks (done)
- Implemented HMAC-validated webhook `/payments/webhook` to reconcile orders in real time.

3) Subscriptions end-to-end (partially done)
- Flouci init/verify for plan purchase implemented and plan upgrade on success.
- Next: scheduled job to renew/downgrade on period/trial end + receipts.

4) Event auto-registration
- Persist `ticketType` in `Order` metadata and call `EventService.registerAttendee` after verify success.

5) Product/session fulfillment
- For products: bind paid Orders to secure download entitlement.
- For sessions: auto-create confirmed/pending booking after payment.

6) Promo admin UI/CRUD and analytics
- Endpoints to create/update/deactivate promo codes; usage stats.

7) Feature gating by plan
- Enforce plan-required features (automation, gamification, verified/featured, custom branding) at service level.

8) Trial/subscription enforcement
- Enforce 7-day trial start/expiry; auto-downgrade and UX notices.

9) E2E tests
- Cover trials, quotas, fees, promos, payment flows, and reconciliation paths.

---

## File Map (Key)
- Payments
  - `src/common/services/flouci-payment.service.ts` (Flouci API calls)
  - `src/common/controllers/payment.controller.ts` (init, verify, webhook)
- Orders & fees
  - `src/schema/order.schema.ts`
  - `src/common/services/fee.service.ts`
- Promos
  - `src/schema/promo-code.schema.ts`
  - `src/common/services/promo.service.ts`
  - `src/common/modules/promo.module.ts`
- Plans & policy
  - `src/schema/plan.schema.ts`, `src/schema/subscription.schema.ts`
  - `src/common/services/policy.service.ts`
- Communities
  - `src/community-aff-crea-join/*` (includes paid membership checkout via payments and direct checkout in service)
- Courses
  - `src/cours/cours.service.ts` (enrollment + access rules)
- Storage
  - `src/schema/storage-usage.schema.ts`, `src/upload/*` (plan-based quota)

---

## Quick Start for Payments
1. Set env: FLOUCI_* and FRONTEND_URL.
2. Start flows:
   - Community: `POST /payments/init/community`
   - Course: `POST /payments/init/course`
   - Challenge: `POST /payments/init/challenge`
   - Event: `POST /payments/init/event`
   - Product: `POST /payments/init/product`
   - Session: `POST /payments/init/session`
3. After redirect: call `GET /payments/verify?paymentId=...` (or configure webhook) to finalize access.

---

## Frontend Integration Guide (Detailed)

### Auth
- All init endpoints require a logged-in user context. Send JWT in `Authorization: Bearer <token>` if your gateway enforces guards at the route level (current `PaymentController` does not add guards, but upstream API gateway may).

### Common Data
- Promo codes: pass as `?promoCode=CODE` on init endpoints.
- Success/Fail redirects: Flouci uses the URLs we pass from backend; frontend should read query params after redirect and show status.
- Order statuses: `pending | paid | refunded` (verify/webhook flips to `paid`).
- Amounts: All amounts are in DT in API responses; Flouci init converts to millimes internally.

### Endpoints and Payloads

1) Init Community Membership
- POST `/payments/init/community`
  - body JSON:
    ```json
    { "communityId": "<communityId>", "userId": "<currentUserId>" }
    ```
  - optional: `?promoCode=SUMMER10`
  - 200 JSON:
    ```json
    { "link": "https://flouci.link/...", "paymentId": "abc123", "qrCode": "data:image/png;base64,..." }
    ```
  - On success verify/webhook: user becomes member.

2) Init Course Purchase
- POST `/payments/init/course`
  - body: `{ "courseId": "<id>", "userId": "<currentUserId>" }`
  - optional: `?promoCode=...`
  - 200 JSON: same structure as above.
  - On success verify/webhook: user is enrolled.

3) Init Challenge Participation
- POST `/payments/init/challenge`
  - body: `{ "challengeId": "<id>", "userId": "<currentUserId>" }`
  - optional promo
  - On success: user joins challenge.

4) Init Event Ticket
- POST `/payments/init/event`
  - body: `{ "eventId": "<eventPublicId>", "ticketType": "STANDARD", "userId": "<currentUserId>" }`
  - optional promo
  - Note: ticketType should match event.tickets[].type
  - On success: Order becomes paid. To auto-register, we recommend persisting `ticketType` in order metadata (backend planned) and registering on verify.

5) Init Product Purchase
- POST `/payments/init/product`
  - body: `{ "productId": "<publicId>", "userId": "<currentUserId>" }`
  - optional promo
  - On success: Order paid. Frontend can then unlock download UI when `Order.status === 'paid'`.

6) Init Session Booking Payment
- POST `/payments/init/session`
  - body: `{ "sessionId": "<publicId>", "userId": "<currentUserId>" }`
  - optional promo
  - On success: Order paid. Backend can create a booking upon verify in future extension.

7) Init Subscription (Plan)
- POST `/payments/init/subscription`
  - body: `{ "userId": "<currentUserId>", "tier": "STARTER" | "GROWTH" | "PRO" }`
  - 200 JSON: Flouci link info
  - On verify SUCCESS: backend upgrades plan immediately.

8) Verify Payment
- GET `/payments/verify?paymentId=<id>`
  - 200 JSON: `{ "status": "paid" }` or `{ "status": "FAILED" }`
  - Frontend should poll/trigger once after redirect if webhook is not configured.

9) Webhook (for server admins)
- POST `/payments/webhook`
  - headers: `x-flouci-signature: <hex>
  - body: `{ "payment_id": "<id>" }`
  - Backend validates signature using `FLOUCI_WEBHOOK_SECRET` then reconciles and grants access.

### Error Handling Patterns
- 400: invalid ids, free content, unavailable tickets; show inline error.
- 401/403: user not authenticated/authorized; redirect to login.
- 500: generic failure; allow retry.

### Access Rules (Frontend Cues)
- After a paid course: show “Go to course” (enrolled state).
- After paid community: show “Enter community” (member flag true).
- Challenge: show joined state on success.
- Event/Product/Session: display receipt, and poll for registration/entitlement where applicable.

### Promo UX
- Provide a promo input in pay modals; append `?promoCode=CODE` to init calls.
- Backend returns discounted link; final charged amount appears on Flouci page.

### Examples

Init course (fetch):
```ts
const res = await fetch(`/payments/init/course?promoCode=${code}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ courseId, userId })
});
const data = await res.json();
window.location.href = data.link; // or open QR
```

Post-redirect verify:
```ts
const params = new URLSearchParams(window.location.search);
const pid = params.get('paymentId');
if (pid) {
  fetch(`/payments/verify?paymentId=${pid}`).then(() => {
    // refetch user state / course enrollment
  });
}
```


