def run(context):
    region = context.get("region") or "Unknown region"
    priority = str(context.get("priority") or "NORMAL").upper()
    funding = str(context.get("funding") or "")
    status = str(context.get("status") or "").lower()

    funding_l = funding.lower()

    if "high" in funding_l or "unrecoverable" in funding_l:
        funding_risk = "high"
        estimated_exposure = "elevated"
        recommendation = "Protect funding position immediately"
        rationale = f"{region} shows conditions that could create unrecoverable funding exposure."
    elif "moderate" in funding_l:
        funding_risk = "moderate"
        estimated_exposure = "recoverable"
        recommendation = "Stabilize reporting and verification"
        rationale = f"{region} shows moderate funding exposure that may still be recoverable."
    else:
        funding_risk = "low"
        estimated_exposure = "limited"
        recommendation = "Maintain verification discipline"
        rationale = f"{region} shows limited funding exposure under current conditions."

    if priority == "HIGH":
        if funding_risk == "low":
            funding_risk = "moderate"
            estimated_exposure = "recoverable"
        rationale += " High priority raises urgency for protecting outcome-linked funding."

    if "risk" in status or "watch" in status:
        rationale += " Current compliance status increases funding sensitivity."

    return {
        "funding_risk": funding_risk,
        "estimated_exposure": estimated_exposure,
        "funding_recommendation": recommendation,
        "funding_rationale": rationale,
    }
