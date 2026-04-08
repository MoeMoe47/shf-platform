from .decision_journal import list_decisions
from .outcome_feedback import list_feedback
from .rules_store import list_rule_versions, rollback_rules


def _avg_prediction_error(rows):
    vals = [
        float(r.get("prediction_error", 0.0) or 0.0)
        for r in rows
        if r.get("prediction_error") is not None
    ]
    if not vals:
        return 0.0
    return sum(vals) / len(vals)


def _feedback_for_rules_version(version, limit=100):
    decisions = list_decisions(limit=limit)
    decision_ids = {
        d.get("decision_id")
        for d in decisions
        if (d.get("rules_meta") or {}).get("version") == version
    }

    feedback_rows = list_feedback(limit=limit)
    return [f for f in feedback_rows if f.get("decision_id") in decision_ids]


def evaluate_rules_version_health(version, limit=100):
    rows = _feedback_for_rules_version(version, limit=limit)
    avg_error = _avg_prediction_error(rows)
    missed_gaming_count = sum(1 for r in rows if r.get("missed_gaming"))
    overconcentrated_count = sum(1 for r in rows if r.get("overconcentrated"))

    return {
        "version": version,
        "feedback_count": len(rows),
        "avg_prediction_error": avg_error,
        "missed_gaming_count": missed_gaming_count,
        "overconcentrated_count": overconcentrated_count,
        "is_bad": (
            len(rows) >= 3 and (
                avg_error > 0.20 or
                missed_gaming_count >= 2 or
                overconcentrated_count >= 2
            )
        ),
    }


def run_rollback_guard(limit=100):
    versions = list_rule_versions()
    if len(versions) < 2:
        return {
            "ok": False,
            "rolled_back": False,
            "reason": "not_enough_versions",
        }

    # newest first
    latest_path = versions[0]
    previous_path = versions[1]

    latest_version = latest_path.split("_")[-1].replace(".json", "")
    previous_version = previous_path.split("_")[-1].replace(".json", "")

    health = evaluate_rules_version_health(latest_version, limit=limit)

    if not health["is_bad"]:
        return {
            "ok": True,
            "rolled_back": False,
            "reason": "latest_version_healthy",
            "health": health,
        }

    rollback_result = rollback_rules(previous_path)

    return {
        "ok": True,
        "rolled_back": True,
        "reason": "latest_version_failed_health_check",
        "health": health,
        "rollback_result": rollback_result,
        "rolled_back_to_version": previous_version,
    }
