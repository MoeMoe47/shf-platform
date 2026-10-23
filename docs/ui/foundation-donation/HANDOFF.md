# CODEX HANDOFF REPORT

Current full-page audit: [FINAL_PRODUCTION_READINESS.md](FINAL_PRODUCTION_READINESS.md). This file retains the chronological implementation record, including superseded initial imagery and readiness states.

Agent: Foundation implementation (single executor)

Task: SHF-DONATION-001

STATUS: PARTIAL — implemented; browser/visual acceptance remains unverified.

**SHF DONATION PAGE NEEDS OWNER REVIEW**

## Objective and result

Upgrade canonical `/foundation.html#/get-involved` to the owner-mock donation composition with real amount selection and a safe payment boundary. The existing `shf.html` entry also uses this app. No duplicate donation route. Shared FoundationHeader, FoundationClosingCta, and FoundationFooter are retained through FoundationLayout. The header CTA receives its current-page ARIA state only.

The page includes the requested hero/copy/HTML handwritten statements, section navigation, four accessible presets/custom USD input/Give Now, supporting impact panel, six giving cards, navy allocation-category band, and transparency row. No extra donor section or unverified financial/tax claims.

## Files created

- `src/foundation/pages/Donation.jsx`
- `src/foundation/adapters/donationHandoff.js`
- `src/foundation/components/FoundationDonationHero.jsx`
- `src/foundation/components/FoundationDonationNav.jsx`
- `src/foundation/components/FoundationDonationIcon.jsx`
- `src/foundation/components/FoundationDonationDialog.jsx`
- `src/foundation/components/FoundationGiftSelector.jsx`
- `src/foundation/components/FoundationSupportImpactPanel.jsx`
- `src/foundation/components/FoundationWaysToGive.jsx`
- `src/foundation/components/FoundationGiftImpact.jsx`
- `src/foundation/components/FoundationTransparency.jsx`
- `src/foundation/styles/foundation-donation.css`
- `tests/foundationDonation.test.mjs`
- `tests/foundation-donation.tsconfig.json`
- `tests/ui/foundation-donation.spec.mjs`
- `docs/ui/foundation-donation/README.md`
- `docs/ui/foundation-donation/HANDOFF.md`
- `docs/ui/foundation-donation/build.mjs`
- `docs/ui/foundation-donation/screenshots/README.md`

## Existing files modified by this task

- `src/foundation/App.jsx`: import Donation and render it for existing get-involved route, preserving other pre-existing changes.
- `src/foundation/layout/FoundationHeader.jsx`: add current-page ARIA state to existing Support SHF anchor, preserving existing markup/navigation.
- `tests/ui/foundation-global-closing-cta.spec.mjs`: change the destination-heading expectation from the former generic get-involved page to the new donation hero.

The repository already contains extensive unrelated tracked and untracked work, including Foundation shell/components/tests. They remain intact. Git diff against HEAD includes those earlier changes; this list identifies this task's ownership.

Database changes: none. API changes: none. New routes: none. Payment provider: unconfigured, no verified SHF integration. Analytics: none added; no existing Foundation event architecture found. No commits or deployment.

## Tests run / fresh results

| Check                                                                                                                           | Result                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `node --test tests/foundationDonation.test.mjs tests/shfInstitutionalHeader.test.mjs tests/foundationGlobalClosingCta.test.mjs` | PASS: 9 tests (3 donation/render/parser/handoff; 6 shared-header/closing checks)                                                                 |
| `./node_modules/.bin/tsc -p tests/foundation-donation.tsconfig.json`                                                            | PASS: scoped page and imported donation components/adapter                                                                                       |
| Scoped ESLint using exact repository config and offline temporary dependencies                                                  | PASS: all new production JS/JSX and touched shared header; no repo dependency changes                                                            |
| Scoped Prettier check                                                                                                           | PASS: new source/CSS/tests and updated shared CTA browser test                                                                                   |
| `git diff --check`                                                                                                              | PASS                                                                                                                                             |
| `node docs/ui/foundation-donation/build.mjs`                                                                                    | PASS: Foundation + SHF production entries, 251 modules; output `/private/tmp/shf-donation-build`; pre-existing empty vendor-charts chunk warning |
| `./node_modules/.bin/playwright test tests/ui/foundation-donation.spec.mjs --workers=2`                                         | BLOCKED: all 6 cases failed at browser launch, before page assertions                                                                            |
| Alternative Browser plugin                                                                                                      | BLOCKED at bootstrap: importing `node:process` not allowed                                                                                       |
| Full-page screenshots / direct comparison                                                                                       | NOT CAPTURED / NOT INSPECTED; do not treat as visually complete                                                                                  |

Build intentionally skips copying the large shared public directory. Existing public image paths are referenced directly; runtime loading remains part of the pending browser checks. Lint commands and verification reproduction are in README.

## Browser limitation

Installed Chromium headless shell exited with SIGTRAP and macOS `bootstrap_check_in ... MachPortRendezvousServer ... Permission denied (1100)`. No page was opened, so the six failed test cases provide no evidence of product failure or browser success. The alternate supported browser runtime could not initialize. No permission override, browser screenshot fabrication or external deployment was used.

Pending: runtime preset/custom input, validation, modal keyboard containment/Escape/focus restoration, canonical cross-route scroll, image loading, console errors, actual contrast, target sizes, responsive overflow, and screenshots at 1440, 1280, 768 and 390px. Browser spec includes these behavioral/layout checks where practical. Manual visual and accessibility inspection still required.

## Payment and content limitations

Give Now validates a positive exact-cent one-time USD amount, then opens a native informational modal stating an approved secure provider must be connected. It never collects card/bank/donor information, takes payment, persists the amount, simulates a transaction, or claims donation success. Adapter is deliberately isolated for future hosted-checkout integration.

No authoritative tax status, gift restrictions, fee disclosures, monthly giving/cancellation terms or privacy policy were found for this flow; none fabricated. Monthly Giving, Grants & Foundations, Planned Giving, Financial Reports and Governance Overview use explicit informational unavailable states. Corporate/employer partnership actions use existing `#/partners`; Impact Reporting uses existing `#/reports`; Our Impact/Impact Stories use existing `#impact` homepage region. Those resources describe public information boundaries; they are not invented reports or testimonials.

Exact mock imagery is missing. Existing Foundation sunset/riverfront hero and Foundation community-impact photography are documented interim candidates. The mock's young-person hero, right panel portrait, giving-card images and navy-band portrait require approved standalone assets for final matching. Existing canonical header/closing CTA/footer intentionally differ from the mock wherever canonical shell requirements take precedence.

Existing Contact anchors share the Support route and now lead to this donation experience. No working contact form/address has been invented; a dedicated contact destination is follow-up work if required.

## Accessibility and responsive implementation

Semantic sections, one H1, logical headings, decorative SVGs, meaningful photo alternatives, labelled USD field, one pressed preset, inline announced error with input focus, visible focus, reduced-motion scroll handling. Native dialog supplies modal semantics/focus confinement and Escape; cleanup returns invoking focus. These mechanisms are implemented but await browser evidence.

CSS is isolated to donation classes. Desktop follows mock composition; tablet stacks the gift panel and reduces giving grid; mobile stacks gift controls and impact band, retains two-column usable presets/cards and a locally scrolling section nav. No locked Catalog/global resets changed.

## Follow-up / review gates

1. Run focused browser tests in a browser-enabled environment and inspect every full-page screenshot against the supplied mock before visual signoff.
2. Approve standalone final photography; review all illustrative interim assets and handwritten statement placement.
3. Approve SHF's giving provider/account and policies. Integrate hosted checkout behind donationHandoff with server-validated amount/currency, approved redirect destinations, cancellation/errors, idempotency and verified webhooks/receipts before any payment-success claim.
4. Publish actual financial/governance/giving documents and required donor/legal disclosures before replacing unavailable states; establish dedicated contact workflow if desired.

SAFE TO MERGE: WITH CONDITIONS — pending browser/visual review and owner approval of interim images. Online donation processing is unavailable and must not be marketed as active.

### Section 01 — Canonical SHF Header

**SECTION 01 — CANONICAL SHF HEADER COMPLETE WITH VERIFIED BROWSER LIMITATION**

Task: SHF-DONATION-SECTION-01. Target: `/foundation.html#/get-involved`. Verification is limited to the header; this status does not supersede the whole-page visual-review limitations above.

#### Canonical reuse and logo

`src/foundation/layout/FoundationHeader.jsx` is rendered exactly once by `src/foundation/layout/FoundationLayout.jsx`, before the main page. `src/foundation/App.jsx` selects Donation for get-involved inside this shared layout. There is no page-specific header, logo replacement, header prop variant or donation CSS override of the shared header. Render tests compare homepage-state and Donation-state header output, allowing only Support SHF's current-page attribute to differ.

Header branding uses `src/components/shared/SHFLogo.jsx` and the existing official `/assets/brand/shf-official-logo.webp` wordmark (1834 × 371). The official asset was opened for inspection. Canonical compact behavior below 680px uses `/assets/brand/shf-official-heart.png` (426 × 371) in a picture source; accessible alternative remains “Silicon Heartland Foundation.” This is the existing mobile Foundation mark, not new Donation branding. Logo CSS uses automatic height and contain sizing; its canonical proportions/spacing remain unchanged.

#### Navigation and actions

| Existing canonical navigation | Destination  |
| ----------------------------- | ------------ |
| About                         | `#/about`    |
| Our Work                      | `#/programs` |
| Programs                      | `#/programs` |
| Our Impact                    | `#impact`    |
| Partners                      | `#/partners` |
| Resources                     | `#/reports`  |

The owner mock has nine navigation labels; the repository's canonical header currently has six. Metaverse, Learning Arcade and Career Pathways are absent from its navigation configuration. No speculative destinations or Donation-only additions were introduced. Our Work/Programs share their existing destination, and Programs alone receives current state on that route. This preserves current canonical authority; it is not a claim of pixel equality with the mock.

Search remains the canonical accessible “Search SHF resources” link to `#/reports`, shown in desktop utilities or the mobile disclosure. It opens public resources rather than a search input/query engine. No Donation-specific search was added.

Support SHF stays visible in the upper action row at every breakpoint, retains its orange treatment and `#/get-involved` destination, and receives `aria-current="page"` on Donation. No new current-state styling was added. Existing Contact also targets `#/get-involved`. Optional Return to Universe remains dependent on the existing `VITE_UNIVERSE_ORIGIN` configuration.

#### Mobile, visual and accessibility audit

Canonical CSS: `src/foundation/styles/foundation-header.css`. Ivory background `#fdfcf8`, ink `#102430`, orange `#ff4f00`, Inter/system sans typography, sticky header, bottom divider, desktop upper row minimum 92px plus the navigation row, and existing spacing retained. Unlike the mock's single-row header, the canonical desktop implementation uses two rows. No redesign was performed to reconcile that difference.

At widths above 1024px, primary navigation is a nonwrapping horizontal row. At 768px the existing mobile disclosure applies; at 390px it also uses the official compact heart mark. The upper row minimum is 80px on tablet and 72px below 680px. Menu button and Search have 44px targets; links have at least 44px minimum height. The mobile panel uses bounded viewport height with its own vertical scrolling. Source inspection and regression CSS checks confirm these rules; actual geometry at 1440/1280/768/390px remains unverified.

Semantic header/nav, labelled home link and image, named menu button, expanded state/control relationship, visible focus rules, route-change/breakpoint/outside-pointer closing, and Escape closing with focus returned to the menu button are present in the shared implementation. The disclosure is nonmodal, so it does not trap focus. Solid foreground/background color pairs from the actual header stylesheet pass calculated WCAG AA normal-text contrast (4.5:1 minimum); rendered contrast, keyboard interaction, touch geometry and logo clipping still require browser confirmation.

#### Actual defect corrected within scope

