# SHF Interactive Logo Lock

## Confirmed Working

- SHF Impact Command Center builds.
- Header globe/logo is interactive.
- Hover animation/glow works.
- Clicking the logo returns to Foundation home page.
- JSX anchor issue was repaired by using a safe interactive div with click and keyboard handling.
- Existing SHF Command Tour and page layout remain intact.

## Route

Logo target:
`/foundation.html`

## Safety Rule

Do not wrap the existing brand block in an `<a>` tag unless the closing JSX is carefully matched.
The safe pattern is the current `role="button"` + `onClick` approach.
