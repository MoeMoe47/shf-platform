# Brainiact — Asset Production Vault

## Official character

**Name:** Brainiact

**Role:** Official SHF Learning Companion for Curriculum and Career Center.

**Approved visual identity:**

- vivid pink human-brain head
- black brain creases/grooves
- glossy dark digital visor/mask
- cyan digital face expressions/text
- dark robotic body
- expressive mechanical limbs
- friendly futuristic character
- recognizable silhouette must remain consistent

This identity is the baseline every derivative asset (optimized mesh, rig, animation, future progression levels) must stay recognizably true to. Nothing in this vault may redesign Brainiact — only derive, optimize, rig, and animate the approved character.

## Master asset policy

`master/BRAINIACT_HI3D_MASTER.glb` is **immutable**.

It may be:

- inspected
- copied into controlled derivative workflows
- imported into Blender

It must **never** be:

- destructively edited
- overwritten
- optimized in place
- retopologized in place
- rigged in place
- served directly as the production website asset
- silently replaced by another model

Any process that touches this file must do so read-only. All real work happens on derivatives.

## Asset lineage

All future Brainiact assets must clearly derive from the master, and lineage must stay traceable even as filenames evolve:

```text
BRAINIACT_HI3D_MASTER.glb
        ↓
BRAINIACT_WORKING.blend
        ↓
BRAINIACT_OPTIMIZED.blend
        ↓
BRAINIACT_RIGGED.blend
        ↓
BRAINIACT_WEB_V1.glb
```

Each derivative's own report (see `reports/`) should note what it was produced from.

## Production rule

The high-resolution master GLB must **not** be loaded directly by:

- Curriculum
- Career Center
- the Brainiact companion runtime (`src/companion/`, `src/components/companion/`)
- any public-facing SHF page

Only a separately optimized, runtime-certified derivative may ever be placed into production web assets (and even then, not directly under `public/` as the 58MB master — a compressed, LOD-appropriate export only).

## Progression rule

Brainiact's future visual progression may include:

- **Level 1** — basic pink brain
- **Level 2** — subtle neural illumination
- **Level 3** — additional neural pathways
- **Level 4** — more sophisticated visor effects
- **Level 5** — advanced Brainiact visual state

Progression represents the student's growing knowledge. Brainiact's canonical silhouette and core identity must remain recognizable across every level — progression adds detail, it never replaces the character.

## Directory structure

```text
assets-source/brainiact/
├── master/           immutable Hi3D source — see policy above
├── blender/           working/optimized/rigged .blend production files
├── textures/           extracted/authored texture sources
├── animations/           standalone animation source data, if separated from .blend files
├── exports/
│   ├── development/     unoptimized/debug GLB exports for internal testing
│   └── production/       runtime-certified, web-optimized GLB exports only
├── reports/           every phase's audit/certification report (.md)
└── README.md           this file
```

## Current status

See `reports/BRAINIACT_MASTER_METADATA.md` for the master's current pipeline status.
