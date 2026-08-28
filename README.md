# Clean30

Clean30 is a local-first cleaning planner that removes the recurring planning step from home maintenance.

**Live app:** https://thiepn.dev/clean30/

The product contract is simple: describe the home once, then open Clean30 and do the next meaningful task. No account, cloud service, analytics, advertising, or remote database is required.

## Product model

1. Add preset or arbitrarily named rooms.
2. Select the items and surfaces that actually exist in each room.
3. Review the generated work and add any custom recurring task.
4. Set each task from daily to yearly, or enter an arbitrary number of days.
5. Choose realistic cleaning days.
6. Follow the automatically generated plan.

After setup, Clean30 has three destinations:

- **Home** — shows what is due and starts guided cleaning.
- **Plan** — shows overdue, near-term, monthly, long-term, and recently completed work.
- **Settings** — edits rooms, room details, tasks, schedule, appearance, backups, and local data.

Four entry points cover the common reasons to clean:

- Today’s clean
- Weekly reset
- Clean a room
- Guests are coming

The focused cleaning view presents one task at a time. Completing a task schedules its next due date; skipping it keeps it due. An unfinished clean can be paused, resumed after a reload, or discarded without changing the schedule. Every choice can be reviewed before saving.

Frequent upkeep such as dishes may recur every day or every few days. Weekly, monthly, and deep-care work aligns to the chosen cleaning days. Presets accelerate setup without preventing custom rooms, items, tasks, or intervals.

Automatic plans are intentionally bounded: Today shows the eight oldest due tasks and special-purpose modes show at most twelve. Remaining work stays visible as backlog rather than turning one clean into an overwhelming session.

## Visual identity

Clean30 uses system typography, neutral surfaces, compact lists, restrained corners, and one functional green accent. The production interface avoids decorative gradients, glass effects, floating cards, oversized rounded containers, generated slogan copy, and animated hover lifts. Light and dark appearances preserve the same hierarchy.

## Privacy and resilience

- State is stored locally under `clean30_v2_state`.
- JSON backup export and restore are available in Settings.
- Invalid saved sessions and malformed backup data are normalized before use.
- Unreadable local data is protected from automatic overwrite and can be downloaded for recovery.
- Storage failures remain visible so unsaved changes are never presented as safe.
- The PWA app shell works offline after one successful online load.
- The crash screen can export both current and legacy Clean30 storage for recovery.

See [PRIVACY.md](PRIVACY.md) for the data-handling summary.

## Development

```bash
npm ci
npm run dev
```

Run the complete source, build, artifact, security, and runtime release gate:

```bash
npm run verify:release-candidate
```

Run the RC1 browser/device-class certification after installing Playwright locally:

```bash
npm install --no-save --no-package-lock playwright@1.55.0
npx playwright install chromium
npm run build
npm run certify:rc1
```

The RC1 suite exercises 320, 360, and 390-pixel touch viewports, 125% text scaling, reduced motion, setup hierarchy, focused-clean persistence, backup round-trips, keyboard focus containment, service-worker activation, and offline reload. Screenshots and a JSON report are written to `artifacts/rc1/`.

The final physical-phone checklist is in [TESTER_GUIDE.md](TESTER_GUIDE.md). The full manual regression matrix is in [TESTING.md](TESTING.md).

## Production architecture

The shipped interface is built from:

- `src/v2/AppV2.jsx`
- `src/v2/model.js`
- `src/v2/styles.css`
- `public/sw.js`

The former implementation remains temporarily as migration reference but is not imported into the production JavaScript or CSS bundle.

## Deployment

Vite and the service worker use the `/clean30/` base path. Pushes to `main` are verified and deployed through GitHub Actions to the canonical custom-domain URL above.
