# Silicon Heartland Universe — Approved Asset Manifest V1

**Status:** Production authority  
**Version:** 1.1  
**Date:** August 1, 2026  
**Scope:** 32-scene cinematic landing experience

## 1. Authority and non-drift rule

This manifest controls the identity, role, order, and acceptance state of every approved visual scene. The approved pixels remain the visual authority. Implementers must not regenerate, reinterpret, relabel, recolor, crop destructively, or substitute a scene without written approval.

The approved scene files have now been reconciled against the chronological render history and bound to canonical production filenames. Original generated files remain preserved as immutable provenance sources. Nine superseded alternatives or rejected correction drafts were excluded. Every bound row records the approved source render, canonical master, dimensions, byte size, and SHA-256 in the binding ledger below.

## 2. Global visual lock

- Style: premium monochrome, photorealistic cinematic 3D.
- Lighting: physically coherent upper-right key light across the journey.
- Space: deep black, realistic stars, restrained nebula atmosphere, natural depth.
- Motion language: slow, deliberate, monumental; no arcade or theme-park motion.
- SHF Earth: living continuity anchor.
- SHS spacecraft: purposeful traveler and SHS identity symbol.
- Independence: BOS, AOS, Open Autonomous Standard, Autonomous Registry, and Autonomous Trust Bureau remain distinct destinations; visual connection never implies ownership.
- Prohibited: colorful fantasy rendering, generic sci-fi dashboards, dense card walls, decorative data, duplicate labels, fake logos, excessive glow, low-resolution crops.
- UI copy must be rendered as live HTML wherever possible. Architectural labels approved inside scene art remain part of the approved pixels.

## 3. Canonical delivery specification

| Property | Required standard |
|---|---|
| Master format | Lossless PNG or visually lossless AVIF master |
| Production derivatives | AVIF primary, WebP fallback, PNG only when transparency or fidelity requires it |
| Master aspect ratio | 16:9 unless the approved source establishes another ratio |
| Minimum master size | 3840 × 2160 preferred; never upscale a low-resolution source as the archival master |
| Color space | sRGB |
| Naming | `shu-sNN-short-slug-v01.ext` |
| Integrity | SHA-256 recorded after canonical ingest |
| Responsive use | Art-directed crop rules; never stretch |
| Text safety | Approved destination names readable at phone size where the scene contains a label |

## 4. Scene manifest

The first fourteen working titles preserve the approved journey positions but must be reconciled against the actual approved files during ingest. Scenes 15–32 follow the locked destination sequence and approved naming decisions.

