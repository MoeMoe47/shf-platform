from __future__ import annotations

import json
import secrets
from pathlib import Path
from typing import Any, Dict, List, Optional

from datetime import datetime, timezone

from fastapi import APIRouter, Body, Depends, Header, HTTPException
from pydantic import BaseModel, Field

from auth.audit import record_auth_event
from auth.dependencies import require_permission
from auth.permissions import FABRIC_PLAN_APPROVE, FABRIC_PLAN_CREATE
from fabric.plan_store import PlanDecisionError, list_recent_plans, load_plan, record_approval_decision, save_plan
from fabric.run_identity import (
    VERIFIED,
    VerifiedActor,
    actor_may_act_on,
    declared_identity,
    require_fabric_actor,
    verified_identity_fields,
)
from fabric.run_lifecycle import is_valid_id, resolve_correlation_id

# Reading plans exposes approver/creator identity; it needs the Command Center read grant.
PLAN_READ_PERMISSION = "bos.governance.read"
REASON_MAX_CHARS = 500

router = APIRouter()

REGISTRY_DIR = Path(__file__).resolve().parents[1] / "registry"


class PlanRequest(BaseModel):
    agentName: str = Field(..., min_length=1)
    input: Dict[str, Any] = Field(default_factory=dict)


def _load_agent_meta(agent_name: str) -> Dict[str, Any]:
    for p in sorted(REGISTRY_DIR.glob("*.agent.json")):
        try:
            data = json.loads(p.read_text())
        except Exception:
            continue
        if data.get("name") == agent_name:
            return {
                "name": data.get("name"),
                "agentId": data.get("agentId"),
                "layer": data.get("layer"),
                "policy": data.get("policy") or {},
            }
    return {"name": agent_name, "agentId": None, "layer": None, "policy": {}}


