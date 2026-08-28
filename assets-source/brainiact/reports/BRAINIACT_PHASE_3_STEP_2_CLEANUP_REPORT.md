# Brainiact — Phase 3, Step 2: Controlled Geometry Cleanup, Weld & Debris Resolution

**Scope:** forensic cleanup of `BRAINIACT_LOD0_WORKING` only. No retopology, decimation, rigging, animation, texture work, or export happened in this step.
**Working file:** `assets-source/brainiact/blender/BRAINIACT_RETOPOLOGY_WORKING.blend`
**Depends on:** `BRAINIACT_PHASE_3_STEP_1_WORKING_ENVIRONMENT.md`, `BRAINIACT_ISLAND_MAP.md`/`.json`, `BRAINIACT_PHASE_2_STRUCTURE_AND_RETOPOLOGY_PLAN.md`, `BRAINIACT_PHASE_2_1_UNKNOWN_ISLAND_RESOLUTION.md`.

---

## Summary

The first weld attempt (global, whole-mesh) **failed** the identity-preservation checks this step is built around and was **rolled back before certification**. A second, properly-scoped attempt succeeded: every one of the 13 certified structural regions (12 body regions + the Phase 2.1 neck-ring rib segment) has **0.0% face-count deviation** from the certified Phase 2 baseline, while the 75 certified debris/internal candidate islands were consolidated and resolved down to a single small, deliberately-preserved ambiguous remnant. This report documents both attempts in full, per the Failure/Rollback Rule.

## Failed Attempt 1 (documented, rolled back, never certified)

A global `bmesh.ops.find_doubles` + `weld_verts` at the smallest specified candidate threshold (1e-5 m) was run across **all** vertices of `BRAINIACT_LOD0_WORKING`, not scoped to any subset. This merged 17,792 vertices and collapsed the mesh's connectivity catastrophically: post-weld, `structural_islands_post_cleanup = 1` — the brain, face, torso, both arms, hip, both legs, and both feet all fused into a single ~1,999,522–1,999,570-face connected blob, with only the debris fragments remaining as separate tiny islands. The subsequent "delete tiny non-silhouette islands" pass then stripped 32 of the 35 post-cleanup islands, which would have destroyed the mechanical-part separability Phase 2's own rig strategy (rigid parenting per body segment) depends on.

**Root cause:** the pre-weld safety check compared the candidate thresholds only against *within-island feature thinness* (1.6 mm, the thinnest classified-island dimension) — not against the actual gap distance *between different* structural islands at their joint boundaries. All 4 originally-specified candidate thresholds (1e-5 to 1e-4 m) produced nearly identical global merge counts (17,792–18,098), which in hindsight shows the near-duplicate-vertex population is **not** confined to the neck/collar debris hotspot — near-coincident duplicate vertices exist at essentially every joint seam throughout the body (shoulder, hip, knee, ankle, wrist), a reconstruction artifact affecting the whole model, not just the region Phase 2's island map called out. A blanket weld at *any* of the specified thresholds bridges those seams and destroys the separate-rigid-part structure.

**Rollback:** `BRAINIACT_LOD0_WORKING` was restored from `BRAINIACT_PHASE2_REFERENCE` before anything from attempt 1 was certified.

**Secondary bug found and fixed during rollback:** the restore step used `bpy.ops.object.duplicate()`, which requires the source object to be *selectable*. `Brainiact_Phase2_Reference` had `hide_select = True` (a Step 1 protection), which silently blocked `select_set(True)` — the operator ran but duplicated nothing, and the script's `lod0_obj` variable ended up referring to the **original** `Brainiact_Phase2_Reference` object itself. The subsequent rename/relink/mutation calls then repurposed the actual reference object into the new working copy, rather than mutating a fresh duplicate. This was caught by a `phase2_reference_unchanged_in_memory` self-check that came back `False`, verified independently by reopening the saved file and confirming the `Brainiact_Phase2_Reference` object was genuinely missing. **Fix:** regenerated it via a pure `bpy.data`-level `Object.copy()` / `Mesh.copy()` (no operator, no selection/context dependency), duplicating from `geometry_0` (`BRAINIACT_SOURCE_REFERENCE`) — which is documented to be, and was verified to be, byte-identical to what Phase2Reference always held. No information was actually lost; both were pristine untouched copies of the same certified geometry. Confirmed after the fix: `Brainiact_Phase2_Reference` matches `geometry_0` exactly (1,017,842 / 3,017,714 / 2,000,000 verts/edges/faces, identical dimensions).

