# Clean30

Clean30 is a local-first apartment cleaning routine PWA for daily habits, custom dashboard tasks, reset sessions, cleaning systems, history, and backups.

Live app: https://thiepn.github.io/clean30/

## Features

- Dashboard with Daily Rules, custom to-dos, routine starting, and active sessions.
- Cleaning sessions with saved progress, notes, partial finish, reset, and discard flows.
- Routines reference library with collapsed phase checklists.
- Internal editor for Daily Rules, routines, systems, schedule, templates, and profile settings.
- History page for completed resets, Daily Rules, and practical patterns.
- Settings with systems, backup, privacy, help, appearance, install, reminder, and reset tools.
- PWA install support for phone home screens.
- Local-only data storage in browser/PWA storage.
- Full backup export/import for restoring or moving app data.

## How To Use

1. Open the app.
2. Complete Daily Rules from the Dashboard.
3. Add one-off dashboard tasks when needed.
4. Start or resume a reset session from the Dashboard.
5. Use Routines as a reference library.
6. Review History to see what has been completed.
7. Export a full backup regularly from Settings.

## Mobile / PWA Install

1. Open https://thiepn.github.io/clean30/ on your phone.
2. Open the browser menu.
3. Choose **Add to Home Screen** or **Install app**.
4. Launch Clean30 from the home screen.

The app shell is cached for offline use after a successful visit. Cleaning data remains local to that browser or installed PWA storage.

## Local Development

```bash
npm install
npm run dev
npm run build
npm run preview
```

On Windows PowerShell, if `npm` is blocked by script execution policy, use `npm.cmd`:

```bash
npm.cmd install
npm.cmd run dev
npm.cmd run build
```

## GitHub Pages

The Vite app is configured for GitHub Pages at `/clean30/`. Deployment is handled by `.github/workflows/deploy.yml`, which installs dependencies, builds the app, and deploys the `dist/` folder to GitHub Pages.

## Privacy Summary

Clean30 has:

- no account
- no cloud sync
- no analytics
- no ads
- no server database

Data is stored locally in browser/PWA storage. Clearing browser or app data may delete Clean30 data. Export full backups from Settings if you want to protect or move your data.

Appearance preferences, such as accent and background color, are also stored locally with the rest of the app settings.

## Template Sharing

Template export/import is for sharing a cleaning system with friends or family. Template files include routines, Daily Rules, systems, zones, schedule, profile labels, and appearance settings.

Template exports do not include personal history, active sessions, or daily completion data. Full backups do include personal app data and should be treated as private.

Routine and Daily Rules editing is opened from the Dashboard. App-level settings, systems, appearance, and data controls live in Settings.

## Current Status

Clean30 is a usable prototype / tester-ready v1.

## Known Limitations

- Data is local to the current browser, device, or installed PWA.
- Clearing browser/app data may delete Clean30 data unless you exported a backup.
- There is no automatic cloud sync.
- There are no notifications or reminders yet.
- There is no app store release yet.
