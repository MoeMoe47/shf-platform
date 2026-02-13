from __future__ import annotations

import hashlib
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
LOCK_PATH = Path("services/shf-agent-fabric/contracts/locks/runtime_enforcement.lock.json")


def sha256_file(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def main() -> None:
    lp = REPO_ROOT / LOCK_PATH
    if not lp.exists():
        print(f"❌ LOCK MISSING: {lp}")
        print("Run: python3 services/shf-agent-fabric/scripts/lock_runtime_enforcement.py")
        raise SystemExit(1)

    lock = json.loads(lp.read_text(encoding="utf-8"))
    targets = lock.get("targets")
    if not isinstance(targets, list) or not targets:
        print("❌ LOCK INVALID: missing targets")
        raise SystemExit(1)

    errors: list[str] = []
    for t in targets:
        path = Path(t["path"])
        expected = t["sha256"]
        fp = REPO_ROOT / path
        if not fp.exists():
            errors.append(f"missing file: {path}")
            continue
        actual = sha256_file(fp)
        if actual != expected:
            errors.append(f"hash mismatch: {path}\n  expected: {expected}\n  actual:   {actual}")

    if errors:
        print("❌ RUNTIME ENFORCEMENT LOCK FAIL")
        for e in errors:
            print("-", e)
        print("\nFix: re-lock with:")
        print("  python3 services/shf-agent-fabric/scripts/lock_runtime_enforcement.py")
        raise SystemExit(1)

    print("✅ RUNTIME ENFORCEMENT LOCK PASS")


if __name__ == "__main__":
    main()
