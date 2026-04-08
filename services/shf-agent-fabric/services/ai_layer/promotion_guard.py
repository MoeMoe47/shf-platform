from .decision_journal import list_decisions
from .outcome_feedback import list_feedback
from .rules_promotion import load_promotion_state


PROMOTION_GATES = {
    "min_feedback_count": 3,
    "max_avg_prediction_error": 0.15,
    "max_missed_gaming_count": 1,
    "max_overconcentrated_count": 1,
}


def _feedback_for_version(version, limit=200):
    decisions = list_decisions(limit=limit)
    decision_ids = {
        d.get("decision_id")
        for d in decisions
        if (d.get("rules_meta") or {}).get("version") == version
    }

    feedback_rows = list_feedback(limit=limit)
    return [f for f in feedback_rows if f.get("decision_id") in decision_ids]


def evaluate_candidate_for_promotion(limit=200):
    state = load_promotion_state()
    candidate = state.get("candidate_version")

    if not candidate:
        return {
            "ok": False,
            "promotable": False,
            "reason": "no_candidate_version",
        }

    version = candidate.get("version")
    rows = _feedback_for_version(version, limit=limit)

    feedback_count = len(rows)
    avg_prediction_error = (
        sum(float(r.get("prediction_error", 0.0) or 0.0) for r in rows) / feedback_count
        if feedback_count else 0.0
    )
    missed_gaming_count = sum(1 for r in rows if r.get("missed_gaming"))
    overconcentrated_count = sum(1 for r in rows if r.get("overconcentrated"))

    promotable = (
        feedback_count >= PROMOTION_GATES["min_feedback_count"] and
        avg_prediction_error <= PROMOTION_GATES["max_avg_prediction_error"] and
        missed_gaming_count <= PROMOTION_GATES["max_missed_gaming_count"] and
        overconcentrated_count <= PROMOTION_GATES["max_overconcentrated_count"]
    )

    return {
        "ok": True,
        "promotable": promotable,
        "candidate_version": version,
        "feedback_count": feedback_count,
        "avg_prediction_error": avg_prediction_error,
        "missed_gaming_count": missed_gaming_count,
        "overconcentrated_count": overconcentrated_count,
        "gates": PROMOTION_GATES,
    }
