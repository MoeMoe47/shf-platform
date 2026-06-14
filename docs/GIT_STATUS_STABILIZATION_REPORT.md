# Git Status Stabilization Report
Date: 2026-06-14
## Executive Summary
This report classifies the dirty git status after the external archive cleanup. No git staging, commit, restore, reset, file deletion, or file movement was performed during this stabilization report generation. The large deleted-file count is expected archive movement of inactive backup/archive material out of the active repo.
## Current Git Status Counts
- Total changed entries: 3339
- `??`: 46
- `D`: 3279
- `M`: 14

## Top-Level Folders Affected
- `.restore_points`: 2215
- `_production_archive`: 918
- `services`: 26
- `src`: 18
- `docs`: 11
- `_backup_security_identity_v1_patch_3_20260521_221217`: 7
- `scripts`: 7
- `_backup_aggregation_ui_v1_patch_2b_20260522_001328`: 6
- `_backup_aggregation_ui_v1_patch_4_20260522_002229`: 6
- `_backup_security_identity_v1_patch_2_20260521_220647`: 6
- `_backup_hub_partner_workflow_v1_patch_1_20260522_211446`: 5
- `_backup_hub_partner_workflow_v1_patch_1_20260522_212156`: 5
- `_backup_post_v1_bundle_patch_22_20260523_142950`: 5
- `_backup_aggregation_ui_v1_patch_2a_20260522_000913`: 4
- `_backup_post_v1_bundle_patch_22_20260523_142610`: 4
- `_backup_security_identity_v1_patch_4_20260521_223034`: 4
- `.backup_audit_exports_fix_20260223_144040`: 3
- `_backup_security_identity_v1_patch_1_20260521_220132`: 3
- `.backup_operator_fetch_20260309_130926`: 2
- `_backup_aggregation_ui_v1_patch_1_20260521_235708`: 2
- `_backup_aggregation_ui_v1_patch_3_20260522_001729`: 2
- `_backup_ecosystem_readiness_v1_patch_2_20260523_082939`: 2
- `_backup_ecosystem_readiness_v1_patch_3_20260523_083301`: 2
- `_backup_ecosystem_readiness_v1_patch_3_20260523_083503`: 2
- `_backup_funding_decision_briefs_v1_patch_2_20260522_233024`: 2
- `_backup_hub_partner_workflow_v1_patch_2_20260522_213709`: 2
- `_backup_hub_partner_workflow_v1_patch_3_20260522_214008`: 2
- `_backup_hub_partner_workflow_v1_patch_4_20260522_214345`: 2
- `_backup_post_v1_manual_browser_signoff_patch_3_20260523_115202`: 2
- `_backup_production_hardening_patch_2_20260523_101215`: 2

## Archive Manifest Coverage Notes
- Archive manifests found: 2
- `/Users/mikeslate/Desktop/SHF_REPO_EXTERNAL_ARCHIVE/shf-next-cleanup-20260614-095113/ARCHIVE_MANIFEST.md`
- `/Users/mikeslate/Desktop/SHF_REPO_EXTERNAL_ARCHIVE/shrv1-cleanup-20260614-095113/ARCHIVE_MANIFEST.md`
- Manifest original entries parsed: 374
- Deleted paths under manifest-listed folder roots are classified as expected archive moves.
- The three duplicate routers documented in the duplicate layer audit are classified as expected archive moves even though they were previously moved into the internal duplicate-layer archive.

