# Brainiact — Phase 2 Island Map

**Working file:** `assets-source/brainiact/blender/BRAINIACT_WORKING.blend`
**Source reference:** preserved untouched in the `BRAINIACT_SOURCE_REFERENCE` collection (`geometry_0`, 1,017,842 verts / 2,000,000 faces — matches the Phase 1 master audit exactly). All analysis below ran against the `BRAINIACT_PRODUCTION_WORKING` collection's `Brainiact_Working` object. The file was never saved this session.
**Tool:** Blender 4.5.12 LTS, `/Applications/Blender.app/Contents/MacOS/Blender --factory-startup --background`, a read-only bmesh face-adjacency BFS island scan (no edits, no export).
**Cross-reference images:** `phase-2-images/island_map_{front,rear,left,right,top}.png` (already rendered, not regenerated this session).
**Machine-readable companion:** `BRAINIACT_ISLAND_MAP.json`

This continues directly from the previously confirmed Phase 2 findings (128 islands, brain fragmentation, limb/foot segmentation coherence, hybrid rig direction). Nothing here repeats Phase 1's forensic audit or redoes the working-blend setup — it finishes the island classification, debris/unknown triage, rig-class assignment, and retopology/cleanup planning that were still outstanding.

---

## 1. Totals

| Metric | Count | Faces |
|---|---:|---:|
| Total islands | **128** | 2,000,000 |
| Classified (assigned to a body region) | **53** (post-Phase-2.1) | 1,996,200 |
| Unknown (ambiguous, needs manual inspection) | **0** (post-Phase-2.1, was 5) | 0 |
| Debris / internal candidates | **75** (post-Phase-2.1, was 73) | 3,800 (0.19% of total mesh) |

*Figures above reflect the Phase 2.1 resolution of the 5 unknown islands (§3) — see `BRAINIACT_PHASE_2_1_UNKNOWN_ISLAND_RESOLUTION.md` for details.*

The 128-island count reconfirms the Phase 1 forensic audit exactly (live rescan this session, not reused from memory). Debris and unknown islands together are 78 of 128 islands (61% of island *count*) but only 0.27% of total *geometry* — they are numerous but geometrically negligible, consistent with Phase 1's finding of 18,098 duplicate-vertex pairs and 50 zero-area faces.

## 2. Debris / internal candidates (73 islands)

**Classification rule:** face_count ≤ 20, or bounding-box diagonal < 1 cm. Both conditions independently isolate the same set — every one of these islands is a near-point fragment, not a modeled part.

They cluster tightly at a handful of physical sites rather than being scattered randomly, which is itself evidence they're reconstruction artifacts, not intentional geometry:

| Site (approx. location) | Islands | Count |
|---|---|---:|
| Neck / collar seam (z≈0.59–0.63, near torso centerline) | 51 islands across ~8 micro-clusters | **51** |
| Foot / floor-contact zone (z≈0.02–0.04, both feet) | 8 islands | **8** |
| Shin / knee trim (z≈0.20, 0.31) | 3 islands | **3** |
| Upper-head, right-front (z≈0.91) | 2 islands | **2** |
| Remainder (single-island sites) | scattered | **9** |

**59% of all debris islands sit at the neck/collar seam** — a single ~5 cm zone. This is the mesh's primary topology-health hotspot and should be the first place cleanup work targets (see §7).

Full island IDs are in `BRAINIACT_ISLAND_MAP.json` → `debris_candidate_ids`.

## 3. Unknown candidates (5 islands) — RESOLVED in Phase 2.1

IDs **50, 51, 52, 53, 54** — 499–670 faces each, all located inside the same neck/collar hotspot as the debris cluster (z 0.586–0.633, x 0.03–0.10). They were too large to be duplicate-vertex noise but too small and awkwardly placed to confidently call a modeled part from bounding-box data alone at the time this section was first written.

**Resolved in Phase 2.1 (2026-08-18)** without a new full-character render pass — see `BRAINIACT_PHASE_2_1_UNKNOWN_ISLAND_RESOLUTION.md` for the full per-island reasoning. Summary:

| ID | Faces | Z-band | Flatness (max:min dim) | Resolution | Preserve/remove |
|---|---:|---|---|---|---|
| 50 | 670 | lower (~0.593) | 2.7:1 | neck_ring_rib_segment | Preserve |
| 52 | 518 | lower (~0.589) | 5.7:1 | neck_ring_rib_segment | Preserve |
| 53 | 512 | lower (~0.586) | 3.5:1 | neck_ring_rib_segment | Preserve |
| 51 | 560 | upper (~0.632) | 7.8:1 | reclassified debris_candidate | Remove (post-weld verify) |
| 54 | 499 | upper (~0.633) | 5.5:1 | reclassified debris_candidate | Remove (post-weld verify) |

