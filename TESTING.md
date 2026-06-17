# Clean30 Manual QA Checklist

Use this checklist before sharing a tester build or deploying a release.

## First Launch / Onboarding

- [ ] Fresh browser profile shows the tutorial onboarding.
- [ ] Next and Back work.
- [ ] Skip opens Dashboard.
- [ ] Starter setup creates Today tasks.
- [ ] Empty Today setup starts with no default Today tasks.
- [ ] Restart onboarding from Settings works.

## Navigation

- [ ] Desktop nav shows only Dashboard, Routines, History, Settings.
- [ ] Mobile bottom nav shows only Dashboard, Routines, History, Settings.
- [ ] Mobile bottom nav is flush with the bottom and safe-area padding works.
- [ ] Old internal view references do not blank the app.

## Dashboard

- [ ] Today appears as one unified section.
- [ ] Today has starter tasks on a fresh starter setup.
- [ ] Today can start empty when chosen during onboarding.
- [ ] User can add a task for today.
- [ ] User can check and uncheck tasks.
- [ ] User can remove custom Today tasks.
- [ ] Today tasks persist after refresh.
- [ ] Today initializes fresh by date.
- [ ] Completing default Today tasks logs one Today history entry.
- [ ] Re-checking Today tasks does not create duplicate date entries.
- [ ] Edit defaults opens the internal editor focused on Today defaults.
- [ ] Routine picker and selected routine summary appear in Dashboard.
- [ ] Starting a routine keeps the user on Dashboard.
- [ ] Starting a different routine with an active session asks before replacing it.
- [ ] Dashboard shows a compact resume card when a session is active.
- [ ] Active session checklist works and persists after refresh.
- [ ] Active session timer persists after refresh without constant storage writes.
- [ ] Pause and resume keep elapsed time reasonable.
- [ ] Completed active-session phases collapse and remain expandable.
- [ ] Finish, partial finish, reset, and discard still work.
- [ ] Finishing a routine shows a compact completion summary with View History and Close.
- [ ] Mini calendar renders.
- [ ] Calendar marks days with session or Today activity.
- [ ] Selecting a calendar day shows details.

## Routines

- [ ] Routines tab is second.
- [ ] Edit/Add button opens the internal editor.
- [ ] Add routine opens the editor in routine-add mode.
- [ ] Selecting a routine shows summary and checklist reference.
- [ ] Routine cards show duration, last-done state, and subtle color labels.
- [ ] Show archived reveals archived routines.
- [ ] Checklist phases are collapsed by default.
- [ ] No copy or preparation UI appears.

## Editor

- [ ] One editor only.
- [ ] No mode toggle appears.
- [ ] No duplicate-before-edit requirement appears.
- [ ] Today defaults live inside the Routines editor area.
- [ ] Routines can be added and edited.
- [ ] Routine duration validates as 1-600 minutes.
- [ ] Routines can be duplicated with independent IDs.
- [ ] Routines can be archived and unarchived.
- [ ] Active-session routine cannot be archived or deleted.
- [ ] Optional routine color labels persist.
- [ ] Schedule can be edited.
- [ ] App details can be edited.
- [ ] Appearance is not duplicated inside the editor.
- [ ] Back returns to Dashboard, Routines, or Settings based on where the editor opened.

## History

- [ ] History tab is third.
- [ ] Empty History shows a light starter state.
- [ ] Today entries appear as Today entries.
- [ ] Routine/session entries render correctly.
- [ ] Stats are not distorted by one-off Today tasks.
- [ ] Filters work.
- [ ] Entry detail panel opens.
- [ ] Delete entry requires confirmation.

## Settings

- [ ] Settings tab is fourth.
- [ ] Appearance shows 12 accent colors and 12 background colors.
- [ ] Changing accent/background persists after refresh.
- [ ] Backup export downloads a JSON file.
- [ ] Backup import validates and asks for confirmation.
- [ ] Backup reminder interval can be changed.
- [ ] Privacy/local-only section is clear.
- [ ] Help guide opens.
- [ ] Restart onboarding works.
- [ ] Danger Zone is collapsed by default.
- [ ] Reset history and reset all still require confirmation.

## PWA Install

- [ ] Live URL opens at https://thiepn.github.io/clean30/.
- [ ] Vite base remains `/clean30/`.
- [ ] Manifest is detected by the browser.
- [ ] Android Add to Home Screen / Install app is available.
- [ ] Installed app uses Clean30 icons.
- [ ] Service worker syntax passes.

## Compatibility

- [ ] Old localStorage loads.
- [ ] Old full backups import safely.
- [ ] Existing active session loads.
- [ ] Existing appearance settings load or safely map to the new palette.
- [ ] New full backups include Today data.
