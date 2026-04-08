from .live_optimizer import run_live_scenario_comparison


def _safe_get(d, *path):
    cur = d
    for key in path:
        if not isinstance(cur, dict):
            return None
        cur = cur.get(key)
    return cur


def _build_diff(stable_result, candidate_result):
    fields = [
        ("recommended_strategy",),
        ("gaming_risk",),
        ("confidence",),
        ("winning_scenario", "scenario"),
        ("winning_scenario", "projected_value"),
        ("rules_meta", "version"),
    ]

    diffs = []
    for path in fields:
        stable_val = _safe_get(stable_result, *path)
        candidate_val = _safe_get(candidate_result, *path)

        if stable_val != candidate_val:
            diffs.append({
                "field": ".".join(path),
                "stable": stable_val,
                "candidate": candidate_val,
            })

    stable_alloc = _safe_get(stable_result, "winning_scenario", "allocation") or {}
    candidate_alloc = _safe_get(candidate_result, "winning_scenario", "allocation") or {}
    alloc_regions = sorted(set(stable_alloc.keys()) | set(candidate_alloc.keys()))
    allocation_diff = []

    for region in alloc_regions:
        s = stable_alloc.get(region, 0)
        c = candidate_alloc.get(region, 0)
        if s != c:
            allocation_diff.append({
                "region": region,
                "stable": s,
                "candidate": c,
                "delta": c - s,
            })

    return {
        "changed_fields": diffs,
        "allocation_diff": allocation_diff,
    }


def run_stable_vs_candidate_scenario_comparison(county_inputs, total_budget):
    stable_result = run_live_scenario_comparison(
        county_inputs=county_inputs,
        total_budget=total_budget,
        evaluation_mode="stable",
    )

    candidate_result = run_live_scenario_comparison(
        county_inputs=county_inputs,
        total_budget=total_budget,
        evaluation_mode="candidate_if_available",
    )

    diff = _build_diff(stable_result, candidate_result)

    return {
        "stable": stable_result,
        "candidate": candidate_result,
        "diff": diff,
    }
