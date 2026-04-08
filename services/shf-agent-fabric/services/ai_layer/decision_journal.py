from pathlib import Path
from datetime import datetime
import json
import uuid

BASE_DIR = Path(__file__).resolve().parent / "data"
JOURNAL_PATH = BASE_DIR / "decision_journal.jsonl"


def _ts():
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


def _ensure_dir():
    BASE_DIR.mkdir(parents=True, exist_ok=True)


def write_decision(decision_type, payload, rules_meta=None):
    _ensure_dir()

    entry = {
        "decision_id": uuid.uuid4().hex[:12],
        "saved_at": _ts(),
        "decision_type": decision_type,
        "rules_meta": rules_meta or {},
        "payload": payload,
    }

    with JOURNAL_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")

    return {
        "ok": True,
        "decision_id": entry["decision_id"],
        "path": str(JOURNAL_PATH),
        "saved_at": entry["saved_at"],
    }


def _read_all():
    if not JOURNAL_PATH.exists():
        return []
    lines = JOURNAL_PATH.read_text(encoding="utf-8").splitlines()
    return [json.loads(line) for line in lines if line.strip()]


def list_decisions(limit=20):
    rows = _read_all()
    rows.reverse()
    return rows[:limit]


def query_by_decision_type(decision_type, limit=20):
    rows = _read_all()
    rows = [r for r in rows if r.get("decision_type") == decision_type]
    rows.reverse()
    return rows[:limit]


def query_by_rules_version(version, limit=20):
    rows = _read_all()
    rows = [r for r in rows if (r.get("rules_meta") or {}).get("version") == version]
    rows.reverse()
    return rows[:limit]


def query_by_strategy(strategy_name, limit=20):
    rows = _read_all()
    rows = [
        r for r in rows
        if (r.get("payload") or {}).get("recommended_strategy") == strategy_name
    ]
    rows.reverse()
    return rows[:limit]


def get_decision_by_id(decision_id):
    rows = _read_all()
    for row in reversed(rows):
        if row.get("decision_id") == decision_id:
            return row
    return None
