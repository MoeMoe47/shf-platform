# SHS Home + BOS Migration

## Summary

The Silicon Heartland Systems (SHS) public site (`solutions.html`) has been restructured so
that SHS has an institutional front door, and BOS (Business Operating System) — previously
*was* the SHS homepage — is now one of several solutions SHS links out to.

- **Previous SHS homepage route:** `solutions.html#/home` (and bare `solutions.html`)
- **New SHS homepage route:** `solutions.html#/home` (unchanged URL — the institutional page
  now lives here)
- **BOS route (migrated homepage content):** `solutions.html#/bos`

No route was removed. `solutions.html#/home` still resolves; it now serves different content.

## What moved where

| Old | New | Notes |
|---|---|---|
| `src/pages/solutions/SolutionsHome.jsx` (BOS pitch, rendered at `#/home`) | `src/pages/solutions/BosHome.jsx` (rendered at `#/bos`) | Copied verbatim — hero, benefits, metrics, audiences, method, "Built on SHS," commercial story, final CTA all unchanged. Only the CSS import and function name were renamed. |
| `src/pages/solutions/shs-solutions-home.css` | `src/pages/solutions/shs-bos-home.css` | Copied verbatim, only referenced by `BosHome.jsx`. |
| — | `src/pages/solutions/ShsHome.jsx` + `shs-home.css` | New institutional homepage, built to the approved mock. |
| — | `src/components/solutions/ShsHeader.jsx` / `ShsFooter.jsx` | New shared header/footer for the institutional shell (used by `ShsHome`, `ShsAIWorkforcePage`, `ShsGovernPage`). |
| — | `src/pages/solutions/shs-tokens.css` | Shared `--shs-*` design tokens + `.shs-btn*` classes, duplicated (not extracted) from the preserved BOS CSS so the original BOS file never had to be touched. |

`src/pages/solutions/SolutionsHome.jsx` (the original file) and its original CSS were left in
place, untouched, as a safety copy. Nothing imports them anymore; they can be deleted once the
migration is confirmed in production, but were intentionally not deleted here.

## New public routes added

| Route | Component | Status |
|---|---|---|
| `solutions.html#/bos` | `BosHome.jsx` | Migrated BOS homepage content |
| `solutions.html#/ai-workforce` | `ShsAIWorkforcePage.jsx` | New — no public AI Workforce page existed before. Describes governance/oversight only; does not imply unsupervised AI. |
| `solutions.html#/govern` | `ShsGovernPage.jsx` | New — no canonical public "Govern" product existed before. Describes policy/evidence/security/controls/compliance/auditability. |
| `solutions.html#/infrastructure` | `SolutionsInfrastructurePage.jsx` | Pre-existing component, previously only reachable through the admin-gated router (`AdminRoutes.jsx`); now also public here. Fixed two broken logo image paths (`/assets/branding/shs-hub-logo.png`, `/assets/shs/shs-logo-mark.svg` → real asset `/assets/shs/shs-orbiter-logo.png`) since the page is now publicly visible for the first time. |

## Existing product routes referenced (not modified)

- **CivicSure** → `/civicsure` (root `index.html` app, `CivicSureApp.jsx`)
- **Studio** → `/curriculum.html#/studio` (same href the admin sidebar already uses for Studio)
- **BOS (authenticated app)** → `admin.html#/hub`, unchanged, unaffected by this migration

## Canonical identity update

`src/system/orientation/canonicalDestinationIdentity.js` previously flagged
`solutions.html#/home` as the "public BOS discovery route." Since `#/home` is now the
institutional homepage (not BOS-specific), `isPublicBosDiscoveryRoute()` was updated to
recognize `solutions.html#/bos` instead. `tests/ogl5BOSIdentity.test.mjs` was updated to match
and also asserts `#/home` is *not* the BOS discovery route anymore. All existing assertions
about the authenticated `/hub` app were left unchanged.

## Data / claims discipline

- No new numeric claims (project counts, partner counts, capacity, testimonials) were
  introduced. The new homepage's "Featured Project" and "Success Story" cards are explicitly
  tagged **"Illustrative example"** in the UI, and use generic, unattributed copy — no
  fabricated client names.
- The regional emphasis (Ohio, Michigan, Pennsylvania, West Virginia, Indiana) is shown as a
  plain list of states served, not as a numeric/metric claim.
