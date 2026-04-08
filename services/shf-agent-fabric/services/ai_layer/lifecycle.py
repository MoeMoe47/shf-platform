from .tune_cycle import run_tune_and_save_cycle
from .promotion_cycle import run_promotion_cycle
from .rollback_guard import run_rollback_guard
from .rules_promotion import load_promotion_state


def run_full_lifecycle(limit=50):
    # 1. Tune cycle → candidate (if allowed)
    tune_result = run_tune_and_save_cycle(limit=limit)

    # 2. Promotion check
    promotion_result = run_promotion_cycle(limit=limit)

    # 3. Rollback safety check
    rollback_result = run_rollback_guard(limit=limit)

    # 4. Final system state
    promotion_state = load_promotion_state()

    return {
        "ok": True,
        "tune_result": tune_result,
        "promotion_result": promotion_result,
        "rollback_result": rollback_result,
        "promotion_state": promotion_state,
    }
