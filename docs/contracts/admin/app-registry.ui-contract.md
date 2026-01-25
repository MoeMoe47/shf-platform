# SHF Admin — App Registry UI Contract (LOCKED)

Status: **LOCKED**
Owner: SHF Admin
Scope: `/admin.html#/app-registry` (React page: `src/pages/admin/AppRegistry.jsx`)
Purpose: This contract defines the **non-breaking UI/UX guarantees** for App Registry.

---

## 1) Visual Layout Guarantees (must not break)

### Header Row
- Title block: `System` kicker + `App Registry` heading + subtitle
- Controls row includes:
  - Search input (placeholder: “Search apps (name or id)…")
  - Show disabled checkbox
  - Status filter pills: **All / Primary Funnel / System Core / Funding Ready / Pilot Only**
- Header must remain on a single horizontal row on desktop widths.

### Control Plane Strip
- Must render directly below the header.
- Must show:
  - LIVE indicator
  - Overrides count
  - Last change
  - Mode display (PILOT/SYSTEM)
  - Contract version (may show “?” when unknown)

### Card Grid
- Desktop: 3 columns
- Tablet: 2 columns
- Mobile: 1 column
- Cards must use rounded corners and light shadow (Tesla/Apple polish standard).

---

## 2) Card Content Guarantees (per app)

Each card MUST show:
- App name (manifest name or id)
- Enabled/Disabled badge
- Meta line: id + contract version
- SHF status badges (0+):
  - Funding Ready
  - Pilot Only
  - System Core
  - Primary Funnel

Actions row MUST include:
- Open area (see gating rules below)
- Demo toggles:
  - Enable (Demo), Disable (Demo)
- Saved toggles:
  - Enable (Saved), Disable (Saved)
- Reset

---

## 3) Behavior Guarantees (must not regress)

### Search
- Filters by:
  - manifest name
  - app id

### Show Disabled
- If unchecked: disabled apps are hidden.

### Status Filter Pills
- All: no filtering
- Primary Funnel: shows apps tagged funnelPrimary
- System Core: shows apps tagged core
- Funding Ready: shows apps tagged fundingReady
- Pilot Only: shows apps tagged pilotOnly

### Gating Rules
- If app is gated:
  - Open button MUST NOT navigate.
  - Instead show text: “🔒 Switch to SYSTEM mode to open”
  - Card MUST be visually “gated” (grayed/softened).

### No-Flicker Rule
- Page must not repeatedly mount/unmount or blank out in normal dev mode.
- Rendering must be stable with Vite HMR.

---

## 4) Styling Guarantee (failsafe)
- App Registry must remain readable & aligned **even if external CSS fails**.
- Embedded style fallback is allowed and encouraged.

---

## 5) Change Control
Any change to:
- layout structure
- class names used for contract elements
- gating behavior
- button labels
must update this contract doc AND pass the checklist below.

---

## 6) Acceptance Checklist (must pass)
- [ ] Header shows all controls (search, toggle, pills)
- [ ] ControlPlaneStrip visible below header
- [ ] Grid is 3/2/1 responsive
- [ ] Cards render with badges + buttons aligned
- [ ] Gated app hides Open and shows lock message
- [ ] Page does not flicker/blank
- [ ] Overrides log renders without crashing
