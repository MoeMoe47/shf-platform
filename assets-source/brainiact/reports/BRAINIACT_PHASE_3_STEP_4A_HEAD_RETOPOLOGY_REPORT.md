# Brainiact — Phase 3, Step 4A: Head / Brain / Visor Retopology

**Status: NOT CERTIFIED.** Honest report of what was attempted, what a scriptable technique actually produced, and where it falls short of the acceptance gates — with visual evidence, not just numbers.

---

## 1. What this step could and couldn't do

This prompt asks for interactive Blender work: Poly Build, Knife, manual loop placement while repeatedly comparing the viewport against the source from five angles. That requires a human (or a tool with real mouse/keyboard GUI control and live visual judgment) working inside Blender's window. This agent has no GUI-automation capability for native macOS apps — there is no way to actually drive `open -a Blender` interactively. Rather than pretend otherwise, this step used the one method from Step 3's own certified plan that *is* legitimately scriptable — **shrinkwrap-assisted reconstruction** — built the best honest version of it, rendered real comparison images, and is reporting exactly what it did and didn't achieve.

## 2. Checkpoint File

Created `assets-source/brainiact/blender/BRAINIACT_HEAD_RETOPOLOGY_WORKING.blend` from `BRAINIACT_LOD0_BUILD.blend` (mutated only in memory, saved only to the new path — the source file was never targeted by a save call). Checksums verified unchanged on all four protected files before and after:

| File | Unchanged |
|---|---|
| `BRAINIACT_HI3D_MASTER.glb` | Yes |
| `BRAINIACT_WORKING.blend` | Yes |
| `BRAINIACT_RETOPOLOGY_WORKING.blend` | Yes |
| `BRAINIACT_LOD0_BUILD.blend` | Yes |

Created collection `BRAINIACT_HEAD_RETOPO_WORKING` (under `BRAINIACT_PHASE_3`) holding the new `Brainiact_HEAD_LOD0` object. The source `Brainiact_HEAD` object remains present, visible, and was set `hide_select = True` (non-editable reference), per the instruction.

## 3. Method Used

