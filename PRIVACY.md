# Clean30 Privacy Note

Clean30 does not require an account and does not use cloud sync, analytics, advertising, tracking pixels, or a remote application database.

The app is distributed as static files. Normal hosting infrastructure may process standard request metadata, but Clean30 itself does not send room, task, schedule, cleaning-history, or backup content to an application server.

## Data stored on the device

Clean30 stores its current state in the browser or installed-PWA storage under `clean30_v2_state`. That state may include:

- Home name and rooms
- Room features and custom items
- Recurring cleaning tasks and frequencies
- Cleaning days and schedule style
- Active-clean progress
- Completion history
- Appearance settings

Legacy Clean30 storage may remain on a device for migration or recovery until the user clears it.

## Backups and recovery files

A full JSON backup contains the local Clean30 state and should be treated as personal data. It leaves the device only when the user explicitly downloads, copies, uploads, or shares it.

Recovery downloads may contain unreadable or legacy local-storage payloads. They can be useful for data recovery but may also contain personal cleaning information.

## Data deletion

Using **Start over**, clearing browser site data, uninstalling the PWA with data removal, or clearing application storage may permanently delete Clean30 data. Export a backup first when the data should be retained.
