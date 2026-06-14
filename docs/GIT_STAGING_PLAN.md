# Git Staging Plan

Generated: 2026-06-14T12:34:00

This is a safe staging plan only. It does not stage, commit, restore, reset, delete, move, or change runtime behavior.

## Current Decision

The 11 INVESTIGATE files are approved to keep as active work and are classified as `STAGE_AFTER_OWNER_APPROVAL`.

## Recommended Staging Order

1. Governance / anti-drift core
2. Backend infrastructure
3. Admin UI
4. Approved active SHF/WebMaker files
5. Expected archive removals
6. Archive later / do not stage now
7. Leave untracked / runtime / local persistence

Batch 6 and Batch 7 are intentionally not staging batches.

## Batch Summary Counts

| Batch | Name | Count | Risk |
|---:|---|---:|---|
| 1 | Governance / anti-drift core | 26 | medium |
| 2 | Backend infrastructure | 16 | high |
| 3 | Admin UI | 6 | medium-high |
| 4 | Approved active SHF/WebMaker files | 11 | high |
| 5 | Expected archive removals | 3279 | high |
| 6 | Archive later / do not stage now | 7 | low-medium |
| 7 | Leave untracked / runtime / local persistence | 0 | variable |

## Batches

### Batch 1 - Governance / anti-drift core

- Purpose: Stage canonical registry, freeze/guardrail docs, governance check scripts, duplicate cleanup evidence, package governance scripts, and git decision reports first so later batches are evaluated against the official anti-drift authority.
- Risk level: medium
- Suggested staging command: `# write batch file list from GIT_STAGING_PLAN.json, then: git add --pathspec-from-file /tmp/shrv1-batch-files.txt`
- Validation after staging: `npm run check:governance && npm run build`
- Rollback note: If validation fails after staging, do not restore/reset automatically; inspect staged diff, unstage only with explicit owner approval, and correct docs/check plan in a follow-up.

Files:
- `package.json`
- `docs/MASTER_LAYER_REGISTRY.md`
- `docs/TRUTH_SPINE_V1.md`
- `docs/TRUTH_SPINE_FREEZE_V1.md`
- `docs/TRUTH_SPINE_GUARDRAILS.md`
- `docs/ORACLE_LAYER_V1.md`
- `docs/AI_SWARM_GUARDRAILS_V1.md`
- `docs/GAME_THEORY_LAYER_V1.md`
- `docs/ARCHITECTURE_CHANGE_PROPOSAL_TEMPLATE.md`
- `docs/DUPLICATE_LAYER_AUDIT.md`
- `docs/GIT_STATUS_STABILIZATION_REPORT.md`
- `docs/GIT_STATUS_STABILIZATION_REPORT.json`
- `docs/GIT_NEEDS_REVIEW_DECISION_REPORT.md`
- `docs/GIT_NEEDS_REVIEW_DECISION_REPORT.json`
- `docs/GIT_INVESTIGATE_FILES_HUMAN_REVIEW.md`
- `docs/GIT_INVESTIGATE_FILES_HUMAN_REVIEW.json`
- `docs/GIT_STAGING_PLAN.md`
- `docs/GIT_STAGING_PLAN.json`
- `scripts/check_master_layer_registry.py`
- `scripts/check_truth_spine_freeze.py`
- `scripts/check_oracle_layer.py`
- `scripts/check_ai_guardrails_layer.py`
- `scripts/check_game_theory_layer.py`
- `scripts/check_architecture_proposal.py`
- `scripts/check_duplicate_layer_cleanup.py`
- `_archive/duplicate-layer-audit/`

### Batch 2 - Backend infrastructure

