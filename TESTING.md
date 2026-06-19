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
- [ ] Completing Today tasks creates one derived Today activity display without persisting a routine session.
- [ ] Routine-imported Today tasks remain Today activity.
- [ ] Resetting or unchecking dated Today tasks predictably updates derived Today activity.
- [ ] Add-from-routine Cancel, Close, successful Add, and Escape clear transient selections.
- [ ] Edit defaults opens the internal editor focused on Today defaults.
- [ ] Routine picker and selected routine summary appear in Dashboard.
- [ ] Starting a routine keeps the user on Dashboard.
- [ ] Starting a different routine with an active session asks before replacing it.
- [ ] Starting the same routine ID in a different template asks before replacing the original session.
- [ ] Dashboard shows a compact resume card when a session is active.
- [ ] Active session checklist works and persists after refresh.
- [ ] Clean Mode appears only for an active routine session, from both the resume card and active-session area.
- [ ] Clean Mode opens on the first incomplete task and Previous/Next navigation preserves phase context.
- [ ] Mark done and Undo done stay synchronized with the normal active-session checklist.
- [ ] Exiting Clean Mode preserves progress and does not create History.
- [ ] Clean Mode pause/resume and timer stay synchronized with the normal session view.
- [ ] Clean Mode full and partial finish use the existing summary and create one History entry.
- [ ] Rapid or repeated Finish actions across normal and Clean Mode create only one History entry.
- [ ] Clean Mode safely handles an empty routine, an all-complete routine, and a missing routine reference.
- [ ] Clean Mode remains usable at 360px with long text, Large font, and Comfortable density.
- [ ] Active session timer persists after refresh without constant storage writes.
- [ ] Pause and resume keep elapsed time reasonable.
- [ ] Completed active-session phases collapse and remain expandable.
- [ ] Finish, partial finish, reset, and discard still work.
- [ ] Finishing a routine shows a compact completion summary with View History and Close.
- [ ] Calendar renders.
- [ ] Calendar marks days with session or Today activity.
- [ ] Selecting a calendar day opens a closeable detail sheet.
- [ ] Calendar buttons announce the full date and activity counts to a screen reader.
- [ ] Day details clearly separate Today tasks, routine sessions, measured routine time, and estimated Today time.
- [ ] Calendar weekly summary updates from real activity.

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
- [ ] Each weekday clearly shows Using General, Custom, or Empty.
- [ ] Use General, Copy General, and Start empty preserve the intended weekday behavior.
- [ ] Clearing the last custom weekday task leaves an explicit empty weekday.
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
- [ ] Derived Today activity appears as Today activity and has no Delete action.
- [ ] Legacy Today History remains as a non-deletable fallback when dated Today data is absent.
- [ ] Routine/session entries render correctly.
- [ ] Stats are not distorted by one-off Today tasks.
- [ ] Current/best streak and weekly consistency use completed activity only.
- [ ] Entry cards show tasks and elapsed time when available.
- [ ] Older elapsed-only entries show their measured duration.
- [ ] Last 7/30 day insights exclude future entries and use exact inclusive-today boundaries.
- [ ] Filters work.
- [ ] Entry detail panel opens.
- [ ] Delete entry requires confirmation.
- [ ] Deleting a routine session leaves same-day Today activity intact.

## Settings

- [ ] Settings tab is fourth.
- [ ] Appearance shows 12 accent colors and 12 background colors.
- [ ] Changing accent/background persists after refresh.
- [ ] Backup export downloads a JSON file.
- [ ] Backup health updates after export.
- [ ] Backup import previews file name and data counts before confirmation.
- [ ] Complete current backups import; incomplete typed current backups are rejected without a preview.
- [ ] Imported backup timestamps do not count as a local export; backup health recommends a new export.
- [ ] Canceling import leaves current data unchanged.
- [ ] A forced localStorage write failure shows a persistent warning with Export and Retry actions.
- [ ] Today-only use (custom, completed, routine-added, noted, or tagged tasks) becomes backup-reminder eligible.
- [ ] Backup reminder interval can be changed.
- [ ] Font size Small/Normal/Large persists after refresh.
- [ ] Compact/Comfortable density persists after refresh.
- [ ] Version number appears in About.
- [ ] Privacy/local-only section is clear.
- [ ] Help guide opens.
- [ ] Restart onboarding works.
- [ ] Confirmations, Help, onboarding, Add-from-routine, Calendar detail, and Clean Mode trap focus and restore it after closing.
- [ ] Escape dismisses allowed dialogs without confirming destructive actions.
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
- [ ] Ambiguous or malformed imported active sessions warn and are safely discarded.
- [ ] Existing appearance settings load or safely map to the new palette.
- [ ] New full backups include Today data.
- [ ] Version 2 backups migrate empty weekday arrays to General fallback.
- [ ] Version 3 backup round-trips preserve explicit empty weekdays.

## Mobile Accessibility

- [ ] Today checkboxes announce their task text.
- [ ] Bottom navigation, Today row actions, weekday selectors, and modal close controls have usable touch targets.
- [ ] 320px and 360px widths have no horizontal overflow.
- [ ] Large font with Comfortable density remains usable.
