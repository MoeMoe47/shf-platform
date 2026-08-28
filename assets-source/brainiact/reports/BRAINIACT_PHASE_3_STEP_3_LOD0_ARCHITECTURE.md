# Brainiact — Phase 3, Step 3: Structural Separation & LOD0 Retopology Architecture

**Scope:** planning only — no retopology, remeshing, decimation, rigging, or export happened this step. All geometry inspection was read-only against the certified Step 2 state (`assets-source/brainiact/blender/BRAINIACT_RETOPOLOGY_WORKING.blend`, 1,015,656 / 3,012,575 / 1,996,973 verts/edges/faces, 54 islands) and produced no file changes.
**Depends on:** `BRAINIACT_PHASE_3_STEP_1_WORKING_ENVIRONMENT.md`, `BRAINIACT_PHASE_3_STEP_2_CLEANUP_REPORT.md`, `BRAINIACT_ISLAND_MAP.md`/`.json`, `BRAINIACT_PHASE_2_STRUCTURE_AND_RETOPOLOGY_PLAN.md`, `BRAINIACT_PHASE_2_1_UNKNOWN_ISLAND_RESOLUTION.md`.
**Coordinate convention (carried from Phase 2 §5, unchanged):** Z-up, front-facing −Y, character's own right ≈ world −X, left ≈ world +X (derived, medium confidence).

---

## 1. Preflight

Master checksum (`d669f27b25d3a91812057245fdc316fd053bf6425ffa20321455339ccbd2d387`) and Phase 2 working-blend checksum (`e44c6960b5fcf76c15275935dcb7e61bcd1f70ce6c9b41c5d9cf9f4778b49858`) both verified unchanged. `BRAINIACT_LOD0_WORKING` verified at exactly the certified Step 2 state (1,015,656 verts / 3,012,575 edges / 1,996,973 faces) before any inspection. All inspection used a disposable in-memory `bmesh` copy (BFS island scan + centroid matching); nothing was written back or saved.

## 2. The 54 Post-Cleanup Islands, Mapped

Every one of the 54 islands was matched to its certified Phase 2 island ID by nearest centroid (all matches landed within 0.07 mm — unambiguous). 53 matched a `classified` region exactly; 1 (773 faces) matched a former debris ID (59) and has no classified region — this is the ambiguous cluster Step 2 deliberately preserved (see §11).

| Old ID | Region | Faces | Production object | Rig class | Treatment | Priority | Confidence |
|---:|---|---:|---|---|---|---|---|
| 0,5,6,8,9,17 | Brain crown | 483,988 | **HEAD** (merged with face, §3) | Rigid | Preserve as geometry (silhouette-critical) | 1 | High |
| 3,4,7,10,22 | Face / lower head | 380,627 | **HEAD** | Rigid | Preserve as geometry; visor stays texture-only | 1 | High |
| 1 | Torso / chest core | 102,508 | **TORSO** | Rigid | Preserve as geometry | 2 | High |
| 2 | Torso/shoulder mass (right-side member, x=−0.17) | 100,041 | **RIGHT_SHOULDER + RIGHT_UPPER_ARM** (reclassified, see §3) | Rigid | Preserve as geometry, split at new seam | 3 | Medium |
| 24,29,30,32,35,40,41 | Torso/shoulder mass (remaining, left-side + centerline) | 114,093 | **TORSO** (shoulder-yoke saddle) | Rigid | Preserve as geometry | 2 | Medium |
| 12 | Hip / pelvis core | 59,400 | **PELVIS** | Deformation (hip sockets) | Preserve as geometry, split at new seam for legs | 3 | High |
| 11,16,23,27 | Upper-arm-to-shoulder transition | 185,314 | **LEFT_SHOULDER + LEFT_UPPER_ARM** | Rigid (shoulder cap: hybrid) | Preserve as geometry | 3 | Medium |
| 28,31,33,34,36,37,38,39,42,43,44,45,46,47,48,49 | Neck/collar/shoulder ball-joint complex | 111,675 | **NECK_COLLAR** | Hybrid (rigid sub-parts on deforming base) | Preserve as geometry | 2 | Medium |
| 50,52,53 | Neck-ring rib segment (Phase 2.1) | 1,700 | **NECK_COLLAR** (trim detail) | Hybrid | Preserve as geometry (source reference for retopo detail) | 2 | Medium |
| 13 | Left hand + wrist | 59,303 | **LEFT_HAND** | Hybrid (wrist/knuckle blend) | Preserve as geometry | 3 | Medium |
| 14 | Left forearm | 59,302 | **LEFT_FOREARM** | Rigid | Preserve as geometry | 3 | Medium |
| 15 | Right hand + wrist (pointing arm) | 59,053 | **RIGHT_HAND** | Hybrid | Preserve as geometry | 3 | Medium |
| 18,19 | Left foot / shoe base | 108,041 | **LEFT_FOOT** | Rigid | Preserve as geometry | 4 | High |
| 20,21 | Right foot / shoe base | 105,115 | **RIGHT_FOOT** | Rigid | Preserve as geometry | 4 | High |
| 25 | Left lower leg / ankle cuff | 33,524 | **LEFT_LOWER_LEG** | Rigid | Preserve as geometry | 4 | High |
| 26 | Right lower leg / ankle cuff | 32,516 | **RIGHT_LOWER_LEG** | Rigid | Preserve as geometry | 4 | High |
| 59 (ambiguous) | Unclassified debris-like cluster | 773 | none yet | n/a | Preserve as **source reference only** (§11) | — | Low |

