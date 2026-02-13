from __future__ import annotations

import hashlib
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]

TARGETS = [
    Path("services/shf-agent-fabric/fabric/compliance/policy_resolver.py"),
    Path("services/shf-agent-fabric/fabric/compliance/runtime_enforce.py"),
]

LOCK_PATH = Path("services/shf-agent-fabric/contracts/locks/runtime_enforcement.lock.json")


def sha256_file(p: Path) -> str:
    data = p.read_bytes()
    return hashlib.sha256(data).hexdigest()


def main() -> None:
    missing = [str(p) for p in TARGETS if not (REPO_ROOT / p).exists()]
    if missing:
        print("❌ Missing target file(s):")
        for m in missing:
            print(m)
        raise SystemExit(1)

    LOCK_PATH.parent.mkdir(parents=True, exist_ok=True)

    out = {
        "version": 1,
        "repo_root": str(REPO_ROOT),
        "targets": [
            {"path": str(p), "sha256": sha256_file(REPO_ROOT / p)} for p in TARGETS
        ],
    }

    (REPO_ROOT / LOCK_PATH).write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    print(f"✅ wrote lockfile: {REPO_ROOT / LOCK_PATH}")
    for t in out["targets"]:
        print(f"   - {t['path']}: {t['sha256']}")


if __name__ == "__main__":
    main()
