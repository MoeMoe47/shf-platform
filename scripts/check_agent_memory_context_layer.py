#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    "docs/AGENT_MEMORY_CONTEXT_LAYER_V1.md",
    "docs/AGENT_MEMORY_CONTEXT_LAYER_V1.json",
    "src/data/agents/agentMemoryRecords.js",
    "src/data/agents/agentContextPackets.js",
    "src/data/agents/agentMemoryStorage.js",
    "src/data/agents/agentMemoryMetrics.js",
    "src/data/agents/agentMemorySafety.js",
    "src/pages/admin/agents/components/AgentMemoryPanel.jsx",
    "src/pages/admin/agents/components/AgentContextPacketPanel.jsx",
    "src/pages/admin/agents/components/AgentMemoryDetail.jsx",
    "src/pages/admin/agents/components/AgentMemorySafetyPanel.jsx",
]

FORBIDDEN_MUTATION_PATTERNS = [
    r"safe_for_public\s*:\s*true",
    r"public_approved\s*:\s*true",
    r"shf_impact_data_mutated\s*:\s*true",
    r"production_action_executed\s*:\s*true",
    r"execution_allowed_v1\s*:\s*true",
    r"webhook_sent\s*:\s*true",
    r"warehouse_write_performed\s*:\s*true",
]


def read(rel: str) -> str:
    return (ROOT / rel).read_text(encoding="utf-8")


def require(condition: bool, message: str, failures: list[str]) -> None:
    if not condition:
        failures.append(message)


def main() -> int:
    failures: list[str] = []

    for rel in REQUIRED_FILES:
        require((ROOT / rel).exists(), f"missing required file: {rel}", failures)

    if failures:
        for failure in failures:
            print(f"FAIL: {failure}")
        return 1

    memory_records = read("src/data/agents/agentMemoryRecords.js")
    context_packets = read("src/data/agents/agentContextPackets.js")
    memory_storage = read("src/data/agents/agentMemoryStorage.js")
    memory_safety = read("src/data/agents/agentMemorySafety.js")
    workbench = read("src/pages/admin/agents/AgentWorkbenchPage.jsx")
    safe_stub = read("src/data/agents/agentSafeExecutionStub.js")
    package_json = json.loads(read("package.json"))

    require("visibility: \"internal_only\"" in memory_records, "memory defaults must keep visibility internal_only", failures)
    require("safe_for_public: false" in memory_records, "memory records must default safe_for_public false", failures)
    require("public_approved: false" in memory_records, "memory records must default public_approved false", failures)
    require("shf_impact_data_mutated: false" in memory_records, "memory records must default shf_impact_data_mutated false", failures)
    require("production_action_executed: false" in memory_records, "memory records must default production_action_executed false", failures)

    require("safe_for_public: false" in context_packets, "context packets must default safe_for_public false", failures)
    require("public_approved: false" in context_packets, "context packets must default public_approved false", failures)
    require("operator_review_required: true" in context_packets, "context packets must require operator review", failures)

    for component in [
        "AgentMemoryPanel",
        "AgentContextPacketPanel",
        "AgentMemoryDetail",
        "AgentMemorySafetyPanel",
    ]:
        require(component in workbench, f"Workbench must import/render {component}", failures)

    for safety_token in [
        "secret_like_text",
        "api_key_like_text",
        "password_like_text",
        "raw_ssn_like_text",
        "claims_public_approval",
        "claims_production_execution",
    ]:
        require(safety_token in memory_safety, f"missing safety rule: {safety_token}", failures)

    require("localStorage" in memory_storage, "memory storage must use localStorage-safe V1 pattern", failures)
    require("context_packet_blocked_items" in safe_stub, "safe stub must consider blocked context packets", failures)
    require(
        package_json.get("scripts", {}).get("check:agent-memory-context") == "python3 scripts/check_agent_memory_context_layer.py",
        "package script check:agent-memory-context missing",
        failures,
    )

    scan_targets = [
        "src/data/agents/agentMemoryRecords.js",
        "src/data/agents/agentContextPackets.js",
        "src/data/agents/agentMemoryStorage.js",
        "src/data/agents/agentMemorySafety.js",
        "src/pages/admin/agents/AgentWorkbenchPage.jsx",
        "src/pages/admin/agents/components/AgentMemoryPanel.jsx",
        "src/pages/admin/agents/components/AgentContextPacketPanel.jsx",
        "src/pages/admin/agents/components/AgentMemoryDetail.jsx",
        "src/pages/admin/agents/components/AgentMemorySafetyPanel.jsx",
    ]
    for rel in scan_targets:
        text = read(rel)
        require("shfImpactData" not in text, f"{rel} must not reference shfImpactData", failures)
        for pattern in FORBIDDEN_MUTATION_PATTERNS:
            require(not re.search(pattern, text), f"{rel} contains forbidden enabled flag pattern: {pattern}", failures)

    if failures:
        for failure in failures:
            print(f"FAIL: {failure}")
        return 1

    print("PASS: Agent Memory & Context Layer V1 validation OK.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
