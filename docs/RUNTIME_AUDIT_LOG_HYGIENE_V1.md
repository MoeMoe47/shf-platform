# Runtime Audit / Log Hygiene V1

## Executive Summary

Runtime Audit / Log Hygiene V1 fixes the recurring release-safety problem where validation or API smoke runs can modify runtime audit files and leave the git working tree dirty.

This task implements a safe hygiene check and a narrow cleanup helper. It does not delete audit history, disable Watchtower audit logging, change Watchtower business logic, change API behavior, change auth, create new layers, move archives, or commit automatically.

## Problem

`services/shf-agent-fabric/var/watchtower_audit.jsonl` is a tracked file and can receive runtime Watchtower audit rows during validation or smoke activity. When that happens, the repo looks dirty even if no intentional source change was made.

That creates paid-launch risk:

- Runtime state can be accidentally staged with source changes.
- Release diffs become noisy.
- Audit history may be reset casually instead of intentionally.
- Validation runs can create confusing before/after git status.

## Current Tracked Runtime Files

Tracked runtime/audit files found under `services/shf-agent-fabric/var`:

| Path | Current Dirty State | Notes |
| --- | --- | --- |
| `services/shf-agent-fabric/var/watchtower_audit.jsonl` | Clean before implementation | Recurring runtime dirty-file risk. |
| `services/shf-agent-fabric/var/audit_exports/watchtower_attestations_20260218_202229.jsonl` | Clean before implementation | Historical audit export; not touched by cleanup helper. |
| `services/shf-agent-fabric/var/audit_exports/watchtower_snapshots_20260218_193202.jsonl` | Clean before implementation | Historical audit export; not touched by cleanup helper. |
| `services/shf-agent-fabric/var/audit_exports/watchtower_snapshots_20260218_200130.jsonl` | Clean before implementation | Historical audit export; not touched by cleanup helper. |
| `services/shf-agent-fabric/var/audit_exports/watchtower_snapshots_20260218_200654.jsonl` | Clean before implementation | Historical audit export; not touched by cleanup helper. |
| `services/shf-agent-fabric/var/audit_exports/watchtower_snapshots_20260218_202229.jsonl` | Clean before implementation | Historical audit export; not touched by cleanup helper. |

Other obvious local runtime files found by the helper include `*.jsonl` under `services/shf-agent-fabric/db`, `*.log` under `services/shf-agent-fabric/logs`, and `watchtower_store.sqlite`. These are reported by the helper, but the cleanup helper does not restore or delete them.

## Why Smoke Tests Dirty Watchtower Audit

Watchtower and related validation/smoke paths can write runtime audit or risk-observation rows. That is correct behavior for audit visibility, but it is not safe as commit noise when the target file is tracked.

The goal is not to disable audit logging. The goal is to make runtime writes visible, explicit, and easy to clean safely before staging.

## Safe Policy

Runtime logs should not be committed as changing operational state.

Tracked runtime log files should follow one of these owner-approved paths:

1. Convert to sample/template files and ignore live runtime output.
2. Leave tracked but restore after smoke validation using a path-scoped helper.
3. Untrack and ignore live runtime output after preserving required audit/sample evidence.

This V1 chooses the safest minimal implementation:

- Add a checker that reports tracked/dirty runtime files.
- Add strict mode for release gates.
- Add a cleanup helper scoped to the known recurring tracked runtime file.
- Do not de-track files without owner approval.
- Do not change Watchtower write behavior.
- Do not delete audit history.

## What Was Implemented

Created:

- `scripts/check_runtime_log_hygiene.py`
- `scripts/clean_runtime_audit_logs.sh`
- `docs/RUNTIME_AUDIT_LOG_HYGIENE_V1.md`
- `docs/RUNTIME_AUDIT_LOG_HYGIENE_V1.json`

Updated:

- `package.json`

Added package scripts:

- `npm run check:runtime-log-hygiene`
- `npm run check:runtime-log-hygiene:strict`

