from __future__ import annotations

"""
Append-only Truth Spine security/history event log.

Truth Spine security remediation: prior audit confirmed structured approval/
verification history did not exist (only an actorless flat audit log). This
module is intentionally separate from ``services/truth_spine_service.py``'s
existing ``logs/truth.audit.log`` (which is preserved unchanged, since other
components may already depend on it) and provides a structured, queryable,
append-only record of every security-relevant Truth Spine transition.

"Append-only" here means: every function in this module that stores a new
event uses file-open-mode "a" (append) exclusively. No function in this
module opens the history file for writing/truncation, and no function
rewrites or removes an existing line. Ordinary application code has no way
to update or delete a previously written entry - only to append new ones.
This is enforced by construction, not by cryptographic signing; it is not an
immutable ledger in the cryptographic sense, and this module makes no such
claim (see docs/TRUTH_SPINE_SECURITY.md).
"""

import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

SERVICE_ROOT = Path(__file__).resolve().parents[1]
HISTORY_PATH = Path(os.getenv("SHF_TRUTH_HISTORY_PATH", str(SERVICE_ROOT / "db" / "truth" / "history.jsonl")))

EVENT_TYPES = {
    "source.created",
    "source.updated",
    "source.verified",
    "source.verification_revoked",
    "claim.created",
    "claim.version_created",
    "claim.public_approved",
    "claim.public_approval_revoked",
    "claim.public_population_approved",
    "claim.public_population_revoked",
    "public_population_authority.created",
    "public_population_authority.revoked",
    "public_population_signoff.approved",
    "public_population_signoff.revoked",
    "claim.internal_approved",
    "claim.internal_approval_revoked",
    "transition.rejected",
}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _ensure_storage() -> None:
    HISTORY_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not HISTORY_PATH.exists():
        HISTORY_PATH.touch()


def append_history_event(
    *,
    event_type: str,
    entity_type: str,
    entity_id: str,
    entity_version: Optional[int] = None,
    organization_id: Optional[str] = None,
    tenant_id: Optional[str] = None,
    actor_id: str,
    actor_type: str = "USER",
    authentication_method: str = "cookie_session",
    reason: str = "",
    previous_state: Optional[Dict[str, Any]] = None,
    new_state: Optional[Dict[str, Any]] = None,
    correlation_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Append one structured, immutable-by-construction history event.

    This function ONLY appends (file opened with mode "a"). It never reads
    the file back to rewrite it, and no other function in this module opens
    the file for writing/truncation.
    """
    if event_type not in EVENT_TYPES:
        raise ValueError(f"unknown Truth Spine history event_type: {event_type!r}")
    _ensure_storage()
    event = {
        "event_id": f"tevt_{uuid.uuid4().hex[:16]}",
        "event_type": event_type,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "entity_version": entity_version,
        "organization_id": organization_id,
        "tenant_id": tenant_id if tenant_id is not None else organization_id,
        "actor_id": actor_id,
        "actor_type": actor_type,
        "authentication_method": authentication_method,
        "reason": reason,
        "previous_state": previous_state or {},
        "new_state": new_state or {},
        "timestamp": _now(),
        "correlation_id": correlation_id or f"corr_{uuid.uuid4().hex[:12]}",
    }
    with HISTORY_PATH.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(event, sort_keys=True) + "\n")
    return event


def list_history_for_entity(entity_id: str, limit: int = 200) -> List[Dict[str, Any]]:
    """Read-only. Returns events in the order they were appended (oldest
    first among the returned window), proving later transitions never
    overwrite earlier ones."""
    _ensure_storage()
    events: List[Dict[str, Any]] = []
    with HISTORY_PATH.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            try:
                event = json.loads(line)
            except json.JSONDecodeError:
                continue
            if event.get("entity_id") == entity_id:
                events.append(event)
    return events[-limit:]


def list_recent_history(limit: int = 100, organization_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Read-only. Global (SHS-admin) history feed, optionally scoped."""
    _ensure_storage()
    events: List[Dict[str, Any]] = []
    with HISTORY_PATH.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            try:
                event = json.loads(line)
            except json.JSONDecodeError:
                continue
            if organization_id is not None and event.get("organization_id") != organization_id:
                continue
            events.append(event)
    return list(reversed(events[-limit:]))
