# RC1 Evidence Index

The detailed release-candidate assessment is in [`RC1_CERTIFICATION.md`](RC1_CERTIFICATION.md).

## Automated and emulated evidence

- Chromium mobile/touch emulation at 320 px, 360 px, and 390 px
- Fresh setup through all five stages
- Home, Plan, Settings, room picker, focused cleaning, pause/resume, discard, review, and save
- Backup export and restore
- 200% root text scaling at 320 px
- Keyboard focus trapping and focus restoration
- Offline reload under an active service worker
- Service-worker update handoff from app-shell v25 to v26
- 44 px certified interaction floor for critical mobile setup controls

## Remaining external gate

A physical Android browser and installed-PWA spot-check remains required before creating the stable `v2.0.0` tag. The branch may be merged as an RC1 repair because the deployed v25 build contains a confirmed post-setup mobile layout defect.
