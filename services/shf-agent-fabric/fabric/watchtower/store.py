from __future__ import annotations

import json
import os
import sqlite3
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


def _repo_root() -> Path:
    # fabric/watchtower/store.py -> fabric/watchtower -> fabric -> services/shf-agent-fabric
    return Path(__file__).resolve().parents[2]


def _db_path() -> Path:
    # Default: services/shf-agent-fabric/var/watchtower_store.sqlite
    p = os.getenv("SHF_WATCHTOWER_STORE_PATH", "")
    if p.strip():
        return Path(p).expanduser().resolve()
    return _repo_root() / "var" / "watchtower_store.sqlite"


def _connect() -> sqlite3.Connection:
    dbp = _db_path()
    dbp.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(dbp))
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    return conn


def ensure_schema() -> None:
    with _connect() as c:
        c.execute(
            """
            CREATE TABLE IF NOT EXISTS quarantine (
                program_id TEXT PRIMARY KEY,
                active INTEGER NOT NULL,
                reason TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                expires_at INTEGER,
                created_by TEXT
            )
            """
        )
        c.execute(
            """
            CREATE TABLE IF NOT EXISTS risk_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ts INTEGER NOT NULL,
                program_id TEXT NOT NULL,
                risk_band TEXT NOT NULL,
                quarantined INTEGER NOT NULL,
                reasons_json TEXT NOT NULL,
                rank_score_01 REAL NOT NULL,
                health_01 REAL NOT NULL,
                delta_score_01 REAL NOT NULL,
                trend_band TEXT NOT NULL,
                window_days INTEGER NOT NULL,
                baseline_weeks INTEGER NOT NULL
            )
            """
        )
        c.execute("CREATE INDEX IF NOT EXISTS idx_risk_history_program_ts ON risk_history(program_id, ts DESC);")


def set_quarantine(program_id: str, *, reason: str, expires_at: Optional[int] = None, created_by: Optional[str] = None) -> None:
    ensure_schema()
    now = int(time.time())
    with _connect() as c:
        c.execute(
            """
            INSERT INTO quarantine(program_id, active, reason, created_at, expires_at, created_by)
            VALUES (?, 1, ?, ?, ?, ?)
            ON CONFLICT(program_id) DO UPDATE SET
                active=1,
                reason=excluded.reason,
                created_at=excluded.created_at,
                expires_at=excluded.expires_at,
                created_by=excluded.created_by
            """,
            (program_id, str(reason), now, expires_at, created_by),
        )


def clear_quarantine(program_id: str) -> None:
    ensure_schema()
    with _connect() as c:
        c.execute("UPDATE quarantine SET active=0 WHERE program_id=?", (program_id,))


def get_quarantine_map() -> Dict[str, Dict[str, Any]]:
    ensure_schema()
    now = int(time.time())
    out: Dict[str, Dict[str, Any]] = {}
    with _connect() as c:
        rows = c.execute(
            """
            SELECT program_id, active, reason, created_at, expires_at, created_by
            FROM quarantine
            """
        ).fetchall()
    for (pid, active, reason, created_at, expires_at, created_by) in rows:
        if int(active) != 1:
            continue
        if expires_at is not None and int(expires_at) > 0 and int(expires_at) < now:
            continue
        out[str(pid)] = {
            "active": True,
            "reason": str(reason),
            "created_at": int(created_at),
            "expires_at": (int(expires_at) if expires_at is not None else None),
            "created_by": (str(created_by) if created_by else None),
        }
    return out


def record_risk_snapshot(row: Dict[str, Any], *, window_days: int, baseline_weeks: int) -> None:
    """
    Store a deterministic risk snapshot per call.
    This is for HISTORY (D).
    """
    ensure_schema()
    try:
        program_id = str(row.get("program_id") or "")
        if not program_id:
            return
        ts = int(time.time())
        risk_band = str(row.get("risk_band") or "GREEN")
        quarantined = 1 if bool(row.get("quarantined")) else 0
        reasons = row.get("quarantine_reasons") if isinstance(row.get("quarantine_reasons"), list) else []
        reasons_json = json.dumps(reasons, sort_keys=True)

        rank_score_01 = float(row.get("rank_score_01") or 0.0)
        health_01 = float(row.get("health_01") or 0.0)
        delta_score_01 = float(row.get("delta_score_01") or 0.0)
        trend_band = str(row.get("trend_band") or "FLAT").upper()

        with _connect() as c:
            c.execute(
                """
                INSERT INTO risk_history(
                    ts, program_id, risk_band, quarantined, reasons_json,
                    rank_score_01, health_01, delta_score_01, trend_band,
                    window_days, baseline_weeks
                )
                VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    ts,
                    program_id,
                    risk_band,
                    quarantined,
                    reasons_json,
                    rank_score_01,
                    health_01,
                    delta_score_01,
                    trend_band,
                    int(window_days),
                    int(baseline_weeks),
                ),
            )
    except Exception:
        return


def get_risk_history(program_id: str, *, limit: int = 50) -> List[Dict[str, Any]]:
    ensure_schema()
    limit = max(1, min(int(limit), 500))
    with _connect() as c:
        rows = c.execute(
            """
            SELECT ts, program_id, risk_band, quarantined, reasons_json,
                   rank_score_01, health_01, delta_score_01, trend_band,
                   window_days, baseline_weeks
            FROM risk_history
            WHERE program_id=?
            ORDER BY ts DESC
            LIMIT ?
            """,
            (program_id, limit),
        ).fetchall()

    out: List[Dict[str, Any]] = []
    for r in rows:
        (
            ts, pid, band, quarantined, reasons_json,
            rank_score_01, health_01, delta_score_01, trend_band,
            window_days, baseline_weeks
        ) = r
        try:
            reasons = json.loads(reasons_json) if reasons_json else []
        except Exception:
            reasons = []
        out.append(
            {
                "ts": int(ts),
                "program_id": str(pid),
                "risk_band": str(band),
                "quarantined": bool(int(quarantined)),
                "reasons": reasons,
                "rank_score_01": float(rank_score_01),
                "health_01": float(health_01),
                "delta_score_01": float(delta_score_01),
                "trend_band": str(trend_band),
                "window_days": int(window_days),
                "baseline_weeks": int(baseline_weeks),
            }
        )
    return out