def _pilot_plan_6_steps(task: str) -> Dict[str, Any]:
    return {
        "overview": {
            "task": task,
            "scope": "Franklin County, Ohio",
            "deliverable": "Draft-only pilot plan (no external submissions)",
        },
        "steps": [
            {
                "step": 1,
                "title": "Pick pilot sites + partners",
                "checklist": [
                    "Choose 2–3 host sites (community centers, churches, rec centers, school partners).",
                    "Confirm room access, safety rules, and pickup/dropoff flow.",
                    "Sign a simple pilot MOU (roles, hours, incident policy, reporting).",
                ],
                "output": "Site list + partner contacts + MOU draft",
            },
            {
                "step": 2,
                "title": "Define program model + schedule",
                "output": "Weekly program model + daily schedule + rotation plan",
                "model": {
                  "gradeBands": ["6-8", "9-12"],
                  "targetBandForPilot": "6-8",
                  "capacity": {
                    "perSiteDailyCapacity": 25,
                    "staffToStudentRatioTarget": "1:12",
                    "maxEnrollment": 35,
                    "enrollmentRule": "first-come + priority for high-need referrals"
                  },
                  "tracks": [
                    {
                      "name": "Track A - Homework Help",
                      "goal": "Homework completion + missing work recovery",
                      "outputs": ["Homework log", "Teacher note check (if provided)"]
                    },
                    {
                      "name": "Track B - Skills Lab (Tech/Career)",
                      "goal": "Build a weekly skill + artifact",
                      "outputs": ["Weekly portfolio artifact", "Micro-badge check"]
                    },
                    {
                      "name": "Track C - Life Skills/SEL",
                      "goal": "Behavior support, leadership, routines, communication",
                      "outputs": ["Daily reflection check", "Team role practice"]
                    }
                  ],
                  "dailySchedule": [
                    {"time": "3:15-3:35", "block": "Check-in + snack + attendance"},
                    {"time": "3:35-4:20", "block": "Rotation Block 1 (A/B/C)"},
                    {"time": "4:20-4:30", "block": "Reset / restroom / transition"},
                    {"time": "4:30-5:15", "block": "Rotation Block 2 (A/B/C)"},
                    {"time": "5:15-5:25", "block": "Reset / movement break"},
                    {"time": "5:25-6:10", "block": "Rotation Block 3 (A/B/C)"},
                    {"time": "6:10-6:30", "block": "Dismissal + parent pickup verification"}
                  ],
                  "weeklyThemeMap": [
                    {"day": "Mon", "focus": "Homework + Skill intro"},
                    {"day": "Tue", "focus": "Skills Lab build day"},
                    {"day": "Wed", "focus": "Homework recovery + SEL"},
                    {"day": "Thu", "focus": "Project finalize + badge check"},
                    {"day": "Fri", "focus": "Showcase + enrichment + parent touchpoint"}
                  ]
                },
                "checklist": [
                  "Choose target grade band for pilot and set per-site capacity.",
                  "Lock daily schedule blocks and rotation flow.",
                  "Define weekly themes and portfolio outputs.",
                  "Document parent pickup/dismissal rules and communication cadence."
                ]
              },
            {
  "step": 3,
  "title": "Staffing + operations",
  "output": "Staffing plan + daily SOP + training checklist + incident flow",
  "staffing": {
    "roles": [
      {
        "name": "Site Lead",
        "countPerSite": 1,
        "coreDuties": [
          "Owns site safety + supervision",
          "Runs daily huddles + resolves issues",
          "Confirms dismissal + pickup verification",
          "Ensures attendance + incident logs completed"
        ]
      },
      {
        "name": "Mentors / Tutors",
        "countPerSite": 2,
        "coreDuties": [
          "Lead rotations (Homework / Skills Lab / SEL)",
          "Track student progress + notes",
          "Support behavior using escalation ladder"
        ]
      },
      {
        "name": "Safety + Check-in",
        "countPerSite": 1,
        "coreDuties": [
          "Check-in/check-out, ID/pickup verification",
          "Maintain roster + emergency contacts access",
          "First responder for minor issues, calls Site Lead"
        ]
      },
      {
        "name": "Program Coordinator (roving / central)",
        "countAcrossSites": 1,
        "coreDuties": [
          "Schedules staff, supply runs, quality checks",
          "Weekly reporting + partner comms",
          "Training delivery + compliance checklist"
        ]
      }
    ],
    "ratioTarget": "1:12",
    "minimumCoverageRule": "No site operates with fewer than 2 adults present at any time.",
    "recommendedCoverageFor25": "1 Site Lead + 2 Mentors + 1 Check-in/Safety (4 adults)"
  },
  "training": {
    "preLaunch": [
      "Mandated reporter basics (if applicable to host/role)",
      "Child safety + supervision rules",
      "Behavior expectations + de-escalation",
      "Attendance logging + data privacy basics",
      "Emergency response: fire/medical/lockdown",
      "Dismissal + pickup verification process"
    ],
    "week1Refreshers": [
      "Daily SOP rehearsal",
      "Role-play escalation scenarios",
      "Incident report walkthrough"
    ]
  },
  "dailySOP": [
    {"phase": "Set-up (15 min)", "actions": ["Room check", "Materials ready", "Roster printed/loaded", "Snack prep"]},
    {"phase": "Check-in (20 min)", "actions": ["Attendance", "Snack", "Assign rotation groups", "Review expectations"]},
    {"phase": "Rotations", "actions": ["Run A/B/C blocks", "Quick transitions", "Log participation"]},
    {"phase": "Dismissal (20 min)", "actions": ["Cleanup", "Parent pickup verification", "Sign-out", "Flag issues"]},
    {"phase": "Close-out (10 min)", "actions": ["Daily notes", "Incident logs if any", "Tomorrow needs list"]}
  ],
  "escalation": {
    "ladder": [
      "Level 1: Redirection + reminder",
      "Level 2: Cool-down break + mentor check-in",
      "Level 3: Site Lead intervention + parent contact",
      "Level 4: Incident report + early pickup (if needed)",
      "Level 5: Emergency services (only if required)"
    ],
    "documentationRule": "Any Level 4+ event gets an incident report same day."
  },
  "checklist": [
    "Assign site roles and confirm coverage ratio targets.",
    "Run pre-launch training and document completion.",
    "Finalize daily SOP and print/post it at the site.",
    "Implement escalation ladder + incident documentation."
  ]
},
            
{
  "step": 4,
  "title": "Budget ranges + resources",
  "model": {
    "siteMonthlyRangeUSD": [
      9500,
      14500
    ],
    "whatThisCovers": [
      "Stable staffing coverage for safety + consistency",
      "Daily snack + supplies",
      "Basic devices strategy (some shared devices ok)",
      "Simple reporting + parent touchpoints",
      "Contingency buffer for issues"
    ]
  },
  "checklist": [
    "Lock your Standard Pilot monthly budget per site (pick a number inside the range).",
    "Confirm staffing shifts and coverage ratio targets.",
    "Choose device strategy: shared devices vs donor devices vs bring-your-own.",
    "Build the site kit list and assign who provides each item (you vs host).",
    "Set contingency policy: what triggers using buffer funds."
  ],
  "output": "Top-1% Standard Pilot budget + per-student model + site kit checklist",
  "resources": {
    "minimumKitPerSite": [
      "Attendance system + daily roster",
      "Parent pickup verification log",
      "Incident log + basic first aid kit",
      "Snack station supplies",
      "Supplies bin (paper, pens, markers, folders)",
      "1 staff laptop for logging + reports",
      "Rotation materials for Track A/B/C"
    ],
    "recommendedAddOns": [
      "8-15 shared student devices + headphones",
      "Simple badge system (weekly)",
      "Hotspot (only if site Wi-Fi unreliable)"
    ]
  }
}
,
            

{
  "step": 5,
  "title": "Compliance + risk control",
  "output": "Compliance checklist + consent forms outline + incident workflow",
  "model": {
    "requiredDocs": [
      {"name": "Parent/Guardian Consent", "includes": ["emergency contacts", "pickup authorization list", "photo/media opt-in/out", "medical notes/allergies (optional)", "behavior expectations"]},
      {"name": "Participant Code of Conduct", "includes": ["respect rules", "no violence/weapons", "device rules", "bullying policy", "consequences ladder"]},
      {"name": "Incident Report Form", "includes": ["date/time", "who involved", "what happened", "level (1-5)", "actions taken", "witnesses", "parent contact", "follow-up plan"]},
      {"name": "Daily Dismissal Verification Log", "includes": ["authorized pickup name", "ID checked (yes/no)", "time out", "staff initials"]},
      {"name": "Data Minimization Notice", "includes": ["attendance", "basic demographics if needed", "outcomes (artifacts/badges)", "no sensitive data unless required", "access controls"]},
      {"name": "Volunteer/Staff Acknowledgment", "includes": ["mandated reporting awareness", "confidentiality", "no 1:1 closed-door rule", "escalation steps"] }
    ],
    "backgroundChecks": {
      "policy": "Follow host site policy at minimum; for best practice require checks for all staff/mentors with child contact.",
      "minimum": ["ID verification", "reference check (1)", "basic training completion"],
      "recommended": ["BCI/FBI (or equivalent) background check", "sex offender registry check (where applicable)"]
    },
    "siteSafetyRules": [
      "No unsupervised 1:1 behind closed doors",
      "Two-adult visibility rule for group areas when possible",
      "Sign-in/out required for every student daily",
      "Clear dropoff/pickup window and handoff verification",
      "First-aid kit on site and known location",
      "Emergency exits identified and posted"
    ],
    "incidentEscalation": {
      "ladder": [
        "Level 1: Redirection + reminder",
        "Level 2: Cool-down break + mentor check-in",
        "Level 3: Site Lead intervention + parent contact",
        "Level 4: Incident report + early pickup (if needed)",
        "Level 5: Emergency services (only if required)"
      ],
      "documentationRule": "Any Level 3+ event requires parent contact logged; any Level 4+ event requires incident report same day."
    },
    "dataRules": {
      "collect": ["attendance", "enrollment roster", "parent contact + pickup authorization", "incidents (only when needed)", "learning outputs (artifacts/badges counts)"],
      "avoid": ["social security numbers", "medical/mental health details (unless required and secured)", "unnecessary identifiers"],
      "storage": ["limit access to Site Lead + Coordinator", "use role-based access", "retain only as long as needed for reporting and safety"]
    },
    "communicationCadence": {
      "daily": ["pickup notes for issues", "incident calls when needed"],
      "weekly": ["parent pulse message (1 question) + reminders"],
      "monthly": ["summary outcomes + next-month plan"]
    }
  },
  "checklist": [
    "Finalize consent + pickup authorization form and get signed before Day 1.",
    "Adopt code of conduct and post it at the site.",
    "Set incident escalation ladder and train staff on it.",
    "Confirm background check standard (match or exceed host policy).",
    "Implement data-minimum rules and lock who can access rosters/logs."
  ]
}
,
            {
                "step": 6,
                "title": "Metrics + reporting (Lord of Outcomes-ready)",
                "output": "Pilot scorecard + monthly report template + data schema (minimal)",
                "model": {
                    "northStar": {
                        "attendanceRateTarget": 0.75,
                        "retentionTarget": 0.70,
                        "parentSatisfactionTarget": 4.2,
                        "weeklyArtifactCompletionTarget": 0.60,
                        "behaviorIncidentRateMaxPer100Sessions": 5
                    },
                    "metrics": {
                        "daily": [
                            {"name": "attendance_count", "type": "int"},
                            {"name": "dismissal_verified_pct", "type": "float"},
                            {"name": "incidents_level3_plus", "type": "int"}
                        ],
                        "weekly": [
                            {"name": "unique_students_served", "type": "int"},
                            {"name": "avg_days_attended_per_student", "type": "float"},
                            {"name": "artifact_count", "type": "int"},
                            {"name": "badge_checks_completed", "type": "int"},
                            {"name": "homework_logs_completed", "type": "int"}
                        ],
                        "monthly": [
                            {"name": "enrolled_count", "type": "int"},
                            {"name": "retained_count", "type": "int"},
                            {"name": "retention_rate", "type": "float"},
                            {"name": "cost_total_usd", "type": "float"},
                            {"name": "cost_per_student_usd", "type": "float"},
                            {"name": "parent_satisfaction_avg", "type": "float"},
                            {"name": "incidents_total_level3_plus", "type": "int"},
                            {"name": "improvements_next_month", "type": "list"}
                        ]
                    },
                    "portfolioOutputs": [
                        {
                            "track": "Track B — Skills Lab (Tech/Career)",
                            "weeklyArtifact": "one small deliverable per student or team",
                            "examples": ["resume bullet draft", "basic web page", "career interest map", "budget worksheet", "micro-project checklist"]
                        }
                    ],
                    "reportTemplates": {
                        "weeklyPulse": {
                            "sections": ["attendance snapshot", "wins", "issues", "artifact highlights", "next week focus"],
                            "maxBulletsPerSection": 5
                        },
                        "monthlyBoardReport": {
                            "sections": [
                                "Executive summary",
                                "Participation + retention",
                                "Learning outputs (artifacts/badges)",
                                "Safety + incidents summary",
                                "Budget vs plan",
                                "What changed (process improvements)",
                                "Decision ask (renew/expand/revise)"
                            ]
                        }
                    },
                    "dataRules": {
                        "minimumDataOnly": True,
                        "studentIdentifiers": ["first_name", "last_initial", "grade_band", "guardian_phone"],
                        "noSensitiveDataByDefault": True
                    }
                },
                "checklist": [
                    "Implement daily attendance + dismissal verification logging.",
                    "Implement weekly artifact/badge counts per site.",
                    "Run weekly pulse report every Friday.",
                    "Run monthly board report with costs, outcomes, and improvement actions.",
                    "Compare to targets and decide: renew, expand, or revise at Week 6."
                ]
            },
        ],
        "timeline": {
            "week_0": "Partner confirmation + site setup + staff onboarding",
            "week_1": "Soft launch (reduced capacity) + daily feedback loop",
            "weeks_2_6": "Full pilot run + weekly reporting",
            "week_6": "Decision gate: renew, expand sites, or revise model",
        },
    }


