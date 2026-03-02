from __future__ import annotations

import hashlib
import json
import os
import sqlite3
import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional


def _repo_root() -> Path:
    # fabric/watchtower/*.py -> fabric/watchtower -> fabric -> services/shf-agent-fabric
    return Path(__file__).resolve().parents[2]


def _db_path() -> Path:
    p = os.getenv("SHF_WATCHTOWER_STORE_PATH", "")
    if p.strip():
        return Path(p).expanduser().resolve()
    return _repo_root() / "var" / "watchtower_store.sqlite"


def _canonical_json(obj: Any) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def _sha256_hex(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def compute_global_chain_root(*, limit_programs: int = 5000) -> Dict[str, Any]:
    """
    Deterministic "global root" over the latest chain tip of each program.
    Root input = sorted list of {program_id, tip_chain_hash, snapshot_count}.
    Root = sha256(canonical_json(input)).
    """
    dbp = _db_path()
    dbp.parent.mkdir(parents=True, exist_ok=True)

    # If DB doesn't exist yet, still return deterministic empty root
    if not dbp.exists():
        payload = []
        root = _sha256_hex(_canonical_json(payload))
        return {
            "ok": True,
            "db_path": str(dbp),
            "computed_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "programs": 0,
            "total_snapshots": 0,
            "root_input": payload,
            "root_hash": root,
            "notes": "DB missing; root computed over empty set",
        }

    conn = sqlite3.connect(str(dbp))
    conn.row_factory = sqlite3.Row
    try:
        # Ensure table exists; if not, treat as empty root
        try:
            conn.execute("SELECT 1 FROM risk_snapshots LIMIT 1")
        except sqlite3.OperationalError:
            payload = []
            root = _sha256_hex(_canonical_json(payload))
            return {
                "ok": True,
                "db_path": str(dbp),
                "computed_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "programs": 0,
                "total_snapshots": 0,
                "root_input": payload,
                "root_hash": root,
                "notes": "risk_snapshots missing; root computed over empty set",
            }

        # Program ids
        pids = conn.execute(
            "SELECT DISTINCT program_id FROM risk_snapshots ORDER BY program_id ASC LIMIT ?",
            (int(limit_programs),),
        ).fetchall()

        root_input: List[Dict[str, Any]] = []
        total = 0

        for pr in pids:
            pid = str(pr["program_id"])
            tip = conn.execute(
                """
                SELECT chain_hash
                FROM risk_snapshots
                WHERE program_id=?
                ORDER BY id DESC
                LIMIT 1
                """,
                (pid,),
            ).fetchone()
            tip_hash = str(tip["chain_hash"]) if tip and tip["chain_hash"] else ""

            cnt = conn.execute(
                "SELECT COUNT(1) AS c FROM risk_snapshots WHERE program_id=?",
                (pid,),
            ).fetchone()
            c = int(cnt["c"]) if cnt and cnt["c"] is not None else 0
            total += c

            root_input.append(
                {
                    "program_id": pid,
                    "tip_chain_hash": tip_hash,
                    "snapshot_count": c,
                }
            )

        # Deterministic order already ensured by ORDER BY program_id ASC
        root_hash = _sha256_hex(_canonical_json(root_input))

        return {
            "ok": True,
            "db_path": str(dbp),
            "computed_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "programs": len(root_input),
            "total_snapshots": int(total),
            "root_input": root_input,
            "root_hash": root_hash,
        }
    finally:
        conn.close()