Scoped checkJs/TypeScript exposed TS2741 at the desktop `<SearchLink />` and `<UniverseLink />`: helper destructuring inferred omitted `onNavigate` callbacks as required. Both now explicitly default to undefined. This preserves existing runtime behavior and fixes the canonical header's type contract. The shared header was formatted with the existing Prettier tool. No CSS, navigation destination, logo asset, visual treatment or payment behavior changed.

Before/after server-rendered header output was captured for `#/top`, `#/get-involved`, `#/about` and `#/reports` and compared byte-for-byte: identical. This supplies direct evidence that the type/default/format change preserved rendered markup on other Foundation routes.

#### Fresh verification results

| Check                                                             | Result                                                                                                                                                  |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Donation header render tests + Foundation header regression tests | PASS: 8 tests via `node --test tests/foundationDonationHeader.test.mjs tests/shfInstitutionalHeader.test.mjs`                                           |
| Scoped TypeScript                                                 | PASS after callback fix: `./node_modules/.bin/tsc -p tests/foundation-donation-header.tsconfig.json`                                                    |
| Scoped lint                                                       | PASS: FoundationHeader and SHFLogo with repository rules using the already available temporary lint installation described above                        |
| Formatting                                                        | PASS: modified FoundationHeader and all new Section 01 test/config files                                                                                |
| Pre-existing untouched source formatting                          | The existing header CSS and SHFLogo also have Prettier drift; preserved because they were not changed. No claim that the entire repository is formatted |
| Whitespace                                                        | PASS: `git diff --check`                                                                                                                                |
| Scoped build                                                      | PASS: `node docs/ui/foundation-donation/build.mjs`, 251 modules; existing empty vendor-charts chunk warning                                             |
| Markup equivalence                                                | PASS: header byte-equivalent before/after fix on four route states                                                                                      |
| Production regression guard                                       | PASS: 56 Foundation/logo source files hashed before work; 55 unchanged, only FoundationHeader changed                                                   |
| Browser retry                                                     | Environmentally blocked before page creation; 1 launch failure, 11 cases not run due to max-failures=1                                                  |

Browser command:

```sh
SHF_FOUNDATION_BASE_URL=http://127.0.0.1:5191 ./node_modules/.bin/playwright test tests/ui/foundation-donation-header.spec.mjs tests/ui/foundation-institutional-header.spec.mjs --workers=1 --max-failures=1
```

Chromium exited with SIGTRAP: `bootstrap_check_in ... MachPortRendezvousServer ... Permission denied (1100)`. This is a fresh repetition of the environment limitation, not a failed page assertion. Implementation was not changed to accommodate unavailable browser verification. The only production edit fixes the independently observed TypeScript defect.

No screenshots captured and no browser visual comparison performed. Intended outputs, once the browser suite can run:

- `docs/ui/foundation-donation/screenshots/section-01/header-1440.png`
- `docs/ui/foundation-donation/screenshots/section-01/header-1280.png`
- `docs/ui/foundation-donation/screenshots/section-01/header-768.png` and `header-768-open.png`
- `docs/ui/foundation-donation/screenshots/section-01/header-390.png` and `header-390-open.png`

Pending owner/browser review: inspect logo readability, actual header height/spacing/type, navigation balance, Search and Support visibility, mobile open/closed states, keyboard/Escape, focus outlines, touch targets, clipping and overflow against the canonical homepage and supplied mock. Section 01 is not visually locked.

#### Change and regression record

Changed this task: `src/foundation/layout/FoundationHeader.jsx`; added `tests/foundationDonationHeader.test.mjs`, `tests/foundation-donation-header.tsconfig.json`, `tests/ui/foundation-donation-header.spec.mjs`; appended this section to HANDOFF.md. The new browser spec covers the four requested sizes, header screenshots, current state, Search/Support navigation, keyboard/Escape, target bounds, overflow and homepage header equivalence when browser access is available.

Donation Hero, donation navigation, gift selector/adapter, Ways to Give, impact band, transparency, closing CTA, footer, all other Foundation page sources, and logo assets remain unchanged. No backend, schemas, Catalog, package files, commit or deployment changes. Existing unrelated work preserved.

### Approved Photography Correction Pass

Task: SHF-DONATION-IMAGE-001.

**BLOCKED — APPROVED DONATION IMAGES NOT AVAILABLE**

The owner rejected all nine interim body photographs. All nine references have now been removed from the Donation page; no replacement image or unapproved placeholder artwork was installed. Earlier descriptions in this handoff/README of interim imagery remaining installed are historical and superseded by this correction. The canonical shared header/logo, gray closing artwork and footer remain unchanged.

Authoritative slot/candidate inventory, exact previous paths, intended final filenames, crop requirements and prepared generation briefs: [IMAGE_INVENTORY.md](IMAGE_INVENTORY.md).

| Slot                        | Previous image                                                               | Owner approval / correction                                            | Newly installed path |
| --------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------- |
| Hero                        | `/assets/foundation/building-futures-by-the-river.webp`                      | Unapproved; removed; awaiting approved foreground-student sunset hero  | None                 |
| Choose Your Impact portrait | `/assets/foundation/data-center-community-impact/youth-stem-education.png`   | Unapproved; removed; awaiting approved two-person portrait             | None                 |
| One-Time Gift               | `/assets/foundation/data-center-community-impact/youth-stem-education.png`   | Unapproved; removed; awaiting approved learning image                  | None                 |
| Monthly Giving              | `/assets/foundation/data-center-community-impact/community-families.png`     | Unapproved; removed; awaiting approved ongoing-support image           | None                 |
| Corporate Support           | `/assets/foundation/data-center-community-impact/community-partnerships.png` | Unapproved; removed; awaiting approved professional conversation image | None                 |
| Grants & Foundations        | `/assets/foundation/data-center-community-impact/local-business-growth.png`  | Unapproved; removed; awaiting approved community-group image           | None                 |
| Employer Partnerships       | `/assets/foundation/data-center-community-impact/skilled-trades-careers.png` | Unapproved; removed; awaiting approved workforce conversation image    | None                 |
| Planned Giving              | `/assets/foundation/data-center-community-impact/community-future.png`       | Unapproved; removed; awaiting approved reflective student/city image   | None                 |
| Where Your Gift Goes        | `/assets/foundation/building-futures-by-the-river.webp`                      | Unapproved; removed; awaiting approved smiling-student portrait        | None                 |

#### Candidate and approval outcome

No approved standalone photographs were found in the audited repository or relevant Downloads files. The two reviewed student panoramas differ from the mock and have no approval; neither was installed. Two reviewed “Silicon Heartland\_ Impact and Opportunity” files are About/Donation mock composites, not usable standalone photographs. The exact owner Donation mock is a design reference, not permission to install a page screenshot or extract low-resolution image crops. No image generation was performed. Owner-supplied standalone assets or explicitly requested generation followed by owner approval is required for all nine slots.

No new asset directory or speculative production URL was created: reserved descriptive paths in IMAGE_INVENTORY are documentation only. Originals in Downloads and shared repository assets are preserved; the shared photographs may still be used by their existing other pages. No visual section depending on these photographs is locked.

#### Minimal image integration changes

The four existing photograph-bearing components now retain empty, decorative span regions with stable `data-photo-slot` identities and `data-photo-status="awaiting-approved-asset"`. They contain no text, stock photo, generated artwork, icon or broken image request. They are hidden from assistive technology because no meaningful photograph is present. Existing headings, handwritten overlays, labels, descriptions, actions and section structure remain unchanged.

Image selectors in scoped donation CSS now target the same-sized empty regions. Existing desktop/tablet/mobile dimensions, crop coordinates and object-fit rules are retained for future integration; no final crop can be approved until assets exist. The empty hero region uses the existing navy palette as its base so white headline text remains readable without a photograph. No grid, spacing, type or section-layout redesign was made. No placeholder graphic asset was invented or installed.

#### Fresh tests / build results

| Check                                                                        | Result                                                                                                                                      |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Donation render, amount/handoff regression and Donation header render checks | PASS: 8 tests via `node --test tests/foundationDonation.test.mjs tests/foundationDonationHeader.test.mjs`                                   |
| Image-reference checks                                                       | PASS: exactly 9 explicit awaiting slots, zero Donation-body img/picture/source requests, no substitute background URL, each slot documented |
| Shared image assets                                                          | Preserved; official branding paths continue to pass the header render/asset-existence test                                                  |
| Page copy regression                                                         | PASS: before/after server-rendered page text is identical                                                                                   |
| Scoped TypeScript                                                            | PASS: `./node_modules/.bin/tsc -p tests/foundation-donation.tsconfig.json`                                                                  |
| Scoped lint                                                                  | PASS: four changed image components using existing repository rules and already available temporary lint tooling                            |
| Formatting                                                                   | PASS: changed components, scoped CSS, imagery test updates and image inventory                                                              |
| Whitespace                                                                   | PASS: `git diff --check`                                                                                                                    |
| Scoped production build                                                      | PASS: `node docs/ui/foundation-donation/build.mjs`, 251 modules; existing empty vendor-charts chunk warning                                 |
| Browser retry                                                                | BLOCKED before page assertions at 1440px: Chromium SIGTRAP / MachPortRendezvousServer Permission denied (1100)                              |
| Screenshot inspection / final visual approval                                | PENDING; no new screenshots captured or claimed                                                                                             |

Browser attempt: `./node_modules/.bin/playwright test tests/ui/foundation-donation.spec.mjs --grep '1440px' --workers=1 --max-failures=1`. The size/render browser test now checks nine missing-asset regions and zero body photographs instead of allowing an empty image-load loop to pass. Its image-load checks apply to the retained canonical header/footer branding. Runtime checks still need an environment able to launch Chromium.

#### Changed files / regression guard

Production changes are limited to:

- `src/foundation/components/FoundationDonationHero.jsx`
- `src/foundation/components/FoundationSupportImpactPanel.jsx`
- `src/foundation/components/FoundationWaysToGive.jsx`
- `src/foundation/components/FoundationGiftImpact.jsx`
- `src/foundation/styles/foundation-donation.css`

Test changes: `tests/foundationDonation.test.mjs`, `tests/ui/foundation-donation.spec.mjs`. Documentation: this appended handoff section and new `IMAGE_INVENTORY.md`.

Before/after SHA-256 comparison covered 86 Foundation/Catalog source and Foundation asset files. Only the four image components and scoped donation stylesheet changed. Canonical header, donation navigation, amount logic, Give Now adapter/dialog, card titles/descriptions/actions, impact copy, transparency section, gray closing CTA, footer, other Foundation pages, Catalog and original image files are unchanged. Before/after rendered page text is identical. No backend/schema/dependency changes, commit or deployment.

Installation remains blocked by the absence of approved standalone assets, not by implementation readiness. Empty regions are an explicit awaiting-assets state, not final approved visuals. For each future approved image, record owner approval, source path/hash/dimensions, installed path and crop in IMAGE_INVENTORY; install only that approved standalone asset, then run browser load/crop/overflow checks and inspect screenshots before requesting final visual signoff.

### Owner-approved Photography Installation — IMAGE-002

**SHF DONATION PHOTOGRAPHY INSTALLED WITH VERIFIED BROWSER LIMITATION**

All nine explicitly approved image identities have been located, visually matched and installed. This supersedes IMAGE-001's missing-assets state. No photo was regenerated, extracted from a collage, substituted from the unapproved Foundation pool, or loaded from a Downloads URL.

Source/install table and source/output dimensions: [APPROVED_IMAGE_INSTALL.md](APPROVED_IMAGE_INSTALL.md). All nine slots are now **OWNER APPROVED — INSTALLED** in [IMAGE_INVENTORY.md](IMAGE_INVENTORY.md). Exact SHA-256 mappings, source timestamps, dimensions and output sizes: [approved-image-manifest.json](approved-image-manifest.json).

#### Installed mappings

