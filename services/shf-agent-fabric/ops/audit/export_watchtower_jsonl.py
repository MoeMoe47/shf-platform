from __future__ import annotations

import os
import json
import datetime
from typing import Any, Dict, Iterable

"""
Nightly export scaffold:
- Reads Postgres (truth) and writes JSONL files (immutable audit archive later)
- This file does NOT run unless you explicitly execute it.
- For now, it writes to a local folder; swap destination to S3/GCS/Azure Blob later.

ENV (examples):
  SHF_PG_URL="postgresql://shf:shf_dev_password_change_me@localhost:5432/shf"
  SHF_AUDIT_EXPORT_DIR="services/shf-agent-fabric/var/audit_exports"
  SHF_AUDIT_EXPORT_DAYS=1
"""

def _utc_now_iso() -> str:
    return datetime.datetime.now(datetime.UTC).isoformat()

def _env(name: str, default: str = "") -> str:
    return str(os.getenv(name, default) or "").strip()

def _require(name: str) -> str:
    v = _env(name, "")
    if not v:
        raise SystemExit(f"Missing env: {name}")
    return v

def _rows(conn, query: str, params: tuple[Any, ...]) -> Iterable[Dict[str, Any]]:
    cur = conn.cursor()
    cur.execute(query, params)
    cols = [d[0] for d in cur.description]
    for r in cur.fetchall():
        yield {cols[i]: r[i] for i in range(len(cols))}

def main() -> None:
    pg_url = _require("SHF_PG_URL")
    out_dir = _env("SHF_AUDIT_EXPORT_DIR", "services/shf-agent-fabric/var/audit_exports")
    days = int(_env("SHF_AUDIT_EXPORT_DAYS", "1") or "1")

    os.makedirs(out_dir, exist_ok=True)

    # Lazy import so your normal app/tests never require psycopg.
    try:
        import psycopg  # type: ignore
    except Exception as e:
        raise SystemExit("psycopg not installed. Install with: pip install psycopg[binary]\n" + str(e))

    since = datetime.datetime.now(datetime.UTC) - datetime.timedelta(days=days)
    stamp = datetime.datetime.now(datetime.UTC).strftime("%Y%m%d_%H%M%S")
    snap_path = os.path.join(out_dir, f"watchtower_snapshots_{stamp}.jsonl")
    att_path = os.path.join(out_dir, f"watchtower_attestations_{stamp}.jsonl")

    with psycopg.connect(pg_url) as conn:
        with open(snap_path, "w", encoding="utf-8") as f:
            for row in _rows(
                conn,
                "SELECT * FROM watchtower_snapshots WHERE created_utc >= %s ORDER BY created_utc ASC",
                (since,),
            ):
                f.write(json.dumps(row, default=str, ensure_ascii=False) + "\n")

        with open(att_path, "w", encoding="utf-8") as f:
            for row in _rows(
                conn,
                "SELECT * FROM watchtower_attestations WHERE created_utc >= %s ORDER BY created_utc ASC",
                (since,),
            ):
                f.write(json.dumps(row, default=str, ensure_ascii=False) + "\n")

    print("ok: true")
    print("exported_utc:", _utc_now_iso())
    print("snapshots_jsonl:", snap_path)
    print("attestations_jsonl:", att_path)

if __name__ == "__main__":
    main()
