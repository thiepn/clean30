# RC1 Evidence Index

The final assessment and release decision are recorded in [`RC1_CERTIFICATION.md`](RC1_CERTIFICATION.md).

## Final certified repository state

- Runtime repair commit: `cea8ab03748e5192fee215b6557d5e7fde47c7d3`
- Final RC1 code/documentation commit before the certification-record update: `5aa1d182c6d93434644e80653815b12276dc1eef`
- Service-worker cache: `clean30-app-shell-v26`
- Remaining branches: `main` only
- Open pull requests: none

## Workflow evidence

### Runtime deployment

- GitHub Pages run: `33190559601`
- Build and release-candidate verification: passed
- Deployment: passed
- Canonical deployment: `https://thiepn.dev/clean30/`

### Final reusable browser certification

- Workflow run: `33191464646`
- Result: passed
- Evidence artifact: `rc1-browser-certification-5aa1d182c6d93434644e80653815b12276dc1eef`
- Artifact digest: `sha256:27296e9325a8ec88468844ca9c54e1e8a67b7537e3f1d0d1e66c17f700a80ab4`

The artifact contains:

- `320.png`
- `360.png`
- `390.png`
- `320-large-text.png`
- `390-functional-offline.png`
- `clean30-rc1-backup.json`
- `report.json`

## Passed gates in `report.json`

- touch viewport 320 × 568
- touch viewport 360 × 800
- touch viewport 390 × 844
- 320 × 568 at 125% text with reduced motion
- focused-clean persistence, review, completion, history, and discard
- backup export and restore
- keyboard focus containment and Escape dismissal
- PWA service worker and offline reload
- reduced-motion and mobile safe-area CSS

## Repository cleanup evidence

- PR #8 merged: RC1 runtime/mobile/focus repair
- PR #9 merged: reproducible browser-certification infrastructure and current documentation
- PR #6 closed as superseded
- PR #7 closed as superseded after reconciliation
- obsolete branch-cleanup workflow passed
- repository branch listing contains only `main`

## Remaining external evidence

A physical Android Chrome and installed-PWA record is still required before stable release. Use [`TESTER_GUIDE.md`](TESTER_GUIDE.md) and record:

- phone model
- Android version
- Chrome version
- test date
- browser-tab result
- installed-PWA result
- online/offline result
- any non-blocking observations

The stable `v2.0.0` tag remains intentionally withheld until that record passes.