## Weld

**Thresholds tested (as specified):** 0.00001, 0.000025, 0.00005, 0.0001 m.

| Threshold | Global dry-run merge count (attempt 1, unsafe) | Debris-scoped dry-run merge count (attempt 2, used) |
|---:|---:|---:|
| 0.00001 m | 17,792 | 495 |
| 0.000025 m | 17,792 | 495 |
| 0.00005 m | 17,799 | 495 |
| 0.0001 m | 18,098 | 548 |

**Selected threshold: 0.00001 m, scoped to debris vertices only.**

**Why this is safe (and why threshold alone wasn't the fix):** the corrected approach restricts the `find_doubles` vertex candidate set to only the 2,592 vertices belonging to islands matched (by nearest-centroid, against the certified `BRAINIACT_ISLAND_MAP.json`) to one of the 75 certified debris/internal-candidate island IDs — explicitly excluding the 1,033 vertices belonging to the preserved neck-ring islands (50, 52, 53) and every vertex belonging to any of the 53 classified structural islands. This guarantees the weld can never bridge two different structural islands together, *regardless of threshold* — the risky vertices are simply never candidates. Within that debris-only scope, the merge count plateaus immediately (495 at every threshold from 1e-5 to 5e-5, only rising to 548 at 1e-4 — a 10x looser threshold for 11% more merges), so the smallest threshold was selected per the "smallest threshold that resolves meaningful duplication" instruction.

**Vertices merged: 495** (debris-scoped weld only).

## Defect Cleanup

| Metric | Before (Step 2C baseline, freshly measured) | After (final) |
|---|---:|---:|
| Zero-area / degenerate faces | 0 | 0 |
| Loose (orphan) vertices | 0 | 0 |
| Loose (wire) edges | 0 | 0 (3,904 were created as a byproduct of debris-island face deletion, then removed in a follow-up pass) |
| Non-manifold edges | 35,428 | 34,231 |
| Near-duplicate vertex pairs (@ 1e-4 m, Phase 1's implied methodology) | 18,098 | 17,337 |

**Note on degenerate faces:** Phase 1's forensic audit reported ~50 degenerate faces; this session's direct `face.calc_area() < 1e-10` measurement found 0, both before and after cleanup. This is a real, measured discrepancy, not a copied number — plausibly Phase 1 used a different degenerate-face definition (e.g., faces with a repeated vertex index in their loop rather than near-zero calculated area). Not re-investigated further since `dissolve_degenerate` (which independently targets exactly this class of defect) found nothing to act on either.

**Non-manifold edges only dropped ~3.4%, and duplicate pairs only ~4.2%** — this is intentional, not a shortfall. The overwhelming majority of both remain at legitimate joint boundaries between separate rigid body parts (see Failed Attempt 1) and are deliberately deferred — see Deferred Issues.

Normals: see below.

## Debris

- **Candidates reviewed:** 75 (the full certified `debris_candidate_ids` list, including islands 51 and 54 per Phase 2.1).
- **Confirmed debris / deleted:** all 75 originally-flagged debris islands were consolidated and resolved. The scoped weld merged many of them into a smaller number of larger debris clusters (since they share the same physical hotspot). 35 confirmed-debris/internal clusters were deleted outright in the main pass (none touching the exterior silhouette, none overlapping the preserved neck-ring footprint). Two additional consolidated clusters that had grown past the tiny-island threshold through merging were caught in a manual follow-up audit: one (493 faces) was confirmed non-silhouette-touching and not near any preserved island, and deleted; one (773 faces) sits close enough to preserved island 53's footprint (4.4 mm) that it was left preserved rather than risk deleting something adjacent to protected geometry.
- **Confirmed internal:** none identified as a distinct category beyond the above (this mesh's debris is all near-surface reconstruction noise at the neck/collar seam, not deep interior geometry).
- **Ambiguous, preserved:** 1 — the 773-face cluster above.
- **Islands removed:** 36 total (35 in the main pass + 1 in the follow-up audit), covering 2,027 faces.

## Special Islands

| ID | Disposition |
|---|---|
| **50** | **Preserved.** Excluded from the weld scope entirely (never a merge candidate). Verified post-cleanup as its own distinct island, face count unchanged (670 faces, matched at 0.04 mm from its certified centroid). |
| **52** | **Preserved.** Same treatment as 50 — excluded from weld scope, verified unchanged (518 faces, matched at 0.05 mm). |
| **53** | **Preserved.** Same treatment — verified unchanged (512 faces, matched at 0.07 mm). |
| **51** | Included in the debris-scoped weld (it was certified as a debris candidate in Phase 2.1). Merged with island 54 and other neighboring debris into a combined 1,544-face cluster. Confirmed non-silhouette-touching and not overlapping the preserved neck-ring footprint — **deleted** as CONFIRMED_DEBRIS. |
| **54** | Same cluster and disposition as 51 — **deleted** as CONFIRMED_DEBRIS (merged with 51 first, then removed as a single unit). |

Islands 50/52/53's visible ribbed form was not visually re-rendered (no render was needed — their face counts and centroids were verified numerically, unchanged, before and after every mutation pass).

## Normals

A conservative heuristic (compare each face's stored normal against a `recalc_face_normals` pass run on a disposable in-memory copy; flag only unambiguous flips at `dot < -0.9`) found **24 unambiguous flipped-normal candidates**, all of which were repaired directly on the working mesh (`face.normal_flip()`), followed by `bm.normal_update()`. This ran once, after the (successful, scoped) weld, on the corrected mesh. No global/blind "recalculate all normals" operation was applied — only the 24 unambiguous cases. Given the very small count relative to 2,000,000 faces and their conservative selection criterion, this is not expected to have visibly affected any surface (visor, brain folds, hands, joints, feet, neck collar) — no remaining anomalies are reported because none survived the conservative threshold; the small number of edge-case faces near non-manifold zones that were *not* flagged (dot product in the ambiguous middle range) were left untouched, consistent with "repair confirmed defects only."

## Non-Manifold Classification

Deferred, per Step 2J's own instruction not to force global manifold-perfection. A coarse zone-based split (edge midpoint Z inside vs. outside the known joint/collar/hip/ankle/knee Z-bands, ±2 cm padding) on the final mesh's 34,231 non-manifold edges found:

- **20,148** inside known joint/collar zones — most plausibly legitimate mechanical boundaries between separate rigid parts (category 2, "legitimate mechanical boundary"), consistent with Failed Attempt 1's finding that these zones carry pervasive near-duplicate-vertex seams by design of the reconstruction, not by accident.
- **14,083** elsewhere — flagged as category 5, "unresolved / future-retopology issue," not further diagnosed this session.

No edges in either bucket were repaired this step; both are explicitly deferred to retopology, where the rig-strategy decision (should adjoining rigid parts be topologically fused or remain genuinely separate meshes) will determine how these boundaries should be resolved.

## Identity Preservation

| Check | Result |
|---|---|
| Silhouette / overall dimensions | Unchanged — final dims `0.6643028259277344 × 0.5928590297698975 × 1.0` m, bit-identical to `BRAINIACT_PHASE2_REFERENCE` |
| Brain (folds, pink shape, crease structure) | Unchanged — `brain_crown` region: 483,988 → 483,988 faces, 0.0% delta |
| Face / visor area | Unchanged — `face_lower_head` region: 380,627 → 380,627 faces, 0.0% delta |
| Arms / hands / fingers | Unchanged — all 4 arm/hand regions (`pointing_arm_hand_wrist`, `lowered_arm_forearm`, `lowered_arm_hand_wrist`, `upper_arm_shoulder_transition`): 0.0% delta each; no finger-level geometry existed to merge (Phase 2 already established fingers are continuous with the hand, not separate islands) |
| Mechanical joints (shoulder / elbow / wrist / hip / knee / ankle) | Unchanged — `neck_collar_shoulder_joint_complex`, `torso_shoulder_mass`, `hip_pelvis`, `lower_leg_ankle_cuff` regions: 0.0% delta each |
| Feet | Unchanged — `foot_shoe_base`: 213,156 → 213,156 faces, 0.0% delta |
| Neck ring (islands 50/52/53) | Preserved intact, see Special Islands above |

**All 13 tracked regions (12 body regions + `neck_ring_rib_segment`) show exactly 0.0% face-count deviation.** This was verified by nearest-centroid matching every certified old island ID against the final mesh's island set, not by assumption.

## Quantitative Comparison

| Metric | Before cleanup | After cleanup | Delta |
|---|---:|---:|---:|
| Vertices | 1,017,842 | 1,015,656 | −2,186 (−0.215%) |
| Edges | 3,017,714 | 3,012,575 | −5,139 (−0.170%) |
| Faces | 2,000,000 | 1,996,973 | −3,027 (−0.151%) |
| Triangles | 2,000,000 | 1,996,973 | −3,027 (−0.151%) |
| Islands | 128 | 54 | −74 (−57.8%, entirely from debris consolidation — 0% structural loss) |
| Duplicate pairs (@ 1e-4 m) | 18,098 | 17,337 | −761 (−4.2%) |
| Non-manifold edges | 35,428 | 34,231 | −1,197 (−3.4%) |
| Degenerate faces | 0 | 0 | 0 |
| Debris islands | 75 | 1 (ambiguous, preserved) | −74 |

- Vertex reduction: 0.215%
- Face / triangle reduction: 0.151%
- Dimensional deviation: 0.0%
- Bounding-box deviation: 0.0%

This is unambiguously cleanup, not optimization — the 0.15% face reduction is two orders of magnitude below anything that would register as a triangle-budget change, and it is fully accounted for by the deleted debris (2,027 faces) plus a handful of degenerate-adjacent losses during weld/dissolve.

## Deferred Issues (explicitly left for later phases)

1. **The bulk of the near-duplicate-vertex population (~17,337 of the original 18,098 pairs) is deliberately unresolved.** These sit at joint boundaries between separate rigid body parts (shoulder, hip, knee, ankle, wrist), not in the debris hotspot. Welding them was proven unsafe in Failed Attempt 1 (it fuses the whole body into one connected blob). Resolving this requires a rig-strategy decision — should these parts be topologically fused (single continuous mesh, deformation-rigged at the seam) or remain genuinely separate meshes (rigid parenting, per Phase 2's original plan) — that is out of Step 2's scope.
2. **34,231 non-manifold edges remain**, split ~59%/41% between known joint/collar zones (likely legitimate boundaries) and elsewhere (unclassified, needs retopology-time review).
3. **One 773-face ambiguous debris-like cluster was deliberately left in place** near island 53's footprint rather than risk deleting something adjacent to protected geometry — flagged for a future manual interactive look.
4. Full retopology, rigging, animation, texture work, and export remain entirely out of scope, as before.

## Artifacts

- `assets-source/brainiact/blender/BRAINIACT_RETOPOLOGY_WORKING.blend` — updated in place (5 mutation passes: failed global weld → rollback → scoped weld/cleanup/deletion → Phase2Reference repair → two follow-up debris-cluster resolutions, all logged above).
- `assets-source/brainiact/reports/BRAINIACT_PHASE_3_STEP_2_CLEANUP_REPORT.md` — this document.
- `assets-source/brainiact/reports/BRAINIACT_PHASE_3_STEP_2_CLEANUP_METRICS.json` — structured metrics.

No renders were produced or required — every verification in this step used direct Blender data-API inspection (vertex/edge/face counts, island BFS, centroid matching), consistent with the Performance/Stability Rule.
