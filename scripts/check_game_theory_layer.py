#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8") if path.exists() else ""


def main() -> int:
    missing: list[str] = []

    registry = read(ROOT / "docs" / "MASTER_LAYER_REGISTRY.md")
    guardrails = read(ROOT / "docs" / "TRUTH_SPINE_GUARDRAILS.md").lower()
    package_json = read(ROOT / "package.json")
    router_path = ROOT / "services" / "shf-agent-fabric" / "routers" / "game_theory_routes.py"
    service_path = ROOT / "services" / "shf-agent-fabric" / "services" / "game_theory_service.py"
    existing_asset = ROOT / "services" / "shf-agent-fabric" / "services" / "ai_layer" / "game_theory.py"
    docs_path = ROOT / "docs" / "GAME_THEORY_LAYER_V1.md"

    if "Game Theory Layer" not in registry:
        missing.append("docs/MASTER_LAYER_REGISTRY.md missing Game Theory Layer")
    if not docs_path.exists():
        missing.append("docs/GAME_THEORY_LAYER_V1.md missing")
    if not service_path.exists():
        missing.append("services/shf-agent-fabric/services/game_theory_service.py missing")
    if not router_path.exists():
        missing.append("services/shf-agent-fabric/routers/game_theory_routes.py missing")
    if not existing_asset.exists():
        missing.append("existing asset services/shf-agent-fabric/services/ai_layer/game_theory.py missing")

    router = read(router_path)
    for route in ("/health", "/scenarios", "/analyze", "/analyses", "/strategy-playbook", "/audit-feed"):
        if route not in router:
            missing.append(f"game_theory_routes.py missing {route}")

    service = read(service_path)
    if "run_scenario_comparison" not in service:
        missing.append("game_theory_service.py does not reuse existing ai_layer.game_theory")

    required_guardrail_phrases = (
        "game theory predictions must not be labeled verified outcomes",
        "game theory cannot verify claims",
        "public-approve",
        "publish reports",
    )
    for phrase in required_guardrail_phrases:
        if phrase not in guardrails:
            missing.append(f"TRUTH_SPINE_GUARDRAILS.md missing phrase: {phrase}")

    if "check:governance" not in package_json:
        missing.append("package.json missing check:governance")
    if "check:game-theory" not in package_json:
        missing.append("package.json missing check:game-theory")

    duplicate_candidates = [
        ROOT / "services" / "shf-agent-fabric" / "routers" / "gametheory_routes.py",
        ROOT / "services" / "shf-agent-fabric" / "routers" / "game_theory_v1_routes.py",
        ROOT / "services" / "shf-agent-fabric" / "services" / "gametheory_service.py",
        ROOT / "services" / "shf-agent-fabric" / "services" / "game_theory_v1_service.py",
    ]
    for candidate in duplicate_candidates:
        if candidate.exists():
            missing.append(f"duplicate Game Theory implementation candidate exists: {candidate.relative_to(ROOT)}")

    if missing:
        print("FAIL: Game Theory Layer V1 checks failed.")
        for item in missing:
            print(f"- {item}")
        return 1

    print("PASS: Game Theory Layer V1 checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

