from __future__ import annotations

"""
AFCC-3 Phase 4 — per-plan execution claim (single-flight) with a bounded lease.

One claim file per plan, `claims/{plan_id}.json`, created with O_CREAT|O_EXCL in
the same store as the run log. File creation is atomic on a local filesystem,
so exactly one thread or process holding the store can hold a plan's claim.
The claim lives next to the data it protects (plans and run events are
per-host JSON files); if that data moves to a shared database, the claim must
move into the same transaction boundary.

Lifecycle: claim -> run.execution_started -> work -> terminal event -> release.
A claim is released only after a terminal event is recorded. A claim whose
terminal could not be recorded (crash, unwritable log) stays held until its
lease has expired plus a grace period; only then may a new execution reclaim it,
and the reclaimer records `run.lease_expired` for the abandoned run.

The lease is server policy (FABRIC_RUN_LEASE_SECONDS, bounded); no request
field can change it. There is no heartbeat: execution is one synchronous
request, and the executor enforces the lease itself at step checkpoints.
"""

import json
import os
import secrets
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, Optional

CLAIM_SCHEMA = "fabric.run_claim.v1"

# AFCC-3 Phase 4.1: what this claim does and does not guarantee. The claim is a
# file in the replica's own store. Production (Azure Container Apps, up to two
# replicas, no shared volume) keeps plans, approvals, run events and claims per
# replica, so single-flight is NOT guaranteed across replicas. Nothing may
# present this as distributed assurance until the claim, plan state and run
# ledger share one transactional store.
EXECUTION_SAFETY = {
    "level": "LOCAL",
    "claim_authority": "REPLICA_LOCAL_FILE",
    "thread_single_flight": "YES",
    "cross_process_same_store": "YES",
    "cross_replica_distributed_single_flight": "NO",
    "local_single_flight": "ACTIVE",
    "distributed_single_flight": "NOT_GUARANTEED",
    "production_blocker": "DISTRIBUTED_SINGLE_FLIGHT_NOT_GUARANTEED",
    "summary": "LOCAL SINGLE-FLIGHT ACTIVE; DISTRIBUTED SINGLE-FLIGHT NOT YET GUARANTEED",
}
DEFAULT_LEASE_SECONDS = 300
MIN_LEASE_SECONDS = 30
MAX_LEASE_SECONDS = 3600
# A lease must be expired for this long before another execution may reclaim it.
TAKEOVER_GRACE_SECONDS = 60

# Identifies this process's claims without exposing host details.
PROCESS_INSTANCE = secrets.token_hex(8)


class ClaimHeld(Exception):
    def __init__(self, existing: Optional[Dict[str, Any]]):
        super().__init__("RUN_ALREADY_EXECUTING")
        self.existing = existing


def now() -> datetime:
    return datetime.now(timezone.utc)


def lease_seconds() -> int:
    try:
        value = int(os.getenv("FABRIC_RUN_LEASE_SECONDS", str(DEFAULT_LEASE_SECONDS)).strip())
    except ValueError:
        value = DEFAULT_LEASE_SECONDS
    return max(MIN_LEASE_SECONDS, min(MAX_LEASE_SECONDS, value))


def parse_ts(value: Any) -> Optional[datetime]:
    if not isinstance(value, str) or not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def claim_path(claims_dir: Path, plan_id: str) -> Path:
    return claims_dir / f"{plan_id}.json"


def read_claim(path: Path) -> Optional[Dict[str, Any]]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None
    return value if isinstance(value, dict) else None


def _reclaimable(existing: Optional[Dict[str, Any]], path: Path, at: datetime) -> bool:
    expires = parse_ts((existing or {}).get("lease_expires_at"))
    if expires is None:
        # Unreadable or half-written claim: fall back to the longest possible lease.
        try:
            expires = datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc) + timedelta(seconds=MAX_LEASE_SECONDS)
        except OSError:
            return False
    return at >= expires + timedelta(seconds=TAKEOVER_GRACE_SECONDS)


def acquire_claim(claims_dir: Path, record: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Atomically take the plan's claim. Returns the stale claim it reclaimed, if any.

    Raises ClaimHeld when another execution holds a live (or not yet reclaimable) claim.
    """
    claims_dir.mkdir(parents=True, exist_ok=True)
    path = claim_path(claims_dir, record["plan_id"])
    reclaimed: Optional[Dict[str, Any]] = None
    for _ in range(3):
        try:
            fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
        except FileExistsError:
            existing = read_claim(path)
            if not _reclaimable(existing, path, now()):
                raise ClaimHeld(existing)
            # Rename is atomic: of several racers, only one moves the stale claim aside.
            tomb = claims_dir / f".reclaimed.{record['plan_id']}.{secrets.token_hex(6)}.json"
            try:
                os.rename(path, tomb)
            except FileNotFoundError:
                continue
            reclaimed = read_claim(tomb) or existing or {}
            continue
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(record, handle, sort_keys=True)
            handle.flush()
            os.fsync(handle.fileno())
        return reclaimed
    raise ClaimHeld(None)


def release_claim(claims_dir: Path, plan_id: str, run_id: str) -> bool:
    """Remove the claim only if it still belongs to `run_id`."""
    path = claim_path(claims_dir, plan_id)
    current = read_claim(path)
    if not current or current.get("run_id") != run_id:
        return False
    try:
        path.unlink()
    except FileNotFoundError:
        return False
    return True


def new_claim(*, plan_id: str, run_id: str, actor_id: str, correlation_id: str) -> Dict[str, Any]:
    started = now()
    seconds = lease_seconds()
    return {
        "schema_version": CLAIM_SCHEMA,
        "plan_id": plan_id,
        "run_id": run_id,
        "claimed_by_actor_id": actor_id,
        "correlation_id": correlation_id,
        "claimed_at": started.isoformat(),
        "lease_seconds": seconds,
        "lease_expires_at": (started + timedelta(seconds=seconds)).isoformat(),
        "heartbeat": "NOT_SUPPORTED",
        "holder": {"pid": os.getpid(), "process_instance": PROCESS_INSTANCE},
    }


def deadline_passed(claim: Dict[str, Any]) -> bool:
    expires = parse_ts(claim.get("lease_expires_at"))
    return expires is None or now() >= expires
