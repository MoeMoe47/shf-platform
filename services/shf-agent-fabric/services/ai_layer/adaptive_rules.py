from .rules_store import load_rules, load_rules_with_meta


def get_default_rules():
    return {
        "weights": {
            "risk_high": 50,
            "risk_moderate": 30,
            "risk_low": 10,
            "funding_high": 30,
            "funding_moderate": 18,
            "funding_low": 8,
            "time_urgent": 20,
            "time_high": 12,
            "time_medium": 6,
        },
        "penalties": {
            "low_confidence_scale": 40,
            "weak_verification_scale": 50,
            "suspicious_spike": 15,
            "scenario_medium_risk_penalty": 8,
            "scenario_high_risk_penalty": 18,
        },
        "thresholds": {
            "high_confidence_floor": 0.85,
            "verification_floor": 0.80,
            "score_prioritize": 90,
            "score_stabilize": 65,
        },
    }


def get_default_rules_meta():
    return {
        "version": "default",
        "label": "default_rules",
        "saved_at": None,
    }


def get_active_rules():
    saved = load_rules()
    return saved if saved else get_default_rules()


def get_active_rules_meta():
    saved = load_rules_with_meta()
    if saved and "rules" in saved:
        return {
            "version": saved.get("version", "unknown"),
            "label": saved.get("label", "unknown"),
            "saved_at": saved.get("saved_at"),
        }
    return get_default_rules_meta()


def tune_rules_from_feedback(current_rules, observations):
    rules = {
        "weights": dict(current_rules.get("weights", {})),
        "penalties": dict(current_rules.get("penalties", {})),
        "thresholds": dict(current_rules.get("thresholds", {})),
    }

    observations = observations or []
    if not observations:
        return rules

    avg_error = sum(float(x.get("prediction_error", 0.0)) for x in observations) / len(observations)
    missed_gaming_count = sum(1 for x in observations if x.get("missed_gaming"))
    overconcentrated_count = sum(1 for x in observations if x.get("overconcentrated"))

    if avg_error > 0.15:
        rules["weights"]["funding_high"] += 2
        rules["weights"]["time_urgent"] += 2

    if missed_gaming_count > 0:
        rules["penalties"]["low_confidence_scale"] += 4
        rules["penalties"]["weak_verification_scale"] += 4
        rules["penalties"]["suspicious_spike"] += 2

    if overconcentrated_count > 0:
        rules["penalties"]["scenario_high_risk_penalty"] += 2
        rules["penalties"]["scenario_medium_risk_penalty"] += 1

    return rules