- Partner and industry sections list categories only, not specific organizations.
- "Watch Our Story" is a disabled button (`aria-disabled`, tooltip) since no real video route
  exists yet — same disabled-link pattern already used by `SolutionsLayout.jsx`'s "Return to
  Universe" pill.
- Footer social links are shown as inert/disabled placeholders (no real SHS social handles were
  found anywhere in the repo) rather than fabricated URLs.

## Seed / placeholder content

- Featured Project card ("Midwest Data Center Initiative") and the Success Story quote are
  marked in the UI as illustrative and are not attributed to a real client.
- All other homepage copy (capabilities, mission statement, approach stages, final CTA) is
  either verbatim from the task's approved copy or descriptive of real, existing SHS
  capabilities found in the codebase (command-bus, event-bus, agent fabric, executive
  governance, etc.).

## Tests

- `tests/ogl5BOSIdentity.test.mjs` — updated, passing (2/2)
- `tests/fe6ShsBosStudio.test.mjs` — unaffected, passing (5/5)
- `npx vite build` — passes with no new errors (pre-existing chunk-size warnings only)

## Untouched by design

- SHF (`foundation.html`, `src/foundation/**`)
- Universe / Metaverse (`index.html`, `universe.html`, `src/pages/universe-v1/**`,
  `src/pages/metaverse/**`)
- All BOS backend/authenticated systems (`src/system/{command-bus,event-bus,job-scheduler,
  executive-command-center,tracking,notification-fabric,orchestrator}`, `admin.html#/hub`)
- CivicSure, Studio application code

## Visual fidelity pass (2026-09-24)

A follow-up pass rebuilt `ShsHome.jsx`/`shs-home.css` and `ShsHeader`/`ShsFooter` to closely
match the approved mock's structure, density, and color system, rather than the original looser
interpretation. Key changes:

- **Header bug fix:** the original header relied on flex `order` + wrapping to reflow the nav at
  narrow widths, which broke (nav rendered above the header row, one link per line). Replaced
  with a standard pattern: full inline nav on one line above 1024px (verified it never wraps),
  and a real hamburger-triggered dropdown panel below 1024px. No more fragile wrap tricks.
- **Color tokens** (`shs-tokens.css`) tuned to the mock's deep navy / mid navy / cyan range.
- **Section backgrounds now alternate** dark (hero, capabilities, mission) → light (solutions,
  industries, approach, lower band) → dark (final CTA, footer), matching the mock instead of a
  uniform dark page.
- **Structural rebuild** to match the mock's exact composition: hero as a single full-bleed
  photographic band (not a two-column split) with an absolutely-positioned capability panel;
  6-across capability strip; 3-column mission (copy / engagement areas / regional map;
  fabricated mock stats like "500+ Projects" were intentionally **not** carried over — replaced
  with category labels per the no-fabricated-metrics rule); solutions and industries grids now
  render on light backgrounds at their mock counts (6 and 8); a single horizontal 6-step
  approach sequence with connecting arrows instead of a wrapped card grid; a 3-column lower
  band (Featured Project / Success Stories / Partners) instead of full-width stacked sections;
  and a compact single-row footer instead of a 3-column corporate footer.
- **Imagery (initial pass):** the repo had no un-branded photography identified yet at this
  point. Built a CSS/SVG skyline treatment for the hero and final CTA, and a small reusable
  `ShsImageTile` component (duotone gradient + icon) standing in for photography on
  solution/industry/featured-project cards.

## Real photography pass (2026-09-24, follow-up)

A second, more exhaustive asset audit (by file size, by keyword, across every `public/assets/*`
and `src/assets/*` directory, not just `solutions/`) found real, high-quality, un-branded photos
usable under the "no Metaverse branding, no baked text" rule. `ShsImageTile` now renders a real
`<img>` when a `src` prop is supplied, falling back to the duotone/icon treatment otherwise.

**Real photos used at the time** (later superseded for hero/final-CTA/education/community — see
"SHF imagery correction" below): hero background/final CTA used `src/assets/brand/
hero-people-cutout.png`; Education used `store/catalog/ai-literacy.webp`; Community Development
used `store/catalog/community-incubator.webp`. Infrastructure/Data Centers/Featured Project used
`store/catalog/data-center.webp`, and Industrial & Manufacturing used `brand/hero-welder.png` —
both of those two are still in use (see below).

