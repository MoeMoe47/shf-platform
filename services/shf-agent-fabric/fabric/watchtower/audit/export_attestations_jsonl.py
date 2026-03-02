from __future__ import annotations

import hashlib
import json
import os
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, Optional

def _sha256_hex(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()

def _utc_stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")

def _write_jsonl(rows: Iterable[Dict[str, Any]], out_path: str) -> Dict[str, Any]:
    h = hashlib.sha256()
    n = 0
    with open(out_path, "wb") as f:
        for r in rows:
            line = (json.dumps(r, sort_keys=True, separators=(",", ":"), ensure_ascii=False) + "\n").encode("utf-8")
            f.write(line)
            h.update(line)
            n += 1
    return {"rows": n, "sha256": h.hexdigest()}

def _manifest(out_jsonl: str, meta: Dict[str, Any]) -> str:
    mpath = out_jsonl + ".manifest.json"
    payload = {
        "generated_utc": datetime.now(timezone.utc).isoformat(),
        "jsonl_path": out_jsonl,
        **meta,
    }
    blob = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    payload["manifest_sha256"] = _sha256_hex(blob)
    with open(mpath, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
    return mpath

def main() -> int:
    """
    Scaffold: you’ll replace the dummy rows with Postgres query results.
    Object storage upload is intentionally NOT implemented here (depends on AWS/GCP/Azure).
    """
    out_dir = (os.getenv("SHF_AUDIT_EXPORT_DIR", "services/shf-agent-fabric/var/audit_exports") or "").strip()
    os.makedirs(out_dir, exist_ok=True)
    out_jsonl = os.path.join(out_dir, f"watchtower_attestations_{_utc_stamp()}.jsonl")

    # TODO: replace with Postgres fetch: SELECT created_utc,kid,payload,sig,root_hash,proof_tips FROM watchtower_attestations ORDER BY id ASC
    dummy_rows = [
        {"note": "scaffold", "replace_me": True}
    ]

    meta = _write_jsonl(dummy_rows, out_jsonl)
    mpath = _manifest(out_jsonl, meta)

    print("WROTE:", out_jsonl)
    print("MANIFEST:", mpath)
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