- Purpose: Stage Agent Fabric V1 routers/services/tests and mounted route integrations for Truth Spine, Oracle, AI Guardrails, Game Theory, Reports, Watchtower, LOO, and main.py.
- Risk level: high
- Suggested staging command: `git add -- services/shf-agent-fabric/main.py services/shf-agent-fabric/routers/truth_routes.py services/shf-agent-fabric/services/truth_spine_service.py services/shf-agent-fabric/tests/test_truth_routes.py services/shf-agent-fabric/routers/oracle_routes.py services/shf-agent-fabric/services/oracle_service.py services/shf-agent-fabric/tests/test_oracle_routes.py services/shf-agent-fabric/routers/ai_guardrails_routes.py services/shf-agent-fabric/services/ai_guardrails_service.py services/shf-agent-fabric/tests/test_ai_guardrails_routes.py services/shf-agent-fabric/routers/game_theory_routes.py services/shf-agent-fabric/services/game_theory_service.py services/shf-agent-fabric/tests/test_game_theory_routes.py services/shf-agent-fabric/routers/reports_routes.py services/shf-agent-fabric/routers/watchtower_routes.py services/shf-agent-fabric/routers/loo_routes.py`
- Validation after staging: `npm run check:governance && python3 -m pytest services/shf-agent-fabric/tests/test_truth_routes.py services/shf-agent-fabric/tests/test_oracle_routes.py services/shf-agent-fabric/tests/test_ai_guardrails_routes.py services/shf-agent-fabric/tests/test_game_theory_routes.py`
- Rollback note: If route tests fail, keep the batch staged only if owner wants inspection; otherwise unstage with explicit approval and fix the backend bundle before commit.

Files:
- `services/shf-agent-fabric/main.py`
- `services/shf-agent-fabric/routers/truth_routes.py`
- `services/shf-agent-fabric/services/truth_spine_service.py`
- `services/shf-agent-fabric/tests/test_truth_routes.py`
- `services/shf-agent-fabric/routers/oracle_routes.py`
- `services/shf-agent-fabric/services/oracle_service.py`
- `services/shf-agent-fabric/tests/test_oracle_routes.py`
- `services/shf-agent-fabric/routers/ai_guardrails_routes.py`
- `services/shf-agent-fabric/services/ai_guardrails_service.py`
- `services/shf-agent-fabric/tests/test_ai_guardrails_routes.py`
- `services/shf-agent-fabric/routers/game_theory_routes.py`
- `services/shf-agent-fabric/services/game_theory_service.py`
- `services/shf-agent-fabric/tests/test_game_theory_routes.py`
- `services/shf-agent-fabric/routers/reports_routes.py`
- `services/shf-agent-fabric/routers/watchtower_routes.py`
- `services/shf-agent-fabric/routers/loo_routes.py`

### Batch 3 - Admin UI

- Purpose: Stage V1 governance admin pages and admin navigation/route wiring. hubAccessControl.js is related but intentionally staged in Batch 4 because it is one of the owner-approved active 11 files.
- Risk level: medium-high
- Suggested staging command: `git add -- src/pages/admin/truth-spine/ src/pages/admin/oracle/ src/pages/admin/ai-guardrails/ src/pages/admin/game-theory/ src/components/admin/AdminSidebar.jsx src/router/AdminRoutes.jsx`
- Validation after staging: `npm run check:governance && npm run build`
- Rollback note: If admin build fails, inspect route imports and untracked admin page directories; do not move or delete pages without owner approval.

Files:
- `src/pages/admin/truth-spine/`
- `src/pages/admin/oracle/`
- `src/pages/admin/ai-guardrails/`
- `src/pages/admin/game-theory/`
- `src/components/admin/AdminSidebar.jsx`
- `src/router/AdminRoutes.jsx`

### Batch 4 - Approved active SHF/WebMaker files

- Purpose: Stage all 11 owner-approved active files together: public/admin WebMaker boundary, SHF Impact Data Spine/map/report link, and Identity/Access updates supporting these active surfaces.
- Risk level: high
- Suggested staging command: `git add -- src/entries/index.main.jsx src/pages/admin/BuilderHub.jsx src/pages/shf-command/SHFImpactCommandCenter.jsx src/pages/shf-command/components/SHFImpactOhioMap.jsx src/pages/shf-command/components/shf-impact-ohio-map.css src/system/identity/hubAccessControl.js src/system/identity/identityRouting.js src/data/shfImpactData.js src/pages/admin/ops/ src/pages/admin/web-maker.css src/pages/public/WebMakerPage.jsx`
- Validation after staging: `npm run check:governance && npm run build`
- Rollback note: If build or review fails, keep files in working tree; unstage only after owner chooses whether to split SHF Impact, Identity, and WebMaker into smaller commits.

