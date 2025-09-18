# Google OAuth 2.0 Integration Guide

## Completed Components

- Google Strategy: `src/auth/strategies/google.strategy.ts`
- Auth Module Wiring: `src/auth/auth.module.ts`
- Controller Endpoints: `src/auth/auth.controller.ts`
- Service Logic: `src/auth/auth.service.ts`

## Environment Variables

```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

JWT_SECRET=change-me
JWT_REFRESH_SECRET=change-me-too
PORT=3000
FRONTEND_URL=http://localhost:3000
```

## Required Package

```bash
npm install passport-google-oauth20
```

## Endpoints

- GET `/auth/google` → starts Google login
- GET `/auth/google/callback` → handles callback, issues JWTs, sets cookies

## Local Testing Steps

1) Create Google OAuth Client (Web)
   - Authorized redirect URI: `http://localhost:3000/auth/google/callback`
   - Add Test users if app is in testing
2) Set `.env` and restart: `npm run start:dev`
3) Open `http://localhost:3000/auth/google`
4) After redirect, verify tokens and cookies
5) Call `GET /auth/me` to confirm session

## Cookies & Session

- Cookies are set on successful Google login
- Social login uses `rememberMe=true`

## Production Notes

- Use `https://api.yourdomain.com/auth/google/callback` and add it in Google Console
- Strong JWT secrets, HTTPS, secure cookies

## Troubleshooting

- 400 redirect_uri_mismatch: callback must exactly match `GOOGLE_CALLBACK_URL`
- 403 access_denied: add account as Test user
- Missing email: ensure `email` scope and account has primary email
- No cookies: check CORS credentials and domain/port

## File References

- `src/auth/strategies/google.strategy.ts`
- `src/auth/auth.module.ts`
- `src/auth/auth.controller.ts`
- `src/auth/auth.service.ts`
