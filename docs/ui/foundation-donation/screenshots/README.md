# Screenshot verification pending

Expected full-page files after a successful browser run:

- donation-1440.png
- donation-1280.png
- donation-768.png
- donation-390.png

None captured in this execution. Chromium exited before creating any page: macOS `bootstrap_check_in ... MachPortRendezvousServer ... Permission denied (1100)`. Browser plugin bootstrap also failed (`Importing module "node:process" is not allowed in node_repl`). No screenshot inspection or visual completion is claimed. Run `tests/ui/foundation-donation.spec.mjs` in a browser-enabled environment, then inspect all four full-page screenshots against the owner mock.