All sources below are in `/Users/mikeslate/Downloads/`; installed URLs begin `/assets/foundation/donation/`:

| Slot                  | Approved source                                | Production WebP                     |
| --------------------- | ---------------------------------------------- | ----------------------------------- |
| Hero                  | Hopeful Gaze Over the City.png                 | donation-hero.webp                  |
| Choose Your Impact    | Hopeful Horizons at Sunset.png                 | donation-impact-support.webp        |
| One-Time Gift         | Focused Student Studying in a Warm Library.png | donation-one-time-gift.webp         |
| Monthly Giving        | Collaborative Campus Study Session.png         | donation-monthly-giving.webp        |
| Corporate Support     | Mentorship Conversation in a Warm Office.png   | donation-corporate-support.webp     |
| Grants & Foundations  | Golden-Hour Campus Study Circle.png            | donation-grants-foundations.webp    |
| Employer Partnerships | Workforce Development Partnership Meeting.png  | donation-employer-partnerships.webp |
| Planned Giving        | Young Dreamers Watching the Sunset.png         | donation-planned-giving.webp        |
| Where Your Gift Goes  | Real Skills, Real Impact.png                   | donation-impact-banner.webp         |

The two Hopeful images match the clean Hero/support identities specified by the owner and present in the supplied reference collage. The impact banner matches the specifically approved four-person sunset scene and both embedded slogans, despite its earlier source timestamp. The collage itself was not installed. No images are reused across slots.

#### Conversion / display / accessibility

Pillow's available WebP encoder produced quality 95, method 6 RGB copies with original dimensions and aspect ratios unchanged. Total output size: 2,643,880 bytes. Originals were not modified, resized or cropped. All nine outputs fully decode and their SHA-256 hashes are checked by the render/asset tests; source hashes confirm preservation. Converted Hero and impact banner were also opened for visual quality inspection. This is asset inspection, not browser screenshot verification.

Hero retains HTML H1, supporting copy and handwriting over the clean text-free photograph; cover/center 47% desktop and 60% center mobile remain. The support portrait uses cover/30% center desktop and center 38% mobile. Giving cards retain their consistent existing image heights and center/cover presentation. No card order, title, description or action changed.

The approved lower banner includes “REAL SKILLS. REAL PEOPLE. REAL IMPACT.” and “OPPORTUNITY CHANGES LIVES.” It is authoritative visually. Its existing left-side image region now uses the source aspect ratio (2007 / 783), zero minimum image height and centered self-alignment so embedded lettering is not cropped. The dimming filter is removed. The three-part navy-band grid remains unchanged. The old “REAL SUPPORT. REAL OPPORTUNITY.” HTML slogan is preserved using the existing visually-hidden utility rather than overlaying it on the approved banner. The image alt describes the scene and includes both embedded slogans. No essential Hero text became image-only; all nine photos have meaningful alternatives.

Responsive crop positions are implemented but require runtime visual review. The banner's wide text will be small in the existing left column; this preserves the complete approved image within the authorized composition. No image-box letterboxing or stretching is introduced by the aspect-ratio rule. No final visual lock is asserted without browser evidence.

#### Fresh verification

| Check                                                        | Result                                                                                                                                            |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Donation render/asset/amount/handoff + Donation header tests | PASS: 8 tests via `node --test tests/foundationDonation.test.mjs tests/foundationDonationHeader.test.mjs`                                         |
| Exact photo mapping/path checks                              | PASS: 9 approved img elements in specified slot order; all requested stable filenames exist; WebP signatures and installed SHA-256 match manifest |
| Full asset decoding / dimensions                             | PASS: Pillow loaded all 9 WebPs at unchanged source dimensions                                                                                    |
| Source preservation                                          | PASS: all 9 Downloads file hashes still match recorded originals                                                                                  |
| Obsolete mappings                                            | PASS: no Donation-body Downloads paths, rejected riverfront/community-impact URLs, or awaiting-approved-asset state                               |
| Page copy                                                    | PASS: before/after server-rendered page text identical, including retained accessible lower slogan                                                |
| Scoped TypeScript                                            | PASS: `./node_modules/.bin/tsc -p tests/foundation-donation.tsconfig.json`                                                                        |
| Scoped lint                                                  | PASS: four modified photography components with existing repository rules/available temporary lint tooling                                        |
| Formatting / whitespace                                      | PASS: changed source/CSS/tests/install documents and `git diff --check`                                                                           |
| Scoped production build                                      | PASS: `node docs/ui/foundation-donation/build.mjs`, 251 modules; existing empty vendor-charts warning                                             |
| Browser retry                                                | Environmentally BLOCKED before page creation: Chromium SIGTRAP / MachPortRendezvousServer Permission denied (1100)                                |
| Browser image loading/crop/overflow/screenshots              | UNVERIFIED; no screenshots captured                                                                                                               |

Browser command: `./node_modules/.bin/playwright test tests/ui/foundation-donation.spec.mjs --workers=1 --max-failures=1`. The focused browser suite now requires nine approved body photographs and checks image loading for those photographs plus canonical logo images. The first browser launch failed; remaining cases did not run. No runtime image-load or geometry success is inferred from file decoding or a build.

Expected full-page captures after browser recovery remain `screenshots/donation-1440.png`, `donation-1280.png`, `donation-768.png`, `donation-390.png`. Inspect faces, skyline, Hero text overlap, support-portrait crops, card consistency, lower banner lettering and page overflow at each width before declaring visual lock.

#### Scope / regression evidence

Production source changes: only FoundationDonationHero.jsx, FoundationSupportImpactPanel.jsx, FoundationWaysToGive.jsx, FoundationGiftImpact.jsx and scoped foundation-donation.css. New assets: the nine requested WebPs under `public/assets/foundation/donation/`. Tests updated: foundationDonation.test.mjs and ui/foundation-donation.spec.mjs. Documentation: APPROVED_IMAGE_INSTALL.md, approved-image-manifest.json, IMAGE_INVENTORY.md, README asset-status paragraph and this HANDOFF section.

Before/after source hashes confirm no changes to Section 01 header, donation navigation, amount selector, Give Now adapter/dialog, Your Support Helps copy, transparency, gray closing CTA, footer, other Foundation page sources or Catalog sources. Before/after page text is identical. No backend, schemas, payment, dependency, commit or deployment changes. Shared original Foundation assets are preserved. All nine asset approvals are resolved; remaining limitation is browser visual verification.

### Section 02 — Donation Hero

**SECTION 02 — DONATION HERO COMPLETE WITH VERIFIED BROWSER LIMITATION**

Scope: Hero presentation only on `/foundation.html#/get-involved`. Component: `src/foundation/components/FoundationDonationHero.jsx` (unchanged). Styles: Hero-specific selectors in `src/foundation/styles/foundation-donation.css`. Approved asset: `/assets/foundation/donation/donation-hero.webp`, 1672 × 941; content/hash verified against the approved installation manifest. No image replacement, regeneration, remapping, resize or additional photographic layer.

#### Composition and approved HTML copy

The desktop Hero retains left-aligned white Georgia editorial type with the fixed three-line H1: “Invest in People.” / “Build Brighter” / “Tomorrows.” The SUPPORT SHF eyebrow is a brighter SHF orange, and the supporting paragraph is unchanged: “Your support helps expand education, workforce development, technology, and career opportunity for individuals and communities across Ohio and the Midwest.” It remains 19px desktop, limited to 460px, and 17px on tablet/mobile. H1 sizing remains `clamp(42px, 4.45vw, 66px)` desktop and 43px mobile; it was not shrunk to force a desktop layout onto mobile.

The upper-right handwritten OPPORTUNITY / CHANGES / LIVES. remains selectable accessible HTML using the existing SHF Permanent Marker font and orange clipped brush underline. Removed the beige badge/background/padding so the lettering sits directly over the sunset as in the mock. Dark ink with a restrained light text shadow is used over the desktop sky. Mobile repositions the statement below supporting copy with white brush lettering over the solid dark base; the underline remains orange. No essential copy is baked into an image, hidden or duplicated.

The desktop inner region now has a cinematic minimum height of 460px. Image remains cover with preserved aspect ratio and is positioned `center 18%` rather than the previous `center 47%`, retaining more of the upper portrait/head. The single neutral-charcoal gradient is strongest on the left (0.78 opacity at the edge, 0.7 through 38%, transparent at 61%); the sunset/right side is not given a full-width navy wash, blur or dimming filter. The dark fallback base remains beneath the image while it loads.

#### Responsive presentation

| Width  | Source-verified behavior                                                                                                                                                                                                                                                                            |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1440px | 460px minimum inner height; large three-line serif H1 left; student/photo center/right; transparent brush slogan upper right; image center 18%                                                                                                                                                      |
| 1280px | Same desktop composition and minimum height; paragraph capped at 460px; preserved headline structure                                                                                                                                                                                                |
| 768px  | Dedicated 601–1000px rules: 560px minimum inner height, copy lower left at 370px width, 48px H1, 17px paragraph, image 62% top; 28px slogan anchored 32px right / 28px top. Neutral left gradient remains strong through 46% and fades by 72%                                                       |
| 390px  | Portrait shown first in a 380px-high cover image at 65% top. The image fades into the neutral base only over its final 110px. Content stacks below, beginning at 370px, followed by the brush slogan. No desktop squeeze or full-photo dark wash. Hero height grows naturally with readable content |

Hero container retains overflow containment; no nav overlap, bottom margin or intervening region was added. Donation.jsx still composes FoundationDonationHero immediately followed by FoundationDonationNav. Nav code and CSS were not changed. Actual face/skyline crop, rotated-letter bounds, text contrast and overflow still need screenshot inspection at all four widths; source checks are not a substitute for rendered geometry.

#### Accessibility / motion

One page H1 remains, with explicit line breaks. Hero image retains concise meaningful alt text and high-priority loading. All eyebrow, headline, supporting and handwritten text is HTML and stays in the reading order. No Hero animation or motion was introduced; existing reduced-motion support is preserved. White paragraph/headline have a strong neutral left gradient on desktop/tablet and solid dark backing on mobile. Pixel-level contrast over the photo and exact crop/heading placement are unverified while browser access is blocked.

#### Fresh checks

| Check                                                           | Result                                                                                                                      |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Hero render/source + Donation render/asset/amount/handoff tests | PASS: 8 tests via `node --test tests/foundationDonationHero.test.mjs tests/foundationDonation.test.mjs`                     |
| Hero asset path/hash/dimensions                                 | PASS: exact approved URL/hash unchanged; WebP fully decoded at 1672 × 941                                                   |
| Headline/copy/slogan semantics                                  | PASS: one H1, approved three lines/copy, HTML slogan, one photograph, existing brush-font file present                      |
| Responsive source rules                                         | PASS at 1440/1280/768/390px: cover, badge-free slogan, intended desktop/tablet/mobile rules; source-level verification only |
| Hero → nav transition                                           | PASS source ordering; no Hero bottom-margin gap added; runtime junction pending                                             |
| Scoped TypeScript                                               | PASS: `./node_modules/.bin/tsc -p tests/foundation-donation.tsconfig.json`                                                  |
| Scoped lint                                                     | PASS: unchanged Hero component checked with repository rules/available temporary lint tooling                               |
| Formatting                                                      | PASS: changed stylesheet and new Hero verification tests                                                                    |
| Whitespace                                                      | PASS: `git diff --check`                                                                                                    |
| Scoped production build                                         | PASS: `node docs/ui/foundation-donation/build.mjs`, 251 modules; existing empty vendor-charts warning                       |
| Browser attempt                                                 | Environmentally BLOCKED before page creation; first case failed at launch, remaining 3 did not run                          |
| Screenshots / visual comparison                                 | NOT CAPTURED / NOT INSPECTED; no final visual lock                                                                          |

