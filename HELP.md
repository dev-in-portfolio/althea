# Paradox Vault — Help

## What this app is
Paradox Vault is a curated reference for paradoxes, thought experiments, systems, and riddles. It works offline by default and optionally syncs bookmarks/notes to a Neon (Postgres) backend.

## Pages
- `/` Entrance overview + random entry
- `/vault` Search and filter all entries
- `/vault/[slug]` Entry detail (sources, prompts, notes)
- `/tags` Tag list
- `/tags/[tag]` Tag filtered list
- `/bookmarks` Saved entries
- `/notes` Notes grouped by entry

## Bookmarks
Bookmarks are stored in `localStorage` by default. If Neon is configured, they sync via `/api/bookmarks`.

## Notes
Notes are stored in `localStorage` by default and sync via `/api/notes` when configured. You can edit notes in place on entry pages.

## If you see “No entries”
Run:
```bash
node scripts/build-index.mjs
```
Then refresh.

## Curated dataset workflow
1. `node scripts/fetch-curated.mjs`  
2. `node scripts/filter-curated.mjs`  
3. `node scripts/enrich-sources.mjs`  
4. `node scripts/build-index.mjs`

## Troubleshooting
- If port 4321 is busy, stop other dev servers or use a different port:
  ```bash
  npm run dev -- --host 127.0.0.1 --port 4322
  ```
- If Astro fails on frontmatter, run:
  ```bash
  node scripts/fix-curated.mjs
  ```
