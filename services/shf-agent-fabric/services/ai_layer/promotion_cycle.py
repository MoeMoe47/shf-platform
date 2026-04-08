from .promotion_guard import evaluate_candidate_for_promotion
from .rules_promotion import promote_candidate_to_stable


def run_promotion_cycle(limit=200):
    evaluation = evaluate_candidate_for_promotion(limit=limit)

    if not evaluation.get("ok"):
        return {
            "ok": False,
            "promoted": False,
            "reason": evaluation.get("reason"),
            "evaluation": evaluation,
        }

    if not evaluation.get("promotable"):
        return {
            "ok": True,
            "promoted": False,
            "reason": "candidate_failed_promotion_gates",
            "evaluation": evaluation,
        }

    promotion = promote_candidate_to_stable(reason="candidate_passed_promotion_gates")

    return {
        "ok": True,
        "promoted": True,
        "evaluation": evaluation,
        "promotion": promotion,
    }
