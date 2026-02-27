# Receipt Vault

Receipt Vault lets you upload receipts (image/pdf), tag them, and search by vendor/date/tag. Auth is Firebase Anonymous, files stored in Firebase Storage, metadata in Neon.

## Requirements

- Node.js 20+
- Neon Postgres
- Firebase project (Auth + Storage)

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
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
FIREBASE_STORAGE_BUCKET=...
FIREBASE_ADMIN_PROJECT_ID=...
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
NEXT_PUBLIC_BASE_URL=http://localhost:5177
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

1. Upload an image receipt
2. Add vendor/date/amount
3. Tag it “supplies”
4. Filter by tag in /vault
5. Delete receipt removes it from list
