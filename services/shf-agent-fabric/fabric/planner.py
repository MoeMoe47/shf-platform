import json
import hashlib
from typing import Dict, Any, List

def build_plan(agent: Dict[str, Any], user_input: Dict[str, Any]) -> Dict[str, Any]:
    """
    Dry-run planner. Produces a deterministic plan + hash.
    No external actions. No tool execution.
    """
    policy = agent.get("policy") or {}
    allowed_tools: List[str] = agent.get("allowedTools") or []
    layer = agent.get("layer")
    name = agent.get("name")

    steps = [
        {
            "step": 1,
            "type": "analyze",
            "note": "Summarize intent, identify required info, pick tools (draft-only).",
        },
        {
            "step": 2,
            "type": "draft",
            "note": "Generate draft output (no side effects).",
        },
    ]

    plan = {
        "agent": {"name": name, "agentId": agent.get("agentId"), "layer": layer},
        "policy": policy,
        "allowedTools": allowed_tools,
        "inputShape": {"input": user_input},
        "steps": steps,
        "requiresHumanApproval": bool(policy.get("humanApproval", False)),
        "maxSteps": int(policy.get("maxSteps", 6)),
    }

    raw = json.dumps(plan, sort_keys=True).encode("utf-8")
    plan_hash = hashlib.sha256(raw).hexdigest()[:16]
    plan["planId"] = plan_hash
    return plan
