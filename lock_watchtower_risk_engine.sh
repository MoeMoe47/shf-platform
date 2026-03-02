#!/usr/bin/env bash
set -euo pipefail

cd /Users/mikeslate/Desktop/shrv1

RISK_FILE="services/shf-agent-fabric/fabric/watchtower/risk_engine.py"
LOCK_FILE="services/shf-agent-fabric/contracts/locks/runtime_enforcement.lock.json"
VERIFY_SCRIPT="services/shf-agent-fabric/scripts/verify_watchtower_risk_engine_lock.py"

echo "== Computing SHA256 =="
RISK_SHA="$(shasum -a 256 "$RISK_FILE" | awk '{print $1}')"
echo "risk_engine.py sha256 = $RISK_SHA"

echo "== Ensuring lock file exists =="
python3 - <<PY
import json, pathlib, datetime
lock_path = pathlib.Path("$LOCK_FILE")
lock_path.parent.mkdir(parents=True, exist_ok=True)

if not lock_path.exists():
    lock = {
        "version": "1",
        "updated_utc": datetime.datetime.utcnow().isoformat() + "Z",
        "files": {}
    }
    lock_path.write_text(json.dumps(lock, indent=2, sort_keys=True) + "\n", encoding="utf-8")
PY

echo "== Updating lock file =="
python3 - <<PY
import json, pathlib, datetime
lock_path = pathlib.Path("$LOCK_FILE")
lock = json.loads(lock_path.read_text(encoding="utf-8"))

lock.setdefault("version", "1")
lock["updated_utc"] = datetime.datetime.utcnow().isoformat() + "Z"
lock.setdefault("files", {})

lock["files"]["fabric/watchtower/risk_engine.py"] = {
    "sha256": "$RISK_SHA",
    "required": True,
    "notes": "Shared risk/quarantine classifier (enforcement-grade). Any drift must update lock."
}

lock_path.write_text(json.dumps(lock, indent=2, sort_keys=True) + "\n", encoding="utf-8")
print("✅ Updated lock:", str(lock_path))
PY

echo "== Writing verifier script =="
cat > "$VERIFY_SCRIPT" <<'PY'
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
PY

echo "== Running verifier =="
export PYTHONPATH=services/shf-agent-fabric
python3 "$VERIFY_SCRIPT"

echo "== Running tests =="
pytest -q

echo "🔒 LOCKED: risk_engine is enforcement-locked."
