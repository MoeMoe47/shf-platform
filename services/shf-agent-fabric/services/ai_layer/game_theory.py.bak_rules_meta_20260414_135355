from .adaptive_rules import get_default_rules, get_active_rules, get_active_rules_meta
from .decision_journal import write_decision


def _compute_gaming_penalty(confidence_score, verification_quality, suspicious_spike, rules):
    confidence_score = float(confidence_score if confidence_score is not None else 1.0)
    verification_quality = float(verification_quality if verification_quality is not None else 1.0)
    suspicious_spike = bool(suspicious_spike)

    penalties = rules["penalties"]
    thresholds = rules["thresholds"]

    penalty = 0
    reasons = []

    if confidence_score < thresholds["high_confidence_floor"]:
        penalty += int((thresholds["high_confidence_floor"] - confidence_score) * penalties["low_confidence_scale"])
        reasons.append("low_confidence")

    if verification_quality < thresholds["verification_floor"]:
        penalty += int((thresholds["verification_floor"] - verification_quality) * penalties["weak_verification_scale"])
        reasons.append("weak_verification")

    if suspicious_spike:
        penalty += penalties["suspicious_spike"]
        reasons.append("suspicious_spike")

    return {
        "gaming_penalty": penalty,
        "penalty_reasons": reasons,
    }


def _score_county(
    region,
    risk_level,
    funding_risk,
    time_sensitivity,
    confidence_score=1.0,
    verification_quality=1.0,
    suspicious_spike=False,
    rules=None,
):
    rules = rules or get_active_rules()
    rules_meta = get_active_rules_meta()
    rules_meta = get_active_rules_meta()
    rules_meta = get_active_rules_meta()
    rules_meta = get_active_rules_meta()
    weights = rules["weights"]
    thresholds = rules["thresholds"]

    risk_level = str(risk_level or "low").lower()
    funding_risk = str(funding_risk or "low").lower()
    time_sensitivity = str(time_sensitivity or "medium").lower()

    base_score = 0

    base_score += (
        weights["risk_high"] if risk_level == "high"
        else weights["risk_moderate"] if risk_level == "moderate"
        else weights["risk_low"]
    )

    base_score += (
        weights["funding_high"] if funding_risk == "high"
        else weights["funding_moderate"] if funding_risk == "moderate"
        else weights["funding_low"]
    )

    base_score += (
        weights["time_urgent"] if time_sensitivity == "urgent"
        else weights["time_high"] if time_sensitivity == "high"
        else weights["time_medium"]
    )

    penalty_info = _compute_gaming_penalty(
        confidence_score=confidence_score,
        verification_quality=verification_quality,
        suspicious_spike=suspicious_spike,
        rules=rules,
    )

    gaming_penalty = penalty_info["gaming_penalty"]
    adjusted_score = max(0, base_score - gaming_penalty)

    if adjusted_score >= thresholds["score_prioritize"]:
        recommended_strategy = "prioritize_intervention"
        confidence = 0.91
        gaming_risk = "low"
    elif adjusted_score >= thresholds["score_stabilize"]:
        recommended_strategy = "stabilize_and_verify"
        confidence = 0.84
        gaming_risk = "low"
    else:
        recommended_strategy = "monitor_and_preserve"
        confidence = 0.76
        gaming_risk = "medium" if gaming_penalty < 20 else "high"

    strategy_reasoning = (
        f"{region} combines {risk_level} risk, "
        f"{funding_risk} funding sensitivity, and "
        f"{time_sensitivity} timing pressure."
    )

    if gaming_penalty > 0:
        strategy_reasoning += (
            f" Score reduced by {gaming_penalty} due to "
            f"{', '.join(penalty_info['penalty_reasons'])}."
        )

    return {
        "region": region,
        "recommended_strategy": recommended_strategy,
        "strategy_reasoning": strategy_reasoning,
        "gaming_risk": gaming_risk,
        "confidence": confidence,
        "base_score": base_score,
        "gaming_penalty": gaming_penalty,
        "score": adjusted_score,
        "risk_level": risk_level,
        "funding_risk": funding_risk,
        "time_sensitivity": time_sensitivity,
        "confidence_score": confidence_score,
        "verification_quality": verification_quality,
        "suspicious_spike": suspicious_spike,
        "penalty_reasons": penalty_info["penalty_reasons"],
    }


