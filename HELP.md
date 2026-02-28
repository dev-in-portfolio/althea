# RepoPilot

Local-first Git cockpit built with Tauri (Rust) and Svelte. Browse branches, inspect status, and run safe commit/push flows with command transparency.

## Features
- Repo catalog with active selection
- Branch map (local + remote)
- Status + diff summary
- Safe commit + push commands
- All git commands displayed for terminal copy

## Dev Setup
1. Install Node dependencies
   - `pnpm install`
2. Install Rust + Tauri prerequisites
3. Run UI
   - `pnpm run dev`
4. Run Tauri app
   - `pnpm tauri dev`