**Source islands with no production role assigned:** none — every one of the 54 maps to a production object above. **No island is forced into its own object 1:1** — the 16-island neck/collar complex, the 8-island torso/shoulder mass, and the 4-island upper-arm/shoulder-transition group each consolidate into one production object apiece, per the instruction not to mechanically preserve source fragmentation.

## 3. Final Production Object Groups

Evaluated against the full candidate list; **recommended set is 15 objects**, smaller than the 21-item candidate list because three merges are justified by evidence already in hand:

| Candidate | Decision | Why |
|---|---|---|
| BRAIN + VISOR + HEAD/FACE FRAME | **Merged into one `HEAD` object** | Phase 2's own retopology plan (§2) already concluded the 11 brain+face islands retopologize as "one continuous head surface, not 6–11 separate patches," and the visor "has zero geometric presence" (Phase 2 plan §4) — it's baked into the same head texture. Three separate objects would recreate a boundary that doesn't exist in the design and was never separable in the source. |
| NECK / COLLAR | Kept as its own object | Genuinely the busiest, highest-non-manifold-count zone; needs to be its own hybrid deformation object regardless. |
| LEFT/RIGHT_SHOULDER | **Merged into their respective UPPER_ARM objects** (`LEFT_SHOULDER_UPPER_ARM`, `RIGHT_SHOULDER_UPPER_ARM`) | Neither shoulder region source-separates from its upper arm (island 2 on the right is one continuous mass with no elbow break at all; the left region 11/16/23/27 is one loosely-connected cluster). Splitting them into 4 objects instead of 2 would introduce seams with zero source evidence for where to cut, for no rig benefit — the shoulder ball-joint socket itself already lives in `NECK_COLLAR` (hybrid deformation zone) per Phase 2's rig strategy §1. |
| LEFT/RIGHT_FOREARM | Kept separate | Left forearm (14) is a clean, high-confidence, already-separate island; the right forearm doesn't exist as a source seam (fused into island 2) but is recommended as a **new** seam for rig symmetry (§8, Step 4 risk). |
| LEFT/RIGHT_HAND | Kept separate | Clean, distinct source islands. |
| FINGERS | **Not a separate object** | Confirmed continuous with the hand mesh in Phase 2 (no finger-level islands exist in either hand) — fingers live inside `LEFT_HAND`/`RIGHT_HAND` as edge-loop detail, not standalone objects. |
| PELVIS | Kept separate | Distinct, central, high-confidence island. |
| LEFT/RIGHT_UPPER_LEG | **New objects, no source seam** | The source has no separate upper-leg island at all (fused into `PELVIS`). Recommended as new topology cuts at retopology time — flagged as an elevated-risk item (§13). |
| LEFT/RIGHT_LOWER_LEG | Kept separate | Clean source islands (25, 26). |
| LEFT/RIGHT_FOOT | Kept separate | Clean, already multi-part (2 islands each) source structure. |
| accessories | **Not created** | Phase 1's asset inventory found exactly 1 material and 2 meshes total (source + working) — there is no separate accessory geometry on this character. Nothing to group. |

