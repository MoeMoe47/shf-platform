# Brainiact — Phase 2.1: Unknown Island Resolution

**Depends on:** `BRAINIACT_ISLAND_MAP.md` / `.json` (Phase 2, §3 "Unknown candidates").
**Scope:** resolves the 5 islands (IDs 50–54) left as `unknown` at the end of Phase 2. No retopology, weld, deletion, rigging, or export happens here — those remain Phase 3 execution per the Phase 2 structure/retopology plan §5.
**Method:** existing island IDs, existing bounding boxes, existing connected-component (face/vert count) data from `BRAINIACT_ISLAND_MAP.json`, the existing Phase 2 island-map renders, and the existing `unknown_islands_closeup_front.png` / `_side.png` targeted material-isolation renders already produced earlier this session. **No new full-character render pass was run.** `unknown_islands_closeup_top.png` from the earlier session was checked and confirmed blank (all-white, pixel extrema `(0,1)` on every channel — a failed render) and was neither relied on nor regenerated.

---

## 1. Why no new render was needed

Two convergent, independent lines of evidence were already on hand for all 5 islands:

1. **Quantitative** — face count, vert count, centroid, bounding box, and bbox diagonal for each island, from the live bmesh scan already recorded in `BRAINIACT_ISLAND_MAP.json`.
2. **Visual** — `unknown_islands_closeup_front.png` and `unknown_islands_closeup_side.png`, both already showing a highlighted (green) fleck at the neck ring / neck-to-collar transition, in the same on-screen location in both views — i.e. a targeted material-isolation render of this exact zone already exists and did not need to be repeated.

Cross-referencing the two against the ribbed neck-ring geometry visible in both closeups (and against the README's approved identity, which specifies a mechanical, ridged/segmented "dark robotic body") was sufficient to classify all 5 islands without a new render.

## 2. Per-island analysis

Flatness ratio = largest `dims_xyz` component ÷ smallest. All 5 sit inside the same neck/collar hotspot (x 0.03–0.10, y 0.05–0.06) that hosts 51 of the 73 debris islands, but split cleanly into two z-sub-bands:

| ID | Faces | Bbox diagonal | Dims (x,y,z mm) | Flatness | Z-band |
|---|---:|---:|---|---:|---|
| 50 | 670 | 3.45 cm | 22.5 × 24.6 × 9.0 | 2.7:1 | lower (z≈0.593) |
| 52 | 518 | 1.22 cm | 8.0 × 9.1 × 1.6 | 5.7:1 | lower (z≈0.589) |
| 53 | 512 | 1.25 cm | 11.4 × 3.3 × 3.8 | 3.5:1 | lower (z≈0.586) |
| 51 | 560 | 1.42 cm | 9.0 × 10.9 × 1.4 | 7.8:1 | upper (z≈0.632) |
| 54 | 499 | 1.05 cm | 7.7 × 6.9 × 1.4 | 5.5:1 | upper (z≈0.633) |

**Lower band (50, 52, 53):** thicker, larger, less flat. Island 50 in particular (670 faces, 3.45 cm bbox, the least-flat of all 5) is too substantial to be seam noise. This band lines up with the ribbed neck-ring geometry visible immediately below the head in both closeup renders — a real, designed mechanical feature (consistent with the README's "dark robotic body" / ridged neck connector visible in the render), not a reconstruction artifact.

**Upper band (51, 54):** thinner, smaller, more extreme flatness ratios (7.8:1 and 5.5:1 — thin shards). Island 54's bbox diagonal (1.05 cm) sits barely above the 1 cm debris cutoff used in Phase 2 §2. Both are consistent in kind (not just location) with the 73 confirmed debris islands — the same duplicate-vertex/non-manifold seam artifact Phase 1 found 18,098 instances of at this exact site — just large enough in face count to have missed the automatic `face_count ≤ 20` debris rule.

## 3. Final classification

| ID | Final classification | Preserve/remove candidate | Confidence | Reason |
|---|---|---|---|---|
| **50** | `neck_ring_rib_segment` — neck/collar/shoulder-joint complex | **Preserve** | Medium | Largest and least-flat of the 5 (670 faces, 2.7:1 ratio); visually corresponds to the ribbed neck-ring geometry confirmed in both closeup renders; too substantial to be seam noise |
| **52** | `neck_ring_rib_segment` — neck/collar/shoulder-joint complex | **Preserve** | Medium-low | Same physical ridge feature as 50/53 (lower z-band), but flatter (5.7:1) and smaller — merge, verify boundary collapses cleanly after the duplicate-vertex weld pass |
| **53** | `neck_ring_rib_segment` — neck/collar/shoulder-joint complex | **Preserve** | Medium | Same lower-band ridge feature as 50/52; moderate flatness (3.5:1) is closer to 50 than to the upper-band pair |
| **51** | Reclassified `debris_candidate` | **Remove** (post-weld verify) | Low-medium | Upper z-band, thin shard (7.8:1 flatness) — same artifact signature as the 73 confirmed debris islands, just above the automatic face-count cutoff |
| **54** | Reclassified `debris_candidate` | **Remove** (post-weld verify) | Low | Smallest of the 5 (499 faces), bbox diagonal (1.05 cm) nearest the 1 cm debris threshold, paired with 51 at the same z-height with the same thin-shard signature |

No island was left unresolved. Both "remove" candidates are explicitly gated on the Phase 2 cleanup plan's own ordering (§5 steps 1–3: weld duplicate vertices first, then re-inspect, then delete) — this document assigns them to the debris pool for that pass, it does not delete anything itself, consistent with Phase 2.1 being a classification step, not an execution step.

## 4. Artifacts updated

- `BRAINIACT_ISLAND_MAP.json` — islands 50/52/53 moved from `unknown` → `classified` (new region `neck_ring_rib_segment`, added to `regions[]` and `classified_ids`); islands 51/54 moved from `unknown` → `debris_candidate` (added to `debris_candidate_ids`); `unknown_ids` emptied; `totals` recomputed (classified 50→53, unknown 5→0, debris 73→75, debris faces 2,741→3,800, debris share 0.14%→0.19%); top-level `phase_2_1_note` added documenting the resolution and method.
- `BRAINIACT_ISLAND_MAP.md` — §1 totals table and §3 "Unknown candidates" section updated in place with the resolution table and pointer to this document.
- `BRAINIACT_PHASE_2_1_UNKNOWN_ISLAND_RESOLUTION.md` — this document (new).

No `.blend` file was opened, modified, or saved. No mesh geometry was welded, merged, or deleted — that execution remains Phase 3 scope per the existing cleanup plan ordering.
