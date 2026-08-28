# Silicon Heartland Universe — Canonical Landing V1

## Canonical Universe

The approved cinematic Universe V1 — originally developed and verified at
`/Users/mikeslate/Desktop/silicon-heartland-universe-3d/browser-preview/shu-cinematic-browser-preview-v1`
(reachable there at `http://localhost:5175/universe` during its own
development) — is the sole canonical ecosystem landing experience for
Silicon Heartland.

It has been ported, verbatim (visuals and interaction behavior
unchanged), into this repository at `src/pages/universe-v1/`. The
external reference project remains on disk as the historical source of
that port; it is no longer a required runtime dependency for this
repository's `/universe` to work.

## Canonical route

```
/universe
```

Also reachable, rendering the identical component, at:
- `/` (this repository's site root — see "Two entry points" below)
- `/universe.html` (the real Vite multi-page build output backing `/universe`)

Sub-routes inside the Universe SPA (client-side, not separate HTML
entries): `/universe/directory` (Card Mode), `/universe/v1-lab`
(redirects to `/universe`), `/universe/v2-lab`,
`/universe/environment-lab`, plus one route per destination
(`/universe/bos`, `/universe/silicon-heartland-foundation`, etc.) used
only as a fallback informational page if a destination is reached
directly by URL.

## Two entry points, one implementation

```
universe.html  ──┐
                 ├──► src/pages/universe-v1/UniverseApp.jsx (single source)
index.html     ──┘
```

- `src/entries/universe.main.jsx` mounts `UniverseApp` for `universe.html`.
- `src/entries/index.main.jsx` mounts the same `UniverseApp` for the site
  root (`index.html`), preserving its one unrelated existing branch
  (`/studio/templates` → `WebMakerPage`).

Both entries import the exact same `UniverseApp.jsx` module — there is
one implementation, not two forks that could drift apart. Vite's dev
server resolves the extensionless `/universe` path to `universe.html`
directly (verified live); `/` independently resolves to `index.html`,
which now renders the identical component.

## Retired implementation

`src/pages/universe/SiliconHeartlandUniversePage.jsx` and its supporting
files (`universeWorldCatalog.js`, `UniverseCanvas.jsx`, `UniverseLayer.jsx`,
a placeholder `universe.css` stub, the unused `bootApp.jsx` entry, and the
test that asserted its behavior) previously occupied this repository's
site root (`index.html` unconditionally mounted it — it was never a
`/universe` sub-route, it *was* the homepage). It has been moved,
intact, to:

```
src/_archive/universe-legacy-pre-canonical-v1/
```

with a README explaining the retirement. Nothing outside that archive
folder imports from it (confirmed via repository-wide search). It is
preserved for forensic/reference purposes and must never be wired back
into live routing.

## Destination authority

```
src/pages/universe-v1/universeDestinationRegistry.js
```

This is the single source of truth for every Universe destination —
availability, scene coordinates, and href resolution all flow through
`isDestinationAvailable()`, `needsHardNavigation()`, and
`resolveDestinationHref()`. No component hardcodes a destination URL.

Two corrections were made to the ported registry, both required for
routing/integration only (see the file's own header comment for the
full rationale):

1. **BOS and SHF are now `'same-origin-app'` destinations**, not
   cross-origin ones — they're served by this same repository
   (`solutions.html`, `foundation.html`) now that the Universe lives here
   too, so they resolve as plain relative hrefs instead of needing a
   cross-origin origin lookup.
2. **Autonomous Registry remains `'independent-local-app'`** — it is a
   genuinely separate repository (`~/Desktop/autonomous-registry`, its
   own `vite --port 5174 --strictPort`). Its cross-origin origin is
   still centralized in one place (this registry file) and is
   overridable via `VITE_AUTONOMOUS_REGISTRY_ORIGIN`, never hardcoded in
   a component.

| Destination | Status | Resolution |
|---|---|---|
| BOS (SHS) | Available | `/solutions.html#/home` (same origin) |
| SHF (Foundation) | Available | `/foundation.html#reports` (same origin) |
| Autonomous Registry | Available | `VITE_AUTONOMOUS_REGISTRY_ORIGIN` or `http://127.0.0.1:5174` + `/` |
| AOS | Planned/unavailable | No entry control rendered; informational only |
| Open Autonomous Standard | Planned/unavailable | No entry control rendered; informational only |
| Autonomous Trust Bureau | Planned/unavailable | No entry control rendered; informational only |

## Navigation rule

All ecosystem "Return to Universe" controls must resolve to the
canonical `/universe`, via the shared `VITE_UNIVERSE_ORIGIN` environment
variable rather than a hardcoded port:

- `src/foundation/layout/FoundationHeader.jsx` — pre-existing, already
  built this way; only needed `VITE_UNIVERSE_ORIGIN` to be actually
  configured (it degrades to a disabled pill when unset).
- `src/layouts/SolutionsLayout.jsx` — added during this migration, same
  pattern.
- `~/Desktop/autonomous-registry`'s `src/utils/universeReturn.ts` —
  pre-existing, already built this way, with a hardcoded local-dev
  fallback (`http://127.0.0.1:5173/universe`) that needed no changes.

Do not blindly add a Universe return control to every page — only where
one already exists or where the destination is a documented Universe
destination (as Solutions/BOS is).

## Development URLs

This section documents current local behavior; none of it is baked in
as permanent architecture beyond the `VITE_*_ORIGIN` indirection above.

| Port | Application | Notes |
|---|---|---|
| 5173 | This repository (SHRV1) — `npm run dev` | Now also serves the canonical Universe (`/`, `/universe`, `/universe.html`). Must bind `127.0.0.1` (see `vite.config.js`'s `server.host` — added during this migration; Vite's unconfigured default bound IPv6-only `[::1]` on this machine, silently breaking any `127.0.0.1`-based cross-app link). |
| 5174 | `~/Desktop/autonomous-registry` — `npm run dev` (`--port 5174 --strictPort`) | A separate repository/application. Was found occupied by an accidental **second** SHRV1 `vite` instance at migration time (see Anti-drift note below); that duplicate was stopped and the real Autonomous Registry dev server started in its place. |
| 5175 | The external Universe reference project — `npm run dev` | No longer a required dependency for `/universe` to work in this repository. Left running as the historical reference/source of the port; can be stopped without affecting this repository. (`.env.example` separately documents 5175 as `VITE_SHF_NEXT_BASE_URL` for an unrelated "shf-next" app — outside this migration's scope.) |

**Accidental duplicate found and resolved:** two `vite` processes for
this same repository were running simultaneously (5173 and 5174) at
migration time — almost certainly Vite's own default auto-increment
behavior from starting a second `npm run dev` without noticing 5173 was
already taken. This silently blocked the real Autonomous Registry from
ever binding its required (`--strictPort`) 5174. Resolved by stopping
the duplicate and starting the real Autonomous Registry server.

## Anti-drift rule

No future team may introduce a second independent Silicon Heartland
Universe landing implementation without an explicit architecture/version
decision recorded in this file. Any new `/universe`-adjacent work must
extend `src/pages/universe-v1/` and `universeDestinationRegistry.js`
rather than create a parallel implementation. The permanent regression
test `tests/ui/universe-canonical.spec.mjs` fails if a second live
Universe implementation is reintroduced (an old-Universe import
resurfacing, or a second component claiming the `/universe` route).
