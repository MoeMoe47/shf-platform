# Batch 4 Staging Review

Generated: 2026-06-14

This is a staging review only. No `git add`, commit, restore, reset, delete, or move action was performed as part of this review.

## Scope

Batch 4 from `docs/GIT_STAGING_PLAN.json` is `Approved active SHF/WebMaker files`.

- Plan entry count: 11
- Concrete file count: 25
- Risk level: high
- Purpose: Review approved active SHF/WebMaker/Identity/Ops files before staging.

Owner decision: These files are approved to keep as active work. None should be archived, reverted, moved, or deleted. BuilderHub is the admin/internal control surface. WebMakerPage is the public/user-facing builder page. `web-maker.css` remains the shared current stylesheet for now.

## Concrete File List

| Status | Tracked | File | Ownership / purpose |
|---|---:|---|---|
| `M` | yes | `src/entries/index.main.jsx` | WebMaker public route entrypoint |
| `M` | yes | `src/pages/admin/BuilderHub.jsx` | BuilderHub admin/internal control surface |
| `M` | yes | `src/pages/shf-command/SHFImpactCommandCenter.jsx` | SHF Impact Command Center |
| `M` | yes | `src/pages/shf-command/components/SHFImpactOhioMap.jsx` | SHF Impact Ohio Map |
| `M` | yes | `src/pages/shf-command/components/shf-impact-ohio-map.css` | SHF Impact Ohio Map styling |
| `M` | yes | `src/system/identity/hubAccessControl.js` | Identity / access routing |
| `M` | yes | `src/system/identity/identityRouting.js` | Identity / access routing |
| `??` | no | `src/data/shfImpactData.js` | SHF Impact Data Spine |
| `??` | no | `src/pages/admin/ops/OpsAssetGovernance.jsx` | Admin Ops |
| `??` | no | `src/pages/admin/ops/OpsBrandProfile.jsx` | Admin Ops |
| `??` | no | `src/pages/admin/ops/OpsBuildPacket.jsx` | Admin Ops |
| `??` | no | `src/pages/admin/ops/OpsDataBinding.jsx` | Admin Ops |
| `??` | no | `src/pages/admin/ops/OpsLayoutBlueprint.jsx` | Admin Ops |
| `??` | no | `src/pages/admin/ops/OpsLearningDashboard.jsx` | Admin Ops |
| `??` | no | `src/pages/admin/ops/OpsMockReview.jsx` | Admin Ops |
| `??` | no | `src/pages/admin/ops/OpsPageIntent.jsx` | Admin Ops |
| `??` | no | `src/pages/admin/ops/OpsProductionDashboard.jsx` | Admin Ops |
| `??` | no | `src/pages/admin/ops/OpsProjectSetup.jsx` | Admin Ops |
| `??` | no | `src/pages/admin/ops/OpsScreenshotQA.jsx` | Admin Ops |
| `??` | no | `src/pages/admin/ops/OpsVisualTreatment.jsx` | Admin Ops |
| `??` | no | `src/pages/admin/ops/ops-production.css` | Admin Ops styling |
| `??` | no | `src/pages/admin/ops/opsData.js` | Admin Ops data |
| `??` | no | `src/pages/admin/ops/opsStorage.js` | Admin Ops local storage helpers |
| `??` | no | `src/pages/admin/web-maker.css` | Shared BuilderHub/WebMaker stylesheet |
| `??` | no | `src/pages/public/WebMakerPage.jsx` | WebMaker public/user-facing builder page |

## Inspection Summary

Commands used for inspection:

```bash
git status --short -- <batch-4-paths>
git diff -- <tracked-batch-4-paths>
git ls-files -- <batch-4-paths>
rg references where useful
```

Findings:

