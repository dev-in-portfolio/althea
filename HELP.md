# TapForge

TapForge is a tactile preset lab built with Flutter and a Neon-backed API. The Flutter app stores a device key and sends it on every request; the API maps device keys to users and enforces preset validation.

## Structure

- `lib/` Flutter client
- `server/` Node API server (REST)
- `sql/001_tapforge.sql` Neon schema

## Requirements

- Flutter SDK
- Node.js 20+
- Neon Postgres

## Environment

Create `server/.env`:

```
DATABASE_URL=YOUR_NEON_POSTGRES_URL
PORT=4000
```

## API

Start the server:

```bash
cd server
npm install
npm run dev
```

## Flutter

```bash
flutter pub get
flutter run
```

## Smoke Test

1. Launch app → device key created
2. Create preset with 3 controls → save
3. Reopen app → preset still there
4. Duplicate preset → both exist
5. Export JSON → non-empty
