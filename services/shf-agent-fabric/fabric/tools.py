import json
from pathlib import Path
import secrets
from datetime import datetime, timezone

BASE = Path(__file__).resolve().parent.parent / "db" / "artifacts"

def _write_json(prefix: str, payload: dict) -> dict:
    BASE.mkdir(parents=True, exist_ok=True)
    ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    aid = secrets.token_hex(6)
    path = BASE / f"{prefix}_{ts}_{aid}.json"
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n")
    return {"artifactId": f"{prefix}_{ts}_{aid}", "path": str(path)}

def save_draft_artifact(args: dict, agent: dict):
    title = args.get("title")
    body = args.get("body")
    meta = args.get("meta") or {}
    if not title or body is None:
        raise ValueError("save_draft_artifact requires title and body")
    payload = {
        "type": "draft_artifact",
        "title": title,
        "body": body,
        "meta": {"agent": agent, **meta},
    }
    return _write_json("draft", payload)

def log_note(args: dict, agent: dict):
    payload = {"type": "note", "agent": agent, "body": args}
    return _write_json("note", payload)
