from __future__ import annotations

import os
import datetime
import hashlib
from typing import Any

"""
Integrity monitor scaffold:
- Pull last N days of snapshots from Postgres (truth)
- Recompute row_hash/chain_hash and compare to stored values
- In "top 1%" mode, this runs on a schedule + alerts on drift.

ENV:
  SHF_PG_URL="postgresql://..."
  SHF_MONITOR_DAYS=7
"""

def _env(name: str, default: str = "") -> str:
    return str(os.getenv(name, default) or "").strip()

def _require(name: str) -> str:
    v = _env(name, "")
    if not v:
        raise SystemExit(f"Missing env: {name}")
    return v

def _sha256_hex(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()

def main() -> None:
    pg_url = _require("SHF_PG_URL")
    days = int(_env("SHF_MONITOR_DAYS", "7") or "7")
    since = datetime.datetime.now(datetime.UTC) - datetime.timedelta(days=days)

    try:
        import psycopg  # type: ignore
    except Exception as e:
        raise SystemExit("psycopg not installed. Install with: pip install psycopg[binary]\n" + str(e))

    checked = 0
    mismatches = 0
    prev_chain = ""

    with psycopg.connect(pg_url) as conn:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT created_utc, program_id, prev_hash, row_hash, chain_hash, payload
            FROM watchtower_snapshots
            WHERE created_utc >= %s
            ORDER BY created_utc ASC
            """,
            (since,),
        )

        for created_utc, program_id, prev_hash, row_hash, chain_hash, payload in cur.fetchall():
            checked += 1

            # Minimal canonicalization: rely on DB payload JSONB -> string form
            # In production, mirror your exact canonical_json rules.
            s = f"{created_utc}|{program_id}|{prev_hash or ''}|{payload}"
            recomputed_row = _sha256_hex(s)
            recomputed_chain = _sha256_hex((prev_chain or "") + recomputed_row)

            if row_hash != recomputed_row or chain_hash != recomputed_chain:
                mismatches += 1

            prev_chain = recomputed_chain

    print("ok:", mismatches == 0)
    print("checked:", checked)
    print("mismatches:", mismatches)
    if mismatches:
        raise SystemExit("INTEGRITY_DRIFT_DETECTED")

if __name__ == "__main__":
    main()
