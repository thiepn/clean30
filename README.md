# Clean30

Clean30 is a local-first apartment cleaning PWA for Today tasks, reusable cleaning routines, session history, backups, and simple appearance settings.

Live app: https://thiepn.github.io/clean30/

## Features

- Four main tabs: Dashboard, Routines, History, Settings.
- Dashboard with Today tasks, routine/session controls, and a Calendar with day details and a weekly summary.
- Today tasks reset by date, can start from editable defaults, support notes/tags, and can pull tasks from routines.
- Optional weekday-specific Today defaults and a Start Today empty preference.
- Reusable cleaning routines with editable duration, optional color labels, duplicate/archive controls, and last-done badges.
- Active cleaning sessions with saved progress, notes, elapsed timer, pause/resume, partial finish, reset, discard, and an optional focused Clean Mode.
- Routines reference library with collapsed phase checklists, archived-routine toggle, and Edit/Add entry points.
- History for completed sessions and Today task logs.
- History with elapsed time, active-day streaks, and weekly consistency context.
- Settings for font size, density, appearance, backup health/import preview, privacy, help, install, onboarding, and reset tools.
- 12 accent colors and 12 calm background colors.
- PWA install support for phone home screens.
- Local-only data storage in browser/PWA storage.
- Full backup export/import for restoring or moving app data.
- Backup restore preview before local data is replaced.

## How To Use

1. Open Dashboard.
2. Check off Today tasks or add a one-off task.
3. Start, pause, resume, or finish a cleaning routine when needed. Open Clean Mode for a focused, large-control view; the normal checklist remains available.
4. Use Routines to inspect reusable cleaning plans, then Edit to change, duplicate, archive, or color-label them.
5. Review History to see what has been completed.
6. Export a full backup regularly from Settings.

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

Appearance preferences are stored locally with the rest of the app settings.

## Template Sharing

Template export/import is for sharing a reusable cleaning plan with friends or family. Template files include Today defaults, routines, schedule, profile labels, and other compatibility fields.

Template exports do not include personal history, active sessions, or per-date Today task data. Full backups do include personal app data and should be treated as private.

## Current Status

Clean30 is a usable prototype / tester-ready v1.

## Known Limitations

- Data is local to the current browser, device, or installed PWA.
- Clearing browser/app data may delete Clean30 data unless you exported a backup.
- There is no automatic cloud sync.
- There are no notifications or reminders yet.
- There is no app store release yet.