1. Built a UV-sphere cage (140 × 92 segments) scaled to `Brainiact_HEAD`'s exact bounding box (0.4554 × 0.4086 × 0.3802 m).
2. Deleted the bottom-pole cap faces (below the source's own lowest Z extent, z=0.6193) to leave the cage **open** at the neck — matching Step 3's seam requirement (§ "do not repeat the Step 2 global-weld mistake") and confirmed by inspecting the real source: `Brainiact_HEAD` itself is not one continuous shell — it's still 11 disconnected patches (the original brain-crown + face-lower-head islands, never merged since Step 2/3 only classified them, never retopologized them), with 11 separate boundary loops totaling 11,225 boundary edges. Shrinkwrap doesn't require manifold/connected input (unlike QuadriFlow, which failed for exactly this reason in Step 4), so this was a valid target.
3. Applied a `SHRINKWRAP` modifier (`NEAREST_SURFACEPOINT`, 0.5mm offset) targeting `Brainiact_HEAD`, evaluated via the depsgraph, and baked the result into a new mesh (the equivalent of "Apply Modifier").
4. Cleanup: welded 25 near-duplicate vertices at the sphere's pole convergence point, ran `dissolve_degenerate`, and removed 6 residual zero-area faces.
5. Rendered real comparison images (Workbench, solid + cavity shading, no textures) — front and side views of both the source and the result — to visually check fold/visor readability, not just report numbers. Saved to `assets-source/brainiact/reports/phase-3-step4a-images/`.

## 4. Triangle Counts

Step 3 merged Brain + Head-Frame + Visor into one continuous `HEAD` shell (no seam between them, by certified design) — so there is no structural "brain vs. head-frame vs. visor" split to report separately; the single `Brainiact_HEAD_LOD0` object covers all three.

| | Triangles |
|---|---:|
| Combined (Brain + Head Frame + Visor) | **21,682** |
| Step 3 certified target | 21,000 |
| Deviation | +3.2% (small, not flagged as an issue) |

## 5. Topology Health

| Check | Result |
|---|---|
| Vertices / Faces / Triangles | 12,717 / 10,907 / 21,682 |
| Loose vertices | 0 |
| Zero-area faces | 0 |
| Duplicate vertices (@ 1 micron) | 0 |
| Non-manifold overlap edges (>2 linked faces) | 0 |
| Boundary edges | 162 — forms exactly one clean ring (the neck opening), not multiple stray holes |
| Dimensional deviation vs. source `Brainiact_HEAD` bbox | X 0.25%, Y 0.32%, Z 0.14% |

Topology-health-wise, this is a clean result and a genuine improvement over the source (0 non-manifold edges vs. the source's fragmented 11-island, 11,225-boundary-edge state; one intentional open boundary at the neck, matching Step 3's seam strategy). **But clean topology is not the same as correct topology for this asset** — see §6.

## 6. Visual Comparison (real renders, not assumed)

Rendered (Workbench solid+cavity shading, 700×700, <3 seconds total, well inside the 120s/view limit):

- `phase-3-step4a-images/source_head_front.png` / `lod0_head_front.png`
- `phase-3-step4a-images/source_head_side.png` / `lod0_head_side.png`

**What the source shows:** a clearly recognizable brain dome with distinct, deep folds; a separate visor/face plate with two eye-slot recesses, an ear-disc detail on each side, and a clean rounded-rectangle framing boundary between the brain and the plate.

**What the shrinkwrap result shows:**
- **Brain dome (upper ~2/3):** partial success. The overall rounded silhouette and some large lobe bumps are visible — it reads as an organic, bumpy dome, not a smooth sphere. But the specific fold *pattern* Brainiact is known for is lost; it reads as a generic "cauliflower" texture rather than the source's distinctive groove layout. This is a direct consequence of the cage having no deliberately-placed crease edge loops — `NEAREST_SURFACEPOINT` shrinkwrap only captures whatever bump happens to be nearest each cage vertex, with no control over aligning edges to actual valleys.
- **Head frame / visor (lower ~1/3): failure, not just imperfection.** The face plate is **not represented at all** — in its place is a blank, faceted wedge shape with no eye slots, no ear-disc detail, and no rounded-rectangle framing. This is a structural limitation of the technique, not a resolution problem: the visor is a **concave recessed** surface, and `NEAREST_SURFACEPOINT` projection is unstable for concave detail at this cage density — sphere vertices near that region snap to whichever surface point is nearest in 3D space, which for a shallow recess is often the surrounding rim, not the recess itself. A generic sphere is also structurally the wrong primitive for a flat, rounded-rectangle plate with cutouts (Step 3 §7 already called for the head-frame/visor to use hard-surface/primitive-driven construction, not a spherical organic cage — this result confirms why that distinction matters).

**Conclusion: this technique captures the brain's general silhouette adequately but not its fold identity, and completely fails to capture the visor/head-frame.** A two-stage approach (a dedicated flat/rounded-rectangle primitive shrinkwrapped separately to just the face-plate region, merged with the brain dome) would likely fix the visor absence, but still would not solve the fold-fidelity problem — that requires actual crease-aligned edge loops, which requires either manual placement or a much more sophisticated feature-aware remeshing algorithm than what's scriptable here. This was not attempted given the clear, already-demonstrated ceiling on visual fidelity for this style of blind automated pass.

## 7. Visual Acceptance Gates

| # | Gate | Result |
|---|---|---|
| 1 | Immediately recognizable as Brainiact | **FAIL** — the missing visor alone would make this unrecognizable from the front; see renders |
| 2 | Brain silhouette matches source | **PARTIAL** — overall dome shape and dimensions match closely (<0.5% deviation); the source's specific silhouette-defining fold *pattern* does not |
| 3 | Major folds remain readable | **FAIL** — some bump texture is visible but does not read as Brainiact's specific fold pattern |
| 4 | Visor silhouette matches source | **FAIL** — no visor geometry is present at all |
| 5 | Head proportions remain faithful | **PASS** — bbox dimensions within 0.32% of source |
| 6 | Neck articulation remains open/usable | **PASS** — single clean 162-edge boundary ring at the neck, not sealed |
| 7 | No major visible reconstruction artifacts | **PASS** — 0 non-manifold edges, 0 zero-area faces, 0 duplicate verts |
| 8 | Topology substantially cleaner than source | **PASS** — source `Brainiact_HEAD` has 11,225 boundary edges across 11 disconnected patches; the result has one 162-edge boundary loop |
| 9 | Triangle count within/close to budget | **PASS** — 21,682 vs. 21,000 target (+3.2%) |
| 10 | Source reference untouched | **PASS** — verified via checksum and in-file inspection |

**4 of 10 gates fail or partially fail, including the two most important ones (recognizability and visor fidelity). This cannot be certified.**

## 8. Known Imperfections / Deferred Detail

- Visor/face-plate geometry: **entirely absent**, needs to be built as a separate hard-surface primitive (flat rounded-rectangle base + eye-slot cutouts), not derived from this sphere cage.
- Brain fold fidelity: readable as "an organic bumpy dome" but not as Brainiact's specific fold pattern; needs deliberate crease-aligned edge loops, which requires either manual placement or visual reference against the actual master geometry per-fold (neither performed here).
- The pole-convergence area (top of the dome) has a small triangle fan from the UV-sphere's original topology — acceptable for a low-poly base but not ideal edge flow for a hero asset.

## 9. Next-Step Recommendation

The visor's absence and the fold-fidelity gap are not fixable by re-running this same automated technique with different parameters — they're limitations of the technique itself (spherical shrinkwrap has no way to represent concave recessed detail or align edges to specific creases without human-guided placement). Realistic next steps, in order of likely payoff:

1. **Interactive artist pass** (the original recommendation from Step 4) remains the only path to a genuinely certifiable result — using `Brainiact_HEAD_LOD0` from this step as a rough starting cage is plausible, but the visor region should likely be rebuilt from scratch as a separate primitive rather than edited from this result.
2. If more automation is wanted before that: a two-stage build (separate flat-primitive cage for the visor/face-plate region, shrinkwrapped independently, then joined to the brain dome) would likely fix gate 4 but not gates 1 or 3.
3. Fold fidelity fundamentally needs either manual edge-loop placement against the real crease pattern, or a genuinely feature-aware remeshing tool (not available in this pipeline).

## 10. Artifacts

- `assets-source/brainiact/blender/BRAINIACT_HEAD_RETOPOLOGY_WORKING.blend` — checkpoint file with `Brainiact_HEAD_LOD0` (21,682 tri shrinkwrap result) alongside the untouched source.
- `assets-source/brainiact/reports/phase-3-step4a-images/` — 4 real comparison renders (source vs. result, front + side).
- `assets-source/brainiact/reports/BRAINIACT_PHASE_3_STEP_4A_HEAD_RETOPOLOGY_REPORT.md` — this document.

`BRAINIACT_LOD0_BUILD.blend`, `BRAINIACT_RETOPOLOGY_WORKING.blend`, `BRAINIACT_WORKING.blend`, and the immutable master were never modified (checksum-verified in §2 and reconfirmed after the final save).
