from fabric.tools import save_draft_artifact, log_note

TOOL_MAP = {
    "save_draft_artifact": save_draft_artifact,
    "log_note": log_note,
}

def run_tool_call(name: str, args: dict, agent: dict | None = None):
    fn = TOOL_MAP.get(name)
    if not fn:
        raise ValueError(f"unknown tool: {name}")
    return fn(args=args, agent=agent or {})