**Rejected candidates and why:** `career/pathways/*` images (baked-in marketing text/taglines),
all `metaverse/*` imagery (excluded by brief), `universe/*` and `oas/*` imagery (fantasy/cosmic
art, wrong tone), `hero-bg-ohio.png` (SHF orange/ivory watercolor style — explicitly the palette
this brand is meant to avoid), `blockchain-transparency-hero.png` (real SHS asset but has
baked-in labels: "Immutable Record," "On-Chain Proof," etc.), `impact-reporting.webp` (real
dashboard photo but the chart text is baked into the image), `educator-pd.webp` (tiny 213×108,
baked UI badges), `globe-plate-v1.jpg` (a photo of Jupiter — not usable for any slot).

**Bug found and fixed during this pass:** the hero was rendering at ~1500px tall instead of the
intended ~420px at true desktop width (1440px) — only visible once a real desktop-width render
was captured via Playwright (`@playwright/test`, already a repo dependency), since the manual
browser-automation tool available in this environment could not exceed ~1024px viewport width
regardless of resize requests. Root cause: `.shs-hero`, `.shs-header`, and `.shs-header-logo`
are generic class names already defined by `shs-bos-home.css` (the preserved BOS page, bundled
into the same `solutions.html` entry) and by unrelated `src/pages/exchange/*.css` files, and
Vite's dev-mode CSS injection order let the wrong rule win. Fixed by renaming every top-level
SHS-home/header/footer/button class to a `shs-home-*` prefix (`shs-home-hero`, `shs-home-header`,
`shs-home-header-logo`, `shs-home-btn*`) and running a full collision sweep (every `shs-*` class
used by the new components, checked against every other CSS file in the repo) — zero collisions
remain. This is a good example of why a true desktop-width screenshot matters: the bug was
invisible in every narrow-viewport screenshot taken in the prior pass.

**Verified desktop metrics at true 1440px** (via Playwright, `getBoundingClientRect` +
`getComputedStyle`):

| Element | Height | Columns / layout |
|---|---|---|
| Header | 71px | single row |
| Hero | 420px | full-bleed photo |
| Capability grid | 197px | 6 × 222px, gap 12px |
| Mission grid | 457px | 3 cols (499 / 385 / 453px), gap 28px |
| Solutions grid | 326px | 6 × 220px, gap 14px |
| Industries grid | 188px | 8 × 165px, gap 10px |
| Approach track | 89px | horizontal flex row, gap 4px |
| Lower band grid | 295px | 3 cols (453 / 385 / 521px), gap 16px |
| Final CTA | 181px | full-bleed photo |
| Footer | 120px | single row |

## SHF imagery correction (2026-09-24, follow-up)

The prior pass reused `hero-people-cutout.png` (hero/final CTA), `ai-literacy.webp` (Education),
and `community-incubator.webp` (Community Development) on reasoning that they were "shared
stock" since `src/foundation/pages/Home.jsx` also imports them. That reasoning was overruled:
those three depict SHF's own subject matter (a graduate/student figure, a university lecture
hall, and volunteers gardening) and were replaced entirely, regardless of where else they're
used in the repo.

**Source of the new imagery:** the approved SHS mock file was located locally at
`/Users/mikeslate/Downloads/ChatGPT Image Sep 24, 2026, 02_18_15 PM.png` (1024×1536 px — a
single flattened full-page composite, not individual production photos). Each slot's
photographic region was cropped directly from this file with Pillow (`python3`), trimmed to
exclude neighboring card edges and any baked headline/body/button text, then upscaled with
`Image.LANCZOS` + a light unsharp-mask pass, and saved as JPEGs under `public/assets/shs/home/`.
The source mock file itself was left untouched.

**Every SHF asset removed from `ShsHome.jsx`:**
- `src/assets/brand/hero-people-cutout.png` — was hero background + final CTA background
- `src/assets/store/catalog/ai-literacy.webp` — was Education industry card
- `src/assets/store/catalog/community-incubator.webp` — was Community Development industry card

**Kept and re-justified:** `src/assets/store/catalog/data-center.webp` (Infrastructure card,
Data Centers & Technology card, Featured Project) and `src/assets/brand/hero-welder.png`
(Industrial & Manufacturing card). Neither depicts people in a nonprofit/education/community
context; both are neutral infrastructure/industrial subject matter with no SHF branding, no
logos, and no baked text — independently re-verified this pass by direct visual inspection, not
assumed acceptable merely because they're already in the repo. Their import paths
(`@/assets/store/catalog/...`, `@/assets/brand/...`) do not match any of the rejected path
patterns (`/foundation/`, `/shf/`, `/curriculum/`, `/student/`, `/learning/`, `/community/`).