**Recommended final production object set (15):** `HEAD`, `NECK_COLLAR`, `TORSO`, `PELVIS`, `LEFT_SHOULDER_UPPER_ARM`, `RIGHT_SHOULDER_UPPER_ARM`, `LEFT_FOREARM`, `RIGHT_FOREARM`, `LEFT_HAND`, `RIGHT_HAND`, `LEFT_UPPER_LEG`, `RIGHT_UPPER_LEG`, `LEFT_LOWER_LEG`, `RIGHT_LOWER_LEG`, `LEFT_FOOT`, `RIGHT_FOOT` (16 counting both leg pairs individually — see full list in the JSON companion).

## 4. Rig Behavior Classification

| Region | Class | Why |
|---|---|---|
| HEAD | Rigid | Single head bone; brain fragmentation is cosmetic/reconstruction-only, not a deformation need |
| NECK_COLLAR | **Hybrid** | Rigid ball-joint sub-parts (the neck ring, shoulder ball caps) sitting on a deforming base — matches Phase 2's rig strategy §1 exactly |
| TORSO | Rigid | Chest-core capsule, no deformation need documented |
| PELVIS | **Deformation** at its hip-socket edges, otherwise rigid core — matches Phase 2 §1 ("both hip sockets" flagged as a deformation zone) |
| SHOULDER_UPPER_ARM (both) | Rigid capsule; the shoulder **socket** itself is part of `NECK_COLLAR`'s hybrid zone, not this object |
| FOREARM (both) | Rigid |
| HAND (both) | **Hybrid** — light skin blend at the wrist and knuckle bases (Phase 2 §1: fingers are geometrically continuous with the hand, so posing needs a soft blend, not a rigid plug) |
| UPPER_LEG (both) | Rigid, with a **deformation** transition at the hip end (matches PELVIS's hip-socket classification) |
| LOWER_LEG (both) | Rigid |
| FOOT (both) | Rigid |

Areas inspected per the instruction's checklist: shoulders → hybrid via NECK_COLLAR; elbows → rigid-rigid hinge, no deformation documented or needed; wrists → hybrid (light blend); fingers → hybrid, inside HAND; neck → hybrid via NECK_COLLAR; torso → rigid; hips → deformation; knees → rigid-rigid hinge; ankles → rigid-rigid hinge.

## 5. Seam Strategy

| Joint | Strategy | Why |
|---|---|---|
| Neck/head | **Hidden seam** at the base of the head, inside `NECK_COLLAR`'s rigid neck-ring sub-part | The neck ring (islands 50/52/53) already reads as a visible mechanical collar in the render — the seam belongs there by design, not invented |
| Shoulder | **Deformation bridge topology** | Phase 2 explicitly classifies shoulder sockets as a deformation zone; a hard cut would show a gap when the arm rotates |
| Elbow | **Intentional hard separation** (overlapping mechanical shells optional) | No deformation documented at the elbow in either Phase 1 or 2; matches the character's "ball-joint hinge" identity — a visible mechanical break here is consistent with the approved design, not a defect |
| Wrist | **Hybrid transition** | Phase 2 §1: light skin blend so hand posing doesn't look like a rigid plug rotating in a socket |
| Fingers | **Hidden seam** (none needed — continuous mesh) | Confirmed geometrically continuous; no seam to plan |
| Hip | **Deformation bridge topology** | Matches shoulder treatment; Phase 2 flags hip sockets as a deformation zone alongside shoulders |
| Knee | **Intentional hard separation** | Same reasoning as elbow — no deformation evidence, matches ball-joint identity |
| Ankle | **Intentional hard separation** | The source already shows this as a clean multi-island boundary (lower-leg islands 25/26 vs. foot islands 18–21) — reuse that boundary, don't deformation-blend it |

**Explicit application of the "proximity ≠ fusion" lesson from the failed global weld:** every joint above that shows near-coincident source vertices (all of them, per the Step 2 finding) is treated as an *intentional part boundary* by default. Only the two joints Phase 2's own forensic analysis flagged as deformation zones (shoulder, hip) — plus the wrist/knuckle blend Phase 2 separately documented — get bridge/blend topology. Everywhere else, closeness in the source mesh is treated as evidence of a mechanical joint, not evidence the surfaces should merge.

## 6. LOD0 Polygon Budget (target: 70,000 of the 60,000–80,000 range, matching Phase 2's own LOD0 figure)

```text
Brain:                          13,000
Head/visor (face + jaw + UV):    8,000
  Head subtotal:                21,000   (= Phase 2's certified "Head/brain 30%" share, unchanged)
Neck/collar:                     7,000   (= Phase 2's certified 10% share, unchanged)
Torso:                           8,400   (= Phase 2's certified 12% share, unchanged)
Shoulders (both, 800 ea.):       1,600   (carved from Phase 2's 16% arm share)
Upper arms (both, 2,400 ea.):    4,800   (carved from Phase 2's 16% arm share)
Forearms (both, 2,400 ea.):      4,800   (carved from Phase 2's 16% arm share)
  Arms subtotal:                11,200   (= Phase 2's certified "Arms 16%" share, unchanged)
Hands/fingers (both, 4,200 ea.): 8,400   (= Phase 2's certified 12% share, unchanged; fingers are edge-loop detail within this budget, not separate)
Pelvis:                          2,800   (= Phase 2's certified 4% share, unchanged)
Legs (both, 3,500 ea.):          7,000   (= Phase 2's certified 10% share, unchanged)
Feet (both, 2,100 ea.):          4,200   (= Phase 2's certified 6% share, unchanged)
Accessories:                         0   (none exist on this asset)

TOTAL:                          70,000
```

This is a **refinement**, not a revision, of the Phase 2 retopology plan's already-certified LOD0 table (§2) — every top-level percentage share is identical; only the arm share is newly subdivided into shoulder/upper-arm/forearm lines and the pelvis/legs/feet lines are broken out per Step 3F's requested format (Phase 2's table already kept these separate). Visual-importance ranking (brain → visor/head shape → hands/fingers → joint transitions → mechanical silhouette) matches Phase 2's own stated priority order exactly.

## 7. Retopology Method Per Region

| Region | Method | Why |
|---|---|---|
| Brain | Manual/guided retopology, shrinkwrap-assisted to the 2M-tri master, hand-placed crease edge loops | Organic dome with silhouette-critical detail (Phase 2 §3); shrinkwrap keeps the low-poly shell locked to the true surface while creases get explicit edge loops, not just normal-map illusion |
| Head/visor | Manual quad retopology, shrinkwrap-assisted | Rounded face-plate shell; needs a clean, deliberately-reserved UV island for the visor region (§9) |
| Neck/collar | **Hard-surface reconstruction** (primitive-driven), not shrinkwrap | This zone carries the highest concentration of Phase 1's duplicate-vertex/non-manifold defects (59% of all original debris sat here) — the raw source surface is not a trustworthy shrinkwrap target for fine detail; build from primitives referencing the neck-ring islands (50/52/53) as trim geometry |
| Torso | Primitive-driven hard-surface reconstruction | Clean capsule shell, well-suited to primitive construction per Phase 2 §2 |
| Shoulders/upper arms/forearms | Primitive-driven hard-surface reconstruction (capsules/cylinders) | Matches Phase 2 §2 exactly — "each retopologized as its own clean primitive-driven segment" |
| Hands | **Manual quad retopology / poly-build**, shrinkwrap-assisted using islands 13/14/15 as reference | Organic-adjacent, needs clean edge flow at the knuckle/wrist hybrid-deformation zone (§4); the source hand islands are clean and high/medium-confidence, good shrinkwrap targets |
| Legs (upper — new seam, lower) | Primitive-driven hard-surface reconstruction | Same reasoning as arms; upper leg has no source reference so build directly from primitives against the master's visible silhouette |
| Feet | Primitive-driven hard-surface reconstruction | Already a clean, well-separated 4-island multi-part shoe design |
| Source-island reuse | **Reference only, never direct reuse**, except the 1,700-face neck-ring islands (50/52/53) which may be used as literal small-scale trim reference | 34,231 non-manifold edges remain in the source; treating any of it as final production topology inherits those defects |
| Decimation | Temporary LOD1/mobile preview reference only, never for LOD0's final geometry | Matches Phase 1's explicit rejection of blind decimation (Path B) |

No single global technique is used — brain/head get organic shrinkwrap methods, mechanical limbs/torso get primitive hard-surface construction, matching the instruction not to treat them identically.

## 8. Brain Strategy

Directly continues Phase 2's certified §3 strategy, now with concrete LOD0 numbers:

- **Must survive in real geometry:** the major crease lines, kept as actual edge loops in LOD0 and LOD1 (13,000-tri LOD0 budget) — not purely a normal-map illusion, because the grooves sit close to the silhouette on a mostly-round head where normal maps read flat under grazing light.
- **Can move to normal maps:** fine-grain groove shading baked from the 2,000,000-tri master (Phase 1's own recommendation) — this supplements the geometry, it doesn't replace it.
- **Base-color/cavity detail:** the black crease coloring itself is texture, not geometry — only the *silhouette-relevant* groove shape needs real edge loops.
- **Minimum density:** at least the primary top-of-head and side creases need to survive as geometry even on the mobile LOD (4,500 tri, per Phase 2's original mobile head budget) so the silhouette never reads as a plain sphere.
- **Merge, don't multiply:** the 6-island brain crown retopologizes into one continuous shell — the current fragmentation is a reconstruction artifact, confirmed again this step (all 6 brain-crown islands matched their certified centroids at 42–64 microns, i.e., they are exactly where Phase 2 said they'd be, with no new information suggesting real part boundaries).

The brain will not be flattened or reduced to a generic dome — 13,000 of LOD0's 70,000 triangles (18.6%) is the largest single per-part allocation on the character.

## 9. Visor Strategy

Phase 2's plan (§4) already established the visor has zero current geometric presence (baked texture) and explicitly deferred the same-surface-UV-island vs. separate-overlay-patch decision to Phase 6 (Digital Face System). Step 3 does not override that deferral, but makes it actionable now:

- **Default LOD0 build (recommended for Step 4):** reserve a clean, visor-shaped **UV island** across the face region during head retopology, separate from the rest of the head's UV layout, even though the geometry stays part of the single continuous `HEAD` shell. Zero additional triangle cost, fully compatible with immediate execution, and is exactly what Phase 2 recommended as the safe default.
- **Deferred alternative (Phase 6 decision, not decided here):** a thin separate overlay patch (shallow shell offset slightly in front of the face) would let a future dynamic face system drive cyan eyes/expressions/text/symbols/mood states with its own material independent of the head's base material. This document only records the option.
- **Material note:** Phase 1 found exactly 1 material (`pbr_material`) on the whole asset. Regardless of which geometry option Phase 6 eventually picks, Step 4 should plan for a **second material slot** dedicated to the visor's emissive/dynamic region — this is a Step 4 setup task, not a Phase 6-only concern, since it doesn't require the geometry decision to be made first.
- Either geometry option is compatible with `HEAD`'s rigid classification — the visor moves with the head bone either way.

## 10. Hand / Finger Strategy

- **Fingers stay joined into the hand mesh**, not separated into a `FINGERS` object or individual rigid finger objects. This is directly supported by evidence, not just preference: Phase 2 confirmed zero finger-level islands in either hand (both are single continuous connected components), and rigid independent finger segments would look mechanically stiff for the poses this character explicitly needs — pointing, fist pump, wave, charades, expressive posing all read better with continuous, lightly-deformable digits than snapped rigid caps.
- **Topology budget:** 4,200 triangles per hand (8,400 total), enough for clean quad flow at the knuckles without over-spending relative to the brain/head priority.
- **Deformation loops required:** edge loops at each knuckle base (all four fingers) and at the wrist boundary, sized for the "hybrid — light skin blend" classification from §4, not full skinned-character-hand density (this is a mascot's hand, not a photoreal hand).
- **Thumb:** needs its own dedicated edge-loop treatment, separate from the four-finger loop pattern, since its opposition axis differs — flagged explicitly so Step 4 doesn't reuse a uniform finger loop count across all five digits.
- **Rigid vs. deformable:** deformable (hybrid), not rigid finger segments, per the pose requirements above.

## 11. Ambiguous 773-Face Cluster

**Disposition: preserve as source reference only.** Per Step 2's own finding, this cluster sits 4.4 mm from preserved island 53's centroid, in the same neck/collar debris hotspot z-band, and does not touch the exterior silhouette — close enough to legitimate preserved neck-ring geometry that deleting it without a closer look risked removing something real, but not confirmed as legitimate trim either. Recommendation for Step 4:

- Do **not** auto-incorporate it into the neck/collar reconstruction's production topology.
- Do **not** auto-delete it as debris.
- Keep it available in the working file as a reference-only object during the `NECK_COLLAR` retopology pass; require one manual interactive Blender-viewport look (isolate/select-linked) before either using it as a trim reference or discarding it. This is a one-time, cheap decision point that belongs inside Step 4's neck/collar checkpoint (Checkpoint A extension — see §14), not something to resolve blind in this planning step.

## 12. Non-Manifold Strategy

34,231 non-manifold edges remain, split (Step 2's zone classification) into 20,148 in known joint/collar zones and 14,083 elsewhere. Step 3's plan for each:

- **Disappear naturally during reconstruction:** the ~20,148 joint-zone edges. Step 4's retopology builds entirely new topology across every joint boundary (§5, §7) rather than repairing or reusing the source mesh's edges there — so these are source-only problems that the new topology will never inherit, without requiring any direct repair.
- **Need explicit attention:** the ~14,083 non-joint-zone edges. These are not automatically resolved by the retopology plan the way the joint-zone ones are, since some regions (hands, brain) *do* use the source as a shrinkwrap reference rather than full hard-surface reconstruction. Flagged for a lightweight check during each region's retopology checkpoint — not a blocking repair pass.
- **Represent mechanical boundaries:** the joint-zone subset, per above — expected and consistent with the seam strategy in §5, not a defect to fix.
- **Source-only, irrelevant to new topology:** true for every hard-surface-reconstructed region (neck/collar, torso, arms, legs, feet) — none of these carry source non-manifold edges into LOD0 at all, since they're built from primitives, not derived from the source mesh directly.

No repair work happens in Step 3 or is scheduled as a dedicated pre-retopology pass — this is intentionally deferred, consistent with "the final LOD0 should be substantially cleaner than the source" being an outcome of *how* Step 4 builds geometry, not a prerequisite cleanup of the source itself.

## 13. Step 4 Risks

1. **Right arm (pointing) has no source-level shoulder/upper-arm/forearm segmentation** — island 2 is one continuous 100,041-face mass from shoulder to wrist, unlike the left arm's 3-part breakdown (upper-arm-transition / forearm / hand). Step 4 must introduce new seams there with no source-topology evidence for exactly where to cut. **Mitigation:** deliberately mirror the finished left-arm topology onto the right rather than deriving it independently, so both arms end up rig-symmetric regardless of the source asymmetry.
2. **Pelvis→upper-leg has zero source seam** — the entire hip+thigh mass is one island (12). Step 4 has no bounding-box evidence for where the hip joint should sit. **Mitigation:** use the lower-leg islands' (25/26) upper bbox boundary as the best available proxy for knee height, and the character reference renders (`phase-2-images/`) for visual hip-joint placement, rather than guessing from the pelvis island alone.
3. **Visor geometry decision remains open** (Phase 6 scope) — Step 4 should build only the safe default (UV reservation, §9) and not block on the full decision.
4. **The 773-face ambiguous cluster** needs one manual look during the neck/collar checkpoint (§11) — small, cheap, but a real decision point that shouldn't be silently skipped.
5. **Non-manifold source edges** must not leak into LOD0 through the shrinkwrap-referenced regions (brain, hands) — worth a quick manifold check on those two regions specifically at their checkpoints, since they're the only regions that touch source topology as a shape reference rather than building fresh from primitives.

## 14. Step 4 Execution Order & Checkpoints

```text
1. Head/brain           -> Checkpoint A
2. Neck/collar          -> Checkpoint A (extension: resolve the 773-face cluster here)
3. Torso                -> Checkpoint B
4. Pelvis                -> Checkpoint B
5. Shoulders/upper arms/forearms (both, mirrored per §13.1) -> Checkpoint C
6. Hands                -> Checkpoint C
7. Upper/lower legs (both, new hip seam per §13.2) -> Checkpoint D
8. Feet                 -> Checkpoint D
9. Accessories          -> (none — skipped)
10. Joint transitions (shoulder/hip deformation bridges, wrist/knuckle blends) -> Checkpoint E
11. Final weld/seam validation -> Checkpoint E
```

**Why this order:** highest-risk, most-protected, and fully self-contained geometry (brain/head) first; the neck/collar checkpoint is folded into Checkpoint A since it's adjacent and shares the one open decision point (§11). Torso/pelvis next as the structural anchor everything else attaches to. Arms and hands are checkpointed together ahead of legs because hand/finger fidelity ranks above general limb silhouette in Phase 2's own visual-priority order (§8, §10). Joint transitions are deliberately built last, as their own pass, since a shoulder or hip deformation bridge can only be correctly built once both sides of the joint already exist.

| Checkpoint | Regions | Triangle budget | Visual acceptance criteria | Source-comparison requirement | Rollback point |
|---|---|---:|---|---|---|
| **A — Head/Brain/Neck** | HEAD, NECK_COLLAR (incl. §11 decision) | 21,000 + 7,000 = 28,000 | Brain silhouette and major crease lines visibly match the master; visor UV island reserved; neck ring reads as a distinct mechanical collar | Region-level face-count/silhouette check against `BRAINIACT_PHASE2_REFERENCE`, not a beauty render | Revert to the certified Step 2 `BRAINIACT_LOD0_WORKING` state |
| **B — Torso/Pelvis** | TORSO, PELVIS | 8,400 + 2,800 = 11,200 | Chest-core and pelvis capsules read as one coherent mechanical torso; hip-joint placement documented (§13.2) even though not yet rigged | Bbox/dimension check against Phase 2 reference | Revert to end of Checkpoint A |
| **C — Arms/Hands** | Both shoulder/upper-arm, both forearm, both hand | 1,600+4,800+4,800+8,400 = 19,600 | Both arms symmetric in topology (per §13.1 mitigation); hands support the 5 required poses at a basic-mesh level (no rig yet, just topology check) | Left/right symmetry check (mirrored vertex count comparison), not just against source | Revert to end of Checkpoint B |
| **D — Pelvis/Legs/Feet** | Both upper leg, both lower leg, both foot | 7,000 + 4,200 = 11,200 (upper/lower legs share the "Legs" 7,000 line) | Leg silhouette matches master at the new hip seam; feet retain the 4-part shoe read | Bbox/dimension check against Phase 2 reference | Revert to end of Checkpoint C |
| **E — Full assembled LOD0** | All joint transitions + final weld/seam pass | remaining budget (~0, this is assembly not new geometry) | Full-body silhouette, all 13 previously-tracked regions' *positions* still recognizable (not face-count — LOD0 is a full rebuild); no dangling/non-manifold edges introduced by the assembly step itself | Full dims/bbox check against `BRAINIACT_PHASE2_REFERENCE`; total triangle count within 60,000–80,000 | Revert to end of Checkpoint D |

Sum of per-checkpoint budgets: 28,000 + 11,200 + 19,600 + 11,200 = 70,000, matching §6 exactly.

## 15. Artifacts

- `assets-source/brainiact/reports/BRAINIACT_PHASE_3_STEP_3_LOD0_ARCHITECTURE.md` — this document.
- `assets-source/brainiact/reports/BRAINIACT_PHASE_3_STEP_3_LOD0_ARCHITECTURE.json` — structured companion.

No renders were produced. All analysis used direct Blender data-API inspection (island BFS + centroid matching against the certified island map) on the already-certified Step 2 mesh, read-only, never saved.
