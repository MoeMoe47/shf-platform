#!/usr/bin/env python3
"""Validate SHS BOS V1.1 release closure artifacts."""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "docs/releases/SHS_BOS_V1_1_RELEASE_MANIFEST.json"
CLOSURE_DOC = ROOT / "docs/releases/SHS_BOS_V1_1_RELEASE_CLOSURE.md"
EXCLUSIONS_DOC = ROOT / "docs/releases/SHS_BOS_V1_1_RELEASE_EXCLUSIONS.md"
VALIDATOR = ROOT / "scripts/check_shs_bos_v1_1_release_closure.py"

PACKAGE_ANCHORS = {
    "shs-bos-package-d-batch-00-v1": "918e25fb8992460a42ce703d1f07c825a72458bc",
    "shs-bos-package-e-batch-01-v1": "17b0458c4a897e5f1b22517f232ee767b4f43e44",
    "shs-bos-package-f-batch-02-v1": "bdaecd00d91d9ae4ffdc39d0abfb25e06e6fa07b",
    "shs-bos-package-h-batch-01-v1": "185ee97db7cd8c44bdcf97b74e3194862087ce89",
}

REQUIRED_KEYS = {
    "schema_version",
    "product",
    "release",
    "release_status",
    "branch",
    "pre_closure_head",
    "release_tag",
    "release_commit_resolution",
    "certified_package_anchors",
    "reachable_commit_inventory",
    "included_scope",
    "excluded_scope",
    "validators",
    "repository_requirements",
    "closure_archive",
    "architecture_locks",
    "future_work",
}

EXCLUDED_CANDIDATES = ("CS-01B", "CS-02", "CS-03", "CS-04", "CS-05", "CS-06", "CS-07", "CS-10", "CS-11", "CS-12", "CS-13")
EXCLUDED_ARTIFACT_TERMS = ("volatile runtime state", "Playwright run output", "pytest cache", "Python bytecode", "generated caches")
ARCHITECTURE_TERMS = (
    "canonical-owner-neutral",
    "canonical owners register with shared layers",
    "No new Unified Experience Layer",
    "Extension Kernel Foundation only",
    "Package H Batch 02 and Package H Batch 03 remain future work",
)
HASH_RE = re.compile(r"^[0-9a-f]{40}$")


def fail(message: str) -> None:
    print(f"FAIL: {message}")
    sys.exit(1)


def git(args: list[str]) -> str:
    result = subprocess.run(
        ["git", *args],
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        timeout=10,
        check=False,
    )
    if result.returncode != 0:
        fail(f"git {' '.join(args)} failed: {result.stderr.strip()}")
    return result.stdout.strip()


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except OSError as exc:
        fail(f"cannot read {path.relative_to(ROOT)}: {exc}")


def load_manifest() -> dict:
    if not MANIFEST.exists():
        fail("release manifest missing")
    try:
        return json.loads(read_text(MANIFEST))
    except json.JSONDecodeError as exc:
        fail(f"release manifest JSON invalid: {exc}")


def validate_required_files() -> None:
    for path in (MANIFEST, CLOSURE_DOC, EXCLUSIONS_DOC, VALIDATOR):
        if not path.exists():
            fail(f"required closure file missing: {path.relative_to(ROOT)}")


def validate_manifest(data: dict) -> None:
    missing = REQUIRED_KEYS - set(data)
    if missing:
        fail(f"manifest missing keys: {sorted(missing)}")
    if data["product"] != "SHS BOS":
        fail("manifest product mismatch")
    if data["release"] != "V1.1":
        fail("manifest release mismatch")
    if data["branch"] != "v1.1-development":
        fail("manifest branch mismatch")
    if data["pre_closure_head"] != "185ee97db7cd8c44bdcf97b74e3194862087ce89":
        fail("manifest pre-closure head mismatch")
    if data["release_tag"] != "shs-bos-v1.1":
        fail("manifest release tag mismatch")
    if data["release_commit_resolution"] != "shs-bos-v1.1^{}":
        fail("manifest release commit resolution mismatch")

    anchors = {item.get("tag"): item.get("peeled_commit") for item in data["certified_package_anchors"]}
    for tag, commit in PACKAGE_ANCHORS.items():
        if anchors.get(tag) != commit:
            fail(f"package anchor mismatch: {tag}")

    inventory = data["reachable_commit_inventory"]
    hashes = [item.get("hash") for item in inventory]
    if len(hashes) != len(set(hashes)):
        fail("reachable commit inventory contains duplicate hashes")
    if any(not isinstance(value, str) or not HASH_RE.match(value) for value in hashes):
        fail("reachable commit inventory contains malformed hash")
    if hashes != git(["log", "--reverse", "--topo-order", "--format=%H", "--ancestry-path", "shrv1-v1.0^{}..185ee97db7cd8c44bdcf97b74e3194862087ce89"]).splitlines():
        fail("reachable commit inventory is not deterministic Git lineage order")
    for item in inventory:
        if not item.get("parents") or not item.get("subject") or not item.get("classification") or not item.get("package_or_domain"):
            fail(f"incomplete inventory item: {item.get('hash')}")

    excluded_blob = "\n".join(data["excluded_scope"])
    for candidate in EXCLUDED_CANDIDATES:
        if candidate not in excluded_blob:
            fail(f"excluded candidate missing from manifest: {candidate}")
    if "Package H Batch 02" not in excluded_blob or "Package H Batch 03" not in excluded_blob:
        fail("Package H Batch 02 or Batch 03 promoted or omitted from exclusions")
    if data["closure_archive"].get("included_in_release") is not False:
        fail("external archive is marked as included release content")
    for term in EXCLUDED_ARTIFACT_TERMS:
        if term not in excluded_blob:
            fail(f"excluded artifact term missing: {term}")
    locks_blob = "\n".join(data["architecture_locks"])
    for term in ARCHITECTURE_TERMS:
        if term not in locks_blob:
            fail(f"architecture lock missing: {term}")


