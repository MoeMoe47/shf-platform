from __future__ import annotations

"""
AFCC-3 Phase 2 — canonical run lifecycle contract.

Single place that defines which run lifecycle states are live, how the current
state is derived from the append-only run event log (`db/runs/events.jsonl`)
and the plan store, and how correlation ids are resolved for new runs.

Nothing here writes. `/runs/execute` and `/plan` import the helpers to stamp
new records; the Command Center read projection imports the derivation rules.
"""

import re
import secrets
from typing import Any, Dict, Iterable, List, Optional

NOT_CAPTURED = "NOT_CAPTURED"
NOT_APPLICABLE = "NOT_APPLICABLE"
UNKNOWN = "UNKNOWN"

RUN_EVENT_SCHEMA = "fabric.run_event.v3"
# v2: Phase 2 single terminal event. v3: Phase 3 start + terminal events with verified identity.
RECORDED_SCHEMAS = frozenset({"fabric.run_event.v2", RUN_EVENT_SCHEMA})
START_EVENT_TYPE = "run.execution_started"

# Live lifecycle vocabulary. Anything else found in a source record is treated
# as unsupported and derives UNKNOWN; it is never passed through.
APPROVAL_REQUIRED = "APPROVAL_REQUIRED"
APPROVED = "APPROVED"
APPROVAL_DENIED = "APPROVAL_DENIED"
EXECUTING = "EXECUTING"
COMPLETED = "COMPLETED"
FAILED = "FAILED"
SUPPORTED_STATES = frozenset({APPROVAL_REQUIRED, APPROVED, APPROVAL_DENIED, EXECUTING, COMPLETED, FAILED})
TERMINAL_STATES = frozenset({COMPLETED, FAILED})

# Deferred until real events exist. Listed so the contract can say so explicitly.
DEFERRED_STATES = ("REQUESTED", "QUEUED", "WAITING", "RETRYING", "CANCELLED", "TIMED_OUT", "REVOKED")

_SUCCESS_OUTCOMES = frozenset({"ok", "success", "completed", "done"})
_FAILURE_OUTCOMES = frozenset({"error", "failed", "fail"})
_KNOWN_PLAN_STATUSES = frozenset({"PLANNED", "APPROVED", "REJECTED", "DONE"})

ID_RE = re.compile(r"^[A-Za-z0-9_.:-]{1,128}$")
# Action words are never run ids, so a read path can never alias an action route.
RESERVED_RUN_IDS = frozenset({
    "execute", "validate", "dry-run", "recent", "approve", "reject",
    "cancel", "revoke", "retry", "timeout", "loo",
})
CORRELATION_RE = re.compile(r"^[A-Za-z0-9_.:-]{8,128}$")


def is_valid_run_id(value: Any) -> bool:
    return isinstance(value, str) and bool(ID_RE.match(value)) and value.lower() not in RESERVED_RUN_IDS


def is_valid_id(value: Any) -> bool:
    return isinstance(value, str) and bool(ID_RE.match(value))


# ------------------------------------------------------------------ correlation


def normalize_correlation_id(value: Any) -> Optional[str]:
    text = str(value or "").strip()
    return text if CORRELATION_RE.match(text) else None


def new_correlation_id() -> str:
    return f"corr_{secrets.token_hex(8)}"


def resolve_correlation_id(*, plan_correlation_id: Any = None, incoming: Any = None) -> Dict[str, str]:
    """Plan correlation wins (the chain began at /plan), then a valid incoming
    header, then a newly generated id. Invalid incoming values are ignored."""
    plan_value = normalize_correlation_id(plan_correlation_id)
    if plan_value:
        return {"correlation_id": plan_value, "correlation_source": "PLAN"}
    incoming_value = normalize_correlation_id(incoming)
    if incoming_value:
        return {"correlation_id": incoming_value, "correlation_source": "REQUEST_HEADER"}
    return {"correlation_id": new_correlation_id(), "correlation_source": "GENERATED"}


# ------------------------------------------------------------ state derivation


