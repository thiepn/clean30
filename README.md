<div align="center">

<img
src="https://capsule-render.vercel.app/api?type=waving&height=260&color=0:0F172A,45:0F766E,100:2DD4BF&text=Clean30&fontColor=FFFFFF&fontSize=72&fontAlignY=38&desc=A%20calmer%20way%20to%20keep%20your%20home%20clean&descAlignY=58&descSize=19&animation=fadeIn"
width="100%"
alt="Clean30"
/>

<img
src="https://readme-typing-svg.demolab.com?font=Inter&weight=600&size=24&duration=2600&pause=900&color=14B8A6&center=true&vCenter=true&width=760&lines=Today+tasks+without+the+clutter.;Reusable+cleaning+routines.;Focused+cleaning+with+Clean+Mode.;Private%2C+local-first%2C+and+installable."
alt="Clean30 animated introduction"
/>

<br>

[![Live App](https://img.shields.io/badge/OPEN_LIVE_APP-14B8A6?style=for-the-badge\&logo=pwa\&logoColor=white)](https://thiepn.github.io/clean30/)
[![Source Code](https://img.shields.io/badge/VIEW_SOURCE-18181B?style=for-the-badge\&logo=github\&logoColor=white)](https://github.com/thiepn/clean30)
[![Installable PWA](https://img.shields.io/badge/INSTALLABLE-PWA-5A0FC8?style=for-the-badge\&logo=pwa\&logoColor=white)](#mobile--pwa-install)

<br>

![React](https://img.shields.io/badge/React-20232A?style=flat-square\&logo=react\&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square\&logo=vite\&logoColor=white)
![Local First](https://img.shields.io/badge/Storage-Local--First-0F766E?style=flat-square)
![No Account](https://img.shields.io/badge/Account-Not_Required-22C55E?style=flat-square)
![No Analytics](https://img.shields.io/badge/Analytics-None-3B82F6?style=flat-square)
![Version](https://img.shields.io/badge/Version-1.0.0-F59E0B?style=flat-square)
![Status](https://img.shields.io/badge/Status-Tester_Ready-EF4444?style=flat-square)

</div>

---

<div align="center">

### Clean your home without turning cleaning into another complicated project.

**Clean30** is a local-first apartment cleaning PWA for Today tasks, reusable cleaning routines, focused cleaning sessions, activity history, backups, and simple appearance settings.

[Launch Clean30](https://thiepn.github.io/clean30/) ·
[Features](#features) ·
[How to use](#how-to-use) ·
[Install](#mobile--pwa-install) ·
[Development](#local-development) ·
[Privacy](#privacy-summary)

</div>

---

## Overview

Clean30 combines lightweight daily task management with structured cleaning routines.

It is designed around four simple areas:

<table>
<tr>
<td width="25%" align="center">

### Dashboard

Today tasks, Quick Start, active sessions, and Calendar activity.

</td>
<td width="25%" align="center">

### Routines

Reusable cleaning plans organized into phases and tasks.

</td>
<td width="25%" align="center">

### History

Completed routines, Today activity, elapsed time, and consistency.

</td>
<td width="25%" align="center">

### Settings

Appearance, backups, privacy, installation, help, and reset tools.

</td>
</tr>
</table>

> [!NOTE]
> Clean30 stores its data locally. It does not require an account, server, subscription, or cloud connection.

---

## Features

### Today dashboard

<table>
<tr>
<td width="50%" valign="top">

#### Daily task management

* Add one-off tasks.
* Complete and uncomplete tasks.
* Add optional notes and tags.
* Reorder tasks.
* Delete tasks with Undo.
* Reset the current list.
* Automatically organize completed tasks below unfinished tasks.

</td>
<td width="50%" valign="top">

#### Flexible defaults

* Start from editable general defaults.
* Configure weekday-specific defaults.
* Set individual weekdays to use General, Custom, or Empty defaults.
* Enable **Start Today empty**.
* Pull selected tasks from an existing routine.

</td>
</tr>
</table>

---

### Reusable routines

Build repeatable cleaning plans instead of reconstructing the same checklist every time.

* Organize routines into phases.
* Add tasks inside each phase.
* Set an estimated duration.
* Add an optional color label.
* Duplicate an existing routine.
* Archive and restore routines.
* View last-completed information.
* Keep archived routines out of Quick Start while retaining their History.
* Use collapsed phase checklists for compact reference.

---

### Active cleaning sessions

Turn a routine into a live cleaning session with persistent progress.

| Session feature            | Description                                                            |
| -------------------------- | ---------------------------------------------------------------------- |
| **Saved progress**         | Session state remains available after refreshing or reopening the app. |
| **Elapsed timer**          | Measures active cleaning time.                                         |
| **Pause and resume**       | Paused time is excluded from the elapsed duration.                     |
| **Partial finish**         | Save a session even when not every task is complete.                   |
| **Full finish**            | Complete the session and save it to History.                           |
| **Reset**                  | Reset session progress without rebuilding the routine.                 |
| **Discard**                | Remove the active session without creating a History entry.            |
| **Session notes**          | Keep information connected to the active session.                      |
| **Replacement protection** | Confirmation is required before replacing an existing session.         |

---

### Clean Mode

<div align="center">

<img
src="https://img.shields.io/badge/CLEAN_MODE-FOCUS_ON_ONE_TASK_AT_A_TIME-0F766E?style=for-the-badge"
alt="Clean Mode"
/>

</div>

Clean Mode is an optional focused view for active routine sessions.

It provides:

* A full-screen cleaning interface.
* Large mobile-friendly controls.
* The current routine, phase, and task.
* Previous and Next task navigation.
* A large **Mark done** or **Undo done** action.
* Session progress.
* Elapsed time.
* Pause and Resume controls.
* Full and partial finishing.
* Exit without discarding the session.
* Synchronization with the normal checklist.

The regular active-session checklist remains available at all times.

---

### History and Calendar

Clean30 keeps routine sessions and Today activity clearly separated.

#### History includes

* Completed routine sessions.
* Derived Today-task activity.
* Completed and total task counts.
* Measured routine-session duration.
* Active-day streaks.
* Best streak information.
* Weekly consistency context.
* Support for archived or deleted routine references.

#### Calendar includes

* Monday-first monthly layout.
* Activity indicators.
* Day-detail sheets.
* Today-task activity counts.
* Routine-session counts.
* Measured routine cleaning time.
* Estimated Today-task time shown separately.
* Compact weekly summaries.

> [!IMPORTANT]
> Today activity is derived from dated Today tasks. Routine sessions are stored as permanent History entries. Because Today activity is derived, changing dated Today tasks can also change the corresponding Today activity display.

---

### Appearance

Personalize the interface without creating a complicated theme system.

* 12 accent colors.
* 12 calm background colors.
* Small, Normal, and Large font sizes.
* Compact and Comfortable density modes.
* Locally stored appearance preferences.

---

### Backup and restore

Your data stays local, so backups are important.

Clean30 supports:

* Full JSON backup export.
* Strict backup validation.
* Import preview before replacement.
* Legacy backup migration.
* Duplicate-ID repair.
* Invalid-data rejection.
* Backup-health information.
* Emergency backup access from the error screen.
* Template-only sharing without personal History.

> [!WARNING]
> Clearing browser data, uninstalling the PWA, resetting the app, or removing site storage may permanently delete local Clean30 data. Export a full backup regularly.

---

### Privacy

<div align="center">

![No Account](https://img.shields.io/badge/NO_ACCOUNT-22C55E?style=for-the-badge)
![No Cloud Sync](https://img.shields.io/badge/NO_CLOUD_SYNC-3B82F6?style=for-the-badge)
![No Analytics](https://img.shields.io/badge/NO_ANALYTICS-8B5CF6?style=for-the-badge)
![No Ads](https://img.shields.io/badge/NO_ADS-F97316?style=for-the-badge)

</div>

Clean30 has:

* no account
* no cloud sync
* no analytics
* no advertisements
* no server database
* no third-party application state service

Cleaning data is stored locally in browser or installed-PWA storage.

---

## How To Use

### 1. Open Dashboard

Dashboard is the main home screen. It contains:

* Today tasks
* Quick Start
* active-session controls
* Calendar

### 2. Complete Today tasks

Check off existing tasks or add a one-off task.

Tasks can include:

* notes
* tags
* routine-source information
* completion state

### 3. Start a routine

Choose a routine from **Quick Start**.

You can then:

* complete tasks
* pause or resume
* reset progress
* discard the session
* finish partially
* finish completely
* open Clean Mode

### 4. Manage routines

Open **Routines** to inspect your reusable cleaning plans.

Use **Edit** to:

* add routines
* change titles
* set durations
* add colors
* edit phases and tasks
* duplicate routines
* archive routines
* delete routines

### 5. Review activity

Open **History** to review:

* routine sessions
* Today activity
* elapsed cleaning time
* streaks
* weekly consistency

Use the Dashboard Calendar to inspect activity by date.

### 6. Export backups

Open **Settings → Backup** and export a full backup regularly.

---

## Mobile / PWA Install

<div align="center">

[![Install Clean30](https://img.shields.io/badge/INSTALL_CLEAN30_ON_YOUR_PHONE-5A0FC8?style=for-the-badge\&logo=pwa\&logoColor=white)](https://thiepn.github.io/clean30/)

</div>

1. Open [Clean30](https://thiepn.github.io/clean30/) on your phone.
2. Open the browser menu.
3. Choose **Add to Home Screen** or **Install app**.
4. Launch Clean30 from the home screen.

The application shell is cached for offline use after a successful visit.

Cleaning data remains local to that browser or installed-PWA storage.

<details>
<summary><strong>Android installation notes</strong></summary>

<br>

Depending on the browser, the installation option may appear as:

* **Install app**
* **Add to Home screen**
* **Install**
* an install icon in the address bar

Chrome and Chromium-based browsers generally provide the most complete PWA installation experience.

</details>

<details>
<summary><strong>Offline behavior</strong></summary>

<br>

After the application has loaded successfully and its service worker has cached the application shell:

* Clean30 can launch without a network connection.
* Local cleaning data remains available.
* New deployments become available through the update flow.
* External resources used by GitHub itself or this README are not part of the installed application.

</details>

---

## Application Structure

```text
Clean30
│
├── Dashboard
│   ├── Today
│   ├── Quick Start
│   ├── Active Session
│   └── Calendar
│
├── Routines
│   ├── Routine Library
│   ├── Phases
│   ├── Tasks
│   ├── Archive
│   └── Editor
│
├── History
│   ├── Routine Sessions
│   ├── Today Activity
│   ├── Elapsed Time
│   └── Consistency
│
└── Settings
    ├── Today Preferences
    ├── Appearance
    ├── Backup
    ├── Privacy
    ├── Help
    ├── Installation
    └── Reset Tools
```

---

## Technology

<table>
<tr>
<td align="center" width="25%">

<img src="https://cdn.simpleicons.org/react/61DAFB" width="48" alt="React">

**React**

Application interface and state.

</td>
<td align="center" width="25%">

<img src="https://cdn.simpleicons.org/vite/646CFF" width="48" alt="Vite">

**Vite**

Development and production build tooling.

</td>
<td align="center" width="25%">

<img src="https://cdn.simpleicons.org/javascript/F7DF1E" width="48" alt="JavaScript">

**JavaScript**

Application logic and utilities.

</td>
<td align="center" width="25%">

<img src="https://cdn.simpleicons.org/css/663399" width="48" alt="CSS">

**Plain CSS**

Responsive layout and appearance.

</td>
</tr>
</table>

Additional architecture:

* Browser `localStorage`
* Service worker
* Web App Manifest
* GitHub Pages
* GitHub Actions deployment
* No backend
* No authentication
* No external state-management library

---

## Local Development

### Requirements

* Node.js
* npm
* Git

### Clone the repository

```bash
git clone https://github.com/thiepn/clean30.git
cd clean30
```

### Install dependencies

```bash
npm install
```

### Start development mode

```bash
npm run dev
```

### Run tests

```bash
npm test
```

### Create a production build

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```

---

### Windows PowerShell

If `npm` is blocked by the PowerShell script-execution policy, use `npm.cmd`:

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd test
npm.cmd run build
npm.cmd run preview
```

---

## GitHub Pages

The Vite application is configured for GitHub Pages at:

```text
/clean30/
```

Deployment is handled by:

```text
.github/workflows/deploy.yml
```

The workflow:

1. Installs dependencies.
2. Runs the production build.
3. Uploads the generated application.
4. Deploys the `dist/` directory to GitHub Pages.

<div align="center">

[![Open Deployment](https://img.shields.io/badge/VIEW_DEPLOYED_APP-14B8A6?style=for-the-badge\&logo=githubpages\&logoColor=white)](https://thiepn.github.io/clean30/)

</div>

---

## Privacy Summary

| Question                             | Clean30                                |
| ------------------------------------ | -------------------------------------- |
| Is an account required?              | No                                     |
| Is data uploaded to a server?        | No                                     |
| Is cloud sync included?              | No                                     |
| Are analytics used?                  | No                                     |
| Are advertisements shown?            | No                                     |
| Is there a remote database?          | No                                     |
| Can data be exported?                | Yes                                    |
| Can data be moved to another device? | Yes, through full backup export/import |

Data is stored locally in browser or installed-PWA storage.

Clearing browser or application data may delete Clean30 data. Export full backups from Settings to protect or move your data.

Appearance preferences are stored locally with the rest of the application settings.

---

## Template Sharing

Template export/import is intended for sharing reusable cleaning plans with friends or family.

Template files can include:

* Today defaults
* weekday defaults
* routines
* phases
* tasks
* schedules
* profile labels
* appearance information
* compatibility fields

Template exports do **not** include:

* personal History
* active sessions
* per-date Today task data
* personal activity records

Full backups include personal application data and should be treated as private.

---

## Data Model Overview

<details>
<summary><strong>Today tasks</strong></summary>

<br>

Today tasks are stored by date and can include:

* task ID
* text
* completion state
* completion time
* creation time
* note
* tags
* routine source
* original routine task reference

Today activity shown in History is derived from these dated tasks.

</details>

<details>
<summary><strong>Routines</strong></summary>

<br>

A routine contains:

* identity
* title
* estimated duration
* optional color
* archive state
* phases
* tasks
* descriptive information
* ordering information

</details>

<details>
<summary><strong>Active sessions</strong></summary>

<br>

An active session contains:

* session identity
* template identity
* routine identity
* routine snapshot
* start time
* completion state
* pause state
* pause timing
* accumulated paused duration
* optional notes

The timer is derived from timestamps and is not written to storage every second.

</details>

<details>
<summary><strong>History</strong></summary>

<br>

Routine-session History stores:

* session identity
* routine identity
* title
* completion time
* completed and total task counts
* completion percentage
* elapsed duration
* optional notes
* template metadata

Today activity is primarily derived from dated Today tasks. Legacy Today History may remain available when no dated Today data exists.

</details>

---

## Backup Safety

Clean30 distinguishes between:

### Full backups

Full backups include personal application data:

* templates
* Today tasks by date
* routines
* active session
* History
* settings
* onboarding state
* appearance
* backup metadata

### Template exports

Template exports are intended for sharing reusable plans and omit personal activity data.

### Import protection

Before replacing local data, Clean30:

* validates the file
* checks the backup format
* checks required fields
* validates nested data
* repairs safe legacy issues
* reports warnings
* previews the import
* requires confirmation

Invalid current-format backups are rejected before replacement.

---

## Current Status

<div align="center">

![Prototype](https://img.shields.io/badge/PRODUCT_STAGE-USABLE_PROTOTYPE-0F766E?style=for-the-badge)
![Testing](https://img.shields.io/badge/RELEASE_STAGE-TESTER_READY-F59E0B?style=for-the-badge)
![Version](https://img.shields.io/badge/CURRENT_VERSION-1.0.0-3B82F6?style=for-the-badge)

</div>

Clean30 is a usable prototype and tester-ready version 1 application.

Current validation includes:

* automated regression tests
* production build verification
* service-worker syntax verification
* backup compatibility tests
* active-session tests
* Today and Calendar tests
* date and duration tests

Real-device and browser testing remain important before a wider release.

---

## Known Limitations

* Data is local to the current browser, device, or installed PWA.
* Clearing browser or application data may delete Clean30 data unless a backup was exported.
* There is no automatic cloud synchronization.
* There are no notifications or reminders yet.
* There is no app-store release yet.
* Historical Today time is estimated from the current template configuration and may change when template estimates are edited.
* Cross-device movement requires manual backup export and import.

---

## Planned Direction

```text
Manual release-candidate testing
        ↓
Small bug-fix and visual-polish passes
        ↓
Improved install and update guidance
        ↓
Optional future notification support
        ↓
Possible packaged mobile release
```

> [!NOTE]
> Cloud synchronization, accounts, and automatic remote backup are not currently part of Clean30.

---

## Safety and Recovery

If the application encounters a serious rendering error, its error screen provides:

* reload
* technical details
* emergency backup export

For ordinary use:

1. Export regular full backups.
2. Keep important backups outside browser storage.
3. Test imported backups before deleting older copies.
4. Avoid clearing site data unless a backup exists.

---

## Contributing

Clean30 is currently a personal prototype project.

When making changes:

1. Create or update the relevant source files.
2. Run the test suite.
3. Run a production build.
4. Check the service worker.
5. Inspect the resulting application on mobile.
6. Commit only intentional source, test, documentation, and generated-build changes.

```bash
npm test
npm run build
node --check public/sw.js
git diff --check
```

---

## Repository

<div align="center">

[![Repository](https://img.shields.io/badge/GITHUB-thiepn%2Fclean30-18181B?style=for-the-badge\&logo=github\&logoColor=white)](https://github.com/thiepn/clean30)
[![Live App](https://img.shields.io/badge/LIVE-thiepn.github.io%2Fclean30-14B8A6?style=for-the-badge\&logo=githubpages\&logoColor=white)](https://thiepn.github.io/clean30/)

<br>

Built as a local-first cleaning application with React, Vite, plain CSS, and browser storage.

</div>

<img
src="https://capsule-render.vercel.app/api?type=waving&height=150&section=footer&color=0:2DD4BF,55:0F766E,100:0F172A"
width="100%"
alt=""
/>