Attempted once: `./node_modules/.bin/playwright test tests/ui/foundation-donation-hero.spec.mjs --workers=1 --max-failures=1`. Chromium exited SIGTRAP with `bootstrap_check_in ... MachPortRendezvousServer ... Permission denied (1100)`. No implementation change was made to bypass that limitation.

The new focused browser spec is ready to capture `docs/ui/foundation-donation/screenshots/section-02/hero-1440.png`, `hero-1280.png`, `hero-768.png`, `hero-390.png`, and verify asset loading, one H1, transparent slogan treatment, Hero/nav adjacency and page overflow. These are intended paths, not existing screenshot artifacts. Inspect against the owner mock before claiming a visual lock.

#### Regression guard / changed files

Production change: only `src/foundation/styles/foundation-donation.css`, limited to selectors containing `shf-donation-hero`. PostCSS comparison against the task-start snapshot proves every non-Hero selector, declaration and media context is identical. SHA-256 comparison proves every Foundation component, other Foundation page, Catalog component and installed Donation image is unchanged.

New verification files: `tests/foundationDonationHero.test.mjs`, `tests/ui/foundation-donation-hero.spec.mjs`. Documentation: this appended Section 02 handoff entry. No Header, donation navigation, Choose Your Impact, amount selector, safe payment handoff, Ways to Give, lower impact band, transparency, gray closing CTA or footer changes. No backend/schema changes, commit or deployment.

Earlier IMAGE-002 crop notes describe the previous Hero presentation; this Section 02 entry is now the current Hero crop/overlay/responsive authority. Image approval and installation remain resolved; screenshot-level visual approval is pending solely because browser execution is environmentally blocked.

### Section 03 — Donation Navigation

Initial audit (before edits): FoundationDonationNav.jsx already contains exactly five semantic controls. Make a Gift / Ways to Give / Where It Goes are focus-and-scroll buttons targeting existing `make-a-gift`, `ways-to-give`, `where-it-goes` sections. Impact Stories is the existing `#impact` homepage destination, not a dedicated story page; Partner With Us uses implemented `#/partners`. No dialog, missing-route or nonfunctional action was found. Current state defaults to Make a Gift and updates on button click; reduced motion already selects immediate scroll. Mock differences: subtle item dividers are absent, and scrolling relies on a fixed 150px section margin rather than measuring the sticky header. Production changes will be limited to this navigation component and its selectors.

**SECTION 03 — DONATION NAVIGATION COMPLETE WITH VERIFIED BROWSER LIMITATION**

#### Component / exact five controls

Component: `src/foundation/components/FoundationDonationNav.jsx`. Styles: only `.shf-donation-nav` selectors within `src/foundation/styles/foundation-donation.css`. Semantic landmark is now `<nav aria-label="Donation page sections">`. Exactly three native buttons and two native links remain, in the approved order:

| Label           | Existing FoundationDonationIcon name | Behavior / destination                                                                      |
| --------------- | ------------------------------------ | ------------------------------------------------------------------------------------------- |
| Make a Gift     | heart                                | Focus and scroll to existing `#make-a-gift` / Choose Your Impact                            |
| Ways to Give    | gift                                 | Focus and scroll to existing `#ways-to-give` / More Ways to Make an Impact                  |
| Where It Goes   | chart                                | Focus and scroll to existing `#where-it-goes` / dark gift-impact band                       |
| Impact Stories  | people                               | Navigate to canonical homepage `#impact` region; existing router/footer complete the scroll |
| Partner With Us | partner (handshake)                  | Navigate to existing `#/partners` public information page                                   |

No new anchors, duplicate IDs, routes, forms, dialogs or icon library. The existing inline-SVG icon component is reused without modification; decorative icons have `aria-hidden="true"`. All destinations were checked in source: Donation.jsx, FoundationWaysToGive.jsx, FoundationGiftImpact.jsx, Home.jsx, PublicInfoPage.jsx and the canonical App router. Impact Stories is a label for the existing public impact destination, not a claim that a separate story library exists.

#### Current state and scrolling

Make a Gift is current on initial mount. Activating any of the three local buttons updates the underline and exposes `aria-current="location"`; other local buttons lose it. This is deliberate click-updated state, not scroll-spy. Manual scrolling does not update the indicator. External links retain native route semantics and unmount the Donation page.

The handler guards a missing target, focuses the existing focusable section using `preventScroll`, then scrolls to the target's document position minus the measured `.shf-institutional-header` height and 16px clearance. This replaces reliance on a fixed section-margin offset without changing the destination sections or their CSS. The target stays below the actual sticky header at the active breakpoint. Normal motion uses smooth scrolling; `prefers-reduced-motion: reduce` uses immediate scrolling. Local buttons do not change the hash/router state.

#### Strip styling / mobile / accessibility

The existing public Foundation strip remains a single flex row with ivory `#fffdf8` background, SHF orange 32px line icons, navy labels at 15px, 82px minimum item height, and orange bottom border only on the current item. Added restrained 1px, 32px-tall vertical dividers between items. No pills, rounded tabs or dashboard treatment.

Desktop 1440/1280px uses the existing balanced horizontal row. At 768px/390px, all five controls remain present and the strip scrolls horizontally within its shell; native touch scrolling and a thin scrollbar remain available. Horizontal overscroll is contained and scroll padding gives controls clearance. At mobile widths the existing 72px minimum height, 13px labels and 25px icons remain. Focus outlines use an inset offset so they are not clipped by the locally scrolling strip. Native buttons support Enter/Space, links support Enter; actual keyboard behavior remains unverified until the browser can run.

Labels convey destination, icons are decorative, active state is semantic as well as visual, and control heights exceed the 44px target minimum in source. Existing high-contrast navy/ivory label and orange accent palette retained. No new motion. Exact touch geometry, rendered contrast, horizontal scroll behavior and target landing position require browser evidence.

Hero → navigation → Choose Your Impact remains the existing immediate JSX sequence. No Hero/content spacing was edited, no duplicated nav added, and existing strip bottom divider remains.

#### Fresh test/build results

| Check                                                                             | Result                                                                                                                              |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Navigation render/target/route/style + Donation render/asset/amount/handoff tests | PASS: 8 tests via `node --test tests/foundationDonationNav.test.mjs tests/foundationDonation.test.mjs`                              |
| Semantic/default-current/icons                                                    | PASS: exactly 5 native controls, 3 buttons/2 links, one default `aria-current`, 5 hidden decorative SVGs                            |
| Section targets / route destinations                                              | PASS in source: three unique focusable existing sections, homepage impact region, implemented partners route                        |
| Scroll logic / reduced motion                                                     | PASS source checks: target guard, measured header, target focus, 16px clearance, smooth/immediate branches; runtime remains pending |
| Scoped TypeScript                                                                 | PASS: `./node_modules/.bin/tsc -p tests/foundation-donation.tsconfig.json`                                                          |
| Scoped lint                                                                       | PASS: FoundationDonationNav with existing repository rules/available temporary lint tooling                                         |
| Formatting                                                                        | PASS: modified component/CSS, new navigation tests and updated existing Donation browser-test landmark query                        |
| Whitespace                                                                        | PASS: `git diff --check`                                                                                                            |
| Scoped production build                                                           | PASS: `node docs/ui/foundation-donation/build.mjs`, 251 modules; existing empty vendor-charts warning                               |
| Browser attempt                                                                   | Environmentally BLOCKED before page creation; first case failed at launch and remaining 3 did not run                               |
| Screenshots / keyboard / visual review                                            | NOT CAPTURED / UNVERIFIED; no visual lock claimed                                                                                   |

Attempted once: `./node_modules/.bin/playwright test tests/ui/foundation-donation-nav.spec.mjs --workers=1 --max-failures=1`. Chromium exited SIGTRAP with `bootstrap_check_in ... MachPortRendezvousServer ... Permission denied (1100)`. No implementation workaround for this browser restriction was made.

The new focused browser spec covers 1440, 1280, 768 and 390px; click/Enter/Space activation, target focus/clearance, current state, local hash preservation, route links, focus outlines, overflow and navigation screenshots. Intended paths after recovery: `docs/ui/foundation-donation/screenshots/section-03/nav-1440.png`, `nav-1280.png`, `nav-768.png`, `nav-390.png`. These files have not been captured. Inspect strip balance, dividers, icon alignment, underline, horizontal scrolling and Hero/content junctions against the owner mock before claiming visual lock.

#### Regression guard / changed files

Production changes: only FoundationDonationNav.jsx and navigation selectors in foundation-donation.css. PostCSS comparison against the task-start snapshot confirms every non-navigation declaration/selector/media context is unchanged. SHA-256 comparison confirms all other Foundation source files, Catalog components and approved image files unchanged, including Header, Hero, Choose Your Impact, donation logic, payment handoff, Ways to Give, lower impact band, transparency, closing CTA and footer.

New tests: `tests/foundationDonationNav.test.mjs`, `tests/ui/foundation-donation-nav.spec.mjs`. Existing browser test `tests/ui/foundation-donation.spec.mjs` only updates its navigation landmark query to “Donation page sections.” Documentation: this Section 03 entry. No backend/schema/image/dependency changes, commit or deployment. Remaining limitations are browser execution, screenshot inspection and live keyboard/scroll geometry verification.

### Section 04 — Choose Your Impact / Make a Gift

**SECTION 04 — CHOOSE YOUR IMPACT COMPLETE WITH VERIFIED BROWSER LIMITATION**

Scope: only Section 04 gift selector/support presentation and its tests. Components: `src/foundation/components/FoundationGiftSelector.jsx` (changed) and FoundationSupportImpactPanel.jsx (unchanged). Section composition/headings remain in `src/foundation/pages/Donation.jsx` unchanged. The existing `adapters/donationHandoff.js`, FoundationDonationDialog.jsx and parent dialog state remain unchanged; no payment integration or architecture changes.

#### Copy, amounts and state

Eyebrow/heading/supporting copy remain exactly “MAKE A DIFFERENCE”, “Choose Your Impact.” and “Every gift helps remove barriers, expand opportunity, and create stronger, more inclusive communities.”

| One-time USD preset | Qualitative description                       |
| ------------------- | --------------------------------------------- |
| $25                 | Supports learning resources                   |
| $50                 | Expands access to program opportunities       |
| $100                | Invests in workforce and career pathways      |
| $250                | Helps grow community and regional initiatives |

Four native buttons retain `aria-pressed`; only the current preset is pressed. Initial amount is empty and no preset or recurring frequency is selected. Each preset sets the current amount and clears an error. Typing custom text clears the preset and stores the exact entered string without rewriting it. The labelled Custom Amount (USD) input retains decimal input mode. The existing parser accepts only positive exact-cent amounts representable as safe integer cents, rejects empty/zero/negative/nonnumeric/exponent/overprecision/unsafe values, and does not round unsupported fractional cents. Formatted dollar amounts appear only in the handoff message, not as a silent rewrite of input.

Invalid submission retains the value, focuses the custom input, sets `aria-invalid`, and displays the existing announced error: “Enter a positive USD amount with no more than two decimal places.” Its `aria-describedby` now includes both `shf-gift-context` and `shf-gift-error` during validation, preserving one-time/USD/provider guidance alongside the error.

#### Give Now / provider / dialog

Give Now validates, calls the existing `prepareDonationHandoff` with one-time USD minor units, then opens the existing native information dialog. The message includes the selected amount, explains that online giving is unavailable until SHF's approved secure provider is connected, and explicitly says no payment was taken and the amount was not saved. No card/bank/donor fields, processing request, receipt, transaction ID or payment-success state was added. Provider status remains `provider-unavailable`.

One selector-only focus adjustment ensures consistent restoration: before opening a valid handoff, the selector focuses a ref on Give Now. The unchanged shared dialog captures that invoking focus, calls `showModal`, focuses its autofocus Close and return button, supports native Escape via `onCancel`, and restores invoking focus during cleanup. This also covers Enter submission while the amount input had focus. The shared dialog and other dialog consumers were not modified. Native containment, live Escape/button close and exact focus restoration still await browser evidence.

