#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    "docs/AGENT_APPROVAL_LEDGER_SAFE_EXECUTION_STUB_V1.md",
    "docs/AGENT_APPROVAL_LEDGER_SAFE_EXECUTION_STUB_V1.json",
    "src/data/agents/agentApprovalLedger.js",
    "src/data/agents/agentSafeExecutionStub.js",
    "src/pages/admin/agents/components/AgentApprovalLedger.jsx",
    "src/pages/admin/agents/components/AgentSafeExecutionPanel.jsx",
]

DANGEROUS_FLAGS = [
    "execution_allowed_v1",
    "production_action_executed",
    "report_published",
    "public_data_mutated",
    "public_approved_mutated",
    "shf_impact_data_mutated",
    "external_message_sent",
    "webhook_sent",
    "warehouse_write_performed",
]

REQUIRED_REFERENCES = {
    "src/pages/admin/agents/AgentWorkbenchPage.jsx": [
        "AgentApprovalLedger",
        "AgentSafeExecutionPanel",
        "recordAgentApprovalDecision",
        "recordSafeExecutionStubRun",
    ],
    "src/data/agents/agentApprovalLedger.js": DANGEROUS_FLAGS,
    "src/data/agents/agentSafeExecutionStub.js": DANGEROUS_FLAGS + [
        "missing_human_approval",
        "rejected_approval",
        "critical_risk_blocked",
        "requested_action_blocked",
        "SAFE_EXECUTION_BLOCKED_PATTERNS",
    ],
}

FORBIDDEN_PATTERNS = [
    r"execution_allowed_v1\s*[:=]\s*true",
    r"production_action_executed\s*[:=]\s*true",
    r"report_published\s*[:=]\s*true",
    r"public_data_mutated\s*[:=]\s*true",
    r"public_approved_mutated\s*[:=]\s*true",
    r"shf_impact_data_mutated\s*[:=]\s*true",
    r"external_message_sent\s*[:=]\s*true",
    r"webhook_sent\s*[:=]\s*true",
    r"warehouse_write_performed\s*[:=]\s*true",
    r"function\s+executeProductionAction\b",
    r"function\s+publishReport\b",
    r"function\s+sendWebhook\b",
    r"function\s+sendNotification\b",
    r"function\s+writeWarehouseRecord\b",
    r"public_approved\s*=\s*true",
    r"can_mutate_shf_impact_data\s*[:=]\s*true",
    r"real\s+execution\s+is\s+enabled",
    r"autonomous\s+production\s+execution\s+enabled",
]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def fail(message: str) -> None:
    print(f"FAIL: {message}", file=sys.stderr)
    sys.exit(1)


def main() -> None:
    missing = [path for path in REQUIRED_FILES if not (ROOT / path).exists()]
    if missing:
      fail(f"missing required files: {missing}")

    docs_json_path = ROOT / "docs/AGENT_APPROVAL_LEDGER_SAFE_EXECUTION_STUB_V1.json"
    with docs_json_path.open(encoding="utf-8") as handle:
        payload = json.load(handle)

    if payload.get("v1_complete") is not True:
        fail("docs JSON must mark v1_complete true after validation")

    for model_key in ("approval_ledger_model", "safe_execution_stub_model"):
        model = payload.get(model_key, {})
        for flag in DANGEROUS_FLAGS:
            if model.get(flag) is not False:
                fail(f"{model_key}.{flag} must be false")

    for path, snippets in REQUIRED_REFERENCES.items():
        text = read(path)
        for snippet in snippets:
            if snippet not in text:
                fail(f"{path} missing {snippet}")

    searchable_paths = REQUIRED_FILES + [
        "src/pages/admin/agents/AgentWorkbenchPage.jsx",
        "src/data/agents/agentTaskStorage.js",
        "package.json",
    ]
    combined = "\n".join(read(path) for path in searchable_paths if (ROOT / path).exists())

    for pattern in FORBIDDEN_PATTERNS:
        if re.search(pattern, combined, flags=re.IGNORECASE):
            fail(f"forbidden execution/mutation pattern found: {pattern}")

    if '"check:agent-approval-stub": "python3 scripts/check_agent_approval_safe_execution.py"' not in read("package.json"):
        fail("package.json missing check:agent-approval-stub script")

    print("PASS: Agent Approval Ledger + Safe Execution Stub V1 checks passed.")


if __name__ == "__main__":
    main()
