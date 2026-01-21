from datetime import datetime

def _six_step_afterschool_plan(payload: dict) -> dict:
    task = (payload or {}).get("task") or "After-school pilot rollout"
    constraints = (payload or {}).get("constraints") or []
    return {
        "title": "After-School Pilot Rollout (6 Steps)",
        "task": task,
        "constraints": constraints,
        "steps": [
            {
                "step": 1,
                "name": "Pilot scope + success metrics",
                "deliverables": [
                    "Define pilot window (4–6 weeks)",
                    "Set KPIs: enrollment, attendance, parent sign-off rate, staff-to-student ratio, incident rate, satisfaction score",
                    "Define minimum viable compliance pack (policies, attendance logs, pickup authorization, incident log)"
                ]
            },
            {
                "step": 2,
                "name": "Site + partner readiness",
                "deliverables": [
                    "Choose 1–2 sites in Franklin County",
                    "MOA/MOU draft: roles, space use, supervision rules, data rules",
                    "Confirm staffing plan and background-check workflow"
                ]
            },
            {
                "step": 3,
                "name": "Program design",
                "deliverables": [
                    "Weekly schedule: homework help, STEM/coding, SEL/fitness, enrichment, snack time",
                    "Daily check-in/out workflow",
                    "Behavior policy and escalation ladder"
                ]
            },
            {
                "step": 4,
                "name": "Enrollment + operations",
                "deliverables": [
                    "Parent packet + permission forms",
                    "Enrollment intake checklist",
                    "Attendance + pickup verification workflow"
                ]
            },
            {
                "step": 5,
                "name": "Measurement + reporting",
                "deliverables": [
                    "Weekly dashboard: attendance, retention, incidents, staff notes",
                    "Parent feedback pulse",
                    "Monthly summary output (draft-only)"
                ]
            },
            {
                "step": 6,
                "name": "Scale decision",
                "deliverables": [
                    "Go/No-Go rubric",
                    "Cost-per-student and staffing model",
                    "Replication checklist for next site"
                ]
            }
        ],
        "generatedAt": datetime.utcnow().isoformat() + "Z"
    }

def build_l23_artifact_body(payload: dict) -> dict:
    task = (payload or {}).get("task") or ""
    t = task.lower()
    if "after-school" in t or "afterschool" in t or "franklin county" in t:
        return _six_step_afterschool_plan(payload)
    return {
        "title": "Orchestrator Draft",
        "input": payload,
        "steps": [
            {"step": 1, "name": "Clarify goal", "deliverables": ["Restate request", "List constraints", "Define output format"]},
            {"step": 2, "name": "Draft plan", "deliverables": ["Create steps", "Add deliverables", "Add success checks"]},
            {"step": 3, "name": "Save artifact", "deliverables": ["Write draft artifact JSON"]}
        ],
        "generatedAt": datetime.utcnow().isoformat() + "Z"
    }
