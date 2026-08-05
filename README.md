# Clean30

Clean30 is a local-first apartment cleaning PWA for Today tasks, reusable cleaning routines, focused cleaning, progress history, backups, and simple appearance settings.

Live app: https://thiepn.github.io/clean30/

## Universal redesign branch

The `redesign/universal-clean30` branch is rebuilding Clean30 around a simpler workflow:

```text
Open Clean30
→ See today's tasks
→ Start cleaning
→ Finish one task at a time
```

The draft redesign currently includes:

- neutral starter content for new users;
- a three-step introduction;
- four public tabs: Today, Routines, Progress, Settings;
- a simplified Today screen;
- focused Today cleaning mode;
- routine cards with direct Start actions;
- a simple routine creator and editor;
- the existing advanced routine structure editor when needed;
- local-only storage and full backup protection.

The deployed `main` branch remains the current public tester version until the redesign is complete and merged.

## Features

- Four main tabs: Today, Routines, Progress, Settings.
- Today tasks with immediate add, completion, notes, tags, reorder, reset, and routine-task import.
- Focused Today cleaning with one task at a time and no duplicate History records.
- Reusable routines with direct Start actions, estimated duration, duplicate, archive, restore, and delete controls.
- Simple routine creation without requiring users to understand phases or templates.
- Optional advanced structure editing for multi-section routines.
- Active cleaning sessions with saved progress, notes, elapsed timer, pause/resume, partial finish, reset, discard, and focused Cleaning Mode.
- Progress for completed sessions and Today task activity.
- Calendar activity, elapsed time, active-day streaks, and weekly context.
- Settings for appearance, backup health, privacy, help, installation, onboarding, and reset tools.
- PWA installation and offline app-shell support.
- Local-only browser/PWA data storage.
- Full backup export/import with validation and restore preview.

## How to use

1. Open **Today**.
2. Check off tasks, add a one-off task, or choose **Start cleaning** for a focused task-by-task view.
3. Open **Routines** to start a reusable clean directly or create a new routine.
4. Use **Progress** to review completed activity.
5. Export full backups regularly from **Settings**.

## Mobile / PWA install

1. Open https://thiepn.github.io/clean30/ on your phone.
2. Open the browser menu.
3. Choose **Add to Home Screen** or **Install app**.
4. Launch Clean30 from the home screen.

The app shell is cached for offline use after a successful visit. Cleaning data remains local to that browser or installed PWA storage.

## Local development

```bash
npm install
npm run dev
npm test
npm run build
npm run preview
```

On Windows PowerShell, use `npm.cmd` when `npm` is blocked by script-execution policy:

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd test
npm.cmd run build
npm.cmd run preview
```

## GitHub Pages

The Vite app is configured for GitHub Pages at `/clean30/`. Deployment is handled by `.github/workflows/deploy.yml`, which installs dependencies, builds the app, and deploys `dist/`.

The redesign branch also includes `.github/workflows/ci.yml` for template-export verification, tests, production builds, and service-worker syntax checks.

## Privacy summary

Clean30 has:

- no account;
- no cloud sync;
- no analytics;
- no ads;
- no server database.

Data is stored locally in browser/PWA storage. Clearing browser or app data may delete Clean30 data. Export full backups from Settings to protect or move it.

## Template sharing

Cleaning-plan export/import is for sharing reusable plans. Template files can include regular Today tasks, routines, schedule information, profile labels, and compatibility fields.

Template exports do not include personal Progress, active sessions, or dated Today lists. Full backups do include personal app data and should be treated as private.

## Current status

- `main`: usable prototype / tester-ready v1.
- `redesign/universal-clean30`: active universal-usability redesign through Phase 3.

## Known limitations

- Data is local to the current browser, device, or installed PWA.
- Clearing browser/app data may delete Clean30 data without a backup.
- There is no automatic cloud sync.
- There are no notifications or reminders yet.
- There is no app-store release yet.
- Progress and Settings still require their dedicated redesign phases.
