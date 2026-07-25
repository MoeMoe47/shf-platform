#!/usr/bin/env python3
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
LINEAGE_PATH = ROOT / "docs" / "architecture" / "SHS_BOS_PACKAGE_D_E_F_RELEASE_LINEAGE_V1.json"

PACKAGE_D = "918e25fb8992460a42ce703d1f07c825a72458bc"
PACKAGE_E = "17b0458c4a897e5f1b22517f232ee767b4f43e44"
PACKAGE_F = "bdaecd00d91d9ae4ffdc39d0abfb25e06e6fa07b"
EXPECTED_BRANCH = "v1.1-development"


def fail(message: str) -> None:
    raise SystemExit(f"SHS BOS release lineage validation FAIL: {message}")


def git(*args: str, check: bool = True) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(
        ["git", *args],
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    if check and result.returncode:
        fail(f"git {' '.join(args)} failed: {result.stdout.strip()}")
    return result


def git_out(*args: str) -> str:
    return git(*args).stdout.strip()


def load_lineage() -> dict[str, Any]:
    if not LINEAGE_PATH.exists():
        fail(f"missing lineage artifact {LINEAGE_PATH.relative_to(ROOT)}")
    return json.loads(LINEAGE_PATH.read_text(encoding="utf-8"))


def assert_ancestor(ancestor: str, descendant: str, label: str) -> None:
    result = git("merge-base", "--is-ancestor", ancestor, descendant, check=False)
    if result.returncode != 0:
        fail(f"{label} ancestry check failed with exit {result.returncode}")


def main() -> int:
    data = load_lineage()
    if git_out("branch", "--show-current") != EXPECTED_BRANCH:
        fail("current branch drifted")
    head = git_out("rev-parse", "HEAD")
    if head != PACKAGE_F:
        result = git("merge-base", "--is-ancestor", PACKAGE_F, head, check=False)
        if result.returncode != 0:
            fail("current HEAD does not contain the Package F integrated anchor")

    for commit in (PACKAGE_D, PACKAGE_E, PACKAGE_F):
        git("rev-parse", "--verify", f"{commit}^{{commit}}")

    assert_ancestor(PACKAGE_D, PACKAGE_E, "Package D to Package E")
    assert_ancestor(PACKAGE_E, PACKAGE_F, "Package E to Package F")
    assert_ancestor(PACKAGE_D, PACKAGE_F, "Package D to Package F")

    lock = data.get("release_anchor_lock", {})
    expected_lock = {
        "PACKAGE_D_RELEASE_ANCHOR": PACKAGE_D,
        "PACKAGE_E_RELEASE_ANCHOR": PACKAGE_E,
        "PACKAGE_F_RELEASE_ANCHOR": PACKAGE_F,
        "CURRENT_INTEGRATED_BRANCH_ANCHOR": PACKAGE_F,
    }
    if lock != expected_lock:
        fail("release anchor lock does not match Git anchors")

    if data.get("branch") != EXPECTED_BRANCH:
        fail("lineage JSON branch mismatch")
    if data.get("current_head") != PACKAGE_F:
        fail("lineage JSON current_head must remain the Package F integrated anchor")

    commits_by_package = {item.get("package"): item.get("commit") for item in data.get("lineage", [])}
    if commits_by_package != {"D": PACKAGE_D, "E": PACKAGE_E, "F": PACKAGE_F}:
        fail("lineage package-to-commit mapping mismatch")

    e_to_f = git_out(
        "diff",
        "--name-status",
        PACKAGE_E,
        PACKAGE_F,
        "--",
        "docs/architecture/SHS_BOS_BATCH_01_*",
        "scripts/check_shs_bos_batch_01_contract_foundations.py",
        "scripts/generate_shs_bos_batch_01_contract_foundations.py",
        "services/shf-agent-fabric/services/contract_runtime",
        "services/shf-agent-fabric/routers/contract_runtime_routes.py",
    )
    if e_to_f:
        fail("Package F changed Package E-owned artifacts")

    docs_scan = git("grep", "-n", "918e25", "--", "docs", "scripts", "services", check=False)
    if docs_scan.returncode not in (0, 1):
        fail(f"stale baseline scan failed with exit {docs_scan.returncode}")
    for line in docs_scan.stdout.splitlines():
        if "SHS_BOS_PACKAGE_D_E_F_RELEASE_LINEAGE_V1" in line:
            continue
        if "Package E" in line and ("baseline" in line.lower() or "release anchor" in line.lower()):
            fail(f"possible stale Package E baseline claim: {line}")

    print("PASS: SHS BOS Package D/E/F release lineage validation OK.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
