def run(context):
    risk = context.get("priority", "Normal")

    if str(risk).lower() == "high":
        level = "high"
        message = "Elevated intervention pressure detected"
    else:
        level = "moderate"
        message = "No immediate escalation detected"

    return {
        "risk_level": level,
        "risk_summary": message,
        "confidence": context.get("confidence", "unknown")
    }