Added non-strict runtime hygiene to `npm run check:governance`.

Non-strict mode is intentionally used in governance because smoke workflows may legitimately dirty runtime files. Strict mode is available for pre-release and paid-launch staging gates.

## What Was Not Changed

This task did not:

- Delete audit files.
- Move audit files.
- Untrack `watchtower_audit.jsonl`.
- Add `.gitignore` rules for currently tracked runtime artifacts.
- Disable Watchtower logging.
- Change Watchtower business logic.
- Change Reports behavior.
- Change backend route permissions.
- Change auth behavior.
- Create production persistence.
- Commit changes.

## Cleanup Command

Check runtime hygiene:

```bash
python3 scripts/check_runtime_log_hygiene.py
```

Strict release check:

```bash
python3 scripts/check_runtime_log_hygiene.py --strict
```

Clean the known recurring tracked Watchtower runtime audit file:

```bash
bash scripts/clean_runtime_audit_logs.sh
```

The cleanup helper restores only:

- `services/shf-agent-fabric/var/watchtower_audit.jsonl`

It does not delete files, touch untracked logs, touch archives, or disable audit logging.

## Future Owner-Approved Recommendation

Before paid launch, owner should decide whether `watchtower_audit.jsonl` is:

- A committed sample fixture.
- A runtime-only generated file.
- An externally archived audit artifact.

Recommended future path:

1. Preserve required historical/sample evidence as an explicit sample or fixture.
2. Move live runtime output to an ignored runtime path or untrack the live file with owner approval.
3. Add narrow `.gitignore` coverage only after the tracked-file decision is made.
4. Keep strict runtime hygiene in the paid-launch release gate.

Owner approval is required for:

- Removing `watchtower_audit.jsonl` from git tracking.
- Replacing tracked runtime logs with sample/template files.
- Adding narrow ignore rules for currently tracked runtime audit artifacts.
- Moving runtime audit output paths or changing Watchtower audit write behavior.

## Validation Results

Validation completed:

- `python3 -m py_compile scripts/check_runtime_log_hygiene.py`: PASS
- `python3 scripts/check_runtime_log_hygiene.py`: PASS, checked 22 runtime paths and found 0 dirty tracked runtime files
- `python3 scripts/check_runtime_log_hygiene.py --strict`: PASS, checked 22 runtime paths and found 0 dirty tracked runtime files
- `bash scripts/clean_runtime_audit_logs.sh`: PASS, `watchtower_audit.jsonl` was already clean and no restore was needed
- `npm run check:governance`: PASS, including non-strict runtime-log hygiene check
- `npm run build`: PASS with the existing Vite large-chunk warning
- `python3 scripts/check_master_layer_registry.py`: PASS, 57 official registry rows/layers checked
- `python3 scripts/check_truth_spine_freeze.py`: PASS

## Git Safety

This task is allowed to change:

- `docs/RUNTIME_AUDIT_LOG_HYGIENE_V1.md`
- `docs/RUNTIME_AUDIT_LOG_HYGIENE_V1.json`
- `scripts/check_runtime_log_hygiene.py`
- `scripts/clean_runtime_audit_logs.sh`
- `package.json`

This task does not include commit, deletion, broad restore/reset, source behavior changes, auth changes, API behavior changes, or Watchtower logic changes.

## Remaining Risks

- `services/shf-agent-fabric/var/watchtower_audit.jsonl` remains tracked until owner approves de-tracking or sample/template conversion.
- Historical Watchtower audit export `jsonl` files under `services/shf-agent-fabric/var/audit_exports` remain tracked and should not be cleaned automatically.
- Non-strict governance check reports runtime hygiene but does not fail normal smoke workflows.
- Strict runtime hygiene must be run explicitly before release or paid-launch staging.
- Future Watchtower/API smoke runs may still dirty tracked runtime files until the owner-approved de-tracking or path strategy is completed.

## V1 Complete

V1 complete: yes.
