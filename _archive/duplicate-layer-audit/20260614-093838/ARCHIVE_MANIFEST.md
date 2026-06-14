# Duplicate Layer Cleanup Archive Manifest

Date/time: 2026-06-14 09:38:38 America/New_York

Reason: Safe duplicate-layer cleanup pass based on `docs/DUPLICATE_LAYER_AUDIT.md`. High-risk unmounted duplicate routers were moved outside active scan paths to reduce route-family confusion without deleting source history or changing active behavior.

## Archived Files

| Source File | Archive File | Mounted In `main.py` | Official Active Replacement | Merged | Notes |
| --- | --- | --- | --- | --- | --- |
| `services/shf-agent-fabric/routers/admin_agents_routes 2.py` | `_archive/duplicate-layer-audit/20260614-093838/admin_agents_routes 2.py` | No | `services/shf-agent-fabric/routers/admin_agents_routes.py` | No | Duplicate `/admin/agents` router. Active replacement remains untouched. |
| `services/shf-agent-fabric/routers/watchtower_attest_routes.py` | `_archive/duplicate-layer-audit/20260614-093838/watchtower_attest_routes.py` | No | `services/shf-agent-fabric/routers/watchtower_attestation_routes.py` | No | Same `/watchtower/attest` prefix as active router. Contains unique global-chain endpoints; manual review needed before any future merge. |
| `services/shf-agent-fabric/routers/admin_routes.py` | `_archive/duplicate-layer-audit/20260614-093838/admin_routes.py` | No | `services/shf-agent-fabric/routers/admin_agents_routes.py`, `services/shf-agent-fabric/routers/admin_layers_routes.py`, `services/shf-agent-fabric/routers/admin_force_routes.py`, `services/shf-agent-fabric/routers/admin_registry_routes.py` | No | Old combined `/admin` router overlapped active split admin routers. |

## Validation Commands Run

- `python3 scripts/check_duplicate_layer_cleanup.py`
- `python3 scripts/check_master_layer_registry.py`
- `python3 scripts/check_truth_spine_freeze.py`
- `python3 scripts/check_oracle_layer.py`
- `python3 scripts/check_ai_guardrails_layer.py`
- `python3 scripts/check_game_theory_layer.py`
- `npm run check:governance`
- `python3 -m pytest services/shf-agent-fabric/tests/test_truth_routes.py services/shf-agent-fabric/tests/test_oracle_routes.py services/shf-agent-fabric/tests/test_ai_guardrails_routes.py services/shf-agent-fabric/tests/test_game_theory_routes.py`
- `npm run build`

## Behavior Confirmation

No active official router was edited as part of this archive action. No files were deleted.