def _loo_schema_and_example(north_star: dict) -> dict:
    """
    Returns:
      {
        "schema": {... JSON Schema ...},
        "example_payload": {... example ...}
      }
    """
    schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "title": "Lord of Outcomes · After-School Pilot Report",
        "type": "object",
        "additionalProperties": False,
        "required": ["schemaVersion", "program", "site", "period", "northStar", "daily", "weekly", "monthly"],
        "properties": {
            "schemaVersion": {"type": "string", "pattern": r"^v\d+\.\d+\.\d+$"},
            "program": {
                "type": "object",
                "additionalProperties": False,
                "required": ["programId", "name", "pilotType"],
                "properties": {
                    "programId": {"type": "string"},
                    "name": {"type": "string"},
                    "pilotType": {"type": "string", "enum": ["after_school"]}
                }
            },
            "site": {
                "type": "object",
                "additionalProperties": False,
                "required": ["siteId", "siteName", "county", "state"],
                "properties": {
                    "siteId": {"type": "string"},
                    "siteName": {"type": "string"},
                    "county": {"type": "string"},
                    "state": {"type": "string", "minLength": 2, "maxLength": 2}
                }
            },
            "period": {
                "type": "object",
                "additionalProperties": False,
                "required": ["month", "year", "timezone"],
                "properties": {
                    "month": {"type": "integer", "minimum": 1, "maximum": 12},
                    "year": {"type": "integer", "minimum": 2020, "maximum": 2100},
                    "timezone": {"type": "string"}
                }
            },
            "northStar": {
                "type": "object",
                "additionalProperties": False,
                "required": [
                    "attendanceRateTarget",
                    "behaviorIncidentRateMaxPer100Sessions",
                    "parentSatisfactionTarget",
                    "retentionTarget",
                    "weeklyArtifactCompletionTarget"
                ],
                "properties": {
                    "attendanceRateTarget": {"type": "number", "minimum": 0, "maximum": 1},
                    "behaviorIncidentRateMaxPer100Sessions": {"type": "number", "minimum": 0},
                    "parentSatisfactionTarget": {"type": "number", "minimum": 1, "maximum": 5},
                    "retentionTarget": {"type": "number", "minimum": 0, "maximum": 1},
                    "weeklyArtifactCompletionTarget": {"type": "number", "minimum": 0, "maximum": 1}
                }
            },
            "daily": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": ["date", "attendance_count", "dismissal_verified_pct", "incidents_level3_plus"],
                    "properties": {
                        "date": {"type": "string", "format": "date"},
                        "attendance_count": {"type": "integer", "minimum": 0},
                        "dismissal_verified_pct": {"type": "number", "minimum": 0, "maximum": 1},
                        "incidents_level3_plus": {"type": "integer", "minimum": 0}
                    }
                }
            },
            "weekly": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": [
                        "week_start",
                        "unique_students_served",
                        "avg_days_attended_per_student",
                        "artifact_count",
                        "badge_checks_completed",
                        "homework_logs_completed"
                    ],
                    "properties": {
                        "week_start": {"type": "string", "format": "date"},
                        "unique_students_served": {"type": "integer", "minimum": 0},
                        "avg_days_attended_per_student": {"type": "number", "minimum": 0},
                        "artifact_count": {"type": "integer", "minimum": 0},
                        "badge_checks_completed": {"type": "integer", "minimum": 0},
                        "homework_logs_completed": {"type": "integer", "minimum": 0}
                    }
                }
            },
            "monthly": {
                "type": "object",
                "additionalProperties": False,
                "required": [
                    "enrolled_count",
                    "retained_count",
                    "retention_rate",
                    "cost_total_usd",
                    "cost_per_student_usd",
                    "parent_satisfaction_avg",
                    "incidents_total_level3_plus",
                    "improvements_next_month"
                ],
                "properties": {
                    "enrolled_count": {"type": "integer", "minimum": 0},
                    "retained_count": {"type": "integer", "minimum": 0},
                    "retention_rate": {"type": "number", "minimum": 0, "maximum": 1},
                    "cost_total_usd": {"type": "number", "minimum": 0},
                    "cost_per_student_usd": {"type": "number", "minimum": 0},
                    "parent_satisfaction_avg": {"type": "number", "minimum": 1, "maximum": 5},
                    "incidents_total_level3_plus": {"type": "integer", "minimum": 0},
                    "improvements_next_month": {"type": "array", "items": {"type": "string"}}
                }
            }
        }
    }

    example_payload = {
        "schemaVersion": "v1.0.0",
        "program": {"programId": "shf_after_school_pilot", "name": "SHF After-School Pilot", "pilotType": "after_school"},
        "site": {"siteId": "franklin_oh_site_01", "siteName": "Gladden Community Center", "county": "Franklin", "state": "OH"},
        "period": {"month": 1, "year": 2026, "timezone": "America/New_York"},
        "northStar": dict(north_star),
        "daily": [
            {"date": "2026-01-05", "attendance_count": 21, "dismissal_verified_pct": 1.0, "incidents_level3_plus": 0},
            {"date": "2026-01-06", "attendance_count": 19, "dismissal_verified_pct": 0.95, "incidents_level3_plus": 1}
        ],
        "weekly": [
            {
                "week_start": "2026-01-05",
                "unique_students_served": 26,
                "avg_days_attended_per_student": 2.7,
                "artifact_count": 14,
                "badge_checks_completed": 12,
                "homework_logs_completed": 20
            }
        ],
        "monthly": {
            "enrolled_count": 35,
            "retained_count": 26,
            "retention_rate": 0.7428571429,
            "cost_total_usd": 11850.00,
            "cost_per_student_usd": 455.77,
            "parent_satisfaction_avg": 4.3,
            "incidents_total_level3_plus": 3,
            "improvements_next_month": [
                "Add 10-minute structured movement break after Rotation Block 2",
                "Tighten pickup verification script and signage",
                "Increase weekly artifact rubric clarity (1-page)"
            ]
        }
    }

    return {"schema": schema, "example_payload": example_payload}