def validate_markdown() -> None:
    closure = read_text(CLOSURE_DOC)
    exclusions = read_text(EXCLUSIONS_DOC)
    required_closure = (
        "Product: SHS BOS",
        "Release: V1.1",
        "RESOLVED_BY_GIT_TAG",
        "shs-bos-v1.1^{}",
        "SHS BOS V1.1 is closed as the exact immutable Git tree identified by the annotated tag shs-bos-v1.1.",
    )
    for term in required_closure:
        if term not in closure:
            fail(f"closure document missing declaration: {term}")
    for tag, commit in PACKAGE_ANCHORS.items():
        if tag not in closure or commit not in closure:
            fail(f"closure document missing package anchor: {tag}")
    if "The external archive is preservation evidence, not executable release content." not in exclusions:
        fail("exclusions document missing archive preservation declaration")
    if "Archived files must not be restored wholesale." not in exclusions:
        fail("exclusions document missing restoration rule")
    if "Horizontal overflow at 390px remains shared UI-shell future work" not in exclusions:
        fail("exclusions document missing 390px backlog statement")
    for candidate in EXCLUDED_CANDIDATES:
        if candidate not in exclusions:
            fail(f"exclusions document missing candidate: {candidate}")


def validate_no_forbidden_content() -> None:
    key_markers = (
        "BEGIN " + "RSA " + "PRIVATE " + "KEY",
        "BEGIN " + "OPENSSH " + "PRIVATE " + "KEY",
    )
    for path in (MANIFEST, CLOSURE_DOC, EXCLUSIONS_DOC):
        text = read_text(path)
        if any(marker in text for marker in key_markers):
            fail(f"private key marker found in {path.relative_to(ROOT)}")
    manifest_text = read_text(MANIFEST)
    closure_text = read_text(CLOSURE_DOC)
    if "CANDIDATE_PENDING_TAG" not in manifest_text or "shs-bos-v1.1^{}" not in manifest_text:
        fail("manifest lacks tag resolution model")
    if "RESOLVED_BY_GIT_TAG" not in closure_text or "shs-bos-v1.1^{}" not in closure_text:
        fail("closure document lacks tag resolution model")
    repo_release_files = list((ROOT / "docs/releases").glob("*"))
    for path in repo_release_files:
        if path.name.startswith("CLOSURE_ARCHIVE_"):
            fail("closure archive file copied into repository")


def validate_git_state() -> None:
    branch = git(["branch", "--show-current"])
    if branch != "v1.1-development":
        fail("current branch mismatch")
    for tag, commit in PACKAGE_ANCHORS.items():
        if git(["rev-parse", f"{tag}^{{}}"]) != commit:
            fail(f"local package tag target drift: {tag}")
        if git(["merge-base", "--is-ancestor", commit, "HEAD"]) != "":
            pass
    status = git(["status", "--porcelain", "--untracked-files=all"])
    allowed = {
        "A  docs/releases/SHS_BOS_V1_1_RELEASE_CLOSURE.md",
        "A  docs/releases/SHS_BOS_V1_1_RELEASE_EXCLUSIONS.md",
        "A  docs/releases/SHS_BOS_V1_1_RELEASE_MANIFEST.json",
        "A  scripts/check_shs_bos_v1_1_release_closure.py",
        "?? docs/releases/SHS_BOS_V1_1_RELEASE_CLOSURE.md",
        "?? docs/releases/SHS_BOS_V1_1_RELEASE_EXCLUSIONS.md",
        "?? docs/releases/SHS_BOS_V1_1_RELEASE_MANIFEST.json",
        "?? scripts/check_shs_bos_v1_1_release_closure.py",
    }
    lines = set(status.splitlines()) if status else set()
    if lines and not lines <= allowed:
        fail(f"unexpected worktree status: {sorted(lines)}")


def main() -> None:
    validate_required_files()
    manifest = load_manifest()
    validate_manifest(manifest)
    validate_markdown()
    validate_no_forbidden_content()
    validate_git_state()
    print("PASS: SHS BOS V1.1 release closure validation OK.")


if __name__ == "__main__":
    main()
