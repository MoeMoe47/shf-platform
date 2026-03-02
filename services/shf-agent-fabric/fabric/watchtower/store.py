from __future__ import annotations

import hashlib
import json
import os
import sqlite3
import time
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


# ============================================================
# Paths / DB connection (single source of truth)
# ============================================================

def _repo_root() -> Path:
    # fabric/watchtower/store.py -> fabric/watchtower -> fabric -> services/shf-agent-fabric
    return Path(__file__).resolve().parents[2]


def _db_path() -> Path:
    """
    Single source of truth DB path for ALL Watchtower storage:
      - quarantine
      - risk_history
      - risk_snapshots (hash-chain)
      - attestations (hash-chain)
      - enforcement flags (immutability toggle)
    """
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
    conn.row_factory = sqlite3.Row
    return conn


def _utc_now_z() -> str:
    # timezone-aware UTC, ISO8601 with Z
    return datetime.now(UTC).isoformat().replace("+00:00", "Z")


# ============================================================
# Deterministic hashing helpers
# ============================================================

def _canonical_json(obj: Any) -> str:
    """
    Deterministic JSON encoding:
      - sorted keys
      - compact separators
      - stable across runs
    """
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def _sha256_hex(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def _decision_hash(payload: Dict[str, Any]) -> str:
    """
    Prefer project decision_hash() if present; otherwise fallback to local sha256(canonical_json).
    """
    try:
        from fabric.watchtower.decision_hash import decision_hash  # type: ignore
        return str(decision_hash(payload))
    except Exception:
        return _sha256_hex(_canonical_json(payload))


# ============================================================
# Schema (quarantine + risk history + enforcement snapshots + attestations + flags)
# ============================================================

def ensure_schema() -> None:
    """
    Ensures base tables exist and performs safe, idempotent upgrades.
    Also installs immutability triggers (guarded by enforcement_flags).
    """
    with _connect() as c:
        # -----------------------------
        # Enforcement flags (toggles)
        # -----------------------------
        c.execute(
            """
            CREATE TABLE IF NOT EXISTS enforcement_flags (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_utc TEXT NOT NULL
            )
            """
        )

        # -----------------------------
        # Manual quarantine table
        # -----------------------------
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

        # -----------------------------
        # Risk history (time-series)
        # -----------------------------
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

        # -----------------------------
        # Enforcement-grade snapshots (append-only) + HASH CHAIN (per program)
        # -----------------------------
        c.execute(
            """
            CREATE TABLE IF NOT EXISTS risk_snapshots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_utc TEXT NOT NULL,
                program_id TEXT NOT NULL,
                window_days INTEGER NOT NULL,
                baseline_weeks INTEGER NOT NULL,
                risk_band TEXT NOT NULL,
                quarantined INTEGER NOT NULL,
                action TEXT NOT NULL,
                reasons_json TEXT NOT NULL,
                decision_hash TEXT NOT NULL,
                prev_chain_hash TEXT,
                chain_hash TEXT NOT NULL,
                payload_json TEXT NOT NULL
            )
            """
        )
        c.execute("CREATE INDEX IF NOT EXISTS idx_risk_snapshots_program_id_id ON risk_snapshots(program_id, id);")
        c.execute("CREATE UNIQUE INDEX IF NOT EXISTS uq_risk_snapshots_chain_hash ON risk_snapshots(chain_hash);")

        # If an older schema exists, add missing columns safely.
        cols = {r["name"] for r in c.execute("PRAGMA table_info(risk_snapshots)").fetchall()}

        def _add_col(name: str, ddl: str) -> None:
            if name not in cols:
                c.execute(f"ALTER TABLE risk_snapshots ADD COLUMN {ddl}")

        _add_col("window_days", "window_days INTEGER NOT NULL DEFAULT 0")
        _add_col("baseline_weeks", "baseline_weeks INTEGER NOT NULL DEFAULT 0")
        _add_col("reasons_json", "reasons_json TEXT NOT NULL DEFAULT '[]'")
        _add_col("decision_hash", "decision_hash TEXT NOT NULL DEFAULT ''")
        _add_col("prev_chain_hash", "prev_chain_hash TEXT")
        _add_col("chain_hash", "chain_hash TEXT NOT NULL DEFAULT ''")
        _add_col("payload_json", "payload_json TEXT NOT NULL DEFAULT '{}'")

        # -----------------------------
        # Attestations (append-only) + HASH CHAIN (global stream)
        # -----------------------------
        c.execute(
            """
            CREATE TABLE IF NOT EXISTS attestations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_utc TEXT NOT NULL,
                kind TEXT NOT NULL,
                program_id TEXT,
                chain_root TEXT NOT NULL,
                payload_json TEXT NOT NULL,
                decision_hash TEXT NOT NULL,
                prev_chain_hash TEXT,
                chain_hash TEXT NOT NULL
            )
            """
        )
        c.execute("CREATE UNIQUE INDEX IF NOT EXISTS uq_attestations_chain_hash ON attestations(chain_hash);")

        # -----------------------------
        # Immutability triggers (guarded by enforcement_flags)
        # snapshots_immutable=1 => block UPDATE/DELETE on risk_snapshots + attestations
        # -----------------------------
        c.execute(
            """
            CREATE TRIGGER IF NOT EXISTS trg_block_update_risk_snapshots
            BEFORE UPDATE ON risk_snapshots
            WHEN (SELECT value FROM enforcement_flags WHERE key='snapshots_immutable')='1'
            BEGIN
                SELECT RAISE(ABORT, 'risk_snapshots immutable');
            END;
            """
        )
        c.execute(
            """
            CREATE TRIGGER IF NOT EXISTS trg_block_delete_risk_snapshots
            BEFORE DELETE ON risk_snapshots
            WHEN (SELECT value FROM enforcement_flags WHERE key='snapshots_immutable')='1'
            BEGIN
                SELECT RAISE(ABORT, 'risk_snapshots immutable');
            END;
            """
        )
        c.execute(
            """
            CREATE TRIGGER IF NOT EXISTS trg_block_update_attestations
            BEFORE UPDATE ON attestations
            WHEN (SELECT value FROM enforcement_flags WHERE key='snapshots_immutable')='1'
            BEGIN
                SELECT RAISE(ABORT, 'attestations immutable');
            END;
            """
        )
        c.execute(
            """
            CREATE TRIGGER IF NOT EXISTS trg_block_delete_attestations
            BEFORE DELETE ON attestations
            WHEN (SELECT value FROM enforcement_flags WHERE key='snapshots_immutable')='1'
            BEGIN
                SELECT RAISE(ABORT, 'attestations immutable');
            END;
            """
        )

        c.commit()


# ============================================================
# Immutability controls
# ============================================================

def set_snapshots_immutable(on: bool) -> None:
    """
    When ON, SQLite triggers hard-block UPDATE/DELETE on risk_snapshots + attestations.
    """
    ensure_schema()
    with _connect() as c:
        c.execute(
            """
            INSERT INTO enforcement_flags(key, value, updated_utc)
            VALUES('snapshots_immutable', ?, ?)
            ON CONFLICT(key) DO UPDATE SET
                value=excluded.value,
                updated_utc=excluded.updated_utc
            """,
            ("1" if on else "0", _utc_now_z()),
        )
        c.commit()


def get_snapshots_immutable() -> bool:
    ensure_schema()
    with _connect() as c:
        row = c.execute(
            "SELECT value FROM enforcement_flags WHERE key='snapshots_immutable' LIMIT 1"
        ).fetchone()
    return bool(row and str(row["value"]).strip() == "1")


# ============================================================
# Quarantine API
# ============================================================

def set_quarantine(
    program_id: str,
    *,
    reason: str,
    expires_at: Optional[int] = None,
    created_by: Optional[str] = None,
) -> None:
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
        c.commit()


def clear_quarantine(program_id: str) -> None:
    ensure_schema()
    with _connect() as c:
        c.execute("UPDATE quarantine SET active=0 WHERE program_id=?", (program_id,))
        c.commit()


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

    for r in rows:
        pid = str(r["program_id"])
        active = int(r["active"])
        expires_at = r["expires_at"]
        if active != 1:
            continue
        if expires_at is not None and int(expires_at) > 0 and int(expires_at) < now:
            continue

        out[pid] = {
            "active": True,
            "reason": str(r["reason"]),
            "created_at": int(r["created_at"]),
            "expires_at": (int(expires_at) if expires_at is not None else None),
            "created_by": (str(r["created_by"]) if r["created_by"] else None),
        }
    return out


# ============================================================
# Risk history (time-series)
# ============================================================

def record_risk_history(row: Dict[str, Any], *, window_days: int, baseline_weeks: int) -> None:
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
            c.commit()
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
        try:
            reasons = json.loads(r["reasons_json"]) if r["reasons_json"] else []
        except Exception:
            reasons = []
        out.append(
            {
                "ts": int(r["ts"]),
                "program_id": str(r["program_id"]),
                "risk_band": str(r["risk_band"]),
                "quarantined": bool(int(r["quarantined"])),
                "reasons": reasons,
                "rank_score_01": float(r["rank_score_01"]),
                "health_01": float(r["health_01"]),
                "delta_score_01": float(r["delta_score_01"]),
                "trend_band": str(r["trend_band"]),
                "window_days": int(r["window_days"]),
                "baseline_weeks": int(r["baseline_weeks"]),
            }
        )
    return out


# ============================================================
# Enforcement snapshots: deterministic + append-only + per-program hash-chain
# ============================================================

def _latest_chain_hash(program_id: str) -> Optional[str]:
    with _connect() as c:
        row = c.execute(
            """
            SELECT chain_hash
            FROM risk_snapshots
            WHERE program_id=?
            ORDER BY id DESC
            LIMIT 1
            """,
            (program_id,),
        ).fetchone()
    return str(row["chain_hash"]) if row and row["chain_hash"] else None


def record_risk_snapshot(row: Dict[str, Any], *, window_days: int, baseline_weeks: int) -> Optional[str]:
    """
    Compatibility entrypoint:
      - Writes risk_history (time-series)
      - Writes enforcement risk_snapshots (deterministic, hash-chained)

    Returns chain_hash (or None if skipped).
    """
    ensure_schema()

    program_id = str(row.get("program_id") or "")
    if not program_id:
        return None

    # 1) Always keep time-series history
    record_risk_history(row, window_days=window_days, baseline_weeks=baseline_weeks)

    # 2) Deterministic enforcement snapshot payload
    reasons = row.get("quarantine_reasons") if isinstance(row.get("quarantine_reasons"), list) else []
    payload: Dict[str, Any] = {
        "program_id": program_id,
        "window_days": int(window_days),
        "baseline_weeks": int(baseline_weeks),
        "risk_band": str(row.get("risk_band") or "GREEN"),
        "quarantined": bool(row.get("quarantined")),
        "action": str(row.get("watchtower_action") or ""),
        "reasons": reasons,
        "rank_score_01": float(row.get("rank_score_01") or 0.0),
        "health_01": float(row.get("health_01") or 0.0),
        "delta_score_01": float(row.get("delta_score_01") or 0.0),
        "trend_band": str(row.get("trend_band") or "FLAT").upper(),
    }

    payload_json = _canonical_json(payload)
    decision_hash = _decision_hash(payload)

    prev = _latest_chain_hash(program_id) or ""
    chain_input = f"{prev}|{decision_hash}|{payload_json}"
    chain_hash = _sha256_hex(chain_input)

    with _connect() as c:
        c.execute(
            """
            INSERT INTO risk_snapshots(
                created_utc,
                program_id,
                window_days,
                baseline_weeks,
                risk_band,
                quarantined,
                action,
                reasons_json,
                decision_hash,
                prev_chain_hash,
                chain_hash,
                payload_json
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                _utc_now_z(),
                program_id,
                int(window_days),
                int(baseline_weeks),
                payload["risk_band"],
                1 if payload["quarantined"] else 0,
                payload["action"],
                _canonical_json(reasons),
                decision_hash,
                (prev if prev else None),
                chain_hash,
                payload_json,
            ),
        )
        c.commit()

    return chain_hash


def get_risk_snapshots(program_id: str, *, limit: int = 50) -> List[Dict[str, Any]]:
    ensure_schema()
    limit = max(1, min(int(limit), 500))
    with _connect() as c:
        rows = c.execute(
            """
            SELECT id, created_utc, program_id, window_days, baseline_weeks,
                   risk_band, quarantined, action, reasons_json,
                   decision_hash, prev_chain_hash, chain_hash, payload_json
            FROM risk_snapshots
            WHERE program_id=?
            ORDER BY id DESC
            LIMIT ?
            """,
            (program_id, limit),
        ).fetchall()

    out: List[Dict[str, Any]] = []
    for r in rows:
        try:
            reasons = json.loads(r["reasons_json"]) if r["reasons_json"] else []
        except Exception:
            reasons = []
        try:
            payload = json.loads(r["payload_json"]) if r["payload_json"] else {}
        except Exception:
            payload = {}

        out.append(
            {
                "id": int(r["id"]),
                "created_utc": str(r["created_utc"]),
                "program_id": str(r["program_id"]),
                "window_days": int(r["window_days"]),
                "baseline_weeks": int(r["baseline_weeks"]),
                "risk_band": str(r["risk_band"]),
                "quarantined": bool(int(r["quarantined"])),
                "action": str(r["action"]),
                "reasons": reasons,
                "decision_hash": str(r["decision_hash"]),
                "prev_chain_hash": (str(r["prev_chain_hash"]) if r["prev_chain_hash"] else None),
                "chain_hash": str(r["chain_hash"]),
                "payload": payload,
            }
        )
    return out


def verify_risk_snapshot_chain(program_id: str, *, limit: int = 2000) -> Dict[str, Any]:
    """
    Verifies the per-program snapshot hash-chain integrity.
    Returns {ok, checked, first_bad_id?, error?}.
    """
    ensure_schema()
    limit = max(1, min(int(limit), 5000))

    with _connect() as c:
        rows = c.execute(
            """
            SELECT id, decision_hash, prev_chain_hash, chain_hash, payload_json
            FROM risk_snapshots
            WHERE program_id=?
            ORDER BY id ASC
            LIMIT ?
            """,
            (program_id, limit),
        ).fetchall()

    prev = ""
    checked = 0
    for r in rows:
        checked += 1
        expected_prev = str(r["prev_chain_hash"] or "")
        if expected_prev != prev:
            return {
                "ok": False,
                "checked": checked,
                "first_bad_id": int(r["id"]),
                "error": f"prev_chain_hash mismatch (expected '{prev}', got '{expected_prev}')",
            }

        payload_json = str(r["payload_json"] or "")
        decision_hash = str(r["decision_hash"] or "")
        recomputed = _sha256_hex(f"{prev}|{decision_hash}|{payload_json}")

        if recomputed != str(r["chain_hash"] or ""):
            return {
                "ok": False,
                "checked": checked,
                "first_bad_id": int(r["id"]),
                "error": "chain_hash mismatch",
            }

        prev = str(r["chain_hash"] or "")

    return {"ok": True, "checked": checked}


# ============================================================
# Global chain root (cross-program): newest snapshot per program
# ============================================================

def compute_global_chain_root() -> Dict[str, Any]:
    """
    Computes a deterministic global root over the latest chain_hash for each program.
    root = sha256( join_sorted( program_id + ":" + chain_hash ) )
    """
    ensure_schema()
    with _connect() as c:
        rows = c.execute(
            """
            SELECT program_id, chain_hash
            FROM risk_snapshots
            WHERE id IN (
                SELECT MAX(id)
                FROM risk_snapshots
                GROUP BY program_id
            )
            """
        ).fetchall()

    items: List[Tuple[str, str]] = []
    for r in rows:
        pid = str(r["program_id"])
        ch = str(r["chain_hash"])
        if pid and ch:
            items.append((pid, ch))

    items.sort(key=lambda t: t[0])
    material = "|".join([f"{pid}:{ch}" for (pid, ch) in items])
    root = _sha256_hex(material)

    return {
        "ok": True,
        "program_count": len(items),
        "root": root,
        "material_preview": material[:200],
    }


# ============================================================
# Attestations: append-only + hash-chain
# ============================================================

def _latest_attestation_chain_hash() -> str:
    with _connect() as c:
        row = c.execute(
            "SELECT chain_hash FROM attestations ORDER BY id DESC LIMIT 1"
        ).fetchone()
    return str(row["chain_hash"]) if row and row["chain_hash"] else ""


def write_attestation(*, kind: str, chain_root: str, payload: Dict[str, Any], program_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Writes an append-only attestation record chained to previous attestations.
    """
    ensure_schema()
    prev = _latest_attestation_chain_hash()
    payload_json = _canonical_json(payload)
    decision_hash = _decision_hash({"kind": kind, "chain_root": chain_root, "payload": payload})
    chain_hash = _sha256_hex(f"{prev}|{decision_hash}|{payload_json}")

    with _connect() as c:
        c.execute(
            """
            INSERT INTO attestations(
                created_utc, kind, program_id, chain_root, payload_json,
                decision_hash, prev_chain_hash, chain_hash
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                _utc_now_z(),
                str(kind),
                (str(program_id) if program_id else None),
                str(chain_root),
                payload_json,
                decision_hash,
                (prev if prev else None),
                chain_hash,
            ),
        )
        c.commit()

    return {"ok": True, "kind": kind, "chain_root": chain_root, "chain_hash": chain_hash}