## Expected Archive Deletes
Count: 3279
- `.backup_agent_fabric_exports_20260223_144448/main.py` - external_archive_manifest
- `.backup_allocation_model_20260223_121503/model.js` - external_archive_manifest
- `.backup_audit_exports_fix_20260223_144040/exports.py` - external_archive_manifest
- `.backup_audit_exports_fix_20260223_144040/exports_signing.py` - external_archive_manifest
- `.backup_audit_exports_fix_20260223_144040/main.py` - external_archive_manifest
- `.backup_capital_layout_20260309_101644/CapitalLayout.jsx` - external_archive_manifest
- `.backup_capital_operator_20260309_101139/TreasuryRoutes.jsx` - external_archive_manifest
- `.backup_capital_operator_20260309_101521/CapitalLayout.jsx` - external_archive_manifest
- `.backup_exports_signing_20260223_143456/main.py` - external_archive_manifest
- `.backup_extract_system_summary_20260309_140049/OperatorControlPanel.base.jsx` - external_archive_manifest
- `.backup_growth_market_fallback_20260218_230840/growthMarket.js` - external_archive_manifest
- `.backup_growth_observatory_20260218_230341/GrowthObservationTower.jsx` - external_archive_manifest
- `.backup_growth_tower_20260218_233122/GrowthObservationTower.jsx` - external_archive_manifest
- `.backup_kill_8090_20260218_232210/vite.config.js` - external_archive_manifest
- `.backup_lifespan_20260213_104345/main.py` - external_archive_manifest
- `.backup_operator_fetch_20260309_130926/OperatorControlPanel.base.jsx` - external_archive_manifest
- `.backup_operator_fetch_20260309_130926/vite.config.js` - external_archive_manifest
- `.backup_orbital_ring_20260221_003735/LordOutcomesLayout.jsx` - external_archive_manifest
- `.backup_ring_precision_20260221_031751/loo.mock.space.css` - external_archive_manifest
- `.backup_router_20260309_135105/CapitalRoutes.jsx` - external_archive_manifest
- `.backup_universe_20260221_115439/bootApp.jsx` - external_archive_manifest
- `.restore_points/command_center_before_jsx_css_rebuild_20260427_180749.patch` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/APP_MATRIX.md` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/App.jsx` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/CrossApplink.jsx` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/SYSTEM_INDEX.txt` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/SalesRoutes.20251107-000126.jsx` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_cosmic_header_backup/LordOutcomesHeaderLocked.jsx` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_cosmic_header_backup/lordOutcomes.header.cosmic.css` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_cosmic_header_backup_20260102-172418/lordOutcomes.header.cosmicGlow.css` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_cosmic_header_backup_20260102-172418/lordOutcomes.header.locked.css` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_cosmic_header_backup_20260102-172418/lordOutcomes.main.jsx` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_cosmic_header_reset/LordOutcomesHeaderLocked.jsx` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_cosmic_header_reset/lordOutcomes._LOCKED.skeleton.css` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_cosmic_header_reset/lordOutcomes.main.jsx` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_cosmic_header_reset_20260102-161227/LordOutcomesLayout.jsx` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_cosmic_header_reset_20260102-161227/LordOutcomesRoutes.jsx` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_cosmic_header_reset_20260102-161227/lordOutcomes._LOCKED.skeleton.css` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_cosmic_header_reset_20260102-161227/lordOutcomes.css` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_cosmic_header_reset_20260102-161227/lordOutcomes.dym.css` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_cosmic_header_reset_20260102-161227/lordOutcomes.dym.pattern.css` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_cosmic_header_reset_20260102-161227/lordOutcomes.header.locked.css` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_cosmic_header_reset_20260102-161227/lordOutcomes.main.jsx` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_cosmic_header_reset_20260102-161227/lordOutcomes.theme.css` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_cosmic_header_reset_20260102-161227/lordOutcomes.tokens.css` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_header_cosmic_reset/lordOutcomes.header.cosmic.css` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_header_cosmic_reset/lordOutcomes.main.jsx` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_header_reset/lordOutcomes._LOCKED.skeleton.css` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_header_reset/lordOutcomes.header.locked.css` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_header_reset/lordOutcomes.main.jsx` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_headers_cleanup/lordOutcomes._LOCKED.skeleton.css.BAD.20251231-141306` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_layers_legacy_20260105-202433/L01/index.js` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_layers_legacy_20260105-202433/L02/index.js` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_layers_legacy_20260105-202433/L03/index.js` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_layers_legacy_20260105-202433/L04/index.js` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_layers_legacy_20260105-202433/L05/index.js` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_layers_legacy_20260105-202433/L06/index.js` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_layers_legacy_20260105-202433/L07/index.js` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_layers_legacy_20260105-202433/L08/index.js` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_layers_legacy_20260105-202433/L09/index.js` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_layers_legacy_20260105-202433/L10/index.js` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_layers_legacy_20260105-202433/L11/index.js` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_layers_legacy_20260105-202433/L12/index.js` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_layers_legacy_20260105-202433/L13/index.js` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_layers_legacy_20260105-202433/L14/index.js` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_layers_legacy_20260105-202433/L15/index.js` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_layers_legacy_20260105-202433/L16/index.js` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_layers_legacy_20260105-202433/L17/index.js` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_layers_legacy_20260105-202433/L18/index.js` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_layers_legacy_20260105-202433/L19/index.js` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_layers_legacy_20260105-202433/L20/index.js` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_layers_legacy_20260105-202433/L21/index.js` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_layers_legacy_20260105-202433/L22/index.js` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_layers_legacy_20260105-202433/L23/index.js` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_layers_legacy_20260105-202433/L24/index.js` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_layers_legacy_20260105-202433/L25/index.js` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_layers_legacy_20260105-202433/L4_data_events/index.js` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_layers_legacy_20260105-202433/L5_outcomes_engine/index.js` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_layers_legacy_20260105-202433/_layerContract.js` - external_archive_manifest
- `.restore_points/stable_base_20260422_093031/src/_archive/_layers_legacy_20260105-202433/index.js` - external_archive_manifest
- ... 3199 more entries in `docs/GIT_STATUS_STABILIZATION_REPORT.json`

## Unexpected Deletes Needing Review
Count: 0
- None

## Modified Active Work Files
Count: 7
- `package.json` - governance package scripts
- `services/shf-agent-fabric/main.py` - mounted V1 layer routers
- `services/shf-agent-fabric/routers/loo_routes.py` - Truth trust metadata integration
- `services/shf-agent-fabric/routers/reports_routes.py` - Truth metadata report snapshot integration
- `services/shf-agent-fabric/routers/watchtower_routes.py` - Truth coverage Watchtower integration
- `src/components/admin/AdminSidebar.jsx` - admin links for V1 layers
- `src/router/AdminRoutes.jsx` - admin routes for V1 layers

## Modified Runtime Noise Files
Count: 0
- None

## Modified Files Needing Review
Count: 7
- `src/entries/index.main.jsx` - active entrypoint change; review before commit
- `src/pages/admin/BuilderHub.jsx` - active admin page outside governance sprint; review before commit
- `src/pages/shf-command/SHFImpactCommandCenter.jsx` - active SHF impact surface; review before commit
- `src/pages/shf-command/components/SHFImpactOhioMap.jsx` - active SHF impact map; review before commit
- `src/pages/shf-command/components/shf-impact-ohio-map.css` - active SHF impact map styling; review before commit
- `src/system/identity/hubAccessControl.js` - active identity/access file; review before commit
- `src/system/identity/identityRouting.js` - active identity/routing file; review before commit

## Untracked Intentional Files
Count: 35
- `_archive/duplicate-layer-audit/` - duplicate cleanup archive required by duplicate cleanup check
- `docs/AI_SWARM_GUARDRAILS_V1.md` - governance/V1 documentation
- `docs/ARCHITECTURE_CHANGE_PROPOSAL_TEMPLATE.md` - governance/V1 documentation
- `docs/DUPLICATE_LAYER_AUDIT.md` - governance/V1 documentation
- `docs/GAME_THEORY_LAYER_V1.md` - governance/V1 documentation
- `docs/GIT_STATUS_STABILIZATION_REPORT.json` - stabilization report artifact
- `docs/GIT_STATUS_STABILIZATION_REPORT.md` - stabilization report artifact
- `docs/MASTER_LAYER_REGISTRY.md` - governance/V1 documentation
- `docs/ORACLE_LAYER_V1.md` - governance/V1 documentation
- `docs/TRUTH_SPINE_FREEZE_V1.md` - governance/V1 documentation
- `docs/TRUTH_SPINE_GUARDRAILS.md` - governance/V1 documentation
- `docs/TRUTH_SPINE_V1.md` - governance/V1 documentation
- `scripts/check_ai_guardrails_layer.py` - governance/check script
- `scripts/check_architecture_proposal.py` - governance/check script
- `scripts/check_duplicate_layer_cleanup.py` - governance/check script
- `scripts/check_game_theory_layer.py` - governance/check script
- `scripts/check_master_layer_registry.py` - governance/check script
- `scripts/check_oracle_layer.py` - governance/check script
- `scripts/check_truth_spine_freeze.py` - governance/check script
- `services/shf-agent-fabric/routers/ai_guardrails_routes.py` - V1 backend router/service
- `services/shf-agent-fabric/routers/game_theory_routes.py` - V1 backend router/service
- `services/shf-agent-fabric/routers/oracle_routes.py` - V1 backend router/service
- `services/shf-agent-fabric/routers/truth_routes.py` - V1 backend router/service
- `services/shf-agent-fabric/services/ai_guardrails_service.py` - V1 backend router/service
- `services/shf-agent-fabric/services/game_theory_service.py` - V1 backend router/service
- `services/shf-agent-fabric/services/oracle_service.py` - V1 backend router/service
- `services/shf-agent-fabric/services/truth_spine_service.py` - V1 backend router/service
- `services/shf-agent-fabric/tests/test_ai_guardrails_routes.py` - V1 route test
- `services/shf-agent-fabric/tests/test_game_theory_routes.py` - V1 route test
- `services/shf-agent-fabric/tests/test_oracle_routes.py` - V1 route test
- `services/shf-agent-fabric/tests/test_truth_routes.py` - V1 route test
- `src/pages/admin/ai-guardrails/` - V1 admin page
- `src/pages/admin/game-theory/` - V1 admin page
- `src/pages/admin/oracle/` - V1 admin page
- `src/pages/admin/truth-spine/` - V1 admin page

## Untracked Runtime Noise Files
Count: 0
- None

## Untracked Files Needing Review
Count: 11
- `SHS_FOCUSED_REVIEW.txt` - untracked file not confidently tied to known governance sprint
- `SHS_LIVE_ONLY_REVIEW.txt` - untracked file not confidently tied to known governance sprint
- `SHS_PROJECT_REVIEW_SNAPSHOT.txt` - untracked file not confidently tied to known governance sprint
- `shs_focused_review.sh` - untracked file not confidently tied to known governance sprint
- `shs_live_only_review.sh` - untracked file not confidently tied to known governance sprint
- `shs_project_snapshot.sh` - untracked file not confidently tied to known governance sprint
- `src/content/lessons/asl-student/student.asl-01-dup.json` - untracked file not confidently tied to known governance sprint
- `src/data/shfImpactData.js` - untracked file not confidently tied to known governance sprint
- `src/pages/admin/ops/` - untracked file not confidently tied to known governance sprint
- `src/pages/admin/web-maker.css` - untracked file not confidently tied to known governance sprint
- `src/pages/public/WebMakerPage.jsx` - untracked file not confidently tied to known governance sprint

## Files That Should Remain Outside Repo
- Expected archive move entries should remain in `/Users/mikeslate/Desktop/SHF_REPO_EXTERNAL_ARCHIVE/` unless a specific file is explicitly needed for recovery.
- Internal duplicate-layer archive files should remain in `_archive/duplicate-layer-audit/` while `scripts/check_duplicate_layer_cleanup.py` expects a manifest there.

## Files To Review Before Commit
- All `needs_review_modified` and `needs_review_untracked` entries.
- Active SHF Impact, identity, BuilderHub, WebMaker, review text/script, duplicate lesson, and `src/data/shfImpactData.js` entries should be reviewed by owner before staging.

## Active Behavior Safety Scan
- `services/shf-agent-fabric/main.py` still imports and includes official Truth, Oracle, AI Guardrails, Game Theory, Watchtower, LOO, Reports, Alignment, and split Admin routers.
- Static scan found the expected governance/layer references across routers, services, admin UI, docs, and scripts; no edit was made from the scan.

## Validation Results
- `check_duplicate_layer_cleanup`: PASS: duplicate layer cleanup checks passed
- `check_master_layer_registry`: PASS: Master Layer Registry checked 45 required layers
- `check_truth_spine_freeze`: PASS: Truth Spine V1 freeze checks passed
- `check_oracle_layer`: PASS: Oracle Layer V1 checks passed
- `check_ai_guardrails_layer`: PASS: AI/Swarm Guardrails V1 checks passed
- `check_game_theory_layer`: PASS: Game Theory Layer V1 checks passed
- `check_governance`: PASS: npm run check:governance passed
- `focused_pytest`: PASS: 23 passed
- `npm_build`: PASS: npm run build passed; Vite reported existing large chunk warnings

## Recommended Next Steps
- Review NEEDS_REVIEW lists before staging or committing.
- If approved later, stage expected archive D entries as removals from the repo.
- If approved later, add intentional new governance files.
- If approved later, ignore or clean runtime noise.
- Do not perform git add, commit, restore, or reset as part of this stabilization pass.

## No Git Action Confirmation
No `git add`, `git commit`, `git restore`, `git reset`, delete, or move operation was performed as part of this stabilization report pass.
