# Clean30

Clean30 is a local-only React + Vite cleaning routine app for running a practical apartment reset system. It helps track daily rules, start cleaning sessions, follow fixed routines, review history, and customize the cleaning system for a specific home.

Live demo: https://thiepn.github.io/clean30/

## Features

- Dashboard with apartment status, daily rules, recommendations, quick starts, and maintenance memory.
- Guided cleaning sessions with phase checklists, progress, notes, reset, cancel, and finish actions.
- Built-in routines for Initial Reset, Weekly Reset, Minimal Reset, Daily Rules, Guest Reset, and Monthly Deep Clean.
- Systems page for bottlenecks, priority order, zones, and practical cleaning principles.
- History view with session stats, filters, details, notes, and delete confirmation.
- Customize section with protected default template and editable custom templates.
- Editors for profile, zones, routines, phases, tasks, daily rules, systems, schedule, and appearance.
- Template JSON export/import for sharing cleaning systems.
- Full backup export/import for moving or restoring all local app data.
- Plain CSS design system with responsive desktop and mobile layouts.

## Local Setup

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal, usually:

```text
http://localhost:5173/
```

On Windows PowerShell, if `npm` is blocked by script execution policy, use:

```bash
npm.cmd install
npm.cmd run dev
```

## Build

```bash
npm run build
```

The production build is written to `dist/`.

## GitHub Pages Deployment

The app is configured for GitHub Pages at:

```js
base: "/clean30/"
```

Deployment is handled by `.github/workflows/deploy.yml`. On pushes to `main`, GitHub Actions installs dependencies, runs `npm run build`, uploads the `dist/` folder, and deploys it with GitHub Pages.

## Install on Android

Clean30 includes basic PWA support. On Android:

1. Open https://thiepn.github.io/clean30/ in Chrome.
2. Open the browser menu.
3. Tap **Add to Home screen** or **Install app**.
4. Launch Clean30 from the home screen.

The app shell is cached for offline use after the first successful visit. Cleaning data still stays local to the browser/app storage on that device.

## Privacy

Clean30 has no backend, no authentication, and no cloud sync. All app data is stored locally in the browser using `localStorage`.

This includes templates, daily rule completions, active session data, and history. Clearing browser storage or using a different browser/device may remove or hide that local data unless you export a backup first.

## Sharing Templates

Use **Customize -> Overview -> Export template JSON** to share only the cleaning system: profile, zones, routines, daily rules, systems, schedule, and appearance.

Template exports do not include personal history or active sessions, so they are suitable for sharing with friends or family.

To use someone else's template, open **Customize -> Overview -> Import template JSON**. Imported templates are added as new editable custom templates and do not overwrite history.

For a complete personal backup, use **Export full backup** instead. Full backups include templates, history, daily rule completions, and active data.
