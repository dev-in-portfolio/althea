# Operator Ledger

Local-first decision and outcomes tracker built with Tauri (Rust + SQLite) and Svelte.

## Features
- Capture decisions with rationale and confidence
- Attach outcomes and lessons learned
- Timeline feed with filters
- Quick insights (low confidence, failed experiments, pivots)
- Export ledger to JSON

## Dev Setup
1. Install Node dependencies
   - `pnpm install`
2. Install Rust + Tauri prerequisites
3. Run UI
   - `pnpm run dev`
4. Run Tauri app (after installing tauri-cli)
   - `pnpm tauri dev`

## Notes
- SQLite database is stored in the Tauri app data directory.
- `export_json` writes `ledger_export.json` alongside the DB.
