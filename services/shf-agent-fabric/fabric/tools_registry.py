import json
import secrets
from pathlib import Path
from typing import Any, Dict, Callable

BASE = Path(__file__).resolve().parent.parent / "db"
ARTIFACTS = BASE / "artifacts"
ARTIFACTS.mkdir(parents=True, exist_ok=True)

class ToolError(Exception):
    pass

def _tool_save_draft_artifact(args: Dict[str, Any]) -> Dict[str, Any]:
    title = str(args.get("title") or "Untitled Draft")
    body = args.get("body")
    meta = args.get("meta") or {}
    artifact_id = secrets.token_hex(8)
    payload = {
        "artifactId": artifact_id,
        "title": title,
        "body": body,
        "meta": meta,
    }
    p = ARTIFACTS / f"{artifact_id}.json"
    p.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n")
    return {"ok": True, "artifactId": artifact_id, "path": str(p)}

def _tool_log_note(args: Dict[str, Any]) -> Dict[str, Any]:
    note_id = secrets.token_hex(8)
    p = ARTIFACTS / f"note_{note_id}.json"
    p.write_text(json.dumps({"noteId": note_id, "note": args}, indent=2, sort_keys=True) + "\n")
    return {"ok": True, "noteId": note_id, "path": str(p)}

TOOLS: Dict[str, Dict[str, Any]] = {
    "save_draft_artifact": {
        "description": "Save a draft artifact JSON into db/artifacts.",
        "handler": _tool_save_draft_artifact,
        "schema": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "body": {},
                "meta": {"type": "object"},
            },
            "required": ["title", "body"],
        },
    },
    "log_note": {
        "description": "Save a note JSON into db/artifacts.",
        "handler": _tool_log_note,
        "schema": {"type": "object"},
    },
}

def list_tools():
    return {
        "tools": [
            {"name": name, "description": spec["description"], "schema": spec["schema"]}
            for name, spec in TOOLS.items()
        ]
    }

def execute_tool(name: str, args: Dict[str, Any]) -> Dict[str, Any]:
    spec = TOOLS.get(name)
    if not spec:
        raise ToolError(f"Unknown tool: {name}")
    handler: Callable[[Dict[str, Any]], Dict[str, Any]] = spec["handler"]
    return handler(args or {})