The lower-band trio (50/52/53) reads as the visible ribbed neck-ring/thread geometry at the neck-to-collar transition (confirmed against `unknown_islands_closeup_front.png` / `_side.png`) and merges into the neck/collar/shoulder-joint complex during retopology. The upper-band pair (51/54) is thin-shard geometry consistent with the same duplicate-vertex/non-manifold seam artifact as the 73 confirmed debris islands — folded into the debris pool, to be deleted only after the duplicate-vertex weld pass (§5 step 1–3), not before.

Islands 50, 52, 53 are now counted in the 50→53 classified total; islands 51, 54 move into the debris pool (73→75 islands, 2,741→3,800 debris faces, 0.14%→0.19% of mesh). `unknown` is now **0**.

## 4. Classified regions (50 islands)

| Region | Islands | Count | Faces | Confidence |
|---|---|---:|---:|---|
| Brain crown (upper head mass) | 0, 5, 6, 8, 9, 17 | 6 | 483,988 | High |
| Face / lower head / jaw mass | 3, 4, 7, 10, 22 | 5 | 380,627 | High |
| Upper-arm-to-shoulder / neck transition | 11, 16, 23, 27 | 4 | 185,314 | Medium |
| Neck / collar / shoulder ball-joint complex | 28, 31, 33, 34, 36, 37, 38, 39, 42, 43, 44, 45, 46, 47, 48, 49 | 16 | 111,675 | Medium |
| Torso / shoulder-yoke mass | 2, 24, 29, 30, 32, 35, 40, 41 | 8 | 214,134 | Medium |
| Torso / chest core shell | 1 | 1 | 102,508 | High |
| Hip / pelvis core | 12 | 1 | 59,400 | High |
| Arm A (extended/pointing) — hand + wrist | 15 | 1 | 59,053 | Medium |
| Arm B (lowered) — forearm | 14 | 1 | 59,302 | Medium |
| Arm B (lowered) — hand + wrist | 13 | 1 | 59,303 | Medium |
| Lower leg / ankle cuff (one per leg) | 25, 26 | 2 | 66,040 | High |
| Foot / shoe base (two per foot) | 18, 19, 20, 21 | 4 | 213,156 | High |

**Brain-crown cross-check:** the 6-island brain crown group found by this independent numeric z-band scan matches the previously confirmed "6–7 irregular reconstruction-style patches" finding almost exactly — good agreement between the earlier visual read and this session's live geometric scan.

**Hands/fingers note:** neither hand produced separate finger islands. That confirms, rather than contradicts, the earlier "forearm/hand regions appear coherent" finding — the fingers are modeled as one continuous connected mesh per hand (no disconnection at the knuckles), which is favorable for retopology and rigging.

**Where confidence is only Medium:** the neck/collar/shoulder complex (16 islands) and the two upper-arm-to-shoulder islands sit in the same dense, low-symmetry zone as the debris hotspot. Z-band + lateral-position heuristics place them correctly as a *group*, but the precise split of "this island is upper-arm vs. that island is shoulder-yoke vs. that island is collar trim" was not confirmed with an interactive per-island viewport isolate this session. Treat the group assignment as reliable and the individual sub-labels as provisional.

## 5. Coordinate convention used

- Up axis: **+Z**. Working object re-origined to floor (Z spans 0.0–1.0), matching Phase 1's rigging recommendation — this was already done in the working file before this session.
- Front-facing: **−Y** (per Phase 1 audit).
- Character's own **right side ≈ world −X**, **left side ≈ world +X** — derived, not read from a named property: in a −Y-facing, Z-up, right-handed frame, a front-view camera at −Y looking toward +Y puts world +X at camera-right. The pointing/extended arm reads on-screen-left in `island_map_front.png` (camera-left / world −X), which mirrors to the character's own right arm. Medium confidence — treat as provisional until the rig's own bone-naming pass confirms it.

## 6. Separability summary

| Body area | Separable today? |
|---|---|
| Brain | Geometrically fragmented (6 islands / patches), not cleanly separable from the face/head mass as a single "brain" object — the crown and lower-head/jaw form two z-band groups, not a clean brain-vs-skull split |
| Visor | **Not separable at all** — no island, in any of the 5 render views, corresponds to a visor-shaped boundary. The visor is 100% texture-baked onto the same continuous head shell as the brain patches (confirms the Phase 1 finding about the baked "LET'S GROW" visor text) |
| Torso | Separable — one large chest-core island (102,508 faces) plus a torso/shoulder-yoke group |
| Arms | Separable per arm at the hand/forearm level; upper-arm/shoulder sub-boundaries are the ones needing the follow-up interactive pass (§4) |
| Hands | Separable as a whole hand+wrist unit per arm; not further separable — no finger-level islands exist |
| Fingers | **Not separable by geometry** — continuous with the hand, confirming (not just "appearing") coherent |
| Legs | Separable at hip / lower-leg-cuff boundaries |
| Feet | Separable — 4 islands (2 per foot), matching the multi-part shoe design visible in the renders |

Full per-island data (id, face count, vert count, centroid, bounding box) for all 128 islands is in `BRAINIACT_ISLAND_MAP.json`.
