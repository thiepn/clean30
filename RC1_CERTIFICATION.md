# RC1 — Release Certification

RC1 separates reproducible browser/device-class certification from the final physical-phone observation that cannot be inferred from source code alone.

## Automated release gates

The `RC1 browser certification` GitHub Actions workflow runs against the production build and fails the release when any gate below fails:

- 320×568 touch viewport
- 360×800 touch viewport
- 390×844 touch viewport
- 320×568 at 125% root text size
- Reduced-motion media preference
- No document-level horizontal overflow through all setup steps
- Current-room hierarchy and immediate visibility on setup entry
- Preset, duplicate, and custom room support
- Daily and arbitrary custom-day frequencies
- Custom task creation and persistence
- Mobile navigation and primary-action touch targets
- Room-dialog focus trap and Escape dismissal
- Direct setup editing and Escape cancellation
- Light/dark persistence
- Version-2 backup export and restore
- Focused-clean progress, pause, reload persistence, review, finish, history, and discard
- Service-worker activation at `/clean30/`
- Controlled offline application reload
- Safe-area CSS and reduced transition duration
- Browser console and uncaught-error cleanliness

Successful runs upload:

- `artifacts/rc1/report.json`
- Viewport screenshots
- The backup used for the round-trip test

## Physical-phone gate

A stable release still requires one pass of [TESTER_GUIDE.md](TESTER_GUIDE.md) on an actual Android phone. The release record must identify the device, Android version, Chrome version, browser/PWA mode, and offline result.

## Release decision

- **Automated failure:** release blocked.
- **Automated pass, physical gate not recorded:** release candidate only.
- **Automated pass and physical gate recorded:** eligible for stable release declaration.
