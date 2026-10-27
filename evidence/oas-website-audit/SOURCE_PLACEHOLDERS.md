# Source placeholders and unfinished code

136 matched lines in the bounded OAS pages/components/styles/HTML/entries. This count includes historical comments, helper definitions/imports and legitimate disabled states; it is **not** a count of 136 missing features. No lorem ipsum, TODO/FIXME task stub or empty business handler was found in the active OAS surface. Data is static explanatory copy rather than mocked authoritative evidence.

Rendered disabled-item counts: Home 19, Standard 25, Domains 20, Purpose 20, Risk 20 (includes shared footer/header duplication). All PlannedItem elements are aria-disabled spans without href; ActionRow always renders a disabled span even when its Coming Soon badge is absent. This produces active-looking specification/schema rows without working actions.

Historical Phase 1/placeholder comments around the flywheel and hero motion conflict with completed runtime visuals; classify them as stale documentation, not automatic missing implementation. The homepage Why OAS rectangle is actually empty; source and screenshot agree. Hand-authored R0–R4/detailed domain copy requires release-scope review; it is not a frozen artifact import. Static Working Draft/Public Review text is obsolete relative to final 1.0.

| Source | Classification | Matched text |
| --- | --- | --- |
| `src/pages/oas/OAS1Page.jsx:13` | Historical/source comment; validate against rendered result | // Claims discipline: OAS-1 is a Public Working Draft only. No |
| `src/pages/oas/OAS1Page.jsx:17` | Historical/source comment; validate against rendered result | // rendered as non-interactive (no href, aria-disabled) because no such |
| `src/pages/oas/OAS1Page.jsx:19` | Historical/source comment; validate against rendered result | // schema, no full-spec page anywhere in the repo). The approved mock |
| `src/pages/oas/OAS1Page.jsx:26` | Helper/import; not itself a missing feature | import { VenusMark, PlannedItem, AnchorLink, OASFooter } from "./oasShared.jsx"; |
| `src/pages/oas/OAS1Page.jsx:39` | Historical/source comment; validate against rendered result | // The approved mock shows a 10-line preview of the 14-section spec |
| `src/pages/oas/OAS1Page.jsx:44` | Historical/source comment; validate against rendered result | // (Risk/Conformance/Schemas are already in the header nav as planned |
| `src/pages/oas/OAS1Page.jsx:66` | Obsolete release presentation | { label: "Status", value: "Public Review", icon: "clock" }, |
| `src/pages/oas/OAS1Page.jsx:78` | Historical/source comment; validate against rendered result | // Measured against the approved mock: icons there render ~24px with a |
| `src/pages/oas/OAS1Page.jsx:145` | Intentional disabled feature/access placeholder | function ActionRow({ icon, title, comingSoon, description }) { |
| `src/pages/oas/OAS1Page.jsx:147` | Intentional disabled feature/access placeholder | <span className="oas1-action" aria-disabled="true" title="Coming soon — this file does not exist yet"> |
| `src/pages/oas/OAS1Page.jsx:152` | Intentional disabled feature/access placeholder | {comingSoon && <span className="oas1-action__badge">Coming Soon</span>} |
| `src/pages/oas/OAS1Page.jsx:208` | Intentional disabled feature/access placeholder | <PlannedItem>Control Domains</PlannedItem> |
| `src/pages/oas/OAS1Page.jsx:209` | Intentional disabled feature/access placeholder | <PlannedItem>Risk</PlannedItem> |
| `src/pages/oas/OAS1Page.jsx:210` | Intentional disabled feature/access placeholder | <PlannedItem>Conformance</PlannedItem> |
| `src/pages/oas/OAS1Page.jsx:211` | Intentional disabled feature/access placeholder | <PlannedItem>Schemas</PlannedItem> |
| `src/pages/oas/OAS1Page.jsx:212` | Intentional disabled feature/access placeholder | <PlannedItem>Implementation</PlannedItem> |
| `src/pages/oas/OAS1Page.jsx:276` | Obsolete release presentation | alt="OAS-1 publication cover: a cream book with the Venus mark, titled 'OAS-1, Open Autonomous Standard,' reading 'A more trustworthy AI future,' with a warm bronze planetary sweep across the lower-right corner, labeled Public Working Draft, Version 1.0, resting against a second volume." |
| `src/pages/oas/OAS1Page.jsx:306` | runtime content/style or implementation | section, per the approved mock — not three stacked sections. Each |
| `src/pages/oas/OAS1Page.jsx:355` | runtime content/style or implementation | <div className="oas1-textlink oas1-textlink--planned"> |
| `src/pages/oas/OAS1Page.jsx:356` | Intentional disabled feature/access placeholder | <PlannedItem>View Full Table of Contents →</PlannedItem> |
| `src/pages/oas/OAS1Page.jsx:371` | Intentional disabled feature/access placeholder | <ActionRow icon="download" title="Download PDF" comingSoon description="A printable version of the OAS-1 standard." /> |
| `src/pages/oas/oas-purpose-boundaries.css:92` | runtime content/style or implementation | .oaspb .oas-header__nav button.oas__planned { |
| `src/pages/oas/oas-purpose-boundaries.css:145` | Historical/source comment; validate against rendered result | /* Trimmed from 36px 0 40px: with the emblem placeholder at its own |
| `src/pages/oas/oas-purpose-boundaries.css:272` | runtime content/style or implementation | earlier phase reserved (target, placeholder, or otherwise), so hero |
| `src/pages/oas/oas-purpose-boundaries.css:707` | runtime content/style or implementation | copy and easing away by the time the placeholder begins. */ |
| `src/pages/oas/oas-risk-classification.css:92` | runtime content/style or implementation | .oasrc .oas-header__nav button.oas__planned { |
| `src/pages/oas/oas-risk-classification.css:108` | Historical/source comment; validate against rendered result | /* A disabled-looking button (wrapped in PlannedItem) never receives a |
| `src/pages/oas/oas-risk-classification.css:110` | runtime content/style or implementation | .oas__planned .oasrc-btn--rust { |
| `src/pages/oas/oas-risk-classification.css:313` | Historical/source comment; validate against rendered result | /* x/y positions tuned against the actual asset via pixel-sampled |
| `src/pages/oas/oas-risk-classification.css:420` | runtime content/style or implementation | the Phase 1 placeholder used (identical aspect-ratio/max-height), so |
| `src/pages/oas/oas-risk-classification.css:475` | runtime content/style or implementation | unlike e.g. the hero visual placeholder elsewhere on this page. */ |
| `src/pages/oas/oas-risk-classification.css:1135` | runtime content/style or implementation | second line at this width — without this, the "Coming Soon" badge |
| `src/pages/oas/OASControlDomainsPage.jsx:12` | Historical/source comment; validate against rendered result | // The flywheel is a placeholder (FlywheelPlaceholder below) reserving |
| `src/pages/oas/OASControlDomainsPage.jsx:23` | Helper/import; not itself a missing feature | import { VenusMark, PlannedItem, AnchorLink, OASFooter } from "./oasShared.jsx"; |
| `src/pages/oas/OASControlDomainsPage.jsx:97` | Historical/source comment; validate against rendered result | // approved mock's exact placement (top, then clockwise). |
| `src/pages/oas/OASControlDomainsPage.jsx:158` | Historical/source comment; validate against rendered result | // 45deg clockwise — matches the approved mock's exact node order and |
| `src/pages/oas/OASControlDomainsPage.jsx:173` | Historical/source comment; validate against rendered result | // positions on .oascd-flywheel (measured against the approved mock: |
| `src/pages/oas/OASControlDomainsPage.jsx:405` | Intentional disabled feature/access placeholder | <PlannedItem>Risk</PlannedItem> |
| `src/pages/oas/OASControlDomainsPage.jsx:406` | Intentional disabled feature/access placeholder | <PlannedItem>Conformance</PlannedItem> |
| `src/pages/oas/OASControlDomainsPage.jsx:407` | Intentional disabled feature/access placeholder | <PlannedItem>Schemas</PlannedItem> |
| `src/pages/oas/OASControlDomainsPage.jsx:408` | Intentional disabled feature/access placeholder | <PlannedItem>Implementation</PlannedItem> |
| `src/pages/oas/OASControlDomainsPage.jsx:445` | Historical/source comment; validate against rendered result | {/* Quiet right-margin micro-copy from the approved mock — a |
| `src/pages/oas/OASControlDomainsPage.jsx:481` | runtime content/style or implementation | A shared standard for a more open future. <span aria-hidden="true">→</span> |
| `src/pages/oas/oas-landing.css:80` | runtime content/style or implementation | .oas__planned { |
| `src/pages/oas/oas-landing.css:154` | runtime content/style or implementation | .oas-header__nav button.oas__planned { |
| `src/pages/oas/oas-landing.css:233` | Historical/source comment; validate against rendered result | /* Full-bleed dark cinematic hero per the approved Home mock — a |
| `src/pages/oas/oas-landing.css:237` | runtime content/style or implementation | dark area reserved for the future planet/atmosphere art — no CSS- |
| `src/pages/oas/oas-landing.css:296` | runtime content/style or implementation | right edge, matching the mock's full-bleed composition. */ |
| `src/pages/oas/oas-landing.css:339` | Historical/source comment; validate against rendered result | /* Neutral placeholder for the future planet/atmosphere art — no |
| `src/pages/oas/oas-landing.css:341` | runtime content/style or implementation | so there's no visible "placeholder box" seam against the copy |
| `src/pages/oas/oas-landing.css:366` | runtime content/style or implementation | the mock. */ |
| `src/pages/oas/oas-landing.css:414` | runtime content/style or implementation | is a plain neutral placeholder (Phase 1: no final institutional |
| `src/pages/oas/oas-landing.css:617` | Historical/source comment; validate against rendered result | /* Phase 1: flat dark placeholder, no final landscape art yet. */ |
| `src/pages/oas/oas-landing.css:699` | runtime content/style or implementation | .oas-footer__col .oas__planned { |
| `src/pages/oas/oas-landing.css:808` | Historical/source comment; validate against rendered result | /* Mobile hero: single column, art placeholder moves below copy |
| `src/pages/oas/oas1-page.css:4` | runtime content/style or implementation | .oas__eyebrow / .oas__rule / .oas__container / .oas__planned are all |
| `src/pages/oas/oas1-page.css:13` | runtime content/style or implementation | landing page's gold/amber-led palette, per the approved OAS-1 mock. |
| `src/pages/oas/oas1-page.css:52` | Historical/source comment; validate against rendered result | /* Measured against the approved mock: header total height there is |
| `src/pages/oas/oas1-page.css:56` | runtime content/style or implementation | excess "air" above/below the row rather than the mock's tighter |
| `src/pages/oas/oas1-page.css:73` | runtime content/style or implementation | (oas-landing.css) reads slightly looser than the mock's own ~26-28px |
| `src/pages/oas/oas1-page.css:111` | Intentional disabled feature/access placeholder | PlannedItems alike — recedes to one warm gray-brown so the active |
| `src/pages/oas/oas1-page.css:114` | runtime content/style or implementation | .oas1 .oas-header__nav button.oas__planned { |
| `src/pages/oas/oas1-page.css:122` | runtime content/style or implementation | hero's primary CTA, matching the mock's filled rust/orange button |
| `src/pages/oas/oas1-page.css:235` | runtime content/style or implementation | bottom edge (matching the mock) instead of floating mid-air with |
| `src/pages/oas/oas1-page.css:253` | runtime content/style or implementation | ~330-365px range the approved mock shows; no border-radius, no |
| `src/pages/oas/oas1-page.css:271` | Historical/source comment; validate against rendered result | /* A small decorative word-stack echoing the approved mock's far-right |
| `src/pages/oas/oas1-page.css:327` | runtime content/style or implementation | directly against the approved mock (icon glyphs there render ~23-25px |
| `src/pages/oas/oas1-page.css:364` | runtime content/style or implementation | columns side by side, matching the approved mock's horizontal |
| `src/pages/oas/oas1-page.css:365` | runtime content/style or implementation | density. Proportions are 32% / 31% / 37% per the mock. */ |
| `src/pages/oas/oas1-page.css:469` | runtime content/style or implementation | .oas1-textlink--planned { |
| `src/pages/oas/oas1-page.css:698` | runtime content/style or implementation | mock's horizontal density is a desktop-only composition. */ |
| `src/pages/oas/OASRiskClassificationPage.jsx:11` | Historical/source comment; validate against rendered result | // for how it's integrated) rather than a placeholder. |
| `src/pages/oas/OASRiskClassificationPage.jsx:33` | Helper/import; not itself a missing feature | import { VenusMark, PlannedItem, AnchorLink, OASFooter } from "./oasShared.jsx"; |
| `src/pages/oas/OASRiskClassificationPage.jsx:218` | Intentional disabled feature/access placeholder | <PlannedItem>Conformance</PlannedItem> |
| `src/pages/oas/OASRiskClassificationPage.jsx:219` | Intentional disabled feature/access placeholder | <PlannedItem>Schemas</PlannedItem> |
| `src/pages/oas/OASRiskClassificationPage.jsx:220` | Intentional disabled feature/access placeholder | <PlannedItem>Implementation</PlannedItem> |
| `src/pages/oas/OASRiskClassificationPage.jsx:274` | Historical/source comment; validate against rendered result | {/* Reserves the same footprint the Phase 1 placeholder used |
| `src/pages/oas/OASRiskClassificationPage.jsx:276` | runtime content/style or implementation | the background art fills this area, the placeholder's |
| `src/pages/oas/OASRiskClassificationPage.jsx:415` | runtime content/style or implementation | safer, more open future. |
| `src/pages/oas/OASRiskClassificationPage.jsx:422` | Intentional disabled feature/access placeholder | PlannedItem) — flagged the same way OAS1Page flags its |
| `src/pages/oas/OASRiskClassificationPage.jsx:425` | Intentional disabled feature/access placeholder | <PlannedItem> |
| `src/pages/oas/OASRiskClassificationPage.jsx:428` | runtime content/style or implementation | <span className="oasrc-cta__badge">Coming Soon</span> |
| `src/pages/oas/OASRiskClassificationPage.jsx:430` | Intentional disabled feature/access placeholder | </PlannedItem> |
| `src/pages/oas/OASPurposeBoundariesPage.jsx:39` | Helper/import; not itself a missing feature | import { VenusMark, PlannedItem, AnchorLink, OASFooter } from "./oasShared.jsx"; |
| `src/pages/oas/OASPurposeBoundariesPage.jsx:201` | Intentional disabled feature/access placeholder | <PlannedItem>Risk</PlannedItem> |
| `src/pages/oas/OASPurposeBoundariesPage.jsx:202` | Intentional disabled feature/access placeholder | <PlannedItem>Conformance</PlannedItem> |
| `src/pages/oas/OASPurposeBoundariesPage.jsx:203` | Intentional disabled feature/access placeholder | <PlannedItem>Schemas</PlannedItem> |
| `src/pages/oas/OASPurposeBoundariesPage.jsx:204` | Intentional disabled feature/access placeholder | <PlannedItem>Implementation</PlannedItem> |
| `src/pages/oas/oas-control-domains.css:73` | runtime content/style or implementation | .oascd .oas-header__nav button.oas__planned { |
| `src/pages/oas/oas-control-domains.css:235` | runtime content/style or implementation | FRAMEWORK" in the hero's upper third per the approved mock, roughly |
| `src/pages/oas/oas-control-domains.css:267` | runtime content/style or implementation | against the approved hero mock (there, the node-center orbit sits at |
| `src/pages/oas/oas-control-domains.css:356` | runtime content/style or implementation | approved mock's own corner dots — restrained (two only). */ |
| `src/pages/oas/oas-control-domains.css:681` | runtime content/style or implementation | Quiet decorative typographic flourish from the approved mock — same |
| `src/pages/oas/oas-control-domains.css:808` | runtime content/style or implementation | precisely (a minmax+1fr track left this closer to the mock by |
| `src/pages/oas/OASLandingPage.jsx:21` | Historical/source comment; validate against rendered result | // does not, it renders as non-interactive text via <PlannedItem>, per |
| `src/pages/oas/OASLandingPage.jsx:26` | Helper/import; not itself a missing feature | import { VenusMark, PlannedItem, AnchorLink, OASFooter } from "./oasShared.jsx"; |
| `src/pages/oas/OASLandingPage.jsx:204` | Intentional disabled feature/access placeholder | <PlannedItem>Conformance</PlannedItem> |
| `src/pages/oas/OASLandingPage.jsx:205` | Intentional disabled feature/access placeholder | <PlannedItem>Schemas</PlannedItem> |
| `src/pages/oas/OASLandingPage.jsx:206` | Intentional disabled feature/access placeholder | <PlannedItem>Implementation</PlannedItem> |
| `src/pages/oas/OASLandingPage.jsx:220` | Historical/source comment; validate against rendered result | {/* Full-bleed dark cinematic hero per the approved Home mock. |
| `src/pages/oas/OASLandingPage.jsx:222` | runtime content/style or implementation | unstyled dark area reserving space for the future planet/ |
| `src/pages/oas/OASLandingPage.jsx:225` | runtime content/style or implementation | placeholder rather than being baked into art. */} |
| `src/pages/oas/OASLandingPage.jsx:246` | runtime content/style or implementation | future for |
| `src/pages/oas/OASLandingPage.jsx:270` | runtime content/style or implementation | <span>Future</span> |
| `src/pages/oas/OASLandingPage.jsx:279` | runtime content/style or implementation | <p className="oas-hero-strip__statement">A shared standard. A safer, more open future.</p> |
| `src/pages/oas/OASLandingPage.jsx:290` | runtime content/style or implementation | architecture image yet (Phase 1: neutral placeholder only). */} |
| `src/pages/oas/OASLandingPage.jsx:296` | runtime content/style or implementation | A shared foundation for a more trustworthy AI future. |
| `src/pages/oas/OASLandingPage.jsx:399` | Historical/source comment; validate against rendered result | {/* Phase 1: flat dark placeholder, no final landscape art yet. */} |
| `src/pages/oas/OASLandingPage.jsx:402` | runtime content/style or implementation | <h2 id="oas-opportunity-heading">A more trustworthy autonomous future starts with shared rules.</h2> |
| `src/pages/oas/oasShared.jsx:3` | Historical/source comment; validate against rendered result | // landing page, OAS-1, and any future OAS document page) so they don't |
| `src/pages/oas/oasShared.jsx:5` | Historical/source comment; validate against rendered result | // class names (.oas-venus-mark, .oas__planned), not on any page-specific |
| `src/pages/oas/oasShared.jsx:24` | Helper/import; not itself a missing feature | export function PlannedItem({ children }) { |
| `src/pages/oas/oasShared.jsx:26` | Intentional disabled feature/access placeholder | <span className="oas__planned" aria-disabled="true" title="Planned — not yet published"> |
| `src/pages/oas/oasShared.jsx:55` | runtime content/style or implementation | A more trustworthy AI future. |
| `src/pages/oas/oasShared.jsx:66` | Intentional disabled feature/access placeholder | <PlannedItem>Principles</PlannedItem> |
| `src/pages/oas/oasShared.jsx:72` | Intentional disabled feature/access placeholder | <PlannedItem>News</PlannedItem> |
| `src/pages/oas/oasShared.jsx:84` | Intentional disabled feature/access placeholder | <PlannedItem>Specification</PlannedItem> |
| `src/pages/oas/oasShared.jsx:87` | Intentional disabled feature/access placeholder | <PlannedItem>Schemas</PlannedItem> |
| `src/pages/oas/oasShared.jsx:90` | Intentional disabled feature/access placeholder | <PlannedItem>Conformance</PlannedItem> |
| `src/pages/oas/oasShared.jsx:99` | Intentional disabled feature/access placeholder | <PlannedItem>Implementation Guides</PlannedItem> |
| `src/pages/oas/oasShared.jsx:102` | Intentional disabled feature/access placeholder | <PlannedItem>Developer Resources</PlannedItem> |
| `src/pages/oas/oasShared.jsx:105` | Intentional disabled feature/access placeholder | <PlannedItem>Use Cases</PlannedItem> |
| `src/pages/oas/oasShared.jsx:108` | Intentional disabled feature/access placeholder | <PlannedItem>FAQ</PlannedItem> |
| `src/pages/oas/oasShared.jsx:117` | Intentional disabled feature/access placeholder | <PlannedItem>Process</PlannedItem> |
| `src/pages/oas/oasShared.jsx:120` | Intentional disabled feature/access placeholder | <PlannedItem>Public Comment</PlannedItem> |
| `src/pages/oas/oasShared.jsx:123` | Intentional disabled feature/access placeholder | <PlannedItem>Version History</PlannedItem> |
| `src/pages/oas/oasShared.jsx:126` | Intentional disabled feature/access placeholder | <PlannedItem>Contact</PlannedItem> |
| `src/pages/oas/oasShared.jsx:142` | Obsolete release presentation | <span>© {YEAR} Open Autonomous Standard. Public Working Draft — OAS-1.</span> |
| `src/pages/oas/oasShared.jsx:144` | Intentional disabled feature/access placeholder | <PlannedItem>Privacy</PlannedItem> |
| `src/pages/oas/oasShared.jsx:145` | Intentional disabled feature/access placeholder | <PlannedItem>Terms</PlannedItem> |
| `src/pages/oas/oasShared.jsx:146` | Intentional disabled feature/access placeholder | <PlannedItem>Accessibility</PlannedItem> |
| `src/pages/oas/OASPurposeBoundariesLowerMotion.jsx:43` | Historical/source comment; validate against rendered result | // Piecewise-linear curve sampled at a handful of control points, both |
| `src/pages/oas/OASPurposeBoundariesLowerMotion.jsx:47` | runtime content/style or implementation | function sampleCurve(points, t) { |
| `src/pages/oas/OASPurposeBoundariesLowerMotion.jsx:231` | runtime content/style or implementation | const shape = sampleCurve(H_CURVE, p.x / width) * sampleCurve(V_CURVE, p.y / height); |
| `oas-1.html:7` | Obsolete release presentation | <meta name="description" content="OAS-1 — the Open Autonomous Standard's public working draft specification for autonomous agent identity, authority, interoperability, safety, evidence, and lifecycle governance." /> |
| `oas.html:7` | Obsolete release presentation | <meta name="description" content="Open Autonomous Standard (OAS) — a public working draft standard for autonomous agent identity, authority, interoperability, safety, evidence, and lifecycle governance." /> |
