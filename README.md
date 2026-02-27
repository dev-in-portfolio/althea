# Pocket Dossier

Pocket Dossier is a fast field log: rapid entries, tags, search, and a clean timeline. Flutter handles the UI, while a Neon-backed API persists data. Device identity is a per-install UUID sent via `X-Device-Key`.

## Structure

- `lib/` Flutter client
- `server/` Node API server (REST)
- `sql/002_pocket_dossier.sql` Neon schema

## Requirements

- Flutter SDK
- Node.js 20+
- Neon Postgres

## Environment

Create `server/.env`:

```
DATABASE_URL=YOUR_NEON_POSTGRES_URL
PORT=4001
```

## API

Start the server:

```bash
cd server
pnpm install
pnpm run dev
```

## Flutter

```bash
flutter pub get
flutter run
```

## Smoke Test

1. Launch app → device key created
2. Create entry with body + 2 tags
3. Timeline shows it at top
4. Filter by tag → entry shown
5. Search q finds by body substring
6. Edit entry → updated_at changes