Files:
- `src/entries/index.main.jsx`
- `src/pages/admin/BuilderHub.jsx`
- `src/pages/shf-command/SHFImpactCommandCenter.jsx`
- `src/pages/shf-command/components/SHFImpactOhioMap.jsx`
- `src/pages/shf-command/components/shf-impact-ohio-map.css`
- `src/system/identity/hubAccessControl.js`
- `src/system/identity/identityRouting.js`
- `src/data/shfImpactData.js`
- `src/pages/admin/ops/`
- `src/pages/admin/web-maker.css`
- `src/pages/public/WebMakerPage.jsx`

### Batch 5 - Expected archive removals

- Purpose: Stage the 3279 expected deletions as repository removals after owner approval. These files were moved to the external archive; staging records that inactive backup/archive files left the repo.
- Risk level: high
- Suggested staging command: `# for expected archive removals only: git add -u --pathspec-from-file /tmp/shrv1-archive-removals.txt`
- Validation after staging: `python3 scripts/check_duplicate_layer_cleanup.py && npm run check:governance && npm run build`
- Rollback note: If any active file is accidentally included, stop and unstage the archive-removal batch with explicit owner approval. Do not restore archived files unless a specific recovery need is identified.

Files:
- `.backup_agent_fabric_exports_20260223_144448/main.py`
- `.backup_allocation_model_20260223_121503/model.js`
- `.backup_audit_exports_fix_20260223_144040/exports.py`
- `.backup_audit_exports_fix_20260223_144040/exports_signing.py`
- `.backup_audit_exports_fix_20260223_144040/main.py`
- `.backup_capital_layout_20260309_101644/CapitalLayout.jsx`
- `.backup_capital_operator_20260309_101139/TreasuryRoutes.jsx`
- `.backup_capital_operator_20260309_101521/CapitalLayout.jsx`
- `.backup_exports_signing_20260223_143456/main.py`
- `.backup_extract_system_summary_20260309_140049/OperatorControlPanel.base.jsx`
- `.backup_growth_market_fallback_20260218_230840/growthMarket.js`
- `.backup_growth_observatory_20260218_230341/GrowthObservationTower.jsx`
- `.backup_growth_tower_20260218_233122/GrowthObservationTower.jsx`
- `.backup_kill_8090_20260218_232210/vite.config.js`
- `.backup_lifespan_20260213_104345/main.py`
- `.backup_operator_fetch_20260309_130926/OperatorControlPanel.base.jsx`
- `.backup_operator_fetch_20260309_130926/vite.config.js`
- `.backup_orbital_ring_20260221_003735/LordOutcomesLayout.jsx`
- `.backup_ring_precision_20260221_031751/loo.mock.space.css`
- `.backup_router_20260309_135105/CapitalRoutes.jsx`
- `.backup_universe_20260221_115439/bootApp.jsx`
- `.restore_points/command_center_before_jsx_css_rebuild_20260427_180749.patch`
- `.restore_points/stable_base_20260422_093031/src/APP_MATRIX.md`
- `.restore_points/stable_base_20260422_093031/src/App.jsx`
- `.restore_points/stable_base_20260422_093031/src/CrossApplink.jsx`
- `.restore_points/stable_base_20260422_093031/src/SYSTEM_INDEX.txt`
- `.restore_points/stable_base_20260422_093031/src/_archive/SalesRoutes.20251107-000126.jsx`
- `.restore_points/stable_base_20260422_093031/src/_archive/_cosmic_header_backup/LordOutcomesHeaderLocked.jsx`
- `.restore_points/stable_base_20260422_093031/src/_archive/_cosmic_header_backup/lordOutcomes.header.cosmic.css`
- `.restore_points/stable_base_20260422_093031/src/_archive/_cosmic_header_backup_20260102-172418/lordOutcomes.header.cosmicGlow.css`
- `.restore_points/stable_base_20260422_093031/src/_archive/_cosmic_header_backup_20260102-172418/lordOutcomes.header.locked.css`
- `.restore_points/stable_base_20260422_093031/src/_archive/_cosmic_header_backup_20260102-172418/lordOutcomes.main.jsx`
- `.restore_points/stable_base_20260422_093031/src/_archive/_cosmic_header_reset/LordOutcomesHeaderLocked.jsx`
- `.restore_points/stable_base_20260422_093031/src/_archive/_cosmic_header_reset/lordOutcomes._LOCKED.skeleton.css`
- `.restore_points/stable_base_20260422_093031/src/_archive/_cosmic_header_reset/lordOutcomes.main.jsx`
- `.restore_points/stable_base_20260422_093031/src/_archive/_cosmic_header_reset_20260102-161227/LordOutcomesLayout.jsx`
- `.restore_points/stable_base_20260422_093031/src/_archive/_cosmic_header_reset_20260102-161227/LordOutcomesRoutes.jsx`
- `.restore_points/stable_base_20260422_093031/src/_archive/_cosmic_header_reset_20260102-161227/lordOutcomes._LOCKED.skeleton.css`
- `.restore_points/stable_base_20260422_093031/src/_archive/_cosmic_header_reset_20260102-161227/lordOutcomes.css`
- `.restore_points/stable_base_20260422_093031/src/_archive/_cosmic_header_reset_20260102-161227/lordOutcomes.dym.css`
- ... 3239 more entries listed in `docs/GIT_STAGING_PLAN.json`

