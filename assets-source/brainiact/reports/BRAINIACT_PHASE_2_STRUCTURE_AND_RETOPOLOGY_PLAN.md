# Brainiact — Phase 2 Structure & Retopology Plan

**Depends on:** `BRAINIACT_ISLAND_MAP.md` / `.json` (island classification, this phase), `BRAINIACT_MASTER_AUDIT.md` (Phase 1 forensic audit).
**Working file:** `assets-source/brainiact/blender/BRAINIACT_WORKING.blend` — inspected read-only this session, never saved, never exported.
**Scope of this document:** planning only. No retopology, rigging, animation, texture work, or export happens here — see the "Not started" list at the end.

---

## 1. Rig strategy — rigid / deformation / hybrid by region

This follows directly from Phase 1's recommended path (D-with-C-prerequisite: retopologize to the model's own visible mechanical-segment boundaries, then rig with rigid parenting everywhere except true deformation zones) and refines it using the actual island data from §4 of the island map.

| Class | Regions | Why |
|---|---|---|
| **Rigid** | Brain crown, face/lower head, torso/chest core, hip/pelvis core, both upper arms, both forearms, both lower legs, both feet | These are the model's own designed capsule/shell segments — ball-joint hinges at the boundaries, no smooth deformation needed inside the segment |
| **Deformation** | Neck base, both shoulder sockets, both hip sockets | Confirmed in Phase 1 as the zones needing real skin weighting; these are also where the socket geometry has to blend two rigid masses (torso ↔ limb) rather than rotate as a single rigid unit |
| **Hybrid** | Neck/collar/shoulder ball-joint complex (as a zone), both wrists, both hands+fingers | The neck/collar complex mixes rigid joint balls with the deformation-zone sockets it surrounds, so it's planned as rigid sub-parts on a deforming base. Wrists and hands get a light skin blend at the wrist boundary so finger/hand posing doesn't look like a rigid plug rotating in a socket — consistent with Phase 1's note that hands may need "soft blending at finger/wrist bases if the retopology keeps them continuous," which the island scan confirms it does (fingers are geometrically continuous with the hand, not separate islands) |

This is a direct extension of Phase 1's assessment, not a new conclusion — the island data gives it region-level specificity Phase 1 couldn't (everything was still one fused mesh then).

## 2. Retopology plan