| ID | Canonical working title | Journey role | Text inside approved art | Canonical filename | State |
|---:|---|---|---|---|---|
| 01 | Universe arrival | Establish the Silicon Heartland Universe | None | `shu-s01-universe-arrival-v01.png` | BOUND_AND_VERIFIED |
| 02 | Universe institutional reveal | Present the primary universe entry state | Approved interface copy only | `shu-s02-universe-interface-v01.png` | BOUND_AND_VERIFIED |
| 03 | Journey toward BOS | Begin BOS route from the universe | None | `shu-s03-bos-journey-v01.png` | BOUND_AND_VERIFIED |
| 04 | Focused BOS arrival | Establish BOS world at close range | Approved architectural identity if present | `shu-s04-bos-arrival-v01.png` | BOUND_AND_VERIFIED |
| 05 | BOS gateway entry | Transform BOS world into its entry passage | None | `shu-s05-bos-gateway-v01.png` | BOUND_AND_VERIFIED |
| 06 | Arrival inside BOS | Reveal the BOS destination interior | Approved BOS identity | `shu-s06-bos-interior-v01.png` | BOUND_AND_VERIFIED |
| 07 | BOS institutional interface | Present minimal BOS entry controls | Approved BOS interface copy | `shu-s07-bos-interface-v01.png` | BOUND_AND_VERIFIED |
| 08 | Return from BOS | Rejoin the universe and establish AOS route | None | `shu-s08-bos-return-v01.png` | BOUND_AND_VERIFIED |
| 09 | Journey toward AOS | Reveal AOS as the agent-side operating world | None | `shu-s09-aos-journey-v01.png` | BOUND_AND_VERIFIED |
| 10 | Focused AOS arrival | Establish AOS world at close range | Approved architectural identity if present | `shu-s10-aos-arrival-v01.png` | BOUND_AND_VERIFIED |
| 11 | AOS gateway entry | Transform the AOS world into its passage | None | `shu-s11-aos-gateway-v01.png` | BOUND_AND_VERIFIED |
| 12 | Arrival inside AOS | Reveal the AOS destination interior | Approved AOS identity | `shu-s12-aos-interior-v01.png` | BOUND_AND_VERIFIED |
| 13 | AOS institutional interface | Present minimal AOS entry controls | Approved AOS interface copy | `shu-s13-aos-interface-v01.png` | BOUND_AND_VERIFIED |
| 14 | Return from AOS | Rejoin the universe and establish standards route | None | `shu-s14-aos-return-v01.png` | BOUND_AND_VERIFIED |
| 15 | Journey toward Open Autonomous Standard | Reveal the independent standards world | None | `shu-s15-oas-journey-v01.png` | BOUND_AND_VERIFIED |
| 16 | Focused standards arrival | Establish monumental lunar standards terrain | None | `shu-s16-oas-arrival-v01.png` | BOUND_AND_VERIFIED |
| 17 | Standards gateway entry | Enter through geometric verification pathways | None | `shu-s17-oas-gateway-v01.png` | BOUND_AND_VERIFIED |
| 18 | Arrival inside Open Autonomous Standard | Reveal lunar constitutional foundation | **OPEN AUTONOMOUS STANDARD** | `shu-s18-oas-interior-v01.png` | BOUND_AND_VERIFIED |
| 19 | Open Autonomous Standard interface | Present the approved institutional entry | **OPEN AUTONOMOUS STANDARD**; **ENTER STANDARD**; **RETURN TO UNIVERSE**; **VERIFICATION ACTIVE · STANDARD ALIGNED** | `shu-s19-oas-interface-v01.png` | BOUND_AND_VERIFIED |
| 20 | Return from Open Autonomous Standard | Reverse through precision gateway toward Registry | None | `shu-s20-oas-return-v01.png` | BOUND_AND_VERIFIED |
| 21 | Journey toward Autonomous Registry | First full reveal of independent Registry world | None | `shu-s21-registry-journey-v01.png` | BOUND_AND_VERIFIED |
| 22 | Focused Autonomous Registry arrival | Reveal indexed terrain and record channels | None | `shu-s22-registry-arrival-v01.png` | BOUND_AND_VERIFIED |
| 23 | Autonomous Registry gateway entry | Align indexed bands into archive passage | None | `shu-s23-registry-gateway-v01.png` | BOUND_AND_VERIFIED |
| 24 | Arrival inside Autonomous Registry | Reveal monumental organized record environment | **AUTONOMOUS REGISTRY** | `shu-s24-registry-interior-v01.png` | BOUND_AND_VERIFIED |
| 25 | Autonomous Registry interface | Present the approved institutional entry | **AUTONOMOUS REGISTRY**; **ENTER REGISTRY**; **RETURN TO UNIVERSE**; **REGISTRATION ACTIVE · PROVENANCE VERIFIED** | `shu-s25-registry-interface-v01.png` | BOUND_AND_VERIFIED |
| 26 | Return from Autonomous Registry | Reverse through archive lanes toward Trust Bureau | None | `shu-s26-registry-return-v01.png` | BOUND_AND_VERIFIED |
| 27 | Journey toward Autonomous Trust Bureau | First full reveal of independent Bureau world | None | `shu-s27-bureau-journey-v01.png` | BOUND_AND_VERIFIED |
| 28 | Focused Autonomous Trust Bureau arrival | Reveal balanced assessment architecture | **AUTONOMOUS TRUST BUREAU**, large and phone-readable | `shu-s28-bureau-arrival-v01.png` | BOUND_AND_VERIFIED |
| 29 | Autonomous Trust Bureau gateway entry | Form balanced evidence-driven passage | None | `shu-s29-bureau-gateway-v01.png` | BOUND_AND_VERIFIED |
| 30 | Arrival inside Autonomous Trust Bureau | Reveal symmetrical evidence-assessment chamber | **AUTONOMOUS TRUST BUREAU**, large and phone-readable | `shu-s30-bureau-interior-v01.png` | BOUND_AND_VERIFIED |
| 31 | Autonomous Trust Bureau interface | Present the approved institutional entry | **AUTONOMOUS TRUST BUREAU**; **ENTER BUREAU**; **RETURN TO UNIVERSE**; **ASSESSMENT ACTIVE · TRUST VERIFIED** | `shu-s31-bureau-interface-v01.png` | BOUND_AND_VERIFIED |
| 32 | Final return to Silicon Heartland Universe | Restore reusable master universe view | None | `shu-s32-universe-return-v01.png` | BOUND_AND_VERIFIED |

## 5. Destination identity locks

The complete source-to-canonical mapping, dimensions, byte sizes, and integrity hashes are recorded in `SILICON_HEARTLAND_UNIVERSE_ASSET_BINDING_LEDGER_V1.md`.

| Destination | Strategic identity | Must not be presented as |
|---|---|---|
| SHS BOS | Business Operating System | Owner of all other worlds |
| AOS | Autonomous Operating System | The Open Autonomous Standard |
| Open Autonomous Standard | Neutral constitutional standards foundation | “Agent Standard” as its official name; part of BOS or AOS |
| Autonomous Registry | Independent registration, identity, provenance, and traceability authority | A BOS/AOS database or marketplace |
| Autonomous Trust Bureau | Independent assessment, evidence, trust, and reporting authority | A Registry feature or BOS scoring widget |

## 6. Ingest checklist for every scene

1. Match the file visually to the approved conversation image.
2. Reject drafts, unlabeled replacements, unreadable-label versions, and images containing unapproved copy.
3. Rename to the canonical filename while retaining the original extension.
4. Record pixel dimensions, aspect ratio, byte size, and SHA-256.
5. Create desktop, tablet, and mobile derivatives without destructive cropping.
6. Compare derivatives to the approved master at 100% and at phone size.
7. Change state to `BOUND_AND_VERIFIED` only after a human visual check.

## 7. Definition of ready

The visual asset package is implementation-ready only when all 32 rows are `BOUND_AND_VERIFIED`, hashes are recorded, required responsive derivatives exist, and no scene relies on an unapproved regeneration.
