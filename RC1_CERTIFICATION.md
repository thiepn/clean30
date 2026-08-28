# Clean30 RC1 — Release Certification and Repository Cleanup

**Assessment date:** 2026-08-28
**Repository:** `thiepn/clean30`
**Deployed base commit inspected:** `d16bb3ec2a00594849dcd87f7ad9de54a6d80057`
**Browser used for certification:** Chromium 144.0.7559.96, Playwright mobile emulation
**Widths exercised:** 320 px, 360 px, 390 px

## Release decision

| Gate | Result |
|---|---|
| Current deployed build | **FAIL** |
| Patched RC1 candidate under browser/device emulation | **PASS** |
| Physical Android browser/PWA certification | **PENDING** |
| Stable `v2.0.0` release | **HOLD** |

The deployed build cannot be tagged stable because its final visual override preserves the desktop sidebar column below 900 px. This compresses Home, Plan, Settings, and focused-cleaning entry surfaces into a narrow left column on phones. The RC1 patch resets the shell to one column and includes regression protection.

The patched candidate passed the browser/device-emulation matrix below. This is not a substitute for one final run on a physical Android device.

## Findings and repairs

### P0 — Post-setup mobile shell remains two-column

**Observed:** At a 390 px viewport, `.v2-app-shell` retained `176px minmax(0, 1fr)`. The main content area was approximately 176 px wide, with most of the viewport unused.

**Root cause:** The final minimal-interface `@media (max-width: 900px)` rule changed the rows but failed to override `grid-template-columns`.

**Repair:**

```css
@media (max-width: 900px) {
  .v2-app-shell {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: 60px 1fr auto;
  }
}
```

### P1 — Dialogs lose keyboard focus when closed

**Observed:** Escape correctly closed the room picker and confirmation dialog, but focus returned to `BODY` rather than the control that opened the dialog.

**Root cause:** The previous active element was captured inside the effect after commit/autofocus, and the effect reran whenever an inline `onClose` callback changed identity.

**Repair:** Capture the previous element during render, hold the current close callback in a ref, mount the focus trap once, and restore focus on the next animation frame after inert state has been removed.

### P1 — Setup editing opens outside the focus model

**Observed:** Settings → Rooms opened the full-screen editor with focus on `BODY`; Escape closed it without returning focus to the Settings row.

**Repair:** Treat editing SetupFlow as a labelled modal dialog, use the shared focus trap, autofocus the Close control, and restore focus to the exact Settings trigger.

### P2 — Compact setup controls are too small for reliable touch use

**Observed:** Several mobile setup controls were visually usable but unnecessarily small: custom-item removal was 28 px, task toggles were 36 px, and multiple chips/selects were 39–42 px high.

**Repair:** Raise the mobile setup interaction floor to 44 px for inputs, selects, room/item chips, task toggles, and destructive icon controls without changing the compact visual hierarchy.

### Release boundary

The service-worker cache advances from `app-shell-v25` to `app-shell-v26` so installed PWAs receive the RC1 repair rather than continuing to serve the faulty shell.

## Browser/device-emulation certification matrix

The patched production artifact was exercised at all three widths. `documentElement.scrollWidth` equalled the viewport width, and no visible element exceeded the viewport.

| Surface | 320 px | 360 px | 390 px |
|---|---:|---:|---:|
| Initial setup introduction | Pass | Pass | Pass |
| Setup — Rooms | Pass | Pass | Pass |
| Setup — Room details | Pass | Pass | Pass |
| Setup — Cleaning tasks | Pass | Pass | Pass |
| Setup — Schedule | Pass | Pass | Pass |
| Home | Pass | Pass | Pass |
| Plan | Pass | Pass | Pass |
| Settings | Pass | Pass | Pass |
| Room picker | Pass | Pass | Pass |
| Weekly focused clean | Pass | Pass | Pass |
| Discard confirmation | Pass | Pass | Pass |

## Functional certification

| Area | Result | Evidence checked |
|---|---|---|
| Fresh setup | Pass | Four default rooms, room list before add controls, task generation, schedule completion |
| Today’s clean | Pass | Start, Done, completion summary, review choices, save |
| Weekly reset | Pass | 11-task focused clean generated from configured state |
| Clean a room | Pass | Accessible room dialog, per-room task counts, disabled empty-room handling |
| Guests are coming | Pass | 10 priority tasks generated |
| Pause/resume | Pass | Active session returned to Home and survived reload |
| Discard | Pass | Confirmation shown; no schedule mutation before confirmation |
| Backup export/restore | Pass | JSON downloaded, edited state restored to exported home state |
| Appearance | Pass | Light/dark switch persisted |
| Large text | Pass | 200% root font size at 320 px; no horizontal overflow or clipped buttons |
| Mobile touch targets | Pass after patch | Critical setup controls and interactive fields retain a 44 px interaction floor |
| Keyboard focus trap | Pass after patch | Forward/backward Tab cycling remained inside dialogs |
| Keyboard focus return | Pass after patch | Room picker, confirmation, and SetupFlow returned focus to their triggers |
| Offline app shell | Pass | Active service worker and cached shell loaded while network was disabled |
| PWA update handoff | Pass | Update toast appeared; activation advanced cache and reloaded successfully |

## Existing automated baseline

The latest successful deployment workflow for the inspected base reported:

- 255 tests passed; 0 failed, skipped, or cancelled
- dependency audit: 0 vulnerabilities
- production build passed
- release verification passed
- runtime HTTP smoke verification passed
- service-worker syntax and offline fallback passed
- GitHub Pages build and deployment passed

RC1 adds source-level regression guards for the one-column mobile shell, focus-managed overlays, and the v26 cache boundary.

## Repository cleanup audit

### Open work

- Open issues: none
- Draft PR `#6` is based on the obsolete `phase20/intuitiveness-consolidation` architecture and is divergent from current `main`. It must be closed, not merged.

### Branches safe to remove

The following branches are fully contained in `main` and have no commits missing from it:

- `dashboard-routines-overhaul`
- `redesign/autopilot-core`
- `redesign/friction-elimination`
- `redesign/intuitiveness-consolidation`
- `redesign/universal-clean30`
- `redesign/visual-polish`

The following branch is divergent but superseded by the current v2 implementation and its obsolete draft PR:

- `phase20/intuitiveness-consolidation`

After the RC1 fix is merged, retain `main` as the only long-lived branch.

## Required remote actions

1. Apply the RC1 patch to `main` or a short-lived `rc1/release-certification` branch.
2. Run `npm ci` and `npm run verify:release-candidate`.
3. Merge only after all checks pass.
4. Confirm the Pages deployment serves `app-shell-v26`.
5. Close PR `#6` as superseded.
6. Delete the seven obsolete branches listed above.
7. Run the physical-device checklist below.
8. Tag `v2.0.0-rc.1`. Promote to stable `v2.0.0` only after physical-device sign-off.

## Final physical-device checklist

Run on an actual Android phone in both browser and installed-PWA modes:

- Fresh setup at normal text size and maximum practical system font size
- Home, Plan, Settings, and all four cleaning modes
- Tap targets near screen edges and bottom safe area
- Pause, background the app, resume, and reload during an active clean
- Export and restore a backup
- Launch offline after one successful online load
- Install/update from v25 to v26 and verify the update prompt
- Rotate portrait → landscape → portrait
- Confirm no horizontal scrolling, clipped controls, accidental double taps, or scroll jumps

**Stable-release criterion:** every item passes without a P0/P1 defect.
