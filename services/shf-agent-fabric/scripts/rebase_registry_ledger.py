from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

# Ensure repo root is on sys.path so "fabric" imports work when running as a script
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from fabric.registry_event_ledger import compute_event_id_v1, verify_ledger, auditor_one_liner  # noqa: E402

DB_DIR = ROOT / "db"
EVENTS_PATH = DB_DIR / "registry_events.jsonl"


def _load_jsonl(path: Path) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    if not path.exists():
        return out
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except Exception:
                continue
            if isinstance(obj, dict):
                out.append(obj)
    return out


def _write_jsonl(path: Path, items: list[dict[str, Any]]) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8") as f:
        for ev in items:
            f.write(json.dumps(ev, ensure_ascii=False) + "\n")
    tmp.replace(path)


def _short(s: str, n: int = 12) -> str:
    return s[:n] if isinstance(s, str) else ""


def main() -> int:
    ap = argparse.ArgumentParser(description="Rebase registry_events.jsonl eventId chain to v1.")
    ap.add_argument("--apply", action="store_true", help="Actually write the rebased ledger (default is dry-run).")
    ap.add_argument("--dry-run", action="store_true", help="Dry-run (default).")
    ap.add_argument("--show", type=int, default=10, help="Show first N rebased ids.")
    ap.add_argument("--backup-suffix", default=".bak_rebase", help="Backup suffix to write once.")
    args = ap.parse_args()

    dry = True
    if args.apply:
        dry = False
    if args.dry_run:
        dry = True

    if not EVENTS_PATH.exists():
        print("No ledger file found:", EVENTS_PATH)
        return 2

    # Verify BEFORE
    v0 = verify_ledger()
    print("Before:", auditor_one_liner(v0))

    evs = _load_jsonl(EVENTS_PATH)
    if not evs:
        print("Ledger empty; nothing to do.")
        return 0

    prev = "GENESIS"
    rebased: list[dict[str, Any]] = []
    preview: list[tuple[int, str, str]] = []

    for i, ev in enumerate(evs):
        # compute new v1 id using existing event object (stable fields extracted inside compute)
        new_id = compute_event_id_v1(prev, ev)

        # copy event (do not mutate original list in-memory)
        ev2 = dict(ev)
        ev2["eventId"] = new_id
        ev2["prevEventId"] = prev  # helpful for audits/debug (optional)
        prev = new_id

        rebased.append(ev2)

        if i < max(0, int(args.show or 0)):
            old = ev.get("eventId") if isinstance(ev.get("eventId"), str) else ""
            preview.append((i, _short(old), _short(new_id)))

    if preview:
        print("\nPreview (index: old -> new):")
        for i, o, n in preview:
            print(f"  {i:>4}: {o} -> {n}")

    if dry:
        print("\nDRY-RUN: no files written. Use --apply to write.")
        return 0

    # Backup once
    backup = EVENTS_PATH.with_suffix(EVENTS_PATH.suffix + args.backup_suffix)
    if not backup.exists():
        backup.write_text(EVENTS_PATH.read_text(encoding="utf-8"), encoding="utf-8")
        print("Backup written:", backup)
    else:
        print("Backup exists:", backup)

    _write_jsonl(EVENTS_PATH, rebased)
    print("Rebased ledger written:", EVENTS_PATH)
    print("Events:", len(rebased))

    # Verify AFTER
    v1 = verify_ledger()
    print("After:", auditor_one_liner(v1))

    return 0 if v1.get("pass") is True else 1


if __name__ == "__main__":
    raise SystemExit(main())
