from __future__ import annotations

"""
Side-effect-free Watchtower read projection for the Agent Fabric Command Center.

Reads the latest PERSISTED Watchtower state only:
  - latest risk snapshot per catalog program (risk_snapshots)
  - active manual quarantine (quarantine)
  - latest attestation (attestations)

It never recomputes risk, never calls LOO rankings, never writes risk history,
snapshots, audit events, quarantine, or attestations, and never runs schema
setup. The store is opened read-only (sqlite `mode=ro`); a missing store means
Watchtower has not evaluated yet.

Alerts and integrity rates are computed during evaluation and are not
persisted by Watchtower, so they are reported as NOT_PUBLISHED.
"""

import json
import sqlite3
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fabric.watchtower.store import _db_path  # pure path resolution; no I/O

BAND_ORDER = ("GREEN", "YELLOW", "RED", "QUARANTINE")


def _catalog_program_ids() -> List[str]:
    # Same catalog Watchtower evaluates (static, side-effect free).
    from routers.loo_routes import loo_programs  # type: ignore

    catalog = loo_programs()
    programs = catalog.get("programs") if isinstance(catalog, dict) else None
    out = []
    for p in programs if isinstance(programs, list) else []:
        pid = str((p or {}).get("program_id") or "") if isinstance(p, dict) else ""
        if pid:
            out.append(pid)
    return out


def _connect_read_only(path) -> sqlite3.Connection:
    conn = sqlite3.connect(f"{path.as_uri()}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    return conn


def _table_exists(conn: sqlite3.Connection, name: str) -> bool:
    row = conn.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?", (name,)).fetchone()
    return row is not None


def _parse_utc(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None


def _age_seconds(value: Optional[str], now: datetime) -> Optional[int]:
    parsed = _parse_utc(value)
    return max(0, int((now - parsed).total_seconds())) if parsed else None


def _reasons(raw: Any) -> List[str]:
    try:
        parsed = json.loads(raw) if isinstance(raw, str) else raw
    except ValueError:
        return []
    return [str(r) for r in parsed if isinstance(r, str)] if isinstance(parsed, list) else []


def build_watchtower_read_projection(now: Optional[datetime] = None) -> Dict[str, Any]:
    now = now or datetime.now(timezone.utc)
    catalog = _catalog_program_ids()
    path = _db_path()

    base: Dict[str, Any] = {
        "source": {
            "authority": "Watchtower",
            "store": "watchtower_store",
            "tables": ["risk_snapshots", "quarantine", "attestations"],
            "evaluation_action": "watchtower.summary",
            "recomputed_on_read": False,
        },
        "catalog_program_count": len(catalog),
        "alerts": {"state": "NOT_PUBLISHED", "reason_code": "WATCHTOWER_DOES_NOT_PERSIST_ALERTS"},
        "integrity": {"state": "NOT_PUBLISHED", "reason_code": "WATCHTOWER_DOES_NOT_PERSIST_INTEGRITY"},
    }

    if not path.exists():
        return {
            **base,
            "state": "NOT_YET_EVALUATED",
            "reason_code": "WATCHTOWER_STORE_NOT_CREATED",
            "programs": [{"program_id": pid, "state": "NOT_YET_EVALUATED"} for pid in catalog],
            "latest_evaluation": None,
            "manual_quarantine": {"active_count": 0, "programs": []},
            "latest_attestation": {"state": "NOT_RECORDED"},
        }

    conn = _connect_read_only(path)
    try:
        snapshots: Dict[str, Dict[str, Any]] = {}
        if _table_exists(conn, "risk_snapshots"):
            rows = conn.execute(
                """
                SELECT program_id, created_utc, risk_band, quarantined, action, reasons_json
                FROM risk_snapshots
                WHERE id IN (SELECT MAX(id) FROM risk_snapshots GROUP BY program_id)
                """
            ).fetchall()
            snapshots = {str(r["program_id"]): dict(r) for r in rows}

        quarantine: List[Dict[str, Any]] = []
        if _table_exists(conn, "quarantine"):
            epoch = int(time.time())
            for r in conn.execute("SELECT program_id, active, reason, created_at, expires_at FROM quarantine").fetchall():
                if int(r["active"]) != 1:
                    continue
                if r["expires_at"] is not None and 0 < int(r["expires_at"]) < epoch:
                    continue
                quarantine.append(
                    {
                        "program_id": str(r["program_id"]),
                        "reason": str(r["reason"] or ""),
                        "since": datetime.fromtimestamp(int(r["created_at"]), timezone.utc).isoformat().replace("+00:00", "Z"),
                    }
                )

        attestation = {"state": "NOT_RECORDED"}
        if _table_exists(conn, "attestations"):
            row = conn.execute("SELECT created_utc, kind FROM attestations ORDER BY id DESC LIMIT 1").fetchone()
            if row:
                attestation = {"state": "RECORDED", "created_utc": row["created_utc"], "kind": str(row["kind"])}
    finally:
        conn.close()

    programs: List[Dict[str, Any]] = []
    for pid in catalog:
        snap = snapshots.get(pid)
        if not snap:
            programs.append({"program_id": pid, "state": "NOT_YET_EVALUATED"})
            continue
        programs.append(
            {
                "program_id": pid,
                "state": "EVALUATED",
                "risk_band": str(snap["risk_band"]),
                "quarantined": bool(snap["quarantined"]),
                "action": str(snap["action"] or ""),
                "reasons": _reasons(snap["reasons_json"]),
                "evaluated_at": snap["created_utc"],
            }
        )

    evaluated = [p for p in programs if p["state"] == "EVALUATED"]
    risk_counts = {band: 0 for band in BAND_ORDER}
    for p in evaluated:
        band = p["risk_band"] if p["risk_band"] in risk_counts else None
        if band:
            risk_counts[band] += 1
    quarantined_count = sum(1 for p in evaluated if p["quarantined"])
    worst = None
    if evaluated:
        # Same roll-up rule Watchtower applies to its own rows (aggregator.py).
        worst = "QUARANTINE" if quarantined_count else ("RED" if risk_counts["RED"] else ("YELLOW" if risk_counts["YELLOW"] else "GREEN"))
    latest = max((p["evaluated_at"] for p in evaluated), default=None)
    oldest = min((p["evaluated_at"] for p in evaluated), default=None)

    return {
        **base,
        "state": "AVAILABLE" if evaluated else "NOT_YET_EVALUATED",
        "reason_code": None if evaluated else "NO_PERSISTED_SNAPSHOTS_FOR_CATALOG",
        "programs": programs,
        "latest_evaluation": None
        if not evaluated
        else {
            "worst_risk_band": worst,
            "risk_counts": risk_counts,
            "quarantined_count": quarantined_count,
            "evaluated_program_count": len(evaluated),
            "not_evaluated_program_count": len(programs) - len(evaluated),
            "latest_evaluated_at": latest,
            "oldest_evaluated_at": oldest,
            "staleness": {
                "age_seconds": _age_seconds(latest, now),
                "oldest_age_seconds": _age_seconds(oldest, now),
                "threshold_seconds": None,
                "threshold": "NOT_DEFINED",
            },
        },
        "non_catalog_snapshot_program_count": len([pid for pid in snapshots if pid not in catalog]),
        "manual_quarantine": {"active_count": len(quarantine), "programs": quarantine},
        "latest_attestation": attestation,
    }
