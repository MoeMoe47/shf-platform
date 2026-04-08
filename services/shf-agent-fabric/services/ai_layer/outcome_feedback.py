from pathlib import Path
from datetime import datetime
import json
import uuid

BASE_DIR = Path(__file__).resolve().parent / "data"
FEEDBACK_PATH = BASE_DIR / "outcome_feedback.jsonl"


def _ts():
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


def _ensure_dir():
    BASE_DIR.mkdir(parents=True, exist_ok=True)


def write_feedback(
    decision_id,
    actual_outcome_score,
    expected_outcome_score=None,
    missed_gaming=False,
    overconcentrated=False,
    notes=None,
    metadata=None,
):
    _ensure_dir()

    entry = {
        "feedback_id": uuid.uuid4().hex[:12],
        "saved_at": _ts(),
        "decision_id": decision_id,
        "actual_outcome_score": actual_outcome_score,
        "expected_outcome_score": expected_outcome_score,
        "prediction_error": (
            abs(float(expected_outcome_score) - float(actual_outcome_score))
            if expected_outcome_score is not None else None
        ),
        "missed_gaming": bool(missed_gaming),
        "overconcentrated": bool(overconcentrated),
        "notes": notes or "",
        "metadata": metadata or {},
    }

    with FEEDBACK_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")

    return {
        "ok": True,
        "feedback_id": entry["feedback_id"],
        "path": str(FEEDBACK_PATH),
        "saved_at": entry["saved_at"],
    }


def _read_all():
    if not FEEDBACK_PATH.exists():
        return []
    lines = FEEDBACK_PATH.read_text(encoding="utf-8").splitlines()
    return [json.loads(line) for line in lines if line.strip()]


def list_feedback(limit=20):
    rows = _read_all()
    rows.reverse()
    return rows[:limit]


def query_feedback_by_decision_id(decision_id):
    rows = _read_all()
    rows = [r for r in rows if r.get("decision_id") == decision_id]
    rows.reverse()
    return rows


def build_tuning_observations(limit=50):
    rows = _read_all()
    rows = rows[-limit:]

    observations = []
    for row in rows:
        observations.append({
            "prediction_error": row.get("prediction_error") or 0.0,
            "missed_gaming": row.get("missed_gaming", False),
            "overconcentrated": row.get("overconcentrated", False),
        })

    return observations
