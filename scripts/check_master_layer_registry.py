#!/usr/bin/env python3
from __future__ import annotations

from collections import Counter
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parents[1]
REGISTRY_PATH = ROOT / "docs" / "MASTER_LAYER_REGISTRY.md"

REQUIRED_FIELDS = [
    "Layer Type",
    "Owns",
    "Must Not Own",
    "Upstream",
    "Downstream",
    "Truth Spine Requirement",
    "Enforcement Status",
]


def _layer_blocks(text: str) -> dict[str, str]:
    matches = list(re.finditer(r"^###\s+(.+?)\s*$", text, flags=re.MULTILINE))
    blocks: dict[str, str] = {}
    for index, match in enumerate(matches):
        name = match.group(1).strip()
        start = match.end()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        blocks[name] = text[start:end]
    return blocks


def _official_layers(text: str) -> list[str]:
    layers: list[str] = []
    in_table = False
    for line in text.splitlines():
        if line.strip() == "| Layer | Ownership | Boundary |":
            in_table = True
            continue
        if not in_table:
            continue
        if line.startswith("| ---"):
            continue
        if not line.startswith("|"):
            break
        cells = [cell.strip() for cell in line.strip("|").split("|")]
        if len(cells) >= 3 and cells[0]:
            layers.append(cells[0])
    return layers


def main() -> int:
    if not REGISTRY_PATH.exists():
        print(f"FAIL: missing {REGISTRY_PATH.relative_to(ROOT)}")
        return 1

    text = REGISTRY_PATH.read_text(encoding="utf-8")
    failures: list[str] = []
    required_layers = _official_layers(text)

    if not required_layers:
        failures.append("Official Layers table did not yield any layer rows")

    heading_names = [match.group(1).strip() for match in re.finditer(r"^###\s+(.+?)\s*$", text, flags=re.MULTILINE)]
    for name, count in sorted(Counter(heading_names).items()):
        if count > 1:
            failures.append(f"duplicate layer heading: {name}")

    blocks = _layer_blocks(text)
    for layer in required_layers:
        block = blocks.get(layer)
        if block is None:
            failures.append(f"missing structured layer entry: {layer}")
            continue
        for field in REQUIRED_FIELDS:
            pattern = rf"^-\s+{re.escape(field)}:\s*(.+?)\s*$"
            match = re.search(pattern, block, flags=re.MULTILINE)
            if not match:
                failures.append(f"{layer} missing section: {field}")
                continue
            if not match.group(1).strip():
                failures.append(f"{layer} has empty section: {field}")

    if failures:
        print("FAIL: Master Layer Registry checks failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print(f"PASS: Master Layer Registry checked {len(required_layers)} official registry rows/layers.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
