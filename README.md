# Pocket Pass

Pocket Pass is a personal membership pass app. Users sign in anonymously via Firebase, receive a pass ID + QR, and check in to locations. The server verifies Firebase tokens and stores data in Neon Postgres.

## Requirements

- Node.js 20+
- Neon Postgres
- Firebase project (client + admin credentials)

## Install

```bash
npm install
```

## Environment

```
DATABASE_URL=YOUR_NEON_POSTGRES_URL
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
FIREBASE_ADMIN_PROJECT_ID=...
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
PASS_SIGNING_SECRET=RANDOM_SECRET
```

## Database

Run `sql/001_init.sql` in Neon.

## Run

```bash
npm run dev
```

Build + start:

```bash
npm run build
npm run start
```

## Tests

```bash
npm run typecheck
```

## Smoke Test

1. Load `/` and allow anonymous sign-in.
2. `/api/me/pass` returns pass id.
3. Create a location row (SQL or `/admin/locations`).
4. Submit check-in with location code.
5. `/history` shows the check-in.

Notes:
- Check-ins have a 5-minute cooldown per location.
- QR payload is signed if `PASS_SIGNING_SECRET` is set.
- Export check-ins: `GET /api/export/checkins` (Authorization required).
