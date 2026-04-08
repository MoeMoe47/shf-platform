def run(context):
    issue = str(context.get("issue") or "").lower()
    priority = str(context.get("priority") or "NORMAL").upper()
    region = context.get("region") or "Unknown region"

    if "iep" in issue and priority == "HIGH":
        action = "Assign intervention and verify within 24 hours"
        rationale = f"{region} has IEP-related urgency with high priority conditions."
        urgency = "urgent"
    elif "attendance" in issue:
        action = "Start attendance stabilization plan"
        rationale = f"{region} shows attendance-linked intervention pressure."
        urgency = "high"
    elif "verification" in issue or "audit" in issue:
        action = "Lock verification evidence and review documentation"
        rationale = f"{region} needs documentation integrity before escalation."
        urgency = "medium"
    else:
        action = "Monitor and verify support plan"
        rationale = f"{region} should be reviewed before escalation."
        urgency = "medium"

    return {
        "recommended_action": action,
        "intervention_rationale": rationale,
        "time_sensitivity": urgency,
    }