**Imagery inventory (final state):**

| Slot | Current asset | Source |
|---|---|---|
| Hero | `public/assets/shs/home/shs-home-hero.jpg` | Cropped from mock (skyline + "SILICON HEARTLAND" building signage) |
| Final CTA | `public/assets/shs/home/shs-final-cta.jpg` | Cropped from mock (skyline strip, different framing) |
| BOS solution card | `public/assets/shs/home/shs-bos.jpg` | Cropped from mock |
| CivicSure solution card | `public/assets/shs/home/shs-civicsure.jpg` | Cropped from mock (capitol building) |
| AI Workforce solution card | `public/assets/shs/home/shs-ai-workforce.jpg` | Cropped from mock |
| Studio solution card | `public/assets/shs/home/shs-studio.jpg` | Cropped from mock |
| Infrastructure solution card | `src/assets/store/catalog/data-center.webp` | Real photo (kept — see justification above; higher quality than the 163×80px mock crop for this slot) |
| Govern solution card | `public/assets/shs/home/shs-govern.jpg` | Cropped from mock |
| Government industry card | `public/assets/shs/home/shs-industry-government.jpg` | Cropped from mock |
| Education industry card | `public/assets/shs/home/shs-industry-education.jpg` | Cropped from mock (institutional campus, not a classroom) |
| Nonprofits industry card | `public/assets/shs/home/shs-industry-nonprofits.jpg` | Cropped from mock |
| Healthcare industry card | `public/assets/shs/home/shs-industry-healthcare.jpg` | Cropped from mock |
| Workforce Development industry card | `public/assets/shs/home/shs-industry-workforce.jpg` | Cropped from mock |
| Data Centers & Technology industry card | `src/assets/store/catalog/data-center.webp` | Real photo (kept) |
| Industrial & Manufacturing industry card | `src/assets/brand/hero-welder.png` | Real photo (kept) |
| Community Development industry card | `public/assets/shs/home/shs-industry-community.jpg` | Cropped from mock (built environment, not a volunteer/gardening scene) |
| Featured Project | `src/assets/store/catalog/data-center.webp` | Real photo (kept — thematically exact match for "Midwest Data Center Initiative") |
| Success Stories thumbnail | `public/assets/shs/home/shs-success-story.jpg` | Cropped from mock (new — this slot previously had no image at all) |

**Known quality limitation, disclosed rather than hidden:** the mock source is only 1024×1536px
total, so most individual card crops started as small as ~90–160px on a side before upscaling.
The hero/final-CTA crops (upscaled ~3–4×) and solution-card crops (upscaled ~4×) are visibly
softer than production photography would be — acceptable as a mock-fidelity stand-in, but every
file under `public/assets/shs/home/` should be treated as a placeholder for a real photography
shoot or a higher-resolution source, not a final production asset. No image-generation tool is
available in this environment to produce higher-resolution originals.

## Future work

- `SHSRequestDemoPage`, `SHSBlockchainTransparencyPage`, `SHSMeetTheTeamPage`, `SHSLayersPage`
  still use their own bespoke headers rather than the new shared `ShsHeader`/`ShsFooter` — left
  untouched per "preserve existing work." Adopting the shared shell there would unify the site.
- Dedicated `Industries`, `Technology`, `Company`, and `Resources` pages don't exist yet; the
  new header links to on-page sections or existing real pages instead of inventing new routes.
  Building those out would let the header nav point to full subpages.
- `src/pages/solutions/SolutionsHome.jsx` (the pre-migration file) can be deleted once the new
  structure is confirmed stable in production.
- The header search is a real client-side filter over the Solutions/Industries sections only;
  it does not search the full site.
- Every image slot on the homepage now has imagery (no `ShsImageTile` gradient/icon fallback
  remains in use), but every file under `public/assets/shs/home/` is a low-resolution mock crop
  (see "SHF imagery correction" above), not production photography. Commission or source real
  photography for all 14 of those slots — the mock crops should be treated as temporary.
- Mission section metrics are shown as category labels, not numbers, until real project/partner
  counts are verified and can be sourced from data rather than hardcoded.
