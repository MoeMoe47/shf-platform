from __future__ import annotations

import hashlib
import json
from typing import Any, Dict


def stable_json_dumps(obj: Any) -> str:
    """
    Deterministic JSON encoder.
    Ensures key order + no whitespace drift.
    """
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def decision_hash(payload: Dict[str, Any]) -> str:
    """
    SHA256 hash of a normalized decision payload.
    Used for enforcement-grade audit integrity.
    """
    encoded = stable_json_dumps(payload).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()
