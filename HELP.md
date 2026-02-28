# Room Key

Room Key is a shared space app where users create rooms, invite others, and manage collaborative items. Firebase Auth handles sign-in, Neon Postgres stores rooms and items, and server-side permissions enforce roles.

## Requirements

- Node.js 20+
- Neon Postgres
- Firebase project (Auth enabled)

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
NEXT_PUBLIC_BASE_URL=http://localhost:5178
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

## Smoke Test

1. User A creates a room and copies invite code
2. User B joins using invite code
3. Both see room in list
4. B adds item, A sees it
5. A deletes item (owner only)
