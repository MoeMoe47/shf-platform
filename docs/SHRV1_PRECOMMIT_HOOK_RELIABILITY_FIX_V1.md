# SHRV1 Pre-commit Hook Reliability Fix V1

## Summary

SHRV1 pre-commit reliability was repaired so normal commits can run without
server restart side effects, interactive environment requirements, unbounded
HTTP calls, or unsafe port cleanup.

The pre-commit path now uses direct local verification:

- direct SHF registry ledger verification through Python
- bounded subprocess timeout for ledger verification
- bounded registry guard scan
- debug tracing through `SHRV1_PRECOMMIT_DEBUG=1`
- no FastAPI restart
- no HTTP verify endpoint call
- no `ADMIN_API_KEY` requirement
- no port listener cleanup
- no production mutation

No source feature behavior was changed.

## Root Cause

Normal commits were executing the migrated legacy pre-commit wrapper before the
configured pre-commit hooks. That legacy wrapper delegated to the SHF agent
fabric ledger pre-commit script, which restarted the local server on port 8090
and then verified the ledger through an admin HTTP route.

That design made the commit path depend on local server lifecycle, port
ownership, an admin API environment variable, and endpoint responsiveness. The
restart helper could kill any listener on port 8090 and start a new uvicorn
process without exact PID ownership tracking. If startup, health checks, or the
admin verification request stalled, the commit could appear hung.

## Affected Hook Path

- `.git/hooks/pre-commit`
- `.git/hooks/pre-commit.legacy`
- `.pre-commit-config.yaml`
- `services/shf-agent-fabric/bin/ledger_precommit.sh`
- `services/shf-agent-fabric/scripts/ledger_precommit.sh`
- `tools/precommit/check_registry_guard.py`

## Repair Summary

The repaired path removes server lifecycle work from pre-commit entirely.

- Added `tools/precommit/check_ledger_precommit.py`.
- Added a `shf-ledger-verify` hook before the existing registry guard.
- Updated the registry guard with a bounded timeout and debug tracing.
- Replaced legacy ledger shell scripts with direct local verifier calls.
- Updated the local migrated hook wrapper to remove `ADMIN_API_KEY` and only
  call the bounded ledger script.
- Added focused reliability tests for timeout cleanup, repeated execution,
  port safety, HTTP independence, and hook ordering.

## Timeouts

- Ledger verification timeout: 30 seconds by default.
- Registry guard timeout: 60 seconds by default.
- Timed-out ledger child process receives terminate, then an exact-child kill
  only if the three-second graceful cleanup window expires.

## Cleanup Guarantees

- No port process is killed by pre-commit.
- No server process is started by pre-commit.
- No network or HTTP route is required by pre-commit.
- Timeout cleanup targets only the exact subprocess created by the checker.
- Temporary worktree used for commit testing was removed.
- No staged files were left behind.

## Validation Results

Focused test suite:

- `python3 -m pytest tests/test_precommit_reliability.py`
- Result: 9 passed

Direct hook checks after repair:

- `pre-commit run shf-ledger-verify --all-files --verbose`
- Result: passed in approximately 2.44 seconds

- `pre-commit run shf-registry-guard --all-files --verbose`
- Result: passed in approximately 18.85 seconds

- `pre-commit run --all-files --verbose`
- Result: passed in approximately 18.86 seconds

Five-run registry guard check:

| Run | Elapsed real time |
| --- | --- |
| 1 | 11.68s |
| 2 | 10.00s |
| 3 | 10.29s |
| 4 | 10.05s |
| 5 | 9.96s |

Average: 10.40s

Maximum: 11.68s

Leaked new process count: 0

Git lock leftovers: 0

## Temporary Commit Test

A detached temporary worktree was used to verify normal `git commit` behavior
without modifying the active branch history.

- Temporary worktree: `/tmp/shrv1-hook-test-precommit`
- Temporary commit hash: `ce9ee7f`
- Commit elapsed real time: 8.89 seconds
- Result: passed
- Worktree removed: yes
- Active branch history modified: no

The normal commit path executed:

1. migrated legacy wrapper
2. direct ledger verifier
3. registry guard
4. configured pre-commit ledger hook
5. configured pre-commit registry guard hook

All completed without restart, HTTP verification, or interactive input.

## Remaining Risks

- The registry guard still scans repository files and can take roughly 10 to 19
  seconds depending on filesystem cache state.
- A pre-existing uvicorn listener on port 8090 was observed during diagnosis and
  was intentionally left untouched.
- The generated pre-commit hook still invokes the migrated legacy wrapper, but
  that wrapper now delegates only to the bounded local verifier path.

## Completion Status

Pre-commit reliability repair is complete.

Normal commits are supported without `--no-verify`.

No files were staged, committed, pushed, tagged, deleted, restored, reset, or
moved as part of this report.
