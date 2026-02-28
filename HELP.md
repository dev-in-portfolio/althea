# Qwik SignalTile

Live signal board with rule-aware status evaluation, device-scoped telemetry, and fast filtering. Built with Qwik + Qwik City and a lightweight Express/Neon API.

## Features
- Signal intake with channel, note, and value capture
- Threshold rules (warn/bad) per signal
- Status auto-computation based on thresholds
- Device-scoped workspace (no login required)
- Board polling and fast filters

## Local Setup
1. Install dependencies
   - `pnpm install`
2. Create `.env` using `.env.example`
3. Apply SQL in `sql/001_qwik_signaltile.sql` to your Neon database
4. Run the API and client
   - `pnpm run server`
   - `pnpm run dev`

API expects `DATABASE_URL` set in the environment.
