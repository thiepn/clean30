# Clean30 Manual QA Matrix

Use this matrix before a stable release or after changes to scheduling, persistence, setup, focused cleaning, backups, service-worker behavior, or mobile layout.

## Automated prerequisites

- [ ] `npm run verify:release-candidate` passes.
- [ ] RC1 browser certification passes at 320×568, 360×800, and 390×844.
- [ ] Dependency audit reports zero vulnerabilities at the configured release threshold.
- [ ] Production runtime smoke verifies `/clean30/`, hashed assets, manifest icons, and `/clean30/sw.js`.
- [ ] GitHub Pages build and deployment complete successfully.

## Fresh setup

- [ ] Fresh storage opens **Set up your home**.
- [ ] Setup progress, Back, Continue, and finish actions report the correct state.
- [ ] Current rooms appear before room-add controls.
- [ ] Preset rooms may be added repeatedly and renamed independently.
- [ ] Arbitrarily named rooms can be added.
- [ ] Removing every room blocks continuation until at least one room exists.
- [ ] Room details allow built-in features and custom items/surfaces.
- [ ] Generated tasks reflect the configured room features.
- [ ] Optional tasks can be enabled.
- [ ] Custom tasks can be created, renamed, moved to another room, and deleted.
- [ ] Duplicate custom-task names within one room are rejected.
- [ ] Frequencies include daily through yearly and arbitrary custom-day intervals.
- [ ] Spread-through-week and one-main-day schedules both work.
- [ ] Frequent upkeep remains independent from larger cleaning days.
- [ ] **Create for later** and **Create and start** both produce a valid plan.

## Home and cleaning modes

- [ ] Home shows either **Today’s clean** or **Nothing due today** with accurate plan status.
- [ ] Today is capped at the eight oldest due tasks and reports remaining backlog.
- [ ] Weekly reset contains only eligible weekly work.
- [ ] Clean a room lists configured rooms and disables rooms without selected work.
- [ ] Guests are coming contains only eligible priority work.
- [ ] Special-purpose modes remain bounded to twelve tasks.

## Focused cleaning

- [ ] One current task is presented at a time.
- [ ] Done and Skip advance to another unfinished task.
- [ ] Previous and Next wrap safely.
- [ ] Progress and handled counts remain accurate.
- [ ] Pause returns to Home without losing progress.
- [ ] Reloading or reopening resumes the same active session.
- [ ] Escape pauses rather than discarding.
- [ ] Discard requires confirmation and preserves original due dates.
- [ ] Completing all tasks opens the summary.
- [ ] Review choices permits correction before saving.
- [ ] Save and finish creates one history entry and reschedules only completed tasks.
- [ ] An all-skipped clean creates no misleading completion history.
- [ ] Setup editing is blocked while a clean remains active.

## Plan

- [ ] Overdue, next-seven-day, next-thirty-day, and later groups do not overlap.
- [ ] Relative due labels are correct.
- [ ] The seven-day strip reflects near-term work.
- [ ] Recently finished cleans show the correct title and completed-task count.
- [ ] Completing, skipping, correcting, and discarding work updates Plan predictably.

## Settings

- [ ] Rooms opens setup directly at room editing.
- [ ] Room details, cleaning tasks, and cleaning schedule open their intended steps.
- [ ] Cancel, Save changes, and Escape behave correctly in direct editing.
- [ ] Light/dark appearance persists after reload.
- [ ] Export backup downloads a valid current Clean30 v2 backup.
- [ ] Restore rejects malformed or incomplete data.
- [ ] Restore requires confirmation and replaces the current v2 state only after confirmation.
- [ ] Start over requires confirmation and returns to fresh setup.
- [ ] Privacy copy accurately describes local-only storage.

## Persistence and recovery

- [ ] Normal changes persist under `clean30_v2_state`.
- [ ] Current backups round-trip the normalized v2 state without losing rooms, tasks, schedule, history, appearance, or a valid active clean.
- [ ] Valid active sessions survive normalization and reload.
- [ ] Impossible or malformed active sessions are discarded during normalization without corrupting the remaining state.
- [ ] Unreadable saved JSON opens the recovery screen and is not overwritten automatically.
- [ ] Recovery download contains the original unreadable payload.
- [ ] Simulated localStorage write failure produces a persistent warning and unload protection.
- [ ] A later successful save clears the storage warning.

## PWA, update, and offline

- [ ] Manifest identity, icons, start URL, scope, and display mode are correct.
- [ ] Service worker installs at `/clean30/sw.js` with `/clean30/` scope.
- [ ] Current cache is `clean30-app-shell-v25` and older Clean30 caches are removed.
- [ ] Built CSS and JavaScript assets are cached after one online load.
- [ ] A controlled reload works with the network disabled.
- [ ] Offline navigation returns the cached application shell.
- [ ] An update waits for explicit user action rather than replacing a live session silently.
- [ ] **Update now** activates the waiting worker and reloads under the new controller.
- [ ] Installed Android safe areas do not cover the bottom navigation or actions.

## Mobile layout

- [ ] 320, 360, and 390-pixel widths have no document-level horizontal overflow.
- [ ] Setup header, progress, content, and footer remain within the viewport.
- [ ] Current rooms remain above add-room controls.
- [ ] Task rows collapse to one readable mobile column.
- [ ] Custom-frequency controls remain usable.
- [ ] Weekday buttons remain selectable at narrow widths.
- [ ] Finish actions stack at 390 pixels and below when required.
- [ ] Room picker and confirmation sheets remain usable on short screens.
- [ ] Focused-clean actions remain reachable without accidental overlap.
- [ ] Bottom navigation remains fixed and safe-area aware.

## Accessibility

- [ ] Primary navigation exposes visible labels and `aria-current`.
- [ ] Setup progress exposes current, minimum, and maximum values.
- [ ] Room names, removal buttons, task toggles, frequencies, weekdays, and close buttons have accessible names.
- [ ] Dialogs and alert dialogs expose a name, modal state, and initial focus.
- [ ] Tab and Shift+Tab remain trapped inside open dialogs.
- [ ] Escape closes non-destructive overlays without confirming an action.
- [ ] Focus returns to the previous control after a dialog closes.
- [ ] Live regions announce room counts, focused-task changes, notices, and update availability.
- [ ] Touch actions used in primary flows are at least 40×40 CSS pixels.
- [ ] At 125% text size, wrapping does not hide controls or create horizontal overflow.
- [ ] Reduced-motion preference reduces transition duration and disables smooth scrolling.

## Release record

Record the following with the release decision:

- Commit SHA
- GitHub Actions run IDs
- RC1 artifact/report name
- Physical phone model
- Android and Chrome versions
- Browser-tab and installed-PWA results
- Online/offline results
- Known non-blocking defects
