from __future__ import annotations

import json
from pathlib import Path
import subprocess
import sys


REPO_ROOT = Path(__file__).resolve().parents[1]
LOCK_FILE = REPO_ROOT / "contracts" / "locks" / "runtime_enforcement.lock.json"
REL = "fabric/watchtower/risk_engine.py"
TARGET = REPO_ROOT / REL


def sha256_file(p: Path) -> str:
    out = subprocess.check_output(["shasum", "-a", "256", str(p)], text=True).strip()
    return out.split()[0]


def main() -> int:
    if not LOCK_FILE.exists():
        print(f"LOCK_MISSING: {LOCK_FILE}", file=sys.stderr)
        return 2
    if not TARGET.exists():
        print(f"TARGET_MISSING: {TARGET}", file=sys.stderr)
        return 2

    lock = json.loads(LOCK_FILE.read_text(encoding="utf-8"))
    files = lock.get("files") or {}
    spec = files.get(REL) or {}
    expected = (spec.get("sha256") or "").strip()

    if not expected:
        print(f"LOCK_ENTRY_MISSING: files['{REL}'].sha256", file=sys.stderr)
        return 2

    actual = sha256_file(TARGET)

    if actual != expected:
        print("RISK_ENGINE_LOCK_FAIL", file=sys.stderr)
        print(f"  file: {REL}", file=sys.stderr)
        print(f"  expected: {expected}", file=sys.stderr)
        print(f"  actual:   {actual}", file=sys.stderr)
        return 1

    print("✅ risk_engine lock OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
