from __future__ import annotations

import json
import os
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from threading import Lock
from typing import Any, Dict, Optional

_LOCK = Lock()
_CACHE: Dict[str, Dict[str, Any]] = {}

def _default_store_path() -> Path:
    # Default: services/shf-agent-fabric/var/outcomes_proof_signatures.jsonl
    # We assume CWD is services/shf-agent-fabric in local/dev and tests.
    p = Path(os.environ.get("SHF_PROOF_SIGNATURE_STORE", "var/outcomes_proof_signatures.jsonl"))
    p.parent.mkdir(parents=True, exist_ok=True)
    return p

@dataclass(frozen=True)
class StoredSignature:
    schema_version: str
    submission_id: str
    algorithm: str
    signature: str
    proof_sha256: str
    generated_at: str  # ISO8601

def save_signature(*, submission_id: str, algorithm: str, signature: str, proof_sha256: str, generated_at: str) -> Dict[str, Any]:
    rec = StoredSignature(
        schema_version="OUTCOMES_PROOF_SIGNATURE_STORE_V1",
        submission_id=submission_id,
        algorithm=algorithm,
        signature=signature,
        proof_sha256=proof_sha256,
        generated_at=generated_at,
    )
    row = asdict(rec)

    path = _default_store_path()
    line = json.dumps(row, sort_keys=True, separators=(",", ":"))

    with _LOCK:
        with path.open("a", encoding="utf-8") as f:
            f.write(line + "\n")
        _CACHE[submission_id] = row

    return row

def get_latest_signature(submission_id: str) -> Optional[Dict[str, Any]]:
    with _LOCK:
        if submission_id in _CACHE:
            return _CACHE[submission_id]

    path = _default_store_path()
    if not path.exists():
        return None

    latest: Optional[Dict[str, Any]] = None
    # Simple scan; file is expected to be small in MVP. (Can optimize later.)
    with _LOCK:
        with path.open("r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                except Exception:
                    continue
                if obj.get("submission_id") == submission_id:
                    latest = obj
        if latest is not None:
            _CACHE[submission_id] = latest
    return latest