@router.post("/plan")
def create_plan(
    req: PlanRequest,
    x_correlation_id: str | None = Header(default=None, alias="X-Correlation-Id"),
    actor: VerifiedActor = Depends(require_fabric_actor(FABRIC_PLAN_CREATE)),
):
    agent = _load_agent_meta(req.agentName)
    policy = agent.get("policy") or {}
    plan_id = secrets.token_hex(8)
    request_id = secrets.token_hex(6)
    correlation = resolve_correlation_id(incoming=x_correlation_id)

    user_task = ""
    if isinstance(req.input, dict):
        user_task = str(req.input.get("task") or "").strip()

    draft_body: Dict[str, Any]
    if user_task:
        output = req.input.get("output") if isinstance(req.input, dict) else None
        constraints = req.input.get("constraints") if isinstance(req.input.get("constraints"), list) else []
        if output == "loo_schema":
            north_star = req.input.get("northStar") if isinstance(req.input.get("northStar"), dict) else {}
            draft_body = {
                "output": output,
                "constraints": constraints,
                "loo_schema": _loo_schema_and_example(north_star),
            }
        else:
            draft_body = {
                "pilotPlan": _pilot_plan_6_steps(user_task),
                "constraints": constraints,
                "output": output,
            }
    else:
        draft_body = {"echo": req.input}

    creator = verified_identity_fields(actor, prefix="creator")
    plan = {
        "planId": plan_id,
        "requestId": request_id,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "correlationId": correlation["correlation_id"],
        "correlationSource": correlation["correlation_source"],
        # AFCC-3 Phase 3: verified creator from the session; body claims are only DECLARED.
        "organization_id": creator["organization_id"],
        "createdBy": creator,
        "agent": {
            "name": agent.get("name"),
            "agentId": agent.get("agentId"),
            "layer": agent.get("layer"),
        },
        "policy": {
            "humanApproval": bool(policy.get("humanApproval", True)),
            "maxSteps": int(policy.get("maxSteps", 6)),
            "notes": str(policy.get("notes", "")),
        },
        "input": req.input,
        "approvalRequired": bool(policy.get("humanApproval", True)),
        "approved": False,
        "status": "PLANNED",
        "steps": [
            {
                "step": 1,
                "type": "tool_call",
                "tool": "save_draft_artifact",
                "args": {
                    "title": f"Plan Draft · {req.agentName}",
                    "type": "draft_artifact",
                    "meta": {"agent": req.agentName, "layer": agent.get("layer")},
                    "body": draft_body,
                },
            }
        ],
    }
    declared = declared_identity(req.input)
    if declared:
        plan["declared_identity"] = declared

    save_plan(plan)
    record_auth_event("fabric_plan_created", user_id=actor.actor_id, role=actor.role, result="allowed",
                      metadata={"plan_id": plan_id, "correlation_id": correlation["correlation_id"], "permission": actor.permission})
    return {"ok": True, "planId": plan_id, "requestId": request_id, "correlationId": correlation["correlation_id"]}


