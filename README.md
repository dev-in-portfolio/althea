# ClipForge

Local-first clipboard pipeline app built with Tauri (Rust + SQLite) and Svelte.

## Features
- Clipboard history with pinning
- Transform pipelines (wrap code blocks, JSON pretty, patch standardizer)
- Hotkey-ready pipeline records
- Preview before overwrite and apply to clipboard
- Local-only persistence

## Dev Setup
1. Install Node dependencies
   - `pnpm install`
2. Install Rust + Tauri prerequisites
3. Run UI
   - `pnpm run dev`
4. Run Tauri app
   - `pnpm tauri dev`

## Notes
- Clipboard capture uses the Tauri clipboard API.
- Global hotkeys and tray wiring are prepared for extension.