#### Support panel / visual refinement

Approved `/assets/foundation/donation/donation-impact-support.webp` is unchanged, verified against its installed SHA-256, and fully decodes at 1122 × 1402. No image replacement. Heading remains YOUR SUPPORT HELPS with the same cap, briefcase, accessibility and community SVGs and four unchanged qualitative areas:

- Expand access to education and technology
- Create real workforce and career opportunities
- Support inclusive programs for all learners
- Strengthen Ohio and Midwest communities

No metrics, dollar-to-outcome guarantees, percentages or testimonials. Existing ivory cards, navy text, orange amount/action/icons, beige support wash, display H2, selected two-pixel orange border/tint and visible focus remain.

Preset descriptions increase from 12px to 13px; desktop cards have a 132px minimum height for comfortable multi-line text. Main section and support-panel column fractions retain their proportions but use `minmax(0, …)` and children have minimum-width zero to avoid intrinsic content forcing overflow. Support image is explicitly block-level with maximum width 100%; support content can shrink within its existing column. No checkout-style redesign or section restructuring.

#### Responsive / accessibility

At 1440/1280px: existing gift-selector/support-panel two-column composition, four presets across, custom input/action alongside, tall support portrait and list. Below the existing 1100px breakpoint: gift content stacks above the support panel rather than compressing the form; the panel keeps its existing photo/list columns and two-column list where comfortable. At 390px: two-column presets, stacked custom input/Give Now, then support image/list. Mobile image height becomes `clamp(240px, 65vw, 340px)` at center 20% to reveal more of both faces/skyline; desktop cover/30% center remains. Actual crops and overflow remain unverified without browser screenshots.

H2/H3 structure, USD fieldset legend/label, native amount buttons, pressed state, invalid/description relationships, announced error, visible focus and meaningful image alt are preserved. Give Now remains a large native submit button with a clear accessible name. Semantic dialog title/description and native modal behavior are preserved. Source palette remains dark text on warm light backgrounds and dark text on the orange primary action; final pixel-level contrast/touch targets/keyboard experience still need browser inspection.

#### Fresh verification / limitations

| Check                                                                                 | Result                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gift/support/dialog render, validation, safe adapter and Donation render/asset checks | PASS: 9 tests via `node --test tests/foundationGiftSelector.test.mjs tests/foundationDonation.test.mjs`                                                                                |
| Amount state contract                                                                 | PASS source checks: empty initial state, exclusive pressed preset, preset populates input, raw custom text clears preset/error; React DOM interaction remains unverified               |
| Custom validation                                                                     | PASS executable parser tests for the four presets, exact cents and invalid inputs                                                                                                      |
| Safe handoff                                                                          | PASS executable adapter reports provider-unavailable; message/render/source checks confirm truthful state and no payment/storage implementation                                        |
| Modal/focus contract                                                                  | PASS render/source checks for native title/description, showModal, Escape wiring, autofocus close, return-focus cleanup and pre-open Give Now focus; live lifecycle remains unverified |
| Support image                                                                         | PASS exact URL/hash, full WebP decode at 1122 × 1402; no asset change                                                                                                                  |
| Scoped TypeScript                                                                     | PASS: `./node_modules/.bin/tsc -p tests/foundation-donation.tsconfig.json`                                                                                                             |
| Scoped lint                                                                           | PASS: selector, support component and unchanged dialog with repository rules/available temporary lint tooling                                                                          |
| Formatting / whitespace                                                               | PASS changed source/CSS/new test files and `git diff --check`                                                                                                                          |
| Scoped production build                                                               | PASS: `node docs/ui/foundation-donation/build.mjs`, 251 modules; existing empty vendor-charts warning                                                                                  |
| Browser attempt                                                                       | Environmentally BLOCKED before page creation; first case failed at launch, remaining 3 did not run                                                                                     |
| Screenshots / live keyboard/state/focus/mobile geometry                               | NOT VERIFIED; no visual lock claimed                                                                                                                                                   |

Attempted once: `./node_modules/.bin/playwright test tests/ui/foundation-donation-gift.spec.mjs --workers=1 --max-failures=1`. Chromium exited SIGTRAP with `bootstrap_check_in ... MachPortRendezvousServer ... Permission denied (1100)`. The new browser spec covers every preset, Enter/Space activation, switching/custom selection, invalid input preservation, Give Now, input-Enter submission, modal button/Escape/focus return, image loading, target bounds, overflow and screenshot captures at 1440/1280/768/390px.

Intended screenshot paths: `docs/ui/foundation-donation/screenshots/section-04/gift-1440.png`, `gift-1280.png`, `gift-768.png`, `gift-390.png`. None were captured. Optional isolated React test-renderer tooling was also unavailable in the offline cache; no dependency or lockfile changes were made and no browser-level behavior is inferred from source checks.

#### Regression guard / changed files

Only production changes: FoundationGiftSelector.jsx and Section 04 selectors in foundation-donation.css. New tests: `tests/foundationGiftSelector.test.mjs`, `tests/ui/foundation-donation-gift.spec.mjs`. Documentation: this handoff entry. PostCSS comparison proves every CSS rule/media context outside Section 04 unchanged; SHA-256 comparison confirms Header, Hero, navigation, support component/image, adapter, shared dialog, lower sections, closing CTA/footer, other Foundation/Catalog sources and approved image assets unchanged.

No backend/schema/provider/payment/dependency changes, commit or deployment. Section 04 implementation checks pass; visual and runtime interaction approval awaits a browser-enabled environment.

### Section 05 — More Ways to Make an Impact

Initial audit (before edits): FoundationWaysToGive.jsx has all six approved image URLs, correct card order/copy and truthful existing actions. One-Time Gift focuses the existing amount input and scrolls to Make a Gift. Monthly/Grants/Planned open unavailable-information previews; Corporate/Employer use implemented `#/partners`. No recurring billing or fake submission. Current CSS is 6 columns desktop / 3 tablet / 2 mobile, which differs from this task's explicit 3/2/1 preference. Cards are currently whole native controls containing headings; the orange arrow is decorative with no standalone target. This pass will use semantic article cards with labelled native arrow actions, a 44px action target and the requested grid, without changing content/images or downstream components.

**SECTION 05 — MORE WAYS TO MAKE AN IMPACT COMPLETE WITH VERIFIED BROWSER LIMITATION**

#### Component, approved content and image mappings

Component/data/actions remain in `src/foundation/components/FoundationWaysToGive.jsx`. Styles are limited to Section 05 `.shf-donation-ways` / `.shf-giving-*` rules in foundation-donation.css. Eyebrow, H2 and supporting copy remain unchanged: WAYS TO GIVE / More Ways to Make an Impact. / There are many ways to support the mission of Silicon Heartland Foundation.

| Card, in unchanged order | Unchanged description                  | Approved image under `/assets/foundation/donation/` | Action                                                                                                                         |
| ------------------------ | -------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| One-Time Gift            | Make an immediate difference.          | donation-one-time-gift.webp                         | Focus existing Custom Amount input and scroll to `#make-a-gift`                                                                |
| Monthly Giving           | Provide ongoing support.               | donation-monthly-giving.webp                        | Existing informational preview: recurring giving unavailable until approved provider, terms and cancellation information exist |
| Corporate Support        | Partner with us to expand opportunity. | donation-corporate-support.webp                     | Existing `#/partners`                                                                                                          |
| Grants & Foundations     | Support larger initiatives.            | donation-grants-foundations.webp                    | Existing informational preview: giving information/instructions and dedicated funder contact not published here                |
| Employer Partnerships    | Invest in workforce development.       | donation-employer-partnerships.webp                 | Existing `#/partners`                                                                                                          |
| Planned Giving           | Leave a lasting legacy.                | donation-planned-giving.webp                        | Existing informational preview: instructions unavailable, no legal/tax/gift-acceptance guidance supplied                       |

All six originals/production assets are unchanged, match their approved manifest hashes and fully decode at 1536 × 1024. No replacement/remapping, image generation, image file edits or new reuse relationships. Corporate/Employer destinations are implemented in the existing Foundation public route configuration. No story, application, sponsorship, grant, estate or recurring-payment authority was invented.

#### Card structure, visual system and responsive grid

Each card is now a semantic `article` labelled by its H3, with the approved image, description and small orange circular arrow. The arrow has an actual native button or link wrapper measuring 44 × 44px; its visible circle stays 28px as in the mock. Actions are labelled by the card H3 and described by its description. Images/text are not nested inside a button. Decorative arrow artwork is hidden from assistive technology. The whole card is an article; the visible arrow is its activation control.

Desktop 1440/1280px uses **3 columns**, tablet 768px uses **2 columns** at the existing 1100px breakpoint, and mobile 390px uses **1 column** below 600px. This task's explicit 3/2/1 layout takes precedence over the original mock's narrower six-card row. Grid tracks use minimum-width zero and equal fractional rows, gap 20px desktop/tablet and 16px mobile. Cards use the existing warm-white surface, six-pixel radius and restrained border/shadow. H3 grows to 17px and description to 15px. Card bodies flex/stretch with a 160px minimum and reserved bottom space for the consistently positioned action.

Images use a consistent 220px display height, full width, cover and center 40% position at all requested widths. This changes only presentation, not the approved files. All retain useful alt text. Face/activity crops and card height balance still require actual screenshot inspection. Existing visible focus outlines apply to action links/buttons; the eight-pixel inset from the card edge accommodates the outline despite card overflow clipping. Native controls support keyboard activation and a large action hit area without making the visible circle oversized.

#### Action and safety behavior

One-Time Gift reuses the existing input/form; it never creates a second donation flow. Its handler now calculates scroll position from the actual sticky Foundation header height plus 16px clearance, focuses the existing custom amount input, and respects reduced motion (immediate rather than smooth scrolling). No amount/frequency is selected by this action.

Monthly/Grants/Planned retain their original truthful descriptions passed to the unchanged page-owned FoundationDonationDialog. No recurring billing, fake application, legal/tax promise or unverified corporate relationship. Native dialog Escape, close action and invoking-focus return remain shared behavior; not modified in this pass. Partners links stay canonical, with no duplicate forms. Live keyboard/modal/routing behavior remains pending browser verification.

#### Fresh tests/build

| Check                                                                         | Result                                                                                                                                                                                                                                         |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ways render/content/actions/grid + Donation render/asset/amount/handoff tests | PASS: 8 tests via `node --test tests/foundationWaysToGive.test.mjs tests/foundationDonation.test.mjs`                                                                                                                                          |
| Exact six images                                                              | PASS: slot order, exact URLs, useful alternatives, manifest SHA-256 and full WebP decoding at original 1536 × 1024                                                                                                                             |
| Card semantics/accessibility                                                  | PASS render/element checks: six labelled articles, native labelled/described actions, decorative arrow hidden, 44px hit-area CSS                                                                                                               |
| Actual information callbacks                                                  | PASS: invoked the stateless component's real action handlers and checked Monthly/Grants/Planned titles and truthful unavailable text                                                                                                           |
| One-Time action                                                               | PASS: real component handler tested against bounded document/window collaborators; focuses existing input and requests correct sticky-header-aware scroll with normal/reduced motion. This does not prove native browser focus/scroll geometry |
| Canonical route checks                                                        | PASS: Corporate/Employer links preserve `#/partners`, existing public partners content verified                                                                                                                                                |
| Responsive CSS                                                                | PASS: source rules at 1440/1280/768/390 verify 3/3/2/1 columns, consistent 220px images, cover, 44px native action wrappers                                                                                                                    |
| Scoped TypeScript                                                             | PASS: `./node_modules/.bin/tsc -p tests/foundation-donation.tsconfig.json`                                                                                                                                                                     |
| Scoped lint                                                                   | PASS: FoundationWaysToGive with existing repository rules/available temporary lint tooling                                                                                                                                                     |
| Formatting / whitespace                                                       | PASS changed source/CSS/tests and `git diff --check`                                                                                                                                                                                           |
| Scoped production build                                                       | PASS: `node docs/ui/foundation-donation/build.mjs`, 251 modules; existing empty vendor-charts warning                                                                                                                                          |
| Browser attempt                                                               | Environmentally BLOCKED before page creation; first case failed at launch, remaining 3 did not run                                                                                                                                             |
| Live keyboard/route/modal/image-loading/crop/screenshots                      | UNVERIFIED; no final visual lock                                                                                                                                                                                                               |

