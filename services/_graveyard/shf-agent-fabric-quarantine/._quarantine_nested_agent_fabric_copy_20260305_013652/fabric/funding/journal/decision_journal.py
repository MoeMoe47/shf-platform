import json
import hashlib
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict

ROOT = Path(__file__).resolve().parents[4]
STORE = ROOT / "services" / "shf-agent-fabric" / "var"
STORE.mkdir(parents=True, exist_ok=True)

FILE = STORE / "funding_decision_journal.jsonl"


def _stable_json(obj: Any) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":")).encode()


def _sha256(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def record_decision(
    request: Dict[str, Any],
    response: Dict[str, Any],
    ruleset_sha256: str,
    manifest_sha256: str,
) -> Dict[str, Any]:

    decision_id = str(uuid.uuid4())

    entry = {
        "schema_version": "AIM_DECISION_JOURNAL_V1",
        "decision_id": decision_id,
        "time_utc": datetime.utcnow().isoformat() + "Z",
        "request": request,
        "response": response,
        "ruleset_sha256": ruleset_sha256,
        "manifest_sha256": manifest_sha256,
        "request_sha256": _sha256(_stable_json(request)),
        "response_sha256": _sha256(_stable_json(response)),
    }

    with open(FILE, "a") as f:
        f.write(json.dumps(entry) + "\n")

    return entry


def load_decision(decision_id: str) -> Dict[str, Any]:

    if not FILE.exists():
        raise RuntimeError("journal empty")

    with open(FILE) as f:
        for line in f:
            row = json.loads(line)
            if row.get("decision_id") == decision_id:
                return row

    raise KeyError("decision not found")
