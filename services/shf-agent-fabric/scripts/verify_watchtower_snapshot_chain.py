from __future__ import annotations

import os
import sys

# Ensures imports work when run as a script
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from fabric.watchtower.snapshot_verify import verify_snapshot_store  # noqa: E402


def main() -> int:
    res = verify_snapshot_store(verify_all_programs=True)
    if not bool(res.get("ok")):
        print("WATCHTOWER_SNAPSHOT_VERIFY_FAIL", file=sys.stderr)
        print(res, file=sys.stderr)
        return 1
    print("✅ watchtower snapshot store OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