**Primary method:** manual/guided retopology (retopo-over-reference, e.g. Blender's Shrinkwrap + poly-build workflow) using the 2,000,000-tri master as the high-poly reference surface, following the model's own visible mechanical-segment boundaries — not automatic decimation. Phase 1 explicitly rejected blind decimation (Path B) because it would blur joint boundaries and organic brain-fold detail that the approved identity protects.

Per-island retopology handling, informed by §4 of the island map:

- **Brain crown + face/lower-head (11 islands → 1 continuous shell):** re-topologized as one continuous head surface, not 6–11 separate patches. The island fragmentation is a reconstruction/UV-seam artifact, not an intended part boundary — nothing in the visible design (README's approved identity) calls for a segmented brain.
- **Neck/collar/shoulder-joint complex (16 islands + the 5 unknown + the 51 neck-zone debris islands):** the single busiest zone in the mesh. Retopologized last, after the debris/unknown triage in §4 below resolves what's real geometry there.
- **Torso, hip, both arms, both legs, both feet:** each retopologized as its own clean primitive-driven segment (capsules/cylinders at the rigid parts, a simple loop cut at each hinge), directly following the existing island boundaries — these are already well-separated and don't need re-interpretation.
- **Hands+fingers:** retopologized as one continuous low-poly hand mesh with enough edge loops at the knuckles to support the light hybrid skin blend from §1, not as separate finger objects.

### LOD triangle allocation

Built from the Phase 1 targets (LOD0 60–80k, LOD1 25–35k, mobile 12–18k; midpoints used below) distributed by production priority, not by raw current mesh density — the brain gets the largest single share because its crease detail is silhouette-adjacent and explicitly protected by the approved visual identity ("recognizable silhouette must remain consistent"), while rigid limb capsules get the least because they read fine at low density.

| Region | Share | LOD0 (70,000 tri) | LOD1 (30,000 tri) | Mobile (15,000 tri) |
|---|---:|---:|---:|---:|
| Head / brain (crown + face, merged) | 30% | 21,000 | 9,000 | 4,500 |
| Neck / collar / shoulder-joint complex | 10% | 7,000 | 3,000 | 1,500 |
| Torso / chest | 12% | 8,400 | 3,600 | 1,800 |
| Arms (both, upper+forearm+elbow) | 16% | 11,200 (5,600 ea.) | 4,800 (2,400 ea.) | 2,400 (1,200 ea.) |
| Hands + fingers (both) | 12% | 8,400 (4,200 ea.) | 3,600 (1,800 ea.) | 1,800 (900 ea.) |
| Hip / pelvis | 4% | 2,800 | 1,200 | 600 |
| Legs (both, upper+knee+lower) | 10% | 7,000 (3,500 ea.) | 3,000 (1,500 ea.) | 1,500 (750 ea.) |
| Feet (both) | 6% | 4,200 (2,100 ea.) | 1,800 (900 ea.) | 900 (450 ea.) |
| **Total** | 100% | **70,000** | **30,000** | **15,000** |

Visor is intentionally absent from this table — see §4, it isn't separate geometry yet, so it has no independent triangle budget until a Phase 3+ decision is made on whether to give it one.

## 3. Brain-crease preservation strategy

The brain's black creases/grooves are part of the approved visual identity (`README.md`), not incidental sculpt noise, so they get an explicit strategy rather than being left to "whatever the normal map catches":

1. **Merge, don't multiply.** Retopologize the 6-island brain crown into one continuous shell (§2) — the current fragmentation is a reconstruction artifact and has nothing to do with where the real creases run.
2. **Keep the major crease lines as real edge loops in LOD0 and LOD1**, not purely texture/normal-map illusion — the grooves sit close to the silhouette on a mostly-round head, where normal maps alone tend to read as flat under grazing light. A handful of hand-placed crease loops following the master's actual groove pattern preserves the silhouette read at both LODs.
3. **Bake a normal map from the 2,000,000-tri master** (Phase 1's own recommendation) for the fine-grain groove shading the low-poly edge loops can't carry — this supplements the geometry from #2, it doesn't replace it.
4. **Mobile LOD relies more on the normal map and less on geometry** (see the 4,500-tri mobile head budget), but keeps at least the primary top-of-head and side creases as geometry so the silhouette doesn't read as a plain sphere even with the normal map disabled or low-res on weak devices.

## 4. Visor / dynamic-face preparation strategy

**Current state, confirmed by the island scan:** the visor has zero geometric presence. Every island boundary in all 5 island-map renders cuts across the face/head region in the pattern of reconstruction seams, not in any shape resembling a visor. This reconfirms, with harder evidence, Phase 1's finding that the visor's cyan face content is baked directly into the texture on the same continuous head shell as everything else.

**Phase 2 preparation only (no execution):**

- During head retopology (§2), reserve a clean, roughly visor-shaped **UV island** across the face region, separate from the rest of the head's UV layout — even while the geometry stays part of the single continuous head shell. This is what makes a Phase 6 swap possible later without re-touching the brain shell's UVs.
- Flag, for a Phase 3+ decision (not decided here): whether the production rig instead carves the visor out as a **thin separate overlay patch** (a shallow shell offset slightly in front of the face) rather than a UV region on the same surface — that would let Phase 6 drive it with its own material/shader (dynamic cyan expressions) independent of the head's base material. This document only records the option; choosing between "same-surface UV island" and "separate overlay patch" is explicitly Phase 6 (Digital Face System) scope.
- Either option is compatible with the rigid head classification in §1 — the visor moves with the head bone either way, no new deformation zone is implied.

## 5. Cleanup plan

Ordered by dependency, using the island map's debris/unknown findings directly:

1. **Weld duplicate vertices** (18,098 pairs, Phase 1 finding) — concentrated at the same neck/collar seam where 51 of 73 debris islands sit (§2 of the island map). This is almost certainly the same root cause as the debris islands themselves, so doing this first may resolve some of the "debris" automatically rather than requiring manual deletion.
2. **Manually inspect the 5 unknown islands** (IDs 50–54, all in the neck/collar zone) in the Blender viewport — select-linked, isolate, look at each — and decide keep/merge/delete before touching the debris islands around them, since they sit in the same physical space and a wrong debris-deletion pass could take them out by accident.
3. **Delete the 73 debris/internal candidate islands** once #2 confirms they aren't accidentally overlapping legitimate unknown geometry. Combined they're 2,741 faces — 0.14% of the mesh — so this is a safe, low-risk cut once confirmed, not a judgment call with real geometric stakes.
4. **Repair the 35,428 non-manifold edges** (Phase 1 finding) as part of the retopology pass itself, prioritizing the neck/collar zone first since that's both the debris hotspot and one of the two confirmed deformation zones — non-manifold geometry there is the highest-risk spot for skinning to fail.
5. **Fix the 50 zero-area/degenerate faces** (Phase 1 finding) — likely overlapping the same neck-zone hotspot; verify during #4 rather than as a separate pass.
6. **All of the above happens only on `Brainiact_Working`** in the `BRAINIACT_PRODUCTION_WORKING` collection. The untouched `geometry_0` copy in `BRAINIACT_SOURCE_REFERENCE` stays exactly as imported, so there's always a clean reference to diff against or restart from.

## 6. Verification of `BRAINIACT_WORKING.blend`

Confirmed this session via a live, read-only Blender scan (`/Applications/Blender.app/Contents/MacOS/Blender --factory-startup --background`, per the required invocation — the file opens cleanly, matching the independently-confirmed `BRAINIACT_WORKING_OPEN_OK 5` check):

| Check | Result |
|---|---|
| File opens without error | Yes |
| Collections present | `BRAINIACT_PRODUCTION_WORKING`, `BRAINIACT_SOURCE_REFERENCE` — confirms the non-destructive working structure is already correctly set up |
| Source reference preserved | Yes — `geometry_0` in `BRAINIACT_SOURCE_REFERENCE` still has 1,017,842 verts / 2,000,000 faces, matching the Phase 1 master audit exactly |
| Working object present | `Brainiact_Working` in `BRAINIACT_PRODUCTION_WORKING`, same vertex/face counts as the source reference (no retopology has happened yet, as expected) |
| Island count re-scan | **128** — matches Phase 1's forensic audit and the previously confirmed Phase 2 finding exactly |
| Material | 1 material slot (`pbr_material`), consistent with Phase 1 |
| Transform | Working object re-origined to floor (Z 0.0–1.0), matching Phase 1's rigging recommendation — already applied |
| File modified this session | **No** — every script used only ran read-only bmesh queries; `bpy.ops.wm.save_mainfile` was never called |

## 7. Not started (explicitly out of Phase 2 scope)

Full retopology execution, rigging, animation, texture downscaling, production GLB export, Three.js integration, Curriculum integration, Career integration. This document is the plan those phases execute against, not the execution itself.
