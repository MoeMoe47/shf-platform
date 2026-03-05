from typing import Any, Dict
from .decision_journal import load_decision
import json
import hashlib


def _stable_json(obj: Any) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":")).encode()


def _sha256(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def replay_decision(decision_id: str) -> Dict[str, Any]:

    row = load_decision(decision_id)

    request = row["request"]
    original_response = row["response"]

    # deterministic replay (for now just recompute hashes)
    req_sha = _sha256(_stable_json(request))
    resp_sha = _sha256(_stable_json(original_response))

    return {
        "schema_version": "AIM_REPLAY_RESULT_V1",
        "decision_id": decision_id,
        "request_sha256": req_sha,
        "response_sha256": resp_sha,
        "original_request_sha256": row["request_sha256"],
        "original_response_sha256": row["response_sha256"],
        "ruleset_sha256": row["ruleset_sha256"],
        "manifest_sha256": row["manifest_sha256"],
        "deterministic_match": req_sha == row["request_sha256"]
        and resp_sha == row["response_sha256"],
    }
