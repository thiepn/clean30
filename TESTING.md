# Clean30 Manual QA Checklist

Use this checklist before sharing a tester build or deploying a release.

## First Launch / Onboarding

- [ ] Fresh browser profile shows onboarding.
- [ ] Default template setup completes.
- [ ] Duplicate-default setup creates an editable template.
- [ ] Profile fields save after onboarding.
- [ ] Restart onboarding from Settings works.

## Dashboard

- [ ] Dashboard loads without history.
- [ ] Tiny Rules can be checked and unchecked.
- [ ] Completing all Tiny Rules logs one daily history entry.
- [ ] Re-checking/reviewing Tiny Rules does not create duplicate daily history entries.
- [ ] Recommended action appears when expected.
- [ ] Dismissed recommendations disappear.
- [ ] Reset hidden recommendations in Settings allows recommendations to return.
- [ ] Backup reminder respects the selected reminder interval.

## Quick Start

- [ ] Quick Start uses select-first, confirm-second behavior.
- [ ] Starting a reset navigates to Start.
- [ ] Existing active session requires confirmation before replacement.

## Start Page

- [ ] Routine picker excludes Daily Rules as a normal reset.
- [ ] Pre-session summary is readable on mobile.
- [ ] Session starts with an empty checklist.
- [ ] Active session persists after refresh.
- [ ] Tasks and phases can be completed.
- [ ] Notes save during the active session.
- [ ] Finish saves history.
- [ ] Finish partial saves current progress to history.
- [ ] Discard requires confirmation and does not save history.

## Systems Page

- [ ] Page starts with Apartment Map zones.
- [ ] Zone chips change the selected zone.
- [ ] Selected zone chip is visually clear.
- [ ] Zone Focus shows frequency, watch-outs, supplies, and good-enough target.
- [ ] Related tasks are limited by default and expandable.
- [ ] Systems does not show a Start Weekly Reset button.
- [ ] Priority Order is compact and readable on mobile.
- [ ] Apartment Laws are available.
- [ ] System accordions collapse and expand correctly.

## Routines Page

- [ ] Daily Rules is not shown as a normal reset routine.
- [ ] Routine comparison cards are compact on mobile.
- [ ] Selected routine guide shows purpose, metadata, supplies, related zones, and when-to-use.
- [ ] Copy checklist works and shows feedback.
- [ ] View checklist opens the checklist reference.
- [ ] Checklist reference is collapsed by default.
- [ ] Phase summaries show before task details.
- [ ] Tasks appear only after expanding a phase.
- [ ] Start this routine works and remains secondary.

## Customize Simple Mode

- [ ] Simple Customize opens as compact settings cards.
- [ ] Protected default template is clearly read-only.
- [ ] Duplicate to edit works.
- [ ] Home display fields save for editable templates.
- [ ] Reset timing fields save for editable templates.
- [ ] Tiny Rules can be edited for editable templates.
- [ ] Template preset browsing remains available.
- [ ] Full backup shortcut works.
- [ ] Danger Zone is collapsed.

## Customize Advanced Mode

- [ ] Advanced opens to a category menu.
- [ ] Each category opens and has a Back to Advanced action.
- [ ] Template Overview works.
- [ ] Gallery Presets works.
- [ ] Profile Fields works.
- [ ] Zones editor works.
- [ ] Daily Rules editor works.
- [ ] Routines & Phases editor works.
- [ ] Systems editor works.
- [ ] Schedule uses "Fallback reset day" visibly.
- [ ] Appearance editor works.
- [ ] Import / Export category works.
- [ ] Default template remains protected.

## History

- [ ] Empty History shows a light starter state.
- [ ] Tiny Rules history entries appear as Daily entries.
- [ ] Reset stats are not distorted by Daily Rules entries.
- [ ] Filters work: All, Daily, Weekly, Minimal, Guest, Monthly, Initial.
- [ ] Empty filter state is clear.
- [ ] Existing entries render as compact cards.
- [ ] Entry detail panel opens.
- [ ] Delete entry requires confirmation.

## Settings

- [ ] Active system card is compact.
- [ ] Manage in Customize navigates to Customize.
- [ ] Backup export downloads a JSON file.
- [ ] Backup import validates and asks for confirmation.
- [ ] Backup reminder interval can be changed.
- [ ] Setting reminder to Off hides backup reminders.
- [ ] Privacy section is clear.
- [ ] Open help guide opens the existing guide.
- [ ] Restart onboarding works.
- [ ] Reset hidden recommendations works.
- [ ] Danger Zone is collapsed by default.
- [ ] Reset history and reset all still require confirmation.

## PWA Install

- [ ] Live URL opens at https://thiepn.github.io/clean30/.
- [ ] Manifest is detected by the browser.
- [ ] Android Add to Home Screen / Install app is available.
- [ ] Installed app uses Clean30 icons.
- [ ] App loads after install.

## Mobile Layout

- [ ] Bottom navigation is usable.
- [ ] Bottom navigation does not cover final page content.
- [ ] Text does not overflow horizontally.
- [ ] Buttons and checkboxes have usable tap targets.
- [ ] Dashboard, Start, Systems, Routines, Customize, History, and Settings are readable on phone width.

## Desktop Layout

- [ ] Desktop navigation works.
- [ ] Main content remains centered and readable.
- [ ] Cards do not stretch awkwardly on wide screens.
- [ ] Forms and long editors remain usable.

## Compatibility

- [ ] Old localStorage without `appSettings` loads.
- [ ] Old localStorage without `dismissedRecommendations` loads.
- [ ] Old history entries normalize safely.
- [ ] Daily-rule history entries normalize safely.
- [ ] Old full backups without new settings import safely.
- [ ] Full backups include current settings after export.
