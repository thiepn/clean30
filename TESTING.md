# Clean30 Manual QA Checklist

Use this checklist before sharing a tester build or deploying a release.

## First Launch / Onboarding

- [ ] Fresh browser profile shows onboarding.
- [ ] Default template setup completes.
- [ ] Duplicate-default setup creates an editable template.
- [ ] Profile fields save after onboarding.
- [ ] Restart onboarding from Settings works.

## Navigation

- [ ] Desktop nav shows only Dashboard, Routines, History, Settings.
- [ ] Mobile bottom nav shows only Dashboard, Routines, History, Settings.
- [ ] Mobile bottom nav is flush with the bottom and safe-area padding works.
- [ ] No Start, Systems, Customize, or More public tab appears.
- [ ] Old internal view references do not blank the app.

## Dashboard

- [ ] Daily Rules appear first.
- [ ] Daily Rules can be checked and unchecked.
- [ ] Completing all Daily Rules logs one daily history entry.
- [ ] Re-checking or reviewing Daily Rules does not create duplicate daily history entries.
- [ ] Edit Daily Rules opens the internal editor focused on Daily Rules.
- [ ] Custom To-Do List appears in the main Dashboard task area.
- [ ] To-do tasks can be added, checked, unchecked, removed, and cleared when complete.
- [ ] To-do tasks persist after refresh.
- [ ] To-do tasks do not create history entries.
- [ ] No removed Dashboard action/status/reference cards appear.
- [ ] Routine picker and selected routine summary appear in Dashboard.
- [ ] Edit routines opens the internal editor focused on routines.
- [ ] Add routine opens the internal editor and starts an add-routine flow for editable templates.
- [ ] Protected default template behavior still prevents direct editing.

## Sessions

- [ ] Starting a routine keeps the user on Dashboard.
- [ ] Active session checklist appears on Dashboard.
- [ ] Active session persists after refresh.
- [ ] Tasks and phases can be completed.
- [ ] Notes save during the active session.
- [ ] Reset session requires confirmation and clears progress.
- [ ] Discard session requires confirmation and does not save history.
- [ ] Finish session saves current progress to History, including partial progress.
- [ ] Starting a new routine while a session exists requires confirmation.
- [ ] Daily Rules special handling remains separate from normal session history.

## Routines

- [ ] Routines tab is second.
- [ ] Daily Rules are not shown as a normal reset routine.
- [ ] Selecting a routine shows summary and checklist reference.
- [ ] Checklist phases are collapsed by default.
- [ ] Expanding a phase shows tasks.
- [ ] No copy checklist buttons appear.
- [ ] No preparation tools section appears.
- [ ] No copy success/error message appears.
- [ ] No copy or Start-tab wording remains.

## History

- [ ] History tab is third.
- [ ] Empty History shows a light starter state.
- [ ] Daily Rules history entries appear as Daily entries.
- [ ] Routine/session entries render correctly.
- [ ] Stats are not distorted by to-do tasks.
- [ ] Filters work: All, Daily, Weekly, Minimal, Guest, Monthly, Initial.
- [ ] Entry detail panel opens.
- [ ] Delete entry requires confirmation.

## Settings

- [ ] Settings tab is fourth.
- [ ] Active system card is compact.
- [ ] Edit system details opens the internal editor from Settings.
- [ ] Appearance settings still work.
- [ ] Backup export downloads a JSON file.
- [ ] Backup import validates and asks for confirmation.
- [ ] Backup reminder interval can be changed.
- [ ] Privacy/local-only section is clear.
- [ ] Help guide opens.
- [ ] Restart onboarding works.
- [ ] Cleaning Systems content is available inside Settings.
- [ ] Danger Zone is collapsed by default.
- [ ] Reset history and reset all still require confirmation.
- [ ] Reset hidden recommendations control is gone.

## Internal Editor

- [ ] Editor never appears as a public nav tab.
- [ ] Back to Dashboard works when opened from Dashboard.
- [ ] Back to Settings works when opened from Settings.
- [ ] Routines editor can edit phases and tasks for editable templates.
- [ ] Daily Rules editor can edit rules for editable templates.
- [ ] Systems editor remains available through Settings/editor paths.
- [ ] Default template remains protected and offers duplicate-to-edit.
- [ ] Import/export category still works.

## PWA Install

- [ ] Live URL opens at https://thiepn.github.io/clean30/.
- [ ] Vite base remains `/clean30/`.
- [ ] Manifest is detected by the browser.
- [ ] Android Add to Home Screen / Install app is available.
- [ ] Installed app uses Clean30 icons.
- [ ] Service worker syntax passes.

## Mobile Layout

- [ ] Text does not overflow horizontally.
- [ ] Buttons and checkboxes have usable tap targets.
- [ ] Bottom navigation does not cover final page content.
- [ ] Dashboard, Routines, History, and Settings are readable on phone width.

## Compatibility

- [ ] Old localStorage without `dashboardTodos` loads.
- [ ] Old localStorage without `appSettings` loads.
- [ ] Old localStorage with legacy dismissed-action data loads harmlessly.
- [ ] Old history entries normalize safely.
- [ ] Old full backups import safely.
- [ ] New full backups include current app state, including dashboard to-dos.
