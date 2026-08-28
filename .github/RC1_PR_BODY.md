## RC1 — Real-Device Release Certification & Repository Cleanup

This release-candidate repair addresses defects reproduced while testing the deployed `d16bb3e` production artifact under Chromium mobile/touch emulation.

### Release-blocking repairs

- Collapse the post-setup app shell to one column below 900 px. The deployed v25 build retained the 176 px desktop sidebar column on phones, compressing Home, Plan, and Settings into the left side of the screen.
- Repair modal focus restoration so room pickers and confirmations return keyboard focus to their trigger.
- Treat Settings → Rooms setup editing as a labelled modal with trapped focus, Escape handling, and trigger restoration.
- Raise critical mobile setup targets and interactive fields to a 44 px interaction floor.
- Advance the installed-PWA cache boundary from `app-shell-v25` to `app-shell-v26`.

### Certification completed

- 320 / 360 / 390 px setup and post-setup layouts
- Home, Plan, Settings, all four cleaning modes, focused clean, pause/resume, discard, review, and save
- backup export and restore
- large-text reflow at 320 px
- keyboard focus trap and return
- offline reload
- v25 → v26 update prompt, activation, cache cleanup, and reload
- full `npm run verify:release-candidate`

### Repository cleanup

- Correct deployment documentation to `thiepn.dev/clean30/`
- Add the RC1 certification record and evidence index
- After merge, close obsolete draft PR #6 as superseded

### Release decision

Merge the RC1 repair after CI. Do **not** create the stable `v2.0.0` tag yet: one physical Android browser/installed-PWA spot-check remains documented as the final external gate.