Attempted once: `./node_modules/.bin/playwright test tests/ui/foundation-donation-ways.spec.mjs --workers=1 --max-failures=1`. Chromium exited SIGTRAP with `bootstrap_check_in ... MachPortRendezvousServer ... Permission denied (1100)`. No implementation workaround for unavailable browser verification.

The focused browser spec is ready for all six images/actions, keyboard/focus, modal close/Escape/focus return, canonical partnership navigation, actual 3/2/1 computed grid, target dimensions and overflow at the four widths. Intended capture paths: `docs/ui/foundation-donation/screenshots/section-05/ways-1440.png`, `ways-1280.png`, `ways-768.png`, `ways-390.png`. None captured. Inspect image crops, title/description legibility, action placement/focus and grid proportions before final visual lock.

#### Scope and regression guard

Production changes: only FoundationWaysToGive.jsx and Section 05 CSS selectors. New tests: `tests/foundationWaysToGive.test.mjs`, `tests/ui/foundation-donation-ways.spec.mjs`. Documentation: this Section 05 entry. PostCSS comparison proves every rule/declaration/media context outside Section 05 unchanged. SHA-256 comparisons prove Sections 01–04, donation/payment logic, shared dialog, all approved image assets, lower impact band, transparency, gray closing CTA/footer, other Foundation pages and Catalog component sources unchanged.

No backend/schema/provider/dependency/image-file changes, commit or deployment. Content/approval and implementation checks pass; browser screenshot/native interaction verification remains environmentally blocked.

### Section 06 — Where Your Gift Goes

**SECTION 06 — WHERE YOUR GIFT GOES COMPLETE WITH VERIFIED BROWSER LIMITATION**

Component: `src/foundation/components/FoundationGiftImpact.jsx`. Section-specific styles: `.shf-gift-impact*` and its scoped Our Impact CTA selectors in `src/foundation/styles/foundation-donation.css`. Approved banner: `/assets/foundation/donation/donation-impact-banner.webp`, unchanged 2007 × 783 WebP. No generation, remapping, file edits or additional photo layers.

#### Audit and composition

Before edits, the component already had the correct approved banner, hidden old HTML slogan, six categories and canonical `#impact` link. The wide banner was only 32% of desktop width / 35% of tablet width, making its embedded lettering small. The existing three-part dark navy composition is preserved on desktop, with more space for the image and more readable supporting copy/categories. Tablet now gives the wide image a full-width first row rather than a narrow portrait-like column.

Desktop columns use shrink-safe 38/38/24 fractional proportions: approved image left, copy/CTA center, impact list right. Children have minimum-width zero. Background remains deep Foundation navy `#031a26`, white main text, light supporting text and orange accents with the restrained existing vertical category divider. No cards, blue dashboard styling, gray panels, percentages or financial-allocation display.

#### Copy, image and slogan handling

Approved copy remains exactly:

- Eyebrow: WHERE YOUR GIFT GOES
- H2: Focused on Lasting Impact.
- Supporting copy: Your support helps fund programs, resources, and community initiatives that create real education and workforce opportunities.
- CTA: Our Impact

The image region retains the exact 2007 / 783 source aspect ratio, center position, cover and no dimming filter. The complete source frame is preserved by equal source/display aspect ratio, protecting four subjects, skyline and both baked-in slogans. No duplicate visual HTML handwriting overlays the banner. Removed an unused old handwriting-overlay CSS rule, not the accessible content.

Image alt remains: “Four young people overlooking a sunset city skyline. Real skills. Real people. Real impact. Opportunity changes lives.” This describes the scene and transcribes its embedded slogans. Existing “REAL SUPPORT. REAL OPPORTUNITY.” HTML remains in the accessibility tree using the unchanged one-pixel clipped visually-hidden utility. No accessible meaning removed or essential text newly baked into imagery. The image's visible slogans are authoritative.

#### Categories and CTA

The native list is now labelled “Impact and support categories” and contains exactly:

- Education & Youth Programs
- Workforce Development
- Technology & Innovation
- Inclusive Learning
- Community Initiatives
- Program Support & Operations

These are broad qualitative support categories. No percentages, budget ratios, donor designation, equal earmarking or separate restricted funds are implied or added.

Our Impact retains native anchor `href="#impact"`. The Foundation router resolves that fragment to the existing homepage, where `Home.jsx` owns the `id="impact"` region; the canonical FoundationFooter effect finishes the anchor scroll. No new Impact route or data source. Native link name remains Our Impact; decorative arrow SVG stays hidden from assistive technology. CTA retains a minimum 48px height, grows to 15px text and now has a bright warm-orange 3px focus outline with 4px offset. Its existing outlined appearance remains institutional.

#### Responsive/source rules

| Width         | Behavior                                                                                                                                           |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1440 / 1280px | Three-part 38/38/24 desktop band, complete image frame, readable center copy and balanced category list                                            |
| 768px         | Existing below-1100px breakpoint now uses full-width image first, copy and list side by side below; all source lettering retained                  |
| 390px         | One column: image first, copy/CTA second, list third; complete wide source aspect ratio preserved, no artificial stretch or image-box letterboxing |

Copy padding is 36px/28px desktop and retains existing 28px/22px mobile rules. Supporting text grows from 14px to 16px, category text from 14px to 15px with eight-pixel vertical item padding. Image minimum height remains zero so the source ratio controls image height. No section bottom/top margin, separator or white strip was added. Existing Section 05 → FoundationGiftImpact → FoundationTransparency JSX adjacency is unchanged. Actual lettering readability, touch geometry, CTA focus, image crop, page overflow and transition boundaries still require browser screenshots.

#### Fresh tests / browser status

| Check                                                                         | Result                                                                                                                                                                |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Impact render/source/asset/route + Donation render/asset/amount/handoff tests | PASS: 8 tests via `node --test tests/foundationGiftImpact.test.mjs tests/foundationDonation.test.mjs`                                                                 |
| Semantic copy/category checks                                                 | PASS: labelled section, H2, exact approved copy and six named list entries; no allocation/restricted-fund claims                                                      |
| Banner identity                                                               | PASS: exact approved URL and SHA-256, full WebP decode at unchanged 2007 × 783                                                                                        |
| Slogan handling                                                               | PASS: accessible image alt includes both embedded slogans, existing HTML is visually clipped, no visible duplicate handwriting element                                |
| CTA/destination/boundaries                                                    | PASS source/render checks: native Our Impact link, canonical homepage impact region/router/footer behavior present, 48px target/focus CSS and immediate sibling order |
| Responsive styling                                                            | PASS source rules at 1440/1280/768/390: preserved image ratio, desktop three parts, tablet image row, mobile sequence                                                 |
| Scoped TypeScript                                                             | PASS: `./node_modules/.bin/tsc -p tests/foundation-donation.tsconfig.json`                                                                                            |
| Scoped lint                                                                   | PASS: FoundationGiftImpact with repository rules/available temporary lint tooling                                                                                     |
| Formatting / whitespace                                                       | PASS changed source/CSS/tests and `git diff --check`                                                                                                                  |
| Scoped production build                                                       | PASS: `node docs/ui/foundation-donation/build.mjs`, 251 modules; existing empty vendor-charts warning                                                                 |
| Browser attempt                                                               | Environmentally BLOCKED before page creation; first case failed at launch, remaining 3 did not run                                                                    |
| Actual screenshots, crop, keyboard and route behavior                         | UNVERIFIED; no final visual lock asserted                                                                                                                             |

Attempted once: `./node_modules/.bin/playwright test tests/ui/foundation-donation-impact.spec.mjs --workers=1 --max-failures=1`. Chromium exited SIGTRAP with `bootstrap_check_in ... MachPortRendezvousServer ... Permission denied (1100)`. This is environment failure, not evidence that page assertions passed or failed. No implementation workaround for the browser restriction.

The new browser spec covers the four widths, banner loading/ratio, category list, visually hidden slogan bounds, Our Impact focus/Enter destination, sibling transitions and overflow. Intended captures: `docs/ui/foundation-donation/screenshots/section-06/impact-1440.png`, `impact-1280.png`, `impact-768.png`, `impact-390.png`. No files captured. Inspect the whole banner and slogan lettering, center copy, list alignment, CTA and adjacent-section transitions against the approved composition before final visual lock.

#### Scope / regression guard

Production changes: only FoundationGiftImpact.jsx (list accessible label) and Section 06 stylesheet rules. New tests: `tests/foundationGiftImpact.test.mjs`, `tests/ui/foundation-donation-impact.spec.mjs`. Documentation: this appended entry. PostCSS comparison confirms every CSS rule/media context outside Section 06 unchanged. SHA-256 comparison confirms Sections 01–05, Trust & Transparency, gray closing CTA/footer, donation/payment adapter/dialog, all approved images, other Foundation pages and Catalog component sources unchanged.

No backend/schema/provider/dependency/image changes, commit or deployment. Earlier IMAGE-002 responsive crop notes for this band are superseded by this Section 06 presentation; image identity remains unchanged. Remaining limitation is native browser interaction and visual acceptance evidence.

### Section 07 — Trust & Transparency

Initial audit (before editing): FoundationTransparency.jsx has the exact approved copy and three real actions. Financial Reports opens an unavailable-information dialog; no public financial reports/PDFs were located. Governance Overview opens an unavailable-information dialog; no dedicated public governance route/documents were located (generic About is not a governance overview). Impact Reporting links to implemented `#/reports`, the canonical public evidence/disclosure information page, not invented metrics/reports. No broken/placeholder/fake-download destinations found. Main discrepancy: mobile keeps three narrow action columns with 11px labels instead of the requested single-column stack. Dialog-opening actions also lack explicit popup semantics. Shared closing CTA/footer remain owned by FoundationLayout and will not be changed.

**SECTION 07 — TRUST & TRANSPARENCY COMPLETE WITH VERIFIED BROWSER LIMITATION**

#### Component and approved commitment copy

Component: `src/foundation/components/FoundationTransparency.jsx`. Section-only styling: `.shf-donation-transparency*` / `.shf-transparency-actions*` in foundation-donation.css. Existing section label/H2 and copy remain exactly:

- TRUST & TRANSPARENCY
- Your Support. Our Responsibility.
- We are committed to transparent reporting and responsible stewardship of every contribution.

This is a qualitative commitment, not an audited-status, rating, certification, spending-ratio or donor-restriction claim. The section remains light ivory `#fffdf8`, with editorial serif H2, dark text and the existing orange-toned line icons. No dashboard styling or new icon library.

#### Three actions / actual publication status

| Action              | Existing icon | Destination / behavior        | Authority and limitation                                                                                                                                                                         |
| ------------------- | ------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Financial Reports   | file          | Existing informational dialog | No dedicated published financial report resource was located. Message truthfully states approved reports are not currently published and no statements/allocation percentages are presented here |
| Governance Overview | shield        | Existing informational dialog | No dedicated public governance overview was located. Message states it is unavailable and this page does not substitute for approved governance documents                                        |
| Impact Reporting    | chart         | Canonical `#/reports`         | Implemented Foundation public information page describing evidence/disclosure boundaries, not a fabricated metrics dashboard or annual report collection                                         |