### Batch 6 - Archive later / do not stage now

- Purpose: Keep generated review snapshots, ad hoc root snapshot scripts, and duplicate ASL sanity-test content out of the commit for now. These can be moved to external archive later only with owner approval.
- Risk level: low-medium
- Suggested staging command: `# do not stage this batch now`
- Validation after staging: `# no staging validation; if archived later, run npm run check:governance && npm run build`
- Rollback note: No rollback needed because this batch should not be staged. If staged accidentally, unstage with owner approval before commit.

Files:
- `SHS_FOCUSED_REVIEW.txt`
- `SHS_LIVE_ONLY_REVIEW.txt`
- `SHS_PROJECT_REVIEW_SNAPSHOT.txt`
- `shs_focused_review.sh`
- `shs_live_only_review.sh`
- `shs_project_snapshot.sh`
- `src/content/lessons/asl-student/student.asl-01-dup.json`

### Batch 7 - Leave untracked / runtime / local persistence

- Purpose: Leave local JSON persistence, audit logs, generated runtime files, cache/temp files, and anything not clearly intentional out of staging. Current scan found no additional changed paths beyond assigned batches, but this batch exists as the catch-all rule.
- Risk level: variable
- Suggested staging command: `# do not stage this batch`
- Validation after staging: `# no staging validation; re-run git status --short before commit`
- Rollback note: Leave alone unless owner explicitly classifies an item into a staging batch.

Files:
- None

## Assignment Notes

- Batch 4 contains all 11 owner-approved active files exactly as requested.
- `src/system/identity/hubAccessControl.js` is related to Admin UI but staged in Batch 4 to keep the approved active 11 together and avoid duplicate assignment.
- Batch 5 contains all 3279 expected `D` entries from `docs/GIT_STATUS_STABILIZATION_REPORT.json`; they should be staged only after owner approval because they represent archive moves outside the repo.
- Batch 6 should not be staged now.
- Batch 7 is a catch-all for runtime/local persistence and unclear files. Current status scan found 0 changed paths not already assigned to another batch.

## Required Validation Before Commit

```bash
python3 scripts/check_duplicate_layer_cleanup.py
python3 scripts/check_master_layer_registry.py
python3 scripts/check_truth_spine_freeze.py
python3 scripts/check_oracle_layer.py
python3 scripts/check_ai_guardrails_layer.py
python3 scripts/check_game_theory_layer.py
npm run check:governance
python3 -m pytest services/shf-agent-fabric/tests/test_truth_routes.py services/shf-agent-fabric/tests/test_oracle_routes.py services/shf-agent-fabric/tests/test_ai_guardrails_routes.py services/shf-agent-fabric/tests/test_game_theory_routes.py
npm run build
git status --short
```

## No-Action Confirmation

No `git add`, `git commit`, `git restore`, `git reset`, delete, move, source behavior edit, route edit, service edit, or package edit was performed while creating this staging plan.
