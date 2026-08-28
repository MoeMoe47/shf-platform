# Brainiact — Phase 3, Step 1: Protected Retopology Working Environment

**Scope:** establishes the Phase 3 Blender working file and collection architecture only. No cleanup, weld, retopology, decimation, separation, rigging, animation, texture optimization, or export happened in this step.

---

## Environment

| Field | Value |
|---|---|
| Project root | `/Users/mikeslate/Projects/shrv1` |
| Branch | `v1.2-development` |
| Blender executable | `/Applications/Blender.app/Contents/MacOS/Blender` (not the `/usr/local/bin/blender` symlink) |
| Blender version | 4.5.12 LTS (hash `84afd5f785f7`, built 2026-07-21) |
| Factory-startup status | Used for every invocation (`--factory-startup --background`) |

## Source Integrity

| Field | Value |
|---|---|
| Master path | `assets-source/brainiact/master/BRAINIACT_HI3D_MASTER.glb` |
| Master SHA-256 before | `d669f27b25d3a91812057245fdc316fd053bf6425ffa20321455339ccbd2d387` |
| Master SHA-256 after | `d669f27b25d3a91812057245fdc316fd053bf6425ffa20321455339ccbd2d387` |
| Master unchanged | **YES** |
| Phase 2 working path | `assets-source/brainiact/blender/BRAINIACT_WORKING.blend` |
| Phase 2 SHA-256 before | `e44c6960b5fcf76c15275935dcb7e61bcd1f70ce6c9b41c5d9cf9f4778b49858` |
| Phase 2 SHA-256 after | `e44c6960b5fcf76c15275935dcb7e61bcd1f70ce6c9b41c5d9cf9f4778b49858` |
| Phase 2 unchanged | **YES** |

## Phase 3 File

| Field | Value |
|---|---|
| Path | `assets-source/brainiact/blender/BRAINIACT_RETOPOLOGY_WORKING.blend` |
| Created | Yes, via `bpy.ops.wm.save_as_mainfile(filepath=..., copy=True)` from `BRAINIACT_WORKING.blend`, then restructured and saved with `copy=False` to the same new path (original working file was never targeted by a save call) |
| File size | 506 MB (grew from 341 MB due to the independent `BRAINIACT_LOD0_WORKING` duplicate — expected, not a defect) |
| SHA-256 | `008ce5cf268c3eb74ad3151c1abc87049923f43529e4c758051c4369befbc2e5` |
| Reopen test | **YES** — independently reopened via `--factory-startup --background <file> --python-expr "..."`, printed `BRAINIACT_PHASE3_OPEN_OK 6` (6 objects, matching the post-restructure baseline) |

## Collection Architecture

```text
Scene Collection
└── BRAINIACT_PHASE_3
    ├── BRAINIACT_SOURCE_REFERENCE   (geometry_0, Node_0, world — untouched Phase 1 source; hide_select=True on the mesh)
    ├── BRAINIACT_PHASE2_REFERENCE   (Brainiact_Phase2_Reference — the certified Phase 2 geometry, renamed from Brainiact_Working; hide_select=True; never mutated in future Phase 3 steps)
    ├── BRAINIACT_LOD0_WORKING       (Brainiact_LOD0_Working — independent, non-linked duplicate of the Phase 2 geometry; the only object authorized for mutation in future Phase 3 steps; not mutated in this step)
    ├── BRAINIACT_TEMP_ANALYSIS      (empty, reserved for future analysis/helper objects)
    └── BRAINIACT_DIAGNOSTICS        (VizCam — moved here from the old top-level Scene Collection)
```

**Naming note (evidence-based adjustment):** the Phase 2 file's original object name `Brainiact_Working` was renamed to `Brainiact_Phase2_Reference` (and its mesh datablock to `Brainiact_Phase2_Reference_Mesh`) to remove the ambiguity between "the Phase 2 working object" and "the Phase 3 working object" now that both exist side by side. The old `BRAINIACT_PRODUCTION_WORKING` collection (now empty after its one object was moved) was removed since the required architecture doesn't include it and an empty leftover collection would be confusing. Neither change touched mesh geometry.

## Baseline Geometry

Measured directly on `Brainiact_LOD0_Working` after the restructure (matches `Brainiact_Phase2_Reference` exactly — see Equality Check):

| Metric | Value |
|---|---:|
| Objects (total, whole file) | 6 |
| Meshes (total, whole file) | 3 (`geometry_0`'s mesh, `Brainiact_Phase2_Reference_Mesh`, `Brainiact_LOD0_Working_Mesh`) |
| Vertices | 1,017,842 |
| Edges | 3,017,714 |
| Faces | 2,000,000 |
| Triangles | 2,000,000 |
| Materials | 1 (`pbr_material`) |
| Textures (FILE-source images) | 2 (`Image_0`, `Image_1`, both 8192×8192) |
| UV channels | 1 (`UVMap`) |
| Dimensions | 0.6643 × 0.5929 × 1.0 m |
| Bounding box (world Z) | −0.0000015 to 0.9999985 m (grounded at floor) |
| Scale | 1.0, 1.0, 1.0 |
| Orientation | Location (0,0,0), rotation (0°,0°,0°) — unchanged from Phase 2, Z-up, grounded at feet |

These figures reconfirm the Phase 1 forensic audit's 1,017,842 verts / 3,017,714 edges / 2,000,000 triangles / 1 material / 2×8192×8192 textures exactly — no discrepancy to explain.

Island count, non-manifold edge count, duplicate-vertex-pair count, and degenerate-face count were **not** re-measured in this step — those are unchanged-geometry facts already certified in Phase 2 / Phase 2.1 and re-scanning them here would be redundant work outside Step 1's scope (environment setup, not diagnostics).

## Equality Check

`BRAINIACT_PHASE2_REFERENCE` (`Brainiact_Phase2_Reference`) vs. `BRAINIACT_LOD0_WORKING` (`Brainiact_LOD0_Working`):

| Check | Result |
|---|---|
| Vertex count | Match (1,017,842 = 1,017,842) |
| Edge count | Match (3,017,714 = 3,017,714) |
| Face count | Match (2,000,000 = 2,000,000) |
| Triangle count | Match |
| Dimensions | Match (0.6643028259277344, 0.5928590297698975, 1.0) |
| Transforms (location/rotation/scale) | Match (all identity/zero on both) |
| Material assignment | Match (`pbr_material` on both) |
| UV presence | Match (`UVMap` on both) |
| Local bounding box | Match (identical 8-corner bbox) |

**Geometrically equivalent: YES.** Zero intentional or unintentional geometry reduction occurred in Step 1.

## Mutation Status

| Operation | Performed |
|---|---|
| Cleanup performed | NO |
| Debris removed | NO |
| Vertices welded | NO |
| Retopology performed | NO |
| Decimation performed | NO |
| Rigging performed | NO |
| Animation performed | NO |
| Texture modification performed | NO |
| GLB export performed | NO |

The only operations performed were: file copy (save-as), collection creation/linking, object renaming, one non-destructive full-mesh duplication (to populate `BRAINIACT_LOD0_WORKING` as an independent copy), `hide_select` flags on the two reference collections, and moving `VizCam` into `BRAINIACT_DIAGNOSTICS`. No vertex, edge, or face data was added, removed, merged, or altered on any mesh.

## Renders

None produced. Step 1 required no visual/beauty renders — all verification was done via direct Blender data-API inspection (per the Performance/Stability Rule), avoiding the render-hang problem from earlier phases.