Financial and Governance remain native buttons, now with `aria-haspopup="dialog"`. Their existing message/title callbacks and the shared dialog lifecycle are unchanged. The three controls are now in a named group, “Foundation transparency information.” Impact Reporting remains a native link to an implemented App/PublicInfoPage route. Generic About content was not relabelled as a governance document. No missing/new route, placeholder hash, fake PDF/download, Form 990, audited financial statement, rating, board/policy/bylaw/committee content, metrics or financial figures were invented.

#### Composition, responsive rules and accessibility

Desktop 1440/1280px retains the balanced two-part composition: approved copy left, three icon/action blocks right. The outer grid keeps 1.1/1 proportions using shrink-safe minimum-zero tracks. Added explicit warm-white section background and minimum-width zero for children. Supporting copy grows from 13px to 15px; action labels grow from 12px to 14px. Action blocks keep restrained dividers, transparent default surfaces and consistent 34px existing icons, with 112px minimum height. Hover uses a subtle warm tint; focus has a three-pixel blue inset outline that remains visible inside each block.

At 768px, the existing below-1100px rule stacks the copy above the three-column action grid with generous width. At 390px, actions now form a single column with icons beside labels, 15px text, 76px minimum height, full available width and subtle top dividers instead of narrow left borders. No clipped tiny labels or hidden action controls. No extra CTA, section restructuring outside this scope, image, new motion or repeated visible transparency copy.

Semantic labelled section/H2, named action group, native buttons/link and meaningful visible names are preserved. SVGs are decorative and hidden from assistive technology; action meaning is expressed by labels and popup semantics, not orange alone. Existing dialog uses a labelled native modal, autofocus close button, Escape handler and invoking-focus cleanup. Native keyboard, live focus restoration, computed contrast/target dimensions and overflow remain pending browser evidence; source labels, colors and target dimensions were inspected.

#### Closing transition and regression evidence

FoundationLayout remains unchanged: main content → canonical FoundationClosingCta → FoundationFooter. Transparency remains the last visible section in Donation; the existing closed shared dialog follows it inside main without visible layout content. Render checks confirm one transparency section, one closing CTA, one footer, and canonical CTA/footer adjacency. No closing/footer markup, messaging, border, spacing or actions changed. Runtime visual gap/overlap still needs screenshot inspection.

Production edits are only FoundationTransparency.jsx and Section 07 stylesheet selectors. PostCSS comparison confirms every rule/declaration/media context outside Section 07 unchanged. SHA-256 comparison confirms Sections 01–06, all approved photography, donation/payment state/adapter/shared dialog, canonical closing CTA/footer, other Foundation sources and Catalog components unchanged.

New tests: `tests/foundationTransparency.test.mjs`, `tests/ui/foundation-donation-transparency.spec.mjs`. Documentation: this Section 07 entry. No backend/schema/payment/provider/dependency/image changes, commit or deployment.

#### Fresh verification / browser status

| Check                                                                                        | Result                                                                                                                                                                        |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Transparency render/callback/route/layout/shell + Donation render/asset/amount/handoff tests | PASS: 9 tests via `node --test tests/foundationTransparency.test.mjs tests/foundationDonation.test.mjs`                                                                       |
| Information handlers                                                                         | PASS: invoked the real stateless component handlers, verified exact Financial/Governance titles and honest unavailable messages                                               |
| Destination checks                                                                           | PASS: `#/reports` implemented in existing Foundation App/PublicInfoPage; no fake/placeholder download                                                                         |
| Semantics/accessibility                                                                      | PASS render/source: H2, exact copy, 2 native popup buttons + 1 native link, named group, 3 decorative hidden SVGs, visible focus CSS and at least 44px minimum action heights |
| Responsive CSS                                                                               | PASS source rules at 1440/1280/768/390: three actions desktop/tablet, readable full-width mobile rows                                                                         |
| Canonical ending                                                                             | PASS actual shared-layout render: one closing CTA after main and one footer immediately after it                                                                              |
| Scoped TypeScript                                                                            | PASS: `./node_modules/.bin/tsc -p tests/foundation-donation.tsconfig.json`                                                                                                    |
| Scoped lint                                                                                  | PASS: FoundationTransparency with existing repository rules/available temporary lint tooling                                                                                  |
| Formatting / whitespace                                                                      | PASS modified source/CSS/tests and `git diff --check`                                                                                                                         |
| Scoped production build                                                                      | PASS: `node docs/ui/foundation-donation/build.mjs`, 251 modules; existing empty vendor-charts warning                                                                         |
| Browser attempt                                                                              | Environmentally BLOCKED before page creation; first case failed at launch, remaining 3 did not run                                                                            |
| Screenshots / live keyboard/modal/routing/mobile geometry                                    | UNVERIFIED; no final visual lock claimed                                                                                                                                      |

Attempted once: `./node_modules/.bin/playwright test tests/ui/foundation-donation-transparency.spec.mjs --workers=1 --max-failures=1`. Chromium exited SIGTRAP with `bootstrap_check_in ... MachPortRendezvousServer ... Permission denied (1100)`. No implementation workaround for unavailable browser execution.

The focused browser spec covers all three actions, Enter/Space, modal Escape/close/focus return, focus outlines, target geometry, responsive grid, page overflow, canonical ending and Reports navigation at all four widths. Intended capture paths: `docs/ui/foundation-donation/screenshots/section-07/transparency-1440.png`, `transparency-1280.png`, `transparency-768.png`, `transparency-390.png`. No screenshots captured. Inspect typography/spacing, action balance, mobile tap targets and transition to the gray closing CTA before visual lock.

Remaining limitations: authoritative Financial Reports/Governance resources are not published in the audited public implementation; Impact Reporting is the existing public disclosure-information destination. These limitations are presented honestly and are not replaced with invented resources. Browser-level visual and interaction acceptance remains environmentally blocked.

### Section 08 — Canonical SHF Closing CTA

Initial audit: FoundationLayout already mounts the single shared FoundationClosingCta immediately after main and immediately before FoundationFooter; Donation has no local duplicate. Existing artwork, copy, brush lettering and button styling are canonical and will be retained. Demonstrated integration gap: the primary link is always `#/get-involved`, with no click handler; on that same hash it has no Make a Gift focus/scroll behavior. This pass will preserve the canonical href and add guarded same-route focus/scroll behavior only. Other routes and prefixed Catalog consumers retain normal native navigation; no style/artwork/footer changes planned.

**SECTION 08 — CANONICAL SHF CLOSING CTA COMPLETE WITH VERIFIED BROWSER LIMITATION**

#### Canonical reuse / exact artwork and copy

Shared component: `src/foundation/components/FoundationClosingCta.jsx` (existing repository spelling). FoundationLayout mounts it once immediately after main and immediately before `FoundationFooter`; Donation.jsx contains no CTA duplicate. No local Donation CTA, new artwork, copy or styling was created.

Canonical artwork: `src/assets/brand/shf-footer-landscape-light.webp`, imported as `@/assets/brand/shf-footer-landscape-light.webp` and assigned through `--shf-footer-image` for a decorative CSS background. Existing file was opened for inspection and fully decoded at 1916 × 290; it depicts regional farm/fields, bridge, skyline and windmill line artwork. Original hash is unchanged. It was not replaced with Donation/Catalog photography or a plain color block.

Headline remains the shared SHFSlogan H2, two lines “Invest in People.” / “Strengthen Communities.” The canonical editorial class transforms these to the approved uppercase visual text INVEST IN PEOPLE. / STRENGTHEN COMMUNITIES., uses the existing SHF Permanent Marker font, light lettering and decorative orange SVG brush underline. Body copy remains exactly: “Support education, opportunity and community development across the Midwest. Together, we can create lasting impact.” Links remain Support SHF and Partner With Us. All meaningful copy is selectable HTML; background/arrow/underline artwork is decorative.

Styles are unchanged: foundation-closing-cta.css, shared shf-home-mock.css and foundation-slogans.css supply the existing dark charcoal/neutral appearance over canonical artwork, white headline/body, orange primary gradient, outlined secondary action and bright focus outline. No opacity/palette/spacing/type/artwork changes were made.

#### Demonstrated action integration fix

The canonical primary href stays `#/get-involved` (or the existing prefixed `${baseHref}#/get-involved`). A guarded primary-link handler now intercepts only plain activation on the current Foundation get-involved route with an existing `#make-a-gift` target and no baseHref prefix. It focuses the existing section without an automatic focus scroll, then scrolls to that section minus actual sticky-header height and 16px clearance. Reduced motion uses immediate scrolling; normal preference uses smooth scrolling. No amount, frequency or payment state is changed, and no duplicate Donation route is created.

This corrects the previous same-hash no-op when visitors activate Support SHF from the closing CTA while already on Donation. It leaves native behavior intact on other Foundation routes, for prefixed cross-app/Catalog links, modified clicks/new-tab gestures, previously prevented events, and missing-target fallback. The link remains a native anchor with its canonical href; keyboard activation is supported by its normal click event.

Partner With Us remains `#/partners` (or the existing baseHref-prefixed URL), backed by the canonical implemented PublicInfoPage partners route. No form/route duplication. The private ButtonLink helper only gained an optional click callback; its secondary behavior remains unchanged.

Before/after server-rendered canonical CTA output was compiled and compared for both empty baseHref and `/foundation.html`: **byte-identical**. This proves the integration handler did not change copy, markup, visual classes, links or artwork for Foundation or prefixed consumers.

#### Responsive / accessibility / ending transition

At 1440/1280px, canonical flex layout balances copy and actions with visible bridge/regional artwork. Existing below-1100px rules stack/wrap the inner content; below/equal 768px, headline/body/actions stack, links retain their existing 48px minimum targets and mobile background sizing retains the artwork at the bottom. At 390px, existing full-width button rules and shell constraints remain. No responsive rule changed in this task. Actual wrapping, artwork crop/contrast, focus target bounds and page overflow remain pending browser evidence.

The section has the existing accessible label “Support the Silicon Heartland Foundation,” a shared H2, meaningful native link names, decorative background/arrow/underline handling and a three-pixel light focus outline. Shared primary text stays dark navy on orange for contrast; secondary/body/headline remain light over the canonical darkened artwork. Source CSS and asset presence were verified; no rendered pixel contrast or geometry claim is made without screenshots.

