from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List


def build_executive_summary(payload: Dict[str, Any]) -> str:
    status = payload.get("status", "unknown")
    scores = payload.get("scores", {})
    integrity = scores.get("institutional_integrity", "n/a")
    finding_count = payload.get("metadata", {}).get("finding_count", 0)
    action_count = len(payload.get("recommended_actions", []))

    if finding_count == 0:
        return (
            f"The Institutional Self-Audit Engine reports a {status} operating state with an "
            f"Institutional Integrity Score of {integrity}. No active findings were detected, "
            f"and no corrective action is currently required."
        )

    return (
        f"The Institutional Self-Audit Engine reports a {status} operating state with an "
        f"Institutional Integrity Score of {integrity}. The current cycle identified "
        f"{finding_count} finding(s) and generated {action_count} recommended action(s)."
    )


def build_brief_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "audit_id": payload.get("audit_id"),
        "timestamp": payload.get("timestamp"),
        "status": payload.get("status"),
        "audit_confidence": payload.get("audit_confidence"),
        "executive_summary": build_executive_summary(payload),
        "scores": payload.get("scores", {}),
        "finding_count": payload.get("metadata", {}).get("finding_count", 0),
        "top_changes": payload.get("changes_since_prior", [])[:5],
        "recommended_actions": payload.get("recommended_actions", [])[:5],
        "metadata": payload.get("metadata", {}),
    }


def build_markdown_brief(brief: Dict[str, Any]) -> str:
    lines: List[str] = []

    lines.append("# Daily Integrity Brief")
    lines.append("")
    lines.append(f"**Audit ID:** {brief.get('audit_id')}")
    lines.append(f"**Timestamp:** {brief.get('timestamp')}")
    lines.append(f"**Status:** {brief.get('status')}")
    lines.append(f"**Audit Confidence:** {brief.get('audit_confidence')}")
    lines.append("")
    lines.append("## Executive Summary")
    lines.append("")
    lines.append(brief.get("executive_summary", "No summary available."))
    lines.append("")
    lines.append("## Scorecard")
    lines.append("")

    scores = brief.get("scores", {})
    for key, value in scores.items():
        pretty = key.replace("_", " ").title()
        lines.append(f"- **{pretty}:** {value}")

    lines.append("")
    lines.append("## Top Changes")
    lines.append("")

    top_changes = brief.get("top_changes", [])
    if top_changes:
        for item in top_changes:
            lines.append(f"- {item.get('message', 'Change recorded')}")
    else:
        lines.append("- No material changes recorded.")

    lines.append("")
    lines.append("## Recommended Actions")
    lines.append("")

    actions = brief.get("recommended_actions", [])
    if actions:
        for item in actions:
            priority = item.get("priority", "low").upper()
            msg = item.get("message", "No message")
            lines.append(f"- **{priority}:** {msg}")
    else:
        lines.append("- No recommended actions.")

    lines.append("")
    return "\n".join(lines)


def write_brief_outputs(storage_dir: Path, timestamp_key: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    briefs_dir = storage_dir / "briefs"
    briefs_dir.mkdir(parents=True, exist_ok=True)

    brief_payload = build_brief_payload(payload)
    markdown = build_markdown_brief(brief_payload)

    json_path = briefs_dir / f"{timestamp_key}.json"
    md_path = briefs_dir / f"{timestamp_key}.md"
    latest_json_path = briefs_dir / "latest.json"
    latest_md_path = briefs_dir / "latest.md"

    json_path.write_text(json.dumps(brief_payload, indent=2))
    md_path.write_text(markdown)
    latest_json_path.write_text(json.dumps(brief_payload, indent=2))
    latest_md_path.write_text(markdown)

    return {
        "json_path": str(json_path),
        "md_path": str(md_path),
        "latest_json_path": str(latest_json_path),
        "latest_md_path": str(latest_md_path),
        "brief": brief_payload,
    }
