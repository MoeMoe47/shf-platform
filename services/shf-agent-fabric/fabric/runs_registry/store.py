from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone

BASE = Path(__file__).resolve().parent.parent.parent
DB_DIR = BASE / "db"
DB_DIR.mkdir(exist_ok=True)

SQLITE_PATH = DB_DIR / "fabric.sqlite"


def _utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _conn() -> sqlite3.Connection:
    c = sqlite3.connect(str(SQLITE_PATH))
    c.row_factory = sqlite3.Row
    return c


def init_runs_registry() -> None:
    with _conn() as con:
        con.execute(
            """
            CREATE TABLE IF NOT EXISTS runs_registry (
              run_id      TEXT PRIMARY KEY,
              app_id      TEXT NOT NULL,
              name        TEXT,
              owner       TEXT,
              mode        TEXT,          -- "pilot" | "system" | "dev" | null
              created_ts  TEXT NOT NULL,
              start_ts    TEXT,
              end_ts      TEXT,
              targets_json TEXT,         -- JSON string
              meta_json    TEXT          -- JSON string
            );
            """
        )
        con.execute("CREATE INDEX IF NOT EXISTS idx_runs_app_id ON runs_registry(app_id);")
        con.execute("CREATE INDEX IF NOT EXISTS idx_runs_created_ts ON runs_registry(created_ts);")
        con.commit()


def _json_dumps(obj: Any) -> Optional[str]:
    if obj is None:
        return None
    try:
        return json.dumps(obj)
    except Exception:
        return None


def _json_loads(s: Any) -> Any:
    if not isinstance(s, str) or not s.strip():
        return None
    try:
        return json.loads(s)
    except Exception:
        return None


def register_run(
    run_id: str,
    app_id: str,
    name: Optional[str] = None,
    owner: Optional[str] = None,
    mode: Optional[str] = None,
    start_ts: Optional[str] = None,
    end_ts: Optional[str] = None,
    targets: Optional[Dict[str, Any]] = None,
    meta: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    init_runs_registry()

    rec = {
        "run_id": run_id,
        "app_id": app_id,
        "name": name,
        "owner": owner,
        "mode": mode,
        "created_ts": _utc_iso(),
        "start_ts": start_ts,
        "end_ts": end_ts,
        "targets_json": _json_dumps(targets),
        "meta_json": _json_dumps(meta),
    }

    with _conn() as con:
        # upsert
        con.execute(
            """
            INSERT INTO runs_registry
              (run_id, app_id, name, owner, mode, created_ts, start_ts, end_ts, targets_json, meta_json)
            VALUES
              (:run_id, :app_id, :name, :owner, :mode, :created_ts, :start_ts, :end_ts, :targets_json, :meta_json)
            ON CONFLICT(run_id) DO UPDATE SET
              app_id=excluded.app_id,
              name=excluded.name,
              owner=excluded.owner,
              mode=excluded.mode,
              start_ts=excluded.start_ts,
              end_ts=excluded.end_ts,
              targets_json=excluded.targets_json,
              meta_json=excluded.meta_json;
            """,
            rec,
        )
        con.commit()

    return {"ok": True, "run_id": run_id}


def get_run(run_id: str) -> Dict[str, Any]:
    init_runs_registry()
    with _conn() as con:
        row = con.execute("SELECT * FROM runs_registry WHERE run_id = ?", (run_id,)).fetchone()
        if not row:
            return {"ok": False, "error": "RUN_NOT_FOUND", "run_id": run_id}

        d = dict(row)
        d["targets"] = _json_loads(d.pop("targets_json", None))
        d["meta"] = _json_loads(d.pop("meta_json", None))
        m = d.get("meta") or {}
        if isinstance(m, dict):
            d["site"] = m.get("site") or d.get("site") or "unknown"
        else:
            d["site"] = d.get("site") or "unknown"
        return {"ok": True, "run": d}


def list_runs(app_id: Optional[str] = None, limit: int = 50) -> Dict[str, Any]:
    init_runs_registry()
    limit = max(1, min(int(limit or 50), 500))

    q = "SELECT * FROM runs_registry"
    args: List[Any] = []
    if app_id:
        q += " WHERE app_id = ?"
        args.append(app_id)
    q += " ORDER BY created_ts DESC LIMIT ?"
    args.append(limit)

    with _conn() as con:
        rows = con.execute(q, tuple(args)).fetchall()
        out = []
        for r in rows:
            d = dict(r)
            d["targets"] = _json_loads(d.pop("targets_json", None))
            d["meta"] = _json_loads(d.pop("meta_json", None))
            m = d.get("meta") or {}
            if isinstance(m, dict):
                d["site"] = m.get("site") or d.get("site") or "unknown"
            else:
                d["site"] = d.get("site") or "unknown"
            out.append(d)

    return {"ok": True, "runs": out, "count": len(out), "filters": {"app_id": app_id, "limit": limit}}


def run_exists(run_id: str) -> bool:
    if not run_id:
        return False
    init_runs_registry()
    with _conn() as con:
        row = con.execute("SELECT 1 FROM runs_registry WHERE run_id = ? LIMIT 1", (run_id,)).fetchone()
        return bool(row)

def get_run_targets(run_id: str) -> Dict[str, Any]:
    """
    Returns targets dict for run_id, or ok=False if not found.
    """
    res = get_run(run_id)
    if not res.get("ok"):
        return {"ok": False, "error": res.get("error", "RUN_NOT_FOUND"), "run_id": run_id}
    run = res.get("run") or {}
    targets = run.get("targets")
    if isinstance(targets, dict):
        return {"ok": True, "run_id": run_id, "targets": targets}
    return {"ok": True, "run_id": run_id, "targets": {}}