def run_game_theory(context, risk_result, intervention_result, funding_result, rules=None):
    region = context.get("region") or "Unknown region"

    single = _score_county(
        region=region,
        risk_level=risk_result.get("risk_level"),
        funding_risk=funding_result.get("funding_risk"),
        time_sensitivity=intervention_result.get("time_sensitivity"),
        confidence_score=context.get("confidence_score", 1.0),
        verification_quality=context.get("verification_quality", 1.0),
        suspicious_spike=context.get("suspicious_spike", False),
        rules=rules,
    )

    return {
        "recommended_strategy": single["recommended_strategy"],
        "priority_order": [single["region"]],
        "strategy_reasoning": single["strategy_reasoning"],
        "gaming_risk": single["gaming_risk"],
        "confidence": single["confidence"],
        "score": single["score"],
        "base_score": single["base_score"],
        "gaming_penalty": single["gaming_penalty"],
        "penalty_reasons": single["penalty_reasons"],
        "rules_used": rules or get_default_rules(),
        "rules_meta": rules_meta,
        "rules_meta": rules_meta,
    }


def run_cross_county_priority(county_inputs, rules=None):
    rules = rules or get_active_rules()
    rules_meta = get_active_rules_meta()
    scored = []

    for item in county_inputs or []:
        scored.append(
            _score_county(
                region=item.get("region") or "Unknown region",
                risk_level=item.get("risk_level"),
                funding_risk=item.get("funding_risk"),
                time_sensitivity=item.get("time_sensitivity"),
                confidence_score=item.get("confidence_score", 1.0),
                verification_quality=item.get("verification_quality", 1.0),
                suspicious_spike=item.get("suspicious_spike", False),
                rules=rules,
            )
        )

    scored.sort(key=lambda x: x["score"], reverse=True)
    top = scored[0] if scored else None

    return {
        "recommended_strategy": top["recommended_strategy"] if top else "monitor_and_preserve",
        "priority_order": [x["region"] for x in scored],
        "strategy_reasoning": (
            f"{top['region']} ranks first due to the highest adjusted strategic pressure."
            if top else
            "No counties provided."
        ),
        "gaming_risk": top["gaming_risk"] if top else "unknown",
        "confidence": top["confidence"] if top else 0.0,
        "ranked_counties": scored,
        "rules_used": rules,
        "rules_meta": rules_meta,
        "rules_meta": rules_meta,
    }


def run_multi_county_allocation(county_inputs, total_budget, rules=None):
    ranked = run_cross_county_priority(county_inputs, rules=rules)
    scored = ranked.get("ranked_counties", [])

    total_budget = int(total_budget or 0)
    if total_budget <= 0 or not scored:
        return {
            "recommended_strategy": "hold_budget",
            "priority_order": ranked.get("priority_order", []),
            "allocation": {},
            "allocated_total": 0,
            "remaining_budget": total_budget,
            "strategy_reasoning": "No valid budget or counties provided.",
            "gaming_risk": ranked.get("gaming_risk", "unknown"),
            "confidence": ranked.get("confidence", 0.0),
            "ranked_counties": scored,
            "rules_used": ranked.get("rules_used"),
        }

    total_score = sum(max(1, item["score"]) for item in scored)

    raw_allocations = []
    for item in scored:
        share = max(1, item["score"]) / total_score
        raw_amount = total_budget * share
        raw_allocations.append({
            "region": item["region"],
            "score": item["score"],
            "share": share,
            "raw_amount": raw_amount,
        })

    allocation = {}
    allocated_floor = 0
    remainders = []

    for item in raw_allocations:
        floor_amount = int(item["raw_amount"])
        allocation[item["region"]] = floor_amount
        allocated_floor += floor_amount
        remainders.append((item["raw_amount"] - floor_amount, item["region"]))

    leftover = total_budget - allocated_floor
    remainders.sort(reverse=True)

    for _, region in remainders[:leftover]:
        allocation[region] += 1

    allocated_total = sum(allocation.values())
    remaining_budget = total_budget - allocated_total

    strategy_reasoning = (
        f"Allocated ${allocated_total} across counties using score-weighted adjusted strategic pressure. "
        f"Top priority county is {ranked['priority_order'][0]}."
        if ranked.get("priority_order") else
        "No allocation reasoning available."
    )

    return {
        "recommended_strategy": "score_weighted_allocation",
        "priority_order": ranked.get("priority_order", []),
        "allocation": allocation,
        "allocated_total": allocated_total,
        "remaining_budget": remaining_budget,
        "strategy_reasoning": strategy_reasoning,
        "gaming_risk": ranked.get("gaming_risk", "unknown"),
        "confidence": ranked.get("confidence", 0.0),
        "ranked_counties": scored,
        "rules_used": ranked.get("rules_used"),
        "rules_meta": ranked.get("rules_meta"),
        "rules_meta": ranked.get("rules_meta"),
    }


