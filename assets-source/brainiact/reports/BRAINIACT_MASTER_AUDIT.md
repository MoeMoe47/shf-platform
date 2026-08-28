# Brainiact — Phase 1 Forensic 3D Audit

**Master inspected:** `assets-source/brainiact/master/BRAINIACT_HI3D_MASTER.glb`
**SHA-256:** `d669f27b25d3a91812057245fdc316fd053bf6425ffa20321455339ccbd2d387` (confirmed match, master untouched)
**Tool:** Blender 4.5.12 LTS, `--background --python`, read-only inspection script (never saved, never exported, never modified the source file)
**Machine-readable companion:** `BRAINIACT_MASTER_AUDIT.json`
**Diagnostic renders:** `phase-1-images/` (13 images — see note on the wireframe pass below)

This is an inspection-only report. No geometry, materials, or textures were changed. Everything below is either a direct measurement from Blender's own mesh/scene data, or an observation from the rendered diagnostic images — nothing is guessed. Anything not determinable is marked **NOT VERIFIED**.

---

## File / scene structure

| # | Item | Value |
|---|---|---|
| 1 | GLB version | 2 |
| 2 | Exact file size | 61,090,172 bytes (~58 MB) |
| 3 | Scene count | 1 |
| 4 | Collection count | 0 (objects live directly in the scene's root collection) |
| 5 | Node count | 3 (`geometry_0` [mesh], `Node_0` [empty], `world` [empty] — typical of an AI/reconstruction export's transform wrapper, not evidence of body-part separation) |
| 6 | Object count | 3 |
| 7 | Mesh object count | **1** |
| 8 | Primitive/material-slot count | 1 |

## Geometry

| # | Item | Value |
|---|---|---|
| 9 | Total vertices | 1,017,842 |
| 10 | Total edges | 3,017,714 |
| 11 | Total polygons/faces | 2,000,000 |
| 12 | Total triangulated triangles | 2,000,000 (faces are already triangles) |
| 13 | Per-object vertex/triangle count | Same as totals — there is only one mesh object (`geometry_0` / `Mesh_0`) |
| 14 | Per-object triangle count | 2,000,000 (see above) |
| 15 | Topology density distribution | Cannot be broken out numerically per body region — everything is one fused mesh/object, so Blender reports one aggregate count. Visual inspection (below) shows the brain's organic fold sculpting is clearly far denser than the smooth mechanical body segments, but that split isn't quantifiable without first separating the geometry (Phase 2 scope) |

The exact round number (2,000,000 faces) strongly suggests a triangle budget/cap applied by the Hi3D export pipeline itself, not an organic count.

## Materials / textures

| # | Item | Value |
|---|---|---|
| 16 | Material count | 1 (`pbr_material`) |
| 17 | Image count | 2 |
| 18 | Texture count | 2 |
| 19 | Texture dimensions | **8192 × 8192** for both images |
| 20 | Texture formats | JPEG |
| 21 | Embedded vs external | Both embedded (packed) in the GLB |
| 22 | UV maps | 1 per mesh |
| 23 | UV channels | 1 |
| 24 | Normals | Present |
| 25 | Custom split normals | **Yes** (`has_custom_normals: True`) |
| 26 | Tangents | NOT VERIFIED (not exposed by this inspection path — glTF tangents are typically generated at import/export time, not stored as a queryable mesh property in this API) |

Two 8192×8192 JPEGs is a serious web-performance problem on its own: at full resolution and uncompressed in GPU memory, that's roughly **256 MB of texture memory per image, ~512 MB combined** — before the mesh even factors in. This is the single most urgent optimization target, more urgent than the triangle count.

## Transform / dimensions

| # | Item | Value |
|---|---|---|
| 27 | Model dimensions X/Y/Z | 0.664 m × 0.593 m × 1.0 m |
| 28 | Object transforms | Location (0,0,0), rotation (0,0,0), scale (1,1,1) — clean, unbaked transform |
| 29 | Scale | 1.0 (no unusual scale factor) |
| 30 | Rotation | 0° on all axes |
| 31 | Orientation | Z-up, standing upright, front-facing toward −Y (consistent with the rendered front view) |
| 32 | Ground contact | Model spans Z from −0.5 to +0.5 — **origin sits at the model's vertical center, not at the feet.** Will need re-origining to floor level before rigging (standard for a character root bone) |
| 33 | Origin location | World center of the bounding box (0, 0, 0) |
| 34 | Bounding box | min (−0.332, −0.296, −0.5), max (0.332, 0.296, 0.5) |

## Rigging

| # | Item | Value |
|---|---|---|
| 35 | Armature exists | **NO** |
| 36 | Bone count | 0 |
| 37 | Vertex groups | 0 |
| 38 | Skin modifiers | None |
| 39 | Skin weights | None (nothing to weight — no armature, no vertex groups) |
| 40 | IK constraints | 0 |
| 41 | Rig controls | None |

The master is a completely unrigged static mesh. This was expected — Hi3D-style reconstruction pipelines produce geometry, not rigs.

## Animation

| # | Item | Value |
|---|---|---|
| 42 | Animation actions | 0 |
| 43 | NLA tracks | 0 |
| 44 | Animation clips | 0 |
| 45 | Animation duration | N/A |
| 46 | Shape keys / morph targets | 0 |

## Character separability

| # | Item | Value |
|---|---|---|
| 47 | Is Brainiact one fused mesh? | **YES** — one mesh object, one mesh data-block, one material |
| 48 | Are major body regions separable by disconnected geometry? | **Partially, geometrically** — the single mesh contains **128 disconnected connected-components ("islands")** internally (confirmed via bmesh face-adjacency BFS). It is not one continuous connected surface, even though it's one Blender object |
| 49-56 | Brain / visor / torso / arms / hands / fingers / legs / feet independently addressable? | **NOT addressable today by name or object structure** — there is exactly one object (`geometry_0`), one mesh, one material slot, and no vertex groups, so nothing can currently be selected or driven per body part through the file's own structure. **Visually**, the diagnostic renders show a clearly *designed* segmented mechanical character — ball-joint connectors at the shoulders, elbows, wrists, hips, knees, and ankles, and individually sculpted fingers on each hand (see `phase-1-images/shoulder_elbow_closeup.png` and `hand_closeup.png`). Given 128 islands exist and the visual design is this cleanly segmented, it is plausible many islands correspond 1:1 with these visible parts — but confirming which specific islands map to which body part requires per-island bounding-box/selection work inside Blender's UI, which is Phase 2 working-file scope, not this read-only audit. Marked **NOT VERIFIED** as a *confirmed mapping*, while the underlying island count and visual segmentation are both confirmed facts |

## Mesh health

| # | Item | Value |
|---|---|---|
| 57 | Non-manifold geometry | **35,428 non-manifold edges** — significant, will block clean skinning/deformation until repaired |
| 58 | Loose geometry | **0 loose vertices, 0 loose edges** — none found |
| 59 | Duplicate vertices | **18,098 duplicate vertex pairs** within a 0.0001 tolerance — will need welding |
| 60 | Degenerate faces | **50 zero-area faces** — minor, but present |
| 61 | Internal/hidden geometry | NOT VERIFIED — detecting fully-enclosed internal geometry reliably needs ray-cast-based hidden-geometry analysis this script didn't perform |
| 62 | Flipped normals | NOT VERIFIED — `has_custom_normals` confirms authored normal data exists, but this script didn't cross-check face-normal winding consistency across the whole mesh |
| 63 | Extreme topology concentration | Visually evident (brain sculpt reads as far denser than the smooth mechanical body segments) but not quantifiable per-region while everything remains one fused object |
| 64 | Obvious Hi3D decimation artifacts | NOT VERIFIED at render distance/resolution used — the Freestyle wireframe pass did not actually produce visible edge overlays (see note below), so no true close-up topology inspection was possible this pass |
| 65 | Areas likely to deform poorly | Every rig-critical zone (neck, shoulders, elbows, wrists, fingers, hips, knees, ankles) currently sits inside the same dense, non-manifold, duplicate-vertex-laden single mesh with zero vertex groups — **none of them can deform reliably in the mesh's current state**. This is the central reason retopology has to happen before rigging, not a defect isolated to one area |

**Note on the wireframe renders:** the `*_wireframe.png` files in `phase-1-images/` did not actually render visible wireframe overlays — the script's Freestyle pass hit an internal Blender error (`AttributeError: 'NoneType' object has no attribute 'use_chaining'` in Blender's own `parameter_editor.py`, because no `FreestyleLineStyle`/`LineSet` was explicitly configured on a fresh factory-reset scene) and silently fell back to a plain solid-shaded render. They are visually identical to their non-wireframe counterparts. This is being reported honestly rather than treated as a successful wireframe capture; all topology conclusions above come from the bmesh measurements, not from a visual wireframe.

---

## Rigging feasibility assessment

**Direct skinning of the current topology is not practical.** There is no armature, no vertex groups, and the mesh itself has 35,428 non-manifold edges and 18,098 duplicate-vertex pairs — weight-painting onto this geometry as-is would be unreliable even before accounting for its 2-million-triangle web-performance cost.

However, the character's **own design is unusually favorable** for rigging once cleaned up. The diagnostic renders show clear, deliberate mechanical segmentation: ball-joint connectors at every major hinge (shoulders, elbows, wrists, hips, knees, ankles), a segmented neck, and individually modeled fingers with visible knuckle joints. This is not an organic character requiring smooth deformation everywhere — much of it reads as rigid capsule/cylinder segments meant to rotate at discrete joints, which is exactly the geometry a **rigid mechanical rig** (bone-parented, minimal-to-no smooth skin blending) handles best, at far lower rigging risk and cost than full organic deformation. Real deformation is likely only needed at a handful of places: the neck base, and possibly soft blending at finger/wrist bases if the retopology keeps them continuous.

Likely deformation zones needing real attention during retopology: neck, shoulder sockets, hip sockets — everywhere else appears designed to hinge rigidly.

## Web readiness

**Not web-ready today.** A 58 MB file with 2,000,000 triangles and two 8192×8192 embedded JPEGs cannot be shipped to a browser, let alone a student laptop, Chromebook, tablet, or phone. Every dimension of the asset (mesh, textures) needs reduction before Phase 8's production export.

---

## Recommended production path

### **D — Separate major components and use a hybrid mechanical/deformation rig, built on a full retopology pass (Path C) first**

This is not a pure "D" in isolation — it requires C's retopology work as a prerequisite, because there is currently no clean per-part topology to separate. The combined path is:

1. Retopologize the fused mesh into clean, low-poly geometry that explicitly recreates the model's own visible segment boundaries (head/brain, visor, neck, torso, and per-limb: shoulder → upper arm → forearm → hand → fingers; hip → upper leg → lower leg → foot).
2. Rig with a hybrid approach — rigid bone parenting for the mechanical capsule segments (no smooth blend needed), real skin weighting only at the true deformation zones (neck, shoulder/hip sockets).

**Why this path, and not the others:**

- **A (rig existing topology directly) — rejected.** 2,000,000 triangles, zero vertex groups, 35,428 non-manifold edges, 18,098 duplicate vertices. Not skinnable as-is, and even if it were, it would be catastrophic for web performance.
- **B (decimate then rig) — rejected.** Blind decimation doesn't fix non-manifold edges or duplicate vertices, and risks blurring the crisp joint boundaries and organic brain-fold detail that make this character recognizable — both of which the approved identity explicitly protects ("recognizable silhouette must remain consistent").
- **C alone (retopologize, then rig organically) — insufficient.** This would ignore the character's own visible mechanical-segment design language and default to uniform organic deformation everywhere, which is more rigging work and more deformation risk than the design calls for.
- **D alone — not possible yet.** There's nothing to separate: one mesh, one material, zero vertex groups. D can only happen after a retopology pass establishes real per-part boundaries.

**Risks:** the biggest one is losing brain-fold definition and the visor's cyan detail during retopology if the low-poly bake isn't paired with a proper high-to-low normal-map bake from this master. The 128-island structure is a promising sign the segmentation will map cleanly, but that needs confirming by hand in the Blender working file (Phase 2), not assumed here.

**Expected visual preservation:** high, provided normal/detail baking is done deliberately for the brain and visor (see Phase 4 scope).

**Expected rig quality:** high for the mechanical segments (rigid parenting is simple and robust), moderate complexity only at the few true deformation zones.

**Expected web-performance benefit:** very large — going from 2,000,000 triangles / ~58 MB / two 8192×8192 textures to the targets below is roughly a 20-30x reduction in geometry and up to two orders of magnitude in texture memory.

---

## Recommended optimization targets

| Target | Value |
|---|---|
| LOD0 triangles | 60,000 – 80,000 |
| LOD1 triangles | 25,000 – 35,000 |
| Mobile LOD triangles | 12,000 – 18,000 |
| Texture target | 2048 × 2048 base color, plus a baked normal map (from this 2M-tri master) to keep the brain folds and visor detail readable at low poly |
| Mobile texture target | 1024 × 1024 (512 × 512 as a hard low-end fallback) |
| Target production GLB size | 3 – 5 MB |
| Maximum acceptable first-pass size | 10 MB |

No optimization was performed — these are recommendations only, per the Phase 1 scope boundary.

---

## Summary for the next phase

The master is a legitimate, on-identity Brainiact asset (confirmed visually against every point of the approved visual identity: pink brain with visible creases, glossy dark visor with cyan digital text/eyes, dark robotic body, articulated mechanical limbs). It is also, structurally, a dense unrigged single-mesh export with real mesh-health issues that must be resolved before rigging can begin. Phase 2 should proceed to establish the Blender working file and begin retopology planning informed by this audit's island count and the visible mechanical-segment design.

One finding worth flagging now for Phase 6 (Digital Face System): the visor's "LET'S GROW" text and eye expression are **baked directly into the texture**, not a separate, swappable surface — Phase 6 will need to replace this with a genuinely dynamic solution, not just note it as already solved.