FoundationLayout sequence is unchanged: main (including Trust & Transparency as Donation's last visible section) → one shared closing CTA → one shared footer. Existing closed dialog inside main does not introduce visible layout content. Actual shared-layout render tests confirm adjacency and uniqueness; no duplicate artwork region or CTA added. Existing canonical spacing is preserved; no Section 07/footer changes.

#### Fresh checks / browser limitation

| Check                                                                      | Result                                                                                                                                                                                           |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Donation closing/integration tests + canonical shared closing render tests | PASS: 6 tests via `node --test tests/foundationDonationClosingCta.test.mjs tests/foundationGlobalClosingCta.test.mjs`                                                                            |
| Donation reuse/ending                                                      | PASS actual shared-layout render: one CTA after main, one footer immediately after CTA, no page-local duplicate                                                                                  |
| Exact copy/artwork/destinations                                            | PASS render/source checks; canonical artwork fully decodes at 1916 × 290 and hash unchanged                                                                                                      |
| Support SHF same-route handler                                             | PASS real stateless-component handler invoked with bounded browser collaborators: focus existing section, correct sticky offset, normal/reduced motion and recognized query/trailing-slash forms |
| Native fallback / other consumers                                          | PASS: other route, modified click/default prevention, missing target and baseHref-prefix handling retain native links; canonical partner content exists                                          |
| Markup equivalence                                                         | PASS: byte-identical before/after renders for Foundation and `/foundation.html`-prefixed consumers                                                                                               |
| Scoped TypeScript                                                          | PASS: `./node_modules/.bin/tsc -p tests/foundation-global-cta.tsconfig.json`                                                                                                                     |
| Scoped lint                                                                | PASS: FoundationClosingCta with repository rules/available temporary lint tooling                                                                                                                |
| Formatting / whitespace                                                    | PASS modified component/new tests and `git diff --check`                                                                                                                                         |
| Scoped production build                                                    | PASS: `node docs/ui/foundation-donation/build.mjs`, 251 modules; existing empty vendor-charts warning                                                                                            |
| Browser attempt                                                            | Environmentally BLOCKED before page creation; first case failed at launch, remaining 3 did not run                                                                                               |
| Screenshots / native keyboard/focus/visual transition                      | UNVERIFIED; no final visual lock                                                                                                                                                                 |

Attempted once: `./node_modules/.bin/playwright test tests/ui/foundation-donation-closing-cta.spec.mjs --workers=1 --max-failures=1`. Chromium exited SIGTRAP with `bootstrap_check_in ... MachPortRendezvousServer ... Permission denied (1100)`. No implementation workaround for the environment restriction.

The focused browser spec covers 1440, 1280, 768, 390px, copy/artwork, both CTAs, keyboard focus, minimum target geometry, overflow, canonical ending adjacency, same-route Make a Gift focus and Partner route. Intended captures: `docs/ui/foundation-donation/screenshots/section-08/closing-1440.png`, `closing-1280.png`, `closing-768.png`, `closing-390.png`. None captured. Inspect regional artwork/contrast, handwritten headline, action alignment/mobile wrapping and Section 07/CTA/footer transitions before visual lock.

#### Scope / changed files

Only production change: shared FoundationClosingCta.jsx's guarded same-route Support SHF integration. No CSS or assets changed. New tests: `tests/foundationDonationClosingCta.test.mjs`, `tests/ui/foundation-donation-closing-cta.spec.mjs`. Documentation: this Section 08 entry.

SHA-256 comparisons confirm Sections 01–07, all Foundation styles, approved Donation images, canonical artwork, payment logic/adapter/dialog, footer, other Foundation page bodies and Catalog component/StoreCatalog consumer sources unchanged. Prefixed consumer rendered markup is also unchanged. No backend/schema/provider/dependency/image changes, commit or deployment. Remaining limitation is browser-level visual/interaction acceptance evidence.

### Section 09 — Canonical SHF Footer

Initial audit: Donation uses FoundationLayout's one shared FoundationFooter immediately after the shared closing CTA and as the shell's final child. Official SHFLogo, eight canonical links, decorative nonlinked social placeholders, exact tagline/copyright are present. All routes resolve in the Foundation app; News is an existing Reports alias, Contact an existing Support/Get involved alias. No verified social URLs exist in the component. Demonstrated accessibility gaps: the unlinked social initials are exposed as text under “Social links,” and footer nav links have no defined comfortable touch-target height. This pass will hide decorative placeholders from assistive technology and add Foundation-public-shell-scoped target/focus rules only. No visible branding/copy/route/image or other section changes planned.

**SECTION 09 — CANONICAL SHF FOOTER COMPLETE WITH VERIFIED BROWSER LIMITATION**

#### Shared footer and branding

Component: `src/foundation/layout/FoundationFooter.jsx`. Its imported integration stylesheet is `src/foundation/styles/foundation-footer.css`; existing Foundation base layout/colors/wrapping also come from foundation.css and shf-home-mock.css. FoundationLayout renders the same shared footer once immediately after FoundationClosingCta and as its final child. Donation.jsx has no local footer, Catalog footer or repeated legal strip. Actual Donation/shared-layout render confirms its footer markup equals the standalone shared footer and the shell terminates immediately after it.

Branding remains the canonical `src/components/shared/SHFLogo.jsx` with `/assets/brand/shf-official-logo.webp`, accessible alternative “Silicon Heartland Foundation,” intrinsic 1834 × 371 proportions and the existing 270px footer width. The linked brand retains the accessible name “Silicon Heartland Foundation home” and `/foundation.html` destination. Footer uses the full wordmark on mobile, not a new compact substitute. The official asset fully decodes at 1834 × 371 and is unchanged; no logo/Catalog/SHS/Metaverse substitution.

Exact canonical lower text remains unchanged:

- A stronger region. A brighter tomorrow.
- © 2026 Silicon Heartland Foundation. All rights reserved.

No dynamic date or alternate copyright wording was introduced.

#### Navigation audit

| Visible link                 | Canonical destination                            | Status                                                                                                             |
| ---------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| About                        | `#/about`                                        | Existing Foundation PublicInfoPage                                                                                 |
| Programs                     | `#/programs`                                     | Existing Foundation PublicInfoPage                                                                                 |
| Impact                       | `#impact`                                        | Existing Foundation homepage impact region, resolved by App and shared footer fragment effect                      |
| Partners                     | `#/partners`                                     | Existing Foundation PublicInfoPage                                                                                 |
| Resources                    | `#/reports`                                      | Existing public evidence/disclosure information page                                                               |
| News                         | `#/reports`                                      | Intentional canonical alias to public resources; no dedicated news feed was invented                               |
| Data Center Community Impact | `/foundation.html#/data-center-community-impact` | Existing Foundation page and registered route                                                                      |
| Contact                      | `#/get-involved`                                 | Existing canonical Support/Donation destination; no dedicated contact submission workflow is implied by this audit |

All eight hrefs remain unchanged. No dead `href="#"`, fabricated route, external social account or new page. News/Contact limitations are documented rather than relabelling or inventing destinations. Existing baseHref-prefixed consumers retain their correct canonical Foundation URLs without duplicated path segments. Brand home link stays within Foundation.

#### Social placeholders and accessibility correction

Canonical social placeholders remain visible as `in`, `yt`, `x`, `ig` spans. They have no links and no verified account destination. The wrapper now has `aria-hidden="true"` instead of the misleading “Social links” label, keeping these decorative initials out of the accessibility tree without changing appearance or fabricating social URLs. No keyboard focus target or action was invented for them.

Footer remains semantic `<footer>`, with named Foundation footer navigation, meaningful native link text and accessible official logo. Added minimum 44px link height/width and centered inline-flex alignment for comfortable tap areas, plus a strong three-pixel dark-navy focus outline. New rules are scoped to `.shf-site.shf-home-mock .shf-footer…`, the public Foundation shell. Existing Catalog `.shu-catalog` rules are unchanged; no Catalog files were edited. Shared social-placeholder semantics are corrected in the canonical component for all its consumers; visible markup/content are preserved.

Source-based normal-text contrast checks pass 4.5:1 for the canonical navy navigation, muted tagline/copyright and dark focus color against the ivory footer. Real pixel-level rendering, native focus/touch behavior and layout remain pending browser evidence.

#### Responsive layout and ending boundary

Canonical visible styling/layout remains: warm ivory surface, restrained top border, official wordmark, wrapping Foundation links and social placeholders, followed by the exact tagline/copyright row. Existing footer-inner flex-wrap is preserved. At 1440/1280px it balances/wraps branding and navigation as space permits. Existing below-1100px rules stack the inner content; below/equal 768px the link/social/bottom rows wrap and align left. At 390px the logo remains full-width within the shell, nav links have comfortable minimum targets and bottom text can wrap. No new grid, local footer, imagery, label or legal strip.

The sequence remains canonical gray closing CTA → shared footer → end of shell. Actual shared-layout render confirms one CTA/one footer, direct CTA/footer adjacency and no extra content after the footer. No closing-CTA source/style/behavior change. Actual visible spacing/overlap/artwork border continuity, mobile link wrapping and overflow need screenshots.

#### Fresh test/build/browser evidence

| Check                                                 | Result                                                                                                                                        |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Donation footer tests + canonical ending render tests | PASS: 8 tests via `node --test tests/foundationDonationFooter.test.mjs tests/foundationGlobalClosingCta.test.mjs`                             |
| Shared reuse / duplicate/footer-end guards            | PASS actual Donation/shared-layout render: exact shared footer, one footer after one CTA, no page-local footer and no shell content afterward |
| Branding/tagline/copyright/social                     | PASS exact official wordmark/path/proportions, exact canonical text, four preserved hidden decorative placeholders and no social anchors      |
| Navigation / baseHref consumers                       | PASS eight canonical route mappings, existing route/page ownership, documented News/Contact aliases and valid prefixed URLs                   |
| Accessibility/source contrast                         | PASS semantic/label/source checks, 44px minimum targets, visible dark focus rule and source palette contrast at least 4.5:1                   |
| Scoped TypeScript                                     | PASS: `./node_modules/.bin/tsc -p tests/foundation-global-cta.tsconfig.json`                                                                  |
| Scoped lint                                           | PASS: FoundationFooter with repository rules/available temporary lint tooling                                                                 |
| Formatting / whitespace                               | PASS modified component/footer stylesheet/new tests and `git diff --check`                                                                    |
| Scoped production build                               | PASS: `node docs/ui/foundation-donation/build.mjs`, 251 modules; existing empty vendor-charts warning                                         |
| Browser attempt                                       | Environmentally BLOCKED before page creation; first case failed at launch, remaining 3 did not run                                            |
| Native links/keyboard/geometry/screenshots            | UNVERIFIED; no final visual lock                                                                                                              |

Attempted once: `./node_modules/.bin/playwright test tests/ui/foundation-donation-footer.spec.mjs --workers=1 --max-failures=1`. Chromium exited SIGTRAP with `bootstrap_check_in ... MachPortRendezvousServer ... Permission denied (1100)`. No source workaround for unavailable browser execution.

The focused browser spec covers 1440/1280/768/390px, logo loading, exact text, social semantics, eight links/Enter destinations, focus outlines, target bounds, overflow, one contentinfo landmark and CTA/footer/end adjacency. Intended captures: `docs/ui/foundation-donation/screenshots/section-09/footer-1440.png`, `footer-1280.png`, `footer-768.png`, `footer-390.png`. None captured. Inspect branding scale, navigation wrap, tagline/copyright, focus/touch geometry and CTA/footer transition before final visual lock.

#### Scope / changed files

Production changes: only FoundationFooter.jsx (decorative social semantics) and Foundation-specific accessibility rules appended to foundation-footer.css. New tests: `tests/foundationDonationFooter.test.mjs`, `tests/ui/foundation-donation-footer.spec.mjs`. Documentation: this Section 09 entry. Existing non-Foundation-specific/Catalog rules in the footer stylesheet were compared and are unchanged.

SHA-256 comparison confirms Sections 01–08, donation images/controls, payment adapter/dialog, canonical closing component/artwork, other Foundation page bodies, official logo files and Catalog component/StoreCatalog sources unchanged. No backend/schema/provider/dependency/image changes, commit or deployment. Remaining limitations are native browser verification and the existing informational News/Contact destinations; no missing resources or social accounts were invented.

### Final Production Readiness Audit — SHF-DONATION-FINAL-READINESS-001

Current full report: [FINAL_PRODUCTION_READINESS.md](FINAL_PRODUCTION_READINESS.md).

The integrated focused suite passes 58/58 tests. All nine approved photographs fully decode, match the recorded hashes and return exact HTTP 200 asset bytes. Three scoped TypeScript configurations, lint, scoped formatting and the Foundation production compilation pass. Five unchanged shared files retain pre-existing Prettier drift, documented as non-blocking. One demonstrated large-amount display discrepancy was regression-tested and corrected without changing parsing, provider-unavailable behavior, copy or payment processing.

Chromium was attempted once and failed before page creation with the same macOS MachPortRendezvousServer Permission denied (1100) error. No final screenshots, live keyboard/focus lifecycle or visual lock are claimed. Sections 01–09 retain COMPLETE WITH VERIFIED BROWSER LIMITATION status. The page is ready for public informational use within that evidence boundary; accepting real donations requires a verified approved provider. No approved image, CSS, backend, Catalog, other page body, commit or deployment changed during the final audit. The report lists the exact eight files created/modified by this pass and all executed checks/remaining classifications.
