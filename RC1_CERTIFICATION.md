# Clean30 RC1 — Final Certification Record

**Assessment date:** 2026-08-28  
**Repository:** `thiepn/clean30`  
**Certified runtime commit:** `cea8ab03748e5192fee215b6557d5e7fde47c7d3`  
**Final RC1 repository commit before this record update:** `5aa1d182c6d93434644e80653815b12276dc1eef`  
**Service-worker boundary:** `clean30-app-shell-v26`

## Release decision

| Gate | Result |
|---|---|
| Production runtime repair | **PASS — merged and deployed** |
| Source, build, security, and runtime verification | **PASS** |
| Automated mobile/device-class browser certification | **PASS** |
| Repository and branch cleanup | **PASS** |
| Physical Android Chrome and installed-PWA sign-off | **PENDING** |
| Stable `v2.0.0` tag | **HOLD** |

RC1 is complete at the automated and device-class level. The repaired v26 application is deployed, the reproducible browser-certification workflow is retained on `main`, and the repository contains only the `main` branch. Clean30 must not yet be described as physically device-certified or tagged as stable until the final Android browser and installed-PWA checklist is recorded.

## Defects found and repaired

### P0 — Post-setup mobile shell remained two-column

The deployed v25 build retained the desktop `176px` sidebar column below 900 px, compressing Home, Plan, Settings, and cleaning entry surfaces into the left portion of phone screens.

The v26 repair explicitly collapses the app shell to one column below 900 px:

```css
@media (max-width: 900px) {
  .v2-app-shell {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: 60px 1fr auto;
  }
}
```

### P1 — Modal focus was not restored

Room pickers and confirmation dialogs closed correctly, but keyboard focus returned to `BODY`. The modal implementation now captures the invoking control, traps forward and backward Tab navigation, and restores focus after the overlay closes.

### P1 — Settings → Rooms setup editing was outside the focus model

Direct setup editing now behaves as a labelled modal dialog, receives initial focus, supports Escape, traps focus, and returns focus to the exact Settings trigger.

### P2 — Critical mobile setup controls were undersized

Critical setup controls and interactive fields now retain a 44 px interaction floor without reintroducing oversized visual components.

### PWA update boundary

The service-worker cache advanced from v25 to v26 so existing installations receive the mobile-shell and focus repairs instead of continuing to serve the faulty artifact.

## Automated verification

The production release path passed:

- 255 tests; 255 passed, 0 failed, 0 skipped
- dependency audit: 0 vulnerabilities
- production build
- release-artifact verification
- runtime HTTP smoke verification
- manifest and icon verification
- service-worker syntax and offline-fallback checks
- GitHub Pages build and deployment

The final reusable Playwright certification passed on `main` in workflow run `33191464646` and produced artifact `rc1-browser-certification-5aa1d182c6d93434644e80653815b12276dc1eef`.

## Browser/device-class certification

Chromium mobile/touch emulation exercised:

| Configuration | Result |
|---|---|
| 320 × 568, normal text | Pass |
| 360 × 800, normal text | Pass |
| 390 × 844, normal text | Pass |
| 320 × 568, 125% text, reduced motion | Pass |

Certified flows and properties:

- fresh setup through every stage
- current-room hierarchy before add-room controls
- duplicate and custom rooms
- custom tasks and custom-day frequencies
- Home, Plan, Settings, and all cleaning modes
- focused cleaning, pause, reload persistence, review, completion, history, and discard
- backup export and restore
- horizontal-overflow containment
- critical mobile touch targets
- keyboard focus containment, Escape dismissal, and focus restoration
- service-worker activation and controlled offline reload
- reduced-motion and mobile safe-area behavior
- browser console and uncaught-error cleanliness

## Deployment verification

The runtime repair merged through PR #8 and deployed successfully. The reusable certification and current release documentation merged through PR #9. The final `main` deployment and the RC1 browser-certification workflow both completed successfully on commit `5aa1d182c6d93434644e80653815b12276dc1eef`.

## Repository cleanup

Completed:

- PR #8 merged: runtime and accessibility repairs
- PR #9 merged: reproducible browser certification and current release documentation
- obsolete PR #6 closed as superseded
- obsolete PR #7 closed after its useful work was reconciled
- no open pull requests remain
- all obsolete development and release branches deleted
- `main` is the only remaining branch
- canonical deployment documentation points to `https://thiepn.dev/clean30/`

## Remaining physical-device gate

Run the following on an actual Android phone in both Chrome-tab and installed-PWA modes:

- fresh setup at normal and enlarged system text size
- Home, Plan, Settings, and all four cleaning modes
- touch controls near screen edges and the bottom safe area
- pause, background, reopen, resume, and reload during an active clean
- backup export and restore
- offline launch after one successful online load
- installed-app update behavior on v26
- portrait → landscape → portrait rotation
- check for horizontal scrolling, clipped controls, scroll jumps, accidental double taps, or state loss

Record the phone model, Android version, Chrome version, test date, browser-tab result, installed-PWA result, and online/offline result.

**Stable-release criterion:** every physical-device item passes without a P0 or P1 defect. Only then should `v2.0.0` be tagged stable.
