from copy import deepcopy

from .adaptive_rules import get_active_rules, tune_rules_from_feedback
from .outcome_feedback import build_tuning_observations
from .rules_store import save_rules
from .rules_promotion import set_candidate_version


SAFETY_GATES = {
    "min_observations": 3,
    "min_avg_prediction_error": 0.05,
    "max_changes_count": 8,
    "max_abs_delta_per_param": 6,
}


def _diff_rules(old_rules, new_rules):
    changes = []

    for section in ["weights", "penalties", "thresholds"]:
        old_section = old_rules.get(section, {})
        new_section = new_rules.get(section, {})

        keys = sorted(set(old_section.keys()) | set(new_section.keys()))
        for key in keys:
            old_val = old_section.get(key)
            new_val = new_section.get(key)
            if old_val != new_val:
                delta = None
                if isinstance(old_val, (int, float)) and isinstance(new_val, (int, float)):
                    delta = new_val - old_val

                changes.append({
                    "section": section,
                    "key": key,
                    "old": old_val,
                    "new": new_val,
                    "delta": delta,
                })

    return changes


def _average_prediction_error(observations):
    if not observations:
        return 0.0
    vals = [float(x.get("prediction_error", 0.0) or 0.0) for x in observations]
    return sum(vals) / len(vals)


def _clip_rule_changes(old_rules, new_rules, max_abs_delta):
    clipped = deepcopy(new_rules)

    for section in ["weights", "penalties", "thresholds"]:
        old_section = old_rules.get(section, {})
        new_section = clipped.get(section, {})

        for key, new_val in list(new_section.items()):
            old_val = old_section.get(key)
            if not isinstance(old_val, (int, float)) or not isinstance(new_val, (int, float)):
                continue

            delta = new_val - old_val
            if delta > max_abs_delta:
                new_section[key] = old_val + max_abs_delta
            elif delta < -max_abs_delta:
                new_section[key] = old_val - max_abs_delta

    return clipped


def _apply_safety_gates(current_rules, tuned_rules, observations):
    avg_error = _average_prediction_error(observations)

    if len(observations) < SAFETY_GATES["min_observations"]:
        return {
            "allow_save": False,
            "reason": "not_enough_observations",
            "avg_prediction_error": avg_error,
            "changes": [],
            "rules_to_save": current_rules,
        }

    if avg_error < SAFETY_GATES["min_avg_prediction_error"]:
        return {
            "allow_save": False,
            "reason": "prediction_error_too_low",
            "avg_prediction_error": avg_error,
            "changes": [],
            "rules_to_save": current_rules,
        }

    clipped_rules = _clip_rule_changes(
        current_rules,
        tuned_rules,
        SAFETY_GATES["max_abs_delta_per_param"],
    )

    changes = _diff_rules(current_rules, clipped_rules)

    if len(changes) == 0:
        return {
            "allow_save": False,
            "reason": "no_effective_changes",
            "avg_prediction_error": avg_error,
            "changes": [],
            "rules_to_save": current_rules,
        }

    if len(changes) > SAFETY_GATES["max_changes_count"]:
        return {
            "allow_save": False,
            "reason": "too_many_parameter_changes",
            "avg_prediction_error": avg_error,
            "changes": changes,
            "rules_to_save": current_rules,
        }

    return {
        "allow_save": True,
        "reason": "passed",
        "avg_prediction_error": avg_error,
        "changes": changes,
        "rules_to_save": clipped_rules,
    }


def run_tune_and_save_cycle(limit=50, label="game_theory_rules_auto"):
    current_rules = get_active_rules()
    observations = build_tuning_observations(limit=limit)

    tuned_rules = tune_rules_from_feedback(current_rules, observations)
    gate_result = _apply_safety_gates(current_rules, tuned_rules, observations)

    if not gate_result["allow_save"]:
        return {
            "ok": False,
            "saved": False,
            "gate_reason": gate_result["reason"],
            "observations_used": len(observations),
            "avg_prediction_error": gate_result["avg_prediction_error"],
            "changes_count": len(gate_result["changes"]),
            "changes": gate_result["changes"],
            "active_rules_unchanged": True,
        }

    save_result = save_rules(gate_result["rules_to_save"], label=label)

    # 🔥 REGISTER AS CANDIDATE (NOT STABLE)
    version = save_result.get("version") or save_result.get("rules_meta", {}).get("version")
    set_candidate_version(version, label)


    return {
        "ok": True,
        "saved": True,
        "gate_reason": gate_result["reason"],
        "observations_used": len(observations),
        "avg_prediction_error": gate_result["avg_prediction_error"],
        "changes_count": len(gate_result["changes"]),
        "changes": gate_result["changes"],
        "save_result": save_result,
        "tuned_rules": gate_result["rules_to_save"],
    }