- `src/pages/admin/ops/` expands to 15 concrete files.
- Tracked Batch 4 diff summary: 625 insertions and 212 deletions across 7 tracked files.
- Untracked Batch 4 files are new active files, not archive or runtime persistence files.
- Active references found:
  - `src/entries/index.main.jsx` imports `WebMakerPage` and routes `/studio/templates`.
  - `src/pages/public/WebMakerPage.jsx` imports `src/pages/admin/web-maker.css`.
  - `src/router/AdminRoutes.jsx` imports `BuilderHub` and Admin Ops pages.
  - `src/router/AdminRoutes.jsx` mounts `/builder`, `/web-maker`, `/studio/templates`, and `/ops/*` routes.
  - `src/pages/shf-command/components/SHFImpactOhioMap.jsx` imports `src/data/shfImpactData.js`.
  - `src/pages/shf-command/SHFImpactCommandCenter.jsx` links to the SHF impact report generator.
  - `hubAccessControl.js` and `identityRouting.js` are active identity/access files used by admin and hub routing.

## Boundary Verification

Every Batch 4 concrete file belongs to one of the approved active-work categories:

- SHF Impact Command Center
- SHF Impact Ohio Map
- SHF Impact Data Spine
- Identity / access routing
- WebMaker public page
- BuilderHub admin surface
- Admin Ops

Excluded-batch checks:

- Batch 5 expected archive-removal `D` entries included: 0
- Batch 6 archive-later files included: 0
- Runtime/local persistence files included: 0

Staging dependency checks:

- Batch 1 governance files remain staged.
- Batch 2 backend infrastructure files remain staged.
- Batch 3 Admin UI files remain staged.
- Batch 4 was not staged by this review.

## Safety Notes

- This batch is active product/UI work, not frozen governance core.
- These files should likely be committed separately from Batches 1-3 if the owner wants clean history.
- Do not stage archive removals with this batch.
- Do not stage Batch 6 archive-later files with this batch.
- `opsStorage.js` is an Admin Ops helper file, not local JSON persistence or audit-log runtime output.

## Proposed Git Add Command

Do not execute until owner approval:

```bash
git add -- src/entries/index.main.jsx src/pages/admin/BuilderHub.jsx src/pages/shf-command/SHFImpactCommandCenter.jsx src/pages/shf-command/components/SHFImpactOhioMap.jsx src/pages/shf-command/components/shf-impact-ohio-map.css src/system/identity/hubAccessControl.js src/system/identity/identityRouting.js src/data/shfImpactData.js src/pages/admin/ops/OpsAssetGovernance.jsx src/pages/admin/ops/OpsBrandProfile.jsx src/pages/admin/ops/OpsBuildPacket.jsx src/pages/admin/ops/OpsDataBinding.jsx src/pages/admin/ops/OpsLayoutBlueprint.jsx src/pages/admin/ops/OpsLearningDashboard.jsx src/pages/admin/ops/OpsMockReview.jsx src/pages/admin/ops/OpsPageIntent.jsx src/pages/admin/ops/OpsProductionDashboard.jsx src/pages/admin/ops/OpsProjectSetup.jsx src/pages/admin/ops/OpsScreenshotQA.jsx src/pages/admin/ops/OpsVisualTreatment.jsx src/pages/admin/ops/ops-production.css src/pages/admin/ops/opsData.js src/pages/admin/ops/opsStorage.js src/pages/admin/web-maker.css src/pages/public/WebMakerPage.jsx
```

## Validation Commands

```bash
npm run check:governance
npm run build
git diff --cached --name-status
git status --short
```

Validation results:

- `npm run check:governance`: PASS
- `npm run build`: PASS, with existing large chunk warning
- `git diff --cached --name-status`: Batches 1, 2, and 3 remain staged; Batch 4 is not staged
- `git status --short`: Batch 4 tracked files remain unstaged and Batch 4 new files remain untracked

## Recommendation

Recommendation: Safe to stage after owner approval.

Reason: The Batch 4 file set matches the owner-approved active work, excludes Batch 5 and Batch 6, contains no runtime/local persistence files, and is wired through active entrypoints/routes. Because this is product/UI work, it should be reviewed as a separate staging/commit unit from the governance/backend/admin V1 batches if clean history matters.
