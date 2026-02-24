# Wayfinder Help

This guide explains how to use Walk Mode, settings, and recovery features.

## Quick Start
1. Open any waypoint from `/waypoints`.
2. Set your session options on the Settings screen.
3. Tap **Start Walk** to begin the steps.
4. Use **Next step** and **Pause/Resume** as needed.
5. Tap **End walk** to reach the summary screen.

## Walk Mode Screens
### 1) Settings
Set your pace and atmosphere:
- **Session goal (minutes):** weekly target for walks.
- **Step duration (sec):** how long each step lasts.
- **Haptics:** vibrate on step change (Android).
- **Soft tones:** gentle tone on step change.
- **Ambient sound:** low continuous tone.
- **Ambient volume:** volume for ambient tone.

### 2) Steps
One step at a time:
- **Pause:** stop timer; tap again to resume.
- **Next step:** advance immediately.
- **End walk:** go to summary.
- **Exit to Waypoints:** leave the walk (with confirmation).

### 3) Summary
Review the session:
- Time completed and steps finished.
- Achievement tags.
- Last 3 sessions.
- Links to Progress / Bookmarks / Settings.

## Resume Last Walk
If you leave mid‑session, the app saves a resume snapshot for up to 2 hours.
On the Settings screen, use **Resume Last Walk** to continue.

## Settings Page
Use `/settings` to set general preferences:
- **Font size**
- **Contrast**
- **Reduced motion**
- **Reading streak**

These are stored locally per device.

## Bookmarks & Progress
- Bookmarks and progress are stored locally and optionally synced to Neon.
- If the backend is offline, the app continues in offline mode.

## Troubleshooting
### Buttons don’t respond
Reload the page. If still stuck, clear Walk Mode session storage:
1. Open DevTools.
2. Run: `localStorage.removeItem('wayfinder.walkSession')`.

### No resume button
Resume is shown only if a saved session exists within 2 hours.

### Sound doesn’t play
Mobile browsers may block audio until the user taps a control.
Start Walk first, then enable ambient/tones.

## Privacy
Wayfinder is local-first. All session data is stored on your device unless you enable the backend.