def event_state_claim(event: Dict[str, Any]) -> str:
    """What a single run event says about the run state.

    Returns a supported run state, "NONE" (no claim), "UNSUPPORTED" (a state
    word outside the live vocabulary, or EXECUTING without a recorded start
    event), or "CONFLICT" (the event contradicts itself).
    """
    explicit: Optional[str] = None
    for key in ("to_state", "run_state", "runState", "state", "status"):
        value = event.get(key)
        if isinstance(value, str) and value.strip():
            explicit = value.strip().upper()
            break
    if explicit == EXECUTING:
        # EXECUTING is live only when it comes from a recorded start event.
        is_start = event.get("event_type") == START_EVENT_TYPE and event.get("schema_version") in RECORDED_SCHEMAS
        return EXECUTING if is_start else "UNSUPPORTED"
    outcome = str(event.get("outcome") or "").strip().lower()
    outcome_state = COMPLETED if outcome in _SUCCESS_OUTCOMES else FAILED if outcome in _FAILURE_OUTCOMES else None

    if explicit is not None and explicit not in TERMINAL_STATES:
        return "UNSUPPORTED"
    if explicit and outcome_state and explicit != outcome_state:
        return "CONFLICT"
    return explicit or outcome_state or "NONE"


def _plan_status(plan: Dict[str, Any]) -> str:
    return str(plan.get("status") or "").strip().upper()


def verified_approval(plan: Optional[Dict[str, Any]]) -> bool:
    """True when the plan store holds an APPROVED decision by a verified actor."""
    decision = (plan or {}).get("approvalDecision")
    if not isinstance(decision, dict):
        return False
    verification = decision.get("identity_verification") if isinstance(decision.get("identity_verification"), dict) else {}
    return decision.get("decision") == "APPROVED" and verification.get("actor") == "VERIFIED" and bool(decision.get("approver_actor_id"))


def derive_approval(plan: Optional[Dict[str, Any]], run_events: Iterable[Dict[str, Any]] = ()) -> Dict[str, Any]:
    basis = next(
        (e.get("approval_basis") for e in run_events if isinstance(e.get("approval_basis"), str) and e.get("approval_basis")),
        None,
    )
    if not isinstance(plan, dict):
        # Plan unreadable: only an approval basis recorded on the run event speaks.
        state = {"NOT_REQUIRED": "NOT_REQUIRED", "PLAN_STATUS_APPROVED": "APPROVED", "EXECUTE_REQUEST_APPROVED_FLAG": "APPROVED",
                 "PLAN_APPROVAL_VERIFIED": "APPROVED"}.get(basis or "", UNKNOWN)
        return {"state": state, "required": NOT_CAPTURED, "authority": "plan_store", "plan_status": NOT_CAPTURED,
                "basis": basis or NOT_CAPTURED}
    required = bool(plan.get("approvalRequired", True))
    approved = plan.get("approved") is True
    status = _plan_status(plan)
    if status and status not in _KNOWN_PLAN_STATUSES:
        state = UNKNOWN
    elif status == "REJECTED":
        state = UNKNOWN if approved else "DENIED"
    elif not required:
        state = "NOT_REQUIRED"
    elif status == "DONE":
        state = "APPROVED"  # historical: execution already happened under the rules of its time
    elif approved or status == "APPROVED":
        # Phase 3: an approval without a verified approver cannot authorize execution.
        state = "APPROVED" if verified_approval(plan) else "APPROVED_UNATTRIBUTED"
    else:
        state = "PENDING"
    return {"state": state, "required": required, "authority": "plan_store", "plan_status": status or NOT_CAPTURED,
            "basis": basis or NOT_CAPTURED}


def derive_plan_state(plan: Dict[str, Any]) -> Dict[str, Any]:
    """State of a plan that has no run event yet."""
    status = _plan_status(plan) or "PLANNED"
    if status not in _KNOWN_PLAN_STATUSES:
        return {"state": UNKNOWN, "reason_code": "UNSUPPORTED_PLAN_STATUS", "conflict": False}
    approval = derive_approval(plan)["state"]
    if approval == UNKNOWN:
        return {"state": UNKNOWN, "reason_code": "PLAN_APPROVAL_CONFLICT", "conflict": True}
    if status == "DONE":
        # Executed per the plan store, but no run event proves the outcome.
        return {"state": UNKNOWN, "reason_code": "RUN_EVENT_MISSING", "conflict": False}
    if status == "REJECTED":
        return {"state": APPROVAL_DENIED, "reason_code": "PLAN_REJECTED", "conflict": False}
    if approval == "PENDING":
        return {"state": APPROVAL_REQUIRED, "reason_code": "PLAN_APPROVAL_PENDING", "conflict": False}
    if approval == "APPROVED_UNATTRIBUTED":
        return {"state": APPROVAL_REQUIRED, "reason_code": "PLAN_APPROVAL_UNATTRIBUTED", "conflict": False}
    return {"state": APPROVED, "reason_code": "PLAN_APPROVAL_SATISFIED", "conflict": False}


