#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


REQUIRED_FILES = [
    "docs/DATA_AGGREGATOR_LAYER_V1.md",
    "docs/DATA_AGGREGATOR_LAYER_V1.json",
    "services/shf-agent-fabric/services/data_aggregator_service.py",
    "services/shf-agent-fabric/routers/data_aggregator_routes.py",
    "services/shf-agent-fabric/tests/test_data_aggregator_routes.py",
]

REQUIRED_ROUTES = [
    "/health",
    "/sources",
    "/intake-queue",
    "/summary",
    "/classify",
]


def _read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def main() -> int:
    failures: list[str] = []

    for rel_path in REQUIRED_FILES:
        if not (ROOT / rel_path).exists():
            failures.append(f"missing required file: {rel_path}")

    registry_path = ROOT / "docs" / "MASTER_LAYER_REGISTRY.md"
    if not registry_path.exists():
        failures.append("missing docs/MASTER_LAYER_REGISTRY.md")
    else:
        registry = registry_path.read_text(encoding="utf-8")
        if "| Data Aggregator Layer |" not in registry:
            failures.append("MASTER_LAYER_REGISTRY.md missing Official Layers row for Data Aggregator Layer")
        if "### Data Aggregator Layer" not in registry:
            failures.append("MASTER_LAYER_REGISTRY.md missing structured Data Aggregator Layer entry")
        for section in ("Owns", "Must Not Own", "Upstream", "Downstream", "Truth Spine Requirement", "Enforcement Status"):
            if f"- {section}:" not in registry:
                failures.append(f"MASTER_LAYER_REGISTRY.md missing structured section: {section}")

    if (ROOT / "services/shf-agent-fabric/routers/data_aggregator_routes.py").exists():
        routes = _read("services/shf-agent-fabric/routers/data_aggregator_routes.py")
        if 'prefix="/data-aggregator"' not in routes:
            failures.append("data_aggregator_routes.py missing /data-aggregator prefix")
        for route in REQUIRED_ROUTES:
            if route not in routes:
                failures.append(f"data_aggregator_routes.py missing route: {route}")

    if (ROOT / "services/shf-agent-fabric/main.py").exists():
        main_py = _read("services/shf-agent-fabric/main.py")
        if "data_aggregator_router" not in main_py:
            failures.append("main.py missing data_aggregator_router import")
        if "include_router(data_aggregator_router)" not in main_py:
            failures.append("main.py missing data_aggregator_router mount")

    guardrails_path = ROOT / "docs" / "TRUTH_SPINE_GUARDRAILS.md"
    data_doc_path = ROOT / "docs" / "DATA_AGGREGATOR_LAYER_V1.md"
    boundary_text = ""
    if guardrails_path.exists():
        boundary_text += guardrails_path.read_text(encoding="utf-8")
    if data_doc_path.exists():
        boundary_text += "\n" + data_doc_path.read_text(encoding="utf-8")
    if "Data Aggregator" not in boundary_text or "must not verify" not in boundary_text.lower():
        failures.append("Data Aggregator boundary is not documented with Truth Spine guardrails")

    if (ROOT / "services/shf-agent-fabric/services/data_aggregator_service.py").exists():
        service = _read("services/shf-agent-fabric/services/data_aggregator_service.py").lower()
        forbidden = [
            "verification_status = \"verified\"",
            "public approved by aggregator",
            "report_ready = true",
        ]
        for phrase in forbidden:
            if phrase in service:
                failures.append(f"data_aggregator_service.py contains forbidden authority phrase: {phrase}")

    if failures:
        print("FAIL: Data Aggregator Layer checks failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("PASS: Data Aggregator Layer V1 boundary, routes, docs, and governance checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