@router.get("/plans/recent")
def recent_plans(limit: int = 10, _session=Depends(require_permission(PLAN_READ_PERMISSION))):
    return {"ok": True, "plans": list_recent_plans(limit)}


@router.get("/plan/{plan_id}")
def get_plan(plan_id: str, _session=Depends(require_permission(PLAN_READ_PERMISSION))):
    plan = load_plan(plan_id) if is_valid_id(plan_id) else None
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return {"ok": True, "plan": plan}


def _verified_creator(plan: Dict[str, Any]) -> Optional[str]:
    """The plan creator, only if the writer recorded it from an authenticated session."""
    created_by = plan.get("createdBy")
    if not isinstance(created_by, dict):
        return None
    verification = created_by.get("identity_verification") if isinstance(created_by.get("identity_verification"), dict) else {}
    creator = created_by.get("creator_actor_id")
    return creator if verification.get("actor") == VERIFIED and is_valid_id(creator) else None


def _has_attributable_decision(plan: Dict[str, Any]) -> bool:
    decision = plan.get("approvalDecision")
    return isinstance(decision, dict) and (decision.get("identity_verification") or {}).get("actor") == VERIFIED


def _decide(plan_id: str, decision: str, actor: VerifiedActor, body: Optional[Dict[str, Any]], incoming_correlation: Optional[str]):
    if not is_valid_id(plan_id):
        raise HTTPException(status_code=404, detail="Plan not found")
    body = body if isinstance(body, dict) else {}
    reason = body.get("reason")
    reason = reason.strip()[:REASON_MAX_CHARS] if isinstance(reason, str) and reason.strip() else None

    def may_decide(plan: Dict[str, Any]) -> Optional[str]:
        if not actor_may_act_on(actor, plan):
            return "PLAN_NOT_FOUND"  # never confirm another organization's plan exists
        # AFCC-3 Phase 4.1, Policy B (SHS convention, e.g. AI Governance
        # SELF_APPROVAL_DENIED): the verified creator may neither approve nor
        # reject their own plan. Both identities come from sessions, never bodies.
        # Legacy plans with no verified creator cannot be compared and stay decidable.
        if _verified_creator(plan) == actor.actor_id:
            return "SELF_APPROVAL_DENIED"
        status = str(plan.get("status") or "").upper()
        if status == "DONE":
            return "PLAN_ALREADY_EXECUTED"
        if not bool(plan.get("approvalRequired", True)):
            return "APPROVAL_NOT_REQUIRED"
        if _has_attributable_decision(plan):
            return "DECISION_ALREADY_RECORDED"
        return None

    existing = load_plan(plan_id)
    correlation = resolve_correlation_id(plan_correlation_id=(existing or {}).get("correlationId"), incoming=incoming_correlation)
    record: Dict[str, Any] = {
        "decision": decision,
        "plan_id": plan_id,
        "decided_at": datetime.now(timezone.utc).isoformat(),
        "reason": reason,
        "correlation_id": correlation["correlation_id"],
        "correlation_source": correlation["correlation_source"],
        **verified_identity_fields(actor, prefix="approver"),
    }
    declared = declared_identity(body)
    if declared:
        record["declared_identity"] = declared
    try:
        record_approval_decision(plan_id, record, may_decide)
    except PlanDecisionError as exc:
        record_auth_event("fabric_plan_decision_refused", user_id=actor.actor_id, role=actor.role, result="denied",
                          metadata={"plan_id": plan_id, "decision": decision, "reason": exc.code})
        if exc.code == "PLAN_NOT_FOUND":
            raise HTTPException(status_code=404, detail="Plan not found")
        if exc.code == "SELF_APPROVAL_DENIED":
            raise HTTPException(status_code=403, detail="SELF_APPROVAL_DENIED")
        raise HTTPException(status_code=409, detail=exc.code)
    record_auth_event("fabric_plan_decision_recorded", user_id=actor.actor_id, role=actor.role, result="allowed",
                      metadata={"plan_id": plan_id, "decision": decision, "correlation_id": correlation["correlation_id"], "permission": actor.permission})
    return {"ok": True, "planId": plan_id, "status": decision, "decidedBy": actor.actor_id, "correlationId": correlation["correlation_id"]}


@router.post("/plan/{plan_id}/approve")
def approve_plan(
    plan_id: str,
    body: Optional[Dict[str, Any]] = Body(default=None),
    x_correlation_id: str | None = Header(default=None, alias="X-Correlation-Id"),
    actor: VerifiedActor = Depends(require_fabric_actor(FABRIC_PLAN_APPROVE)),
):
    return _decide(plan_id, "APPROVED", actor, body, x_correlation_id)


@router.post("/plan/{plan_id}/reject")
def reject_plan(
    plan_id: str,
    body: Optional[Dict[str, Any]] = Body(default=None),
    x_correlation_id: str | None = Header(default=None, alias="X-Correlation-Id"),
    actor: VerifiedActor = Depends(require_fabric_actor(FABRIC_PLAN_APPROVE)),
):
    return _decide(plan_id, "REJECTED", actor, body, x_correlation_id)
