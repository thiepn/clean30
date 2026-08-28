# Clean30 Physical-Device Release Check

Use this checklist on an actual Android phone before declaring a release fully certified.

**Canonical app:** https://thiepn.dev/clean30/

## Test conditions

- Chrome or the installed Clean30 PWA
- Portrait orientation
- Normal text size, then approximately 125% system text size
- Network available for the first load
- A fresh browser profile or cleared Clean30 site data for onboarding

## Five-minute critical path

### 1. Fresh setup

- [ ] The first screen fits without horizontal movement.
- [ ] Tap **Set up my home**.
- [ ] **Your rooms** and the current room count appear before **Add a room**.
- [ ] At least the beginning of the current room list is visible immediately without scrolling.
- [ ] Rename a room, add a duplicate room, and add a custom room.
- [ ] Continue through room details, task selection, and cleaning days.
- [ ] Add a custom task with a two-day interval.
- [ ] No control extends beyond the screen at any setup step.
- [ ] Create the plan.

### 2. Cleaning persistence

- [ ] Open **Clean a room** and choose a room.
- [ ] Mark one task done, then pause.
- [ ] Background or close the app, reopen it, and continue the same clean.
- [ ] Finish the remaining tasks.
- [ ] Review choices, return to the summary, and save.
- [ ] The completed clean appears under **Plan → Cleaning history**.
- [ ] Start another clean, pause, discard it, and confirm no task was rescheduled.

### 3. Installed PWA and offline behavior

- [ ] Install Clean30 from Chrome.
- [ ] The installed app opens without browser chrome and uses the Clean30 icon.
- [ ] The bottom navigation clears the gesture/navigation area.
- [ ] Open the installed app once while online, then enable airplane mode.
- [ ] Fully close and reopen Clean30.
- [ ] The real app loads offline rather than an empty or generic error screen.
- [ ] Existing rooms, tasks, and active-clean state remain available.

### 4. Data safety

- [ ] Export a backup from Settings.
- [ ] Restore that backup and confirm rooms, custom tasks, and history remain intact.
- [ ] A destructive reset still requires explicit confirmation.

### 5. Accessibility and display

- [ ] Increase system text size to approximately 125% and repeat the setup-room screen.
- [ ] Text may wrap, but buttons, inputs, and the footer remain usable.
- [ ] Touch targets are comfortable and not crowded.
- [ ] Android back/Escape-equivalent dismissal does not accidentally confirm destructive dialogs.
- [ ] Reduced-motion system settings do not produce unnecessary movement.

## Pass rule

The physical gate passes only when every critical-path item above succeeds without data loss, horizontal overflow, unreachable controls, or a blocked cleaning flow. Record the phone model, Android version, Chrome version, install mode, and date in the release notes.