def _build_scenario(name, ranked_counties, total_budget, rules):
    penalties = rules["penalties"]
    regions = [item["region"] for item in ranked_counties]
    score_map = {item["region"]: item["score"] for item in ranked_counties}
    risk_map = {item["region"]: item["gaming_risk"] for item in ranked_counties}

    allocation = {region: 0 for region in regions}

    if not regions or total_budget <= 0:
        return {
            "scenario": name,
            "allocation": allocation,
            "projected_value": 0,
            "gaming_risk": "unknown",
            "reasoning": "No valid counties or budget.",
        }

    if name == "franklin_first":
        focus = "Franklin" if "Franklin" in regions else regions[0]
        allocation[focus] = total_budget
    elif name == "hamilton_first":
        focus = "Hamilton" if "Hamilton" in regions else regions[0]
        allocation[focus] = total_budget
    elif name == "top2_focus":
        top2 = regions[:2]
        if top2:
            split = total_budget // len(top2)
            for region in top2:
                allocation[region] = split
            leftover = total_budget - sum(allocation.values())
            allocation[top2[0]] += leftover
    elif name == "balanced_top3":
        top3 = regions[:3]
        if top3:
            split = total_budget // len(top3)
            for region in top3:
                allocation[region] = split
            leftover = total_budget - sum(allocation.values())
            allocation[top3[0]] += leftover
    else:
        return {
            "scenario": name,
            "allocation": allocation,
            "projected_value": 0,
            "gaming_risk": "unknown",
            "reasoning": "Unknown scenario.",
        }

    projected_value = 0.0
    scenario_gaming = "low"

    for region, dollars in allocation.items():
        if dollars <= 0:
            continue

        score = score_map.get(region, 0)
        weight = dollars / total_budget
        projected_value += score * weight

        region_risk = risk_map.get(region, "low")
        if region_risk == "high":
            scenario_gaming = "high"
        elif region_risk == "medium" and scenario_gaming != "high":
            scenario_gaming = "medium"

    if name == "franklin_first":
        reasoning = "Concentrates all resources on the highest-priority county."
    elif name == "hamilton_first":
        reasoning = "Tests whether a secondary hotspot should override the top-ranked county."
    elif name == "top2_focus":
        reasoning = "Balances resources across the two strongest counties."
    else:
        reasoning = "Spreads resources across the top three counties to reduce concentration risk."

    return {
        "scenario": name,
        "allocation": allocation,
        "projected_value": round(projected_value, 2),
        "gaming_risk": scenario_gaming,
        "reasoning": reasoning,
    }


def run_scenario_comparison(county_inputs, total_budget, rules=None):
    rules = rules or get_active_rules()
    rules_meta = get_active_rules_meta()
    ranked = run_cross_county_priority(county_inputs, rules=rules)
    ranked_counties = ranked.get("ranked_counties", [])

    scenarios = [
        _build_scenario("franklin_first", ranked_counties, total_budget, rules),
        _build_scenario("hamilton_first", ranked_counties, total_budget, rules),
        _build_scenario("top2_focus", ranked_counties, total_budget, rules),
        _build_scenario("balanced_top3", ranked_counties, total_budget, rules),
    ]

    def scenario_sort_key(item):
        gaming_penalty = (
            0 if item["gaming_risk"] == "low"
            else rules["penalties"]["scenario_medium_risk_penalty"] if item["gaming_risk"] == "medium"
            else rules["penalties"]["scenario_high_risk_penalty"]
        )
        return item["projected_value"] - gaming_penalty

    scenarios.sort(key=scenario_sort_key, reverse=True)
    winner = scenarios[0] if scenarios else None

    return {
        "recommended_strategy": winner["scenario"] if winner else "none",
        "priority_order": ranked.get("priority_order", []),
        "strategy_reasoning": (
            f"{winner['scenario']} wins because it offers the best adjusted projected value."
            if winner else
            "No scenarios available."
        ),
        "winning_scenario": winner,
        "scenario_rankings": scenarios,
        "gaming_risk": winner["gaming_risk"] if winner else "unknown",
        "confidence": ranked.get("confidence", 0.0),
        "rules_used": rules,
        "rules_meta": rules_meta,
    }



def persist_scenario_decision(result):
    return write_decision(
        decision_type="scenario_comparison",
        payload=result,
        rules_meta=result.get("rules_meta"),
    )


def persist_allocation_decision(result):
    return write_decision(
        decision_type="multi_county_allocation",
        payload=result,
        rules_meta=result.get("rules_meta"),
    )


def persist_priority_decision(result):
    return write_decision(
        decision_type="cross_county_priority",
        payload=result,
        rules_meta=result.get("rules_meta"),
    )

