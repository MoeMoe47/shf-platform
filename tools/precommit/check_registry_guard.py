#!/usr/bin/env python3
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

# Files we care about scanning (fast + focused).
SCAN_GLOBS = [
    "**/*.py",
    "**/*.js",
    "**/*.jsx",
    "**/*.ts",
    "**/*.tsx",
    "**/*.json",
    "**/*.md",
    "**/*.sh",
]

# Hard bans: legacy paths + known bypass patterns.
BANNED_PATTERNS = [
    # legacy db registry path (common variants)
    r"\bdb/registry\.json\b",
    r"\bDB\s*/\s*['\"]registry\.json['\"]",
    r"\bDB\s*\+\s*['\"]/?registry\.json['\"]",
    r"\bPath\(['\"]db/registry\.json['\"]\)",
    r"\bregistry\.json\b.*\bdb\b",  # catches "db ... registry.json" on same line

    # environment-variable bypasses that can silently redirect registry contract
    r"\bREGISTRY_PATH\s*=\s*os\.getenv\(",
    r"\bREGISTRY_PATH\s*=\s*getenv\(",

    # "contracts" must stay canonical (we enforce separately too)
]

# Allowlist exceptions (rare). Example: documentation that *mentions* old path could be allowed,
# but by default we keep this strict.
ALLOWLIST_FILE_SUBSTRINGS: list[str] = [
    # Add exceptions only if truly needed, e.g. "docs/migration-notes.md"
]

CANON_FILE = ROOT / "services/shf-agent-fabric/fabric/registry_canon.py"
CANON_REQUIRED_LINE = r"REGISTRY_PATH\s*=\s*ROOT\s*/\s*['\"]contracts/registry/registry\.json['\"]"

def is_allowlisted(path: Path) -> bool:
    p = str(path)
    return any(s in p for s in ALLOWLIST_FILE_SUBSTRINGS)

def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return ""

def scan_repo() -> list[str]:
    errors: list[str] = []

    # 1) Enforce canonical line inside registry_canon.py
    if not CANON_FILE.exists():
        errors.append(f"[REGISTRY_GUARD] Missing canonical file: {CANON_FILE}")
    else:
        txt = read_text(CANON_FILE)
        if not re.search(CANON_REQUIRED_LINE, txt):
            errors.append(
                "[REGISTRY_GUARD] registry_canon.py must pin REGISTRY_PATH to "
                "ROOT / 'contracts/registry/registry.json' (contract path)."
            )
        # Also ensure we don't accidentally reference db registry json anywhere in canon file
        for pat in BANNED_PATTERNS:
            if re.search(pat, txt):
                errors.append(
                    f"[REGISTRY_GUARD] Banned pattern in registry_canon.py: /{pat}/"
                )

    # 2) Scan selected files for banned patterns
    compiled = [re.compile(p) for p in BANNED_PATTERNS]

    for glob in SCAN_GLOBS:
        for path in ROOT.glob(glob):
            if not path.is_file():
                continue
            if is_allowlisted(path):
                continue

            # Skip heavy folders / irrelevant artifacts quickly
            pstr = str(path)
            if any(x in pstr for x in ["/.git/", "/node_modules/", "/dist/", "/build/", "/.venv/", "/venv/"]):
                continue

            txt = read_text(path)
            if not txt:
                continue

            for rx in compiled:
                m = rx.search(txt)
                if m:
                    # Find line number for signal
                    line_no = txt[:m.start()].count("\n") + 1
                    snippet = txt.splitlines()[line_no - 1].strip() if txt.splitlines() else ""
                    errors.append(
                        f"[REGISTRY_GUARD] {path.relative_to(ROOT)}:{line_no} matches /{rx.pattern}/ :: {snippet}"
                    )

    return errors

def main() -> int:
    errs = scan_repo()
    if errs:
        print("\n".join(errs))
        print("\n[REGISTRY_GUARD] Commit blocked. Remove legacy/bypass registry references.")
        return 1
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