def _ts(event: Dict[str, Any]) -> str:
    value = event.get("ts") or event.get("occurred_at")
    return value if isinstance(value, str) else ""


def derive_run_state(run_events: List[Dict[str, Any]], plan: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """Deterministic precedence (first match wins):

    1. any event that contradicts itself                               -> UNKNOWN
    2. any event naming an unsupported state (incl. unrecorded EXECUTING) -> UNKNOWN
    3. more than one start event                                       -> UNKNOWN
    4. more than one distinct terminal state across events             -> UNKNOWN
    5. a terminal event recorded before the start event                -> UNKNOWN
    6. neither a terminal nor a start claim                            -> UNKNOWN
    7. terminal/start claim, but the plan store says rejected/pending   -> UNKNOWN
    8. run says verified approval, plan store holds none               -> UNKNOWN
    9. otherwise the terminal claim, or EXECUTING if only a start exists
    """
    claims = [event_state_claim(e) for e in run_events]
    if "CONFLICT" in claims:
        return {"state": UNKNOWN, "reason_code": "EVENT_STATE_CONFLICT", "conflict": True}
    if "UNSUPPORTED" in claims:
        return {"state": UNKNOWN, "reason_code": "UNSUPPORTED_STATE_IN_SOURCE", "conflict": False}
    starts = [e for e, c in zip(run_events, claims) if c == EXECUTING]
    if len(starts) > 1:
        return {"state": UNKNOWN, "reason_code": "DUPLICATE_START_EVENT", "conflict": True}
    terminal = sorted({c for c in claims if c in TERMINAL_STATES})
    if len(terminal) > 1:
        return {"state": UNKNOWN, "reason_code": "CONFLICTING_TERMINAL_STATES", "conflict": True}
    if terminal and starts:
        start_ts = _ts(starts[0])
        terminal_ts = [_ts(e) for e, c in zip(run_events, claims) if c in TERMINAL_STATES]
        if start_ts and any(t and t < start_ts for t in terminal_ts):
            return {"state": UNKNOWN, "reason_code": "EVENT_ORDER_CONFLICT", "conflict": True}
    if not terminal and not starts:
        return {"state": UNKNOWN, "reason_code": "NO_STATE_IN_SOURCE", "conflict": False}
    if isinstance(plan, dict):
        approval = derive_approval(plan, run_events)["state"]
        if approval in {"DENIED", "PENDING", UNKNOWN}:
            return {"state": UNKNOWN, "reason_code": "APPROVAL_EXECUTION_CONFLICT", "conflict": True}
        if any(e.get("approval_basis") == "PLAN_APPROVAL_VERIFIED" for e in run_events) and not verified_approval(plan):
            return {"state": UNKNOWN, "reason_code": "APPROVAL_PROVENANCE_CONFLICT", "conflict": True}
    if terminal:
        return {"state": terminal[0], "reason_code": "RUN_EVENT_TERMINAL", "conflict": False}
    return {"state": EXECUTING, "reason_code": "RUN_EXECUTION_STARTED", "conflict": False}


# ------------------------------------------------------------ writer helpers


def execution_refusal(plan: Dict[str, Any]) -> Optional[str]:
    """Why `/runs/execute` must refuse this plan, or None. Checked before any run exists."""
    status = _plan_status(plan) or "PLANNED"
    if status not in _KNOWN_PLAN_STATUSES:
        return "PLAN_STATUS_NOT_EXECUTABLE"
    if status == "REJECTED":
        return "PLAN_REJECTED"
    if not plan.get("approvalRequired", True):
        return None
    if status != "APPROVED" or plan.get("approved") is not True:
        return "APPROVAL_REQUIRED"
    if not verified_approval(plan):
        return "APPROVAL_NOT_ATTRIBUTABLE"
    return None


def approval_basis(plan: Dict[str, Any]) -> str:
    """Why execution was allowed. Only call after `execution_refusal` returned None."""
    if not plan.get("approvalRequired", True):
        return "NOT_REQUIRED"
    return "PLAN_APPROVAL_VERIFIED"
