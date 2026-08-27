# Clean30

Clean30 is a local-first cleaning planner that removes the planning step from cleaning.

The app is built around a simple contract: describe the home once, then open Clean30 and do the next meaningful task. It does not ask for a time budget, make the user invent routines, or fill a session with generic “quick wins.”

## Product model

1. Add preset or arbitrarily named rooms.
2. Select built-in items and add any custom item or surface in each room.
3. Review the resulting tasks and choose intervals from daily to yearly, or enter any custom number of days.
4. Choose realistic cleaning days.
5. Follow the automatically generated plan.

After setup, Clean30 has three destinations:

- **Home** — shows what is due and starts today’s guided clean.
- **Plan** — explains what is coming over the next week and month.
- **Settings** — edits the home, schedule, appearance, backups, and local data.

Four cleaning modes cover the real reasons someone opens the app:

- Today’s clean
- Weekly reset
- Clean a room
- Guests coming

The focused cleaning view presents one task at a time. Completing a task schedules its next due date; skipping it keeps it due. An unfinished clean can be paused, resumed, or discarded without changing the schedule. Before saving, every choice can be reviewed and corrected.

Frequent upkeep such as dishes can recur every day or every few days without being restricted to the larger cleaning days. Weekly, monthly, and deep-care tasks align to the user’s chosen cleaning days. Presets accelerate setup but never prevent a custom room, item, task, or interval.

Automatic plans are intentionally bounded: Today shows the eight oldest due tasks and the special-purpose modes show at most twelve. The remaining backlog is visible and becomes the next batch instead of turning one clean into an overwhelming list.

## Privacy and resilience

- No account, analytics, ads, or remote API.
- State is stored in the browser under `clean30_v2_state`.
- JSON backup export and restore are available in Settings.
- Invalid saved sessions and malformed backup state are normalized before use.
- Unreadable local data is protected from automatic overwrite and can be downloaded for recovery.
- Storage failures stay visible so the user is never told unsaved changes are safe.
- The PWA app shell works offline after the first successful load.
- The crash screen can export both v2 data and legacy Clean30 storage.

## Development

```bash
npm ci
npm run dev
```

Run the full release-candidate checks:

```bash
npm run verify:release-candidate
```

The production app is built from `src/v2/AppV2.jsx`, `src/v2/model.js`, and `src/v2/styles.css`. The previous implementation remains in the repository temporarily as migration reference, but its JavaScript and styles are not imported into the production bundle.

## Deployment

The Vite base path is `/clean30/`, matching the GitHub Pages deployment at [thiepn.github.io/clean30](https://thiepn.github.io/clean30/).
