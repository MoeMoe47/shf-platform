from __future__ import annotations

import hashlib
import json
from typing import Any, Dict


def stable_json(obj: Any) -> str:
    # Stable canonical encoding (no whitespace, sorted keys)
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def attach_ruleset_sha256(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Adds sha256 to each ruleset dict in payload["rulesets"] if missing.
    Hash is computed over the ruleset object excluding any existing sha256 field.
    """
    rules = payload.get("rulesets")
    if not isinstance(rules, list):
        return payload

    for r in rules:
        if not isinstance(r, dict):
            continue
        if "sha256" in r:
            continue
        core = {k: v for k, v in r.items() if k != "sha256"}
        r["sha256"] = hashlib.sha256(stable_json(core).encode("utf-8")).hexdigest()

    return payload
