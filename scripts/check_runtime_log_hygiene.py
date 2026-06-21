#!/usr/bin/env python3
"""Check whether runtime audit/log files are dirty in git.

Default mode reports findings and exits 0. Strict mode exits nonzero when a
tracked runtime log is modified, so release checks can fail loudly without
deleting or rewriting audit history.
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]

KNOWN_RUNTIME_PATHS = [
    "services/shf-agent-fabric/var/watchtower_audit.jsonl",
    "services/shf-agent-fabric/db/agent_events.jsonl",
    "services/shf-agent-fabric/logs/alignment.audit.log",
]

SCAN_DIRS = [
    REPO_ROOT / "services/shf-agent-fabric/var",
    REPO_ROOT / "services/shf-agent-fabric/db",
    REPO_ROOT / "services/shf-agent-fabric/logs",
]

SCAN_SUFFIXES = {".jsonl", ".log"}


def run_git(args: list[str]) -> str:
    result = subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        check=False,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return result.stdout.strip()


def rel_path(path: Path) -> str:
    return path.relative_to(REPO_ROOT).as_posix()


def discover_runtime_paths() -> list[str]:
    paths = set(KNOWN_RUNTIME_PATHS)

    for base in SCAN_DIRS:
        if not base.exists():
            continue
        for child in base.rglob("*"):
            if child.is_file() and child.suffix in SCAN_SUFFIXES:
                paths.add(rel_path(child))

    return sorted(paths)


def git_status(path: str) -> str:
    return run_git(["status", "--short", "--", path])


def is_tracked(path: str) -> bool:
    return bool(run_git(["ls-files", "--", path]))


def is_dirty(status: str) -> bool:
    return bool(status.strip())


def main() -> int:
    parser = argparse.ArgumentParser(description="Check runtime audit/log git hygiene.")
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit nonzero if any tracked runtime log is dirty.",
    )
    args = parser.parse_args()

    records = []
    dirty_tracked = []

    for path in discover_runtime_paths():
        tracked = is_tracked(path)
        status = git_status(path)
        dirty = is_dirty(status)
        cleanup = f"git restore -- {path}" if tracked and dirty else ""
        record = {
            "path": path,
            "tracked": tracked,
            "dirty": dirty,
            "status": status,
            "recommended_cleanup": cleanup,
        }
        records.append(record)
        if tracked and dirty:
            dirty_tracked.append(record)

    print("Runtime audit/log hygiene check")
    print(f"repo: {REPO_ROOT}")
    print(f"strict: {args.strict}")
    print(f"runtime paths checked: {len(records)}")
    print(f"dirty tracked runtime files: {len(dirty_tracked)}")

    for record in records:
        state = "DIRTY" if record["dirty"] else "clean"
        tracked = "tracked" if record["tracked"] else "untracked-or-ignored"
        print(f"- {record['path']} [{tracked}, {state}]")
        if record["status"]:
            print(f"  git_status: {record['status']}")
        if record["recommended_cleanup"]:
            print(f"  cleanup: {record['recommended_cleanup']}")

    if dirty_tracked:
        print("Recommended cleanup commands:")
        for record in dirty_tracked:
            print(f"- {record['recommended_cleanup']}")

    if args.strict and dirty_tracked:
        print("FAIL: tracked runtime audit/log files are dirty.")
        return 1

    print("PASS: runtime audit/log hygiene check completed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
