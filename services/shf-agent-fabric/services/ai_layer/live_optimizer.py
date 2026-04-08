from .game_theory import (
    run_cross_county_priority,
    run_multi_county_allocation,
    run_scenario_comparison,
)
from .rules_runtime import get_rules_bundle


def _stamp_result(result, bundle, evaluation_mode):
    result["evaluation_mode"] = evaluation_mode
    result["rules_used"] = bundle["rules"]
    result["rules_meta"] = bundle["meta"]
    return result


def run_live_cross_county_priority(county_inputs, evaluation_mode="stable"):
    bundle = get_rules_bundle(evaluation_mode=evaluation_mode)
    result = run_cross_county_priority(county_inputs, rules=bundle["rules"])
    return _stamp_result(result, bundle, evaluation_mode)


def run_live_multi_county_allocation(county_inputs, total_budget, evaluation_mode="stable"):
    bundle = get_rules_bundle(evaluation_mode=evaluation_mode)
    result = run_multi_county_allocation(
        county_inputs=county_inputs,
        total_budget=total_budget,
        rules=bundle["rules"],
    )
    return _stamp_result(result, bundle, evaluation_mode)


def run_live_scenario_comparison(county_inputs, total_budget, evaluation_mode="stable"):
    bundle = get_rules_bundle(evaluation_mode=evaluation_mode)
    result = run_scenario_comparison(
        county_inputs=county_inputs,
        total_budget=total_budget,
        rules=bundle["rules"],
    )
    return _stamp_result(result, bundle, evaluation_mode)
