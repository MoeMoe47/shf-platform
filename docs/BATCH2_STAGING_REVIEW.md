# Batch 2 Staging Review

Generated: 2026-06-14

This is a staging review only. No `git add`, commit, restore, reset, delete, or move action was performed as part of this review.

## Scope

Batch 2 from `docs/GIT_STAGING_PLAN.json` is `Backend infrastructure`.

- File count: 16
- Risk level: high
- Purpose: Stage Agent Fabric V1 routers, services, tests, mounted route integrations, and route-mount wiring for Truth Spine, Oracle, AI Guardrails, Game Theory, Reports, Watchtower, LOO, and `main.py`.

## File List

| Status | File | Ownership / purpose |
|---|---|---|
| `M` | `services/shf-agent-fabric/main.py` | Agent Fabric route mounts for backend V1 layers |
| `??` | `services/shf-agent-fabric/routers/truth_routes.py` | Truth Spine router |
| `??` | `services/shf-agent-fabric/services/truth_spine_service.py` | Truth Spine service |
| `??` | `services/shf-agent-fabric/tests/test_truth_routes.py` | Truth Spine backend tests |
| `??` | `services/shf-agent-fabric/routers/oracle_routes.py` | Oracle router |
| `??` | `services/shf-agent-fabric/services/oracle_service.py` | Oracle service |
| `??` | `services/shf-agent-fabric/tests/test_oracle_routes.py` | Oracle backend tests |
| `??` | `services/shf-agent-fabric/routers/ai_guardrails_routes.py` | AI Guardrails router |
| `??` | `services/shf-agent-fabric/services/ai_guardrails_service.py` | AI Guardrails service |
| `??` | `services/shf-agent-fabric/tests/test_ai_guardrails_routes.py` | AI Guardrails backend tests |
| `??` | `services/shf-agent-fabric/routers/game_theory_routes.py` | Game Theory router |
| `??` | `services/shf-agent-fabric/services/game_theory_service.py` | Game Theory service |
| `??` | `services/shf-agent-fabric/tests/test_game_theory_routes.py` | Game Theory backend tests |
| `M` | `services/shf-agent-fabric/routers/reports_routes.py` | Reports truth/trust integration |
| `M` | `services/shf-agent-fabric/routers/watchtower_routes.py` | Watchtower truth coverage integration |
| `M` | `services/shf-agent-fabric/routers/loo_routes.py` | LOO trust metadata integration |

## Boundary Verification

Batch 2 files belong only to the requested backend infrastructure categories:

- Truth Spine: router, service, tests
- Oracle: router, service, tests
- AI Guardrails: router, service, tests
- Game Theory: router, service, tests
- Reports integrations: `reports_routes.py`
- Watchtower integrations: `watchtower_routes.py`
- LOO trust metadata integration: `loo_routes.py`
- Agent Fabric route mounts: `main.py`
- Backend tests: Truth Spine, Oracle, AI Guardrails, Game Theory route tests

Excluded-batch checks:

- Overlap with Batch 1 governance files: 0
- Overlap with Batch 4 SHF/WebMaker active work: 0
- Overlap with Batch 5 archive removals: 0

## Dependency Notes

- Batch 2 depends on Batch 1 governance checks and documentation being staged or otherwise reviewed first.
- `main.py` should be staged with the new routers so route imports and route mounts stay in one backend batch.
- The route tests should be staged with their corresponding routers and services so the backend contract travels with the implementation.
- Reports, Watchtower, and LOO integration files should remain in Batch 2 because they are backend route integrations, not UI or SHF/WebMaker active-work files.

## Proposed Git Add Commands

Do not execute until owner approval:

```bash
git add -- services/shf-agent-fabric/main.py services/shf-agent-fabric/routers/truth_routes.py services/shf-agent-fabric/services/truth_spine_service.py services/shf-agent-fabric/tests/test_truth_routes.py services/shf-agent-fabric/routers/oracle_routes.py services/shf-agent-fabric/services/oracle_service.py services/shf-agent-fabric/tests/test_oracle_routes.py services/shf-agent-fabric/routers/ai_guardrails_routes.py services/shf-agent-fabric/services/ai_guardrails_service.py services/shf-agent-fabric/tests/test_ai_guardrails_routes.py services/shf-agent-fabric/routers/game_theory_routes.py services/shf-agent-fabric/services/game_theory_service.py services/shf-agent-fabric/tests/test_game_theory_routes.py services/shf-agent-fabric/routers/reports_routes.py services/shf-agent-fabric/routers/watchtower_routes.py services/shf-agent-fabric/routers/loo_routes.py
```

## Validation Commands After Staging

```bash
npm run check:governance
python3 -m pytest services/shf-agent-fabric/tests/test_truth_routes.py services/shf-agent-fabric/tests/test_oracle_routes.py services/shf-agent-fabric/tests/test_ai_guardrails_routes.py services/shf-agent-fabric/tests/test_game_theory_routes.py
npm run build
git diff --cached --name-status
```

## Requested Git Snapshots

Commands run for review:

```bash
git diff --name-only
git diff --cached --name-only
git status --short
```

Summary:

- `git diff --name-only`: 3292 paths, dominated by expected Batch 5 archive removals plus modified active files.
- `git diff --cached --name-only`: 29 paths already staged before this Batch 2 review; these are Batch 1 governance paths expanded from the `_archive/duplicate-layer-audit/` directory.
- `git status --short`: 3348 entries total at review time.
- Status counts: 3279 unstaged deletions, 28 staged additions, 27 untracked files, 13 unstaged modifications, 1 staged modification.

## Recommendation

Recommendation: Safe to stage after owner review.

Reason: The Batch 2 file set is internally consistent, has no overlap with Batch 1, Batch 4, or Batch 5, and contains only backend infrastructure files for the approved V1 governance stack and route integrations.

Review note: `git diff --cached --name-only` is not empty. Batch 1 governance files appear to already be staged from outside this review. This review did not create, alter, or clear that staged state.
