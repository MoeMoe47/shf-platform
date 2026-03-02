from __future__ import annotations

import datetime
import hashlib
import json
from typing import Any, Dict, List, Optional, Tuple

from fabric.watchtower.policy import evaluate_attestation_policy
from fabric.watchtower.store import _connect, ensure_schema  # type: ignore


def _canonical_json(obj: Any) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def _sha256_hex(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def _latest_attestation() -> Optional[Dict[str, Any]]:
    with _connect() as c:
        row = c.execute(
            """
            SELECT id, created_utc, root_hash, prev_root_hash, components_json, policy_json, notes, signer
            FROM chain_attestations
            ORDER BY id DESC
            LIMIT 1
            """
        ).fetchone()
    if not row:
        return None
    return {
        "id": int(row["id"]),
        "created_utc": str(row["created_utc"]),
        "root_hash": str(row["root_hash"]),
        "prev_root_hash": (str(row["prev_root_hash"]) if row["prev_root_hash"] else None),
        "components_json": str(row["components_json"]),
        "policy_json": str(row["policy_json"]),
        "notes": str(row["notes"] or ""),
        "signer": (str(row["signer"]) if row["signer"] else None),
    }


def compute_components(*, window_days: int, baseline_weeks: int) -> List[Dict[str, Any]]:
    """
    Deterministic component list used to compute the global root.
    We use the latest per-program snapshot chain_hash, plus key status fields.
    """
    ensure_schema()
    with _connect() as c:
        rows = c.execute(
            """
            SELECT rs.program_id, rs.chain_hash, rs.risk_band, rs.quarantined, rs.action, rs.decision_hash
            FROM risk_snapshots rs
            JOIN (
                SELECT program_id, MAX(id) AS max_id
                FROM risk_snapshots
                GROUP BY program_id
            ) latest
            ON latest.program_id = rs.program_id AND latest.max_id = rs.id
            ORDER BY rs.program_id ASC
            """
        ).fetchall()

    comps: List[Dict[str, Any]] = []
    for r in rows:
        comps.append(
            {
                "program_id": str(r["program_id"]),
                "chain_hash": str(r["chain_hash"]),
                "decision_hash": str(r["decision_hash"]),
                "risk_band": str(r["risk_band"]),
                "quarantined": bool(int(r["quarantined"])),
                "action": str(r["action"]),
                "window_days": int(window_days),
                "baseline_weeks": int(baseline_weeks),
            }
        )
    return comps


def generate_global_chain_root(
    *,
    window_days: int,
    baseline_weeks: int,
    notes: str = "",
    signer: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Creates an append-only attestation row for the current system state:
      - components: latest snapshot per program (sorted)
      - policy decision (stored)
      - root hash: sha256(canonical_json(components))
      - root hash-chain: prev_root_hash -> root_hash (stored as prev_root_hash in row)
    """
    ensure_schema()

    components = compute_components(window_days=int(window_days), baseline_weeks=int(baseline_weeks))
    policy = evaluate_attestation_policy(components)
    policy_json = _canonical_json(
        {"ok": policy.ok, "policy_version": policy.policy_version, "reasons": policy.reasons, "meta": policy.meta}
    )

    components_json = _canonical_json(components)
    root_hash = _sha256_hex(components_json)

    prev = _latest_attestation()
    prev_root_hash = (prev.get("root_hash") if prev else None)

    created_utc = datetime.datetime.utcnow().isoformat() + "Z"

    with _connect() as c:
        c.execute(
            """
            INSERT INTO chain_attestations(
                created_utc, root_hash, prev_root_hash, components_json, policy_json, notes, signer
            )
            VALUES(?, ?, ?, ?, ?, ?, ?)
            """,
            (
                created_utc,
                root_hash,
                prev_root_hash,
                components_json,
                policy_json,
                str(notes or ""),
                (str(signer) if signer else None),
            ),
        )
        c.commit()

    return {
        "ok": bool(policy.ok),
        "created_utc": created_utc,
        "root_hash": root_hash,
        "prev_root_hash": prev_root_hash,
        "components_count": len(components),
        "policy": {"ok": policy.ok, "policy_version": policy.policy_version, "reasons": policy.reasons, "meta": policy.meta},
    }


def verify_global_attestation_chain(*, limit: int = 5000) -> Dict[str, Any]:
    """
    Verifies the attestation chain links: prev_root_hash must match prior row's root_hash.
    """
    ensure_schema()
    limit = max(1, min(int(limit), 5000))

    with _connect() as c:
        rows = c.execute(
            """
            SELECT id, root_hash, prev_root_hash
            FROM chain_attestations
            ORDER BY id ASC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()

    prev = None
    checked = 0
    for r in rows:
        checked += 1
        expected_prev = prev or None
        actual_prev = (str(r["prev_root_hash"]) if r["prev_root_hash"] else None)
        if actual_prev != expected_prev:
            return {
                "ok": False,
                "checked": checked,
                "first_bad_id": int(r["id"]),
                "error": f"prev_root_hash mismatch (expected {expected_prev}, got {actual_prev})",
            }
        prev = str(r["root_hash"])

    return {"ok": True, "checked": checked}
