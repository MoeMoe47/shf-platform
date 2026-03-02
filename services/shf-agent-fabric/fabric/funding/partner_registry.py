from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Dict, Any, List, Optional
import secrets
import time


def _utc_iso() -> str:
    # Simple UTC-ish timestamp without dependencies
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _new_token() -> str:
    # URL-safe token for partners (store hashed later when you move to DB)
    return secrets.token_urlsafe(32)


@dataclass
class Partner:
    partner_id: str
    partner_type: str = "unknown"
    programs: List[str] = None
    allowed_rulesets: List[str] = None
    integration_token: str = ""
    created_at: str = ""
    webhooks: List[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        # normalize nulls
        d["programs"] = d["programs"] or []
        d["allowed_rulesets"] = d["allowed_rulesets"] or []
        d["webhooks"] = d["webhooks"] or []
        return d


# In-memory registry (upgrade to Postgres later)
_PARTNERS: Dict[str, Partner] = {}

# Optional: store verification events (for later audit export)
_VERIFICATIONS: List[Dict[str, Any]] = []


def register_partner(
    partner_id: str,
    partner_type: str = "unknown",
    programs: Optional[List[str]] = None,
    allowed_rulesets: Optional[List[str]] = None,
) -> Dict[str, Any]:
    if not partner_id or not isinstance(partner_id, str):
        raise ValueError("partner_id is required")

    if partner_id in _PARTNERS:
        p = _PARTNERS[partner_id]
        # Don't rotate token automatically on re-register
        return {
            "schema_version": "AIM_PARTNER_REGISTER_V1",
            "partner_id": p.partner_id,
            "status": "already_registered",
            "allowed_rulesets": p.allowed_rulesets or [],
            "integration_token": p.integration_token,
            "created_at": p.created_at,
        }

    token = _new_token()
    p = Partner(
        partner_id=partner_id,
        partner_type=partner_type or "unknown",
        programs=programs or [],
        allowed_rulesets=allowed_rulesets or [],
        integration_token=token,
        created_at=_utc_iso(),
        webhooks=[],
    )
    _PARTNERS[partner_id] = p

    return {
        "schema_version": "AIM_PARTNER_REGISTER_V1",
        "partner_id": p.partner_id,
        "status": "registered",
        "allowed_rulesets": p.allowed_rulesets,
        "integration_token": p.integration_token,
        "created_at": p.created_at,
    }


def add_webhook(
    partner_id: str,
    url: str,
    events: List[str],
) -> Dict[str, Any]:
    if partner_id not in _PARTNERS:
        raise KeyError("partner_id not registered")

    if not url or not isinstance(url, str):
        raise ValueError("url is required")
    if not events or not isinstance(events, list):
        raise ValueError("events must be a list")

    p = _PARTNERS[partner_id]
    hook = {
        "url": url,
        "events": events,
        "created_at": _utc_iso(),
    }
    p.webhooks = (p.webhooks or []) + [hook]

    return {
        "schema_version": "AIM_WEBHOOK_REGISTER_V1",
        "partner_id": partner_id,
        "status": "webhook_registered",
        "webhook": hook,
    }


def network_map() -> Dict[str, Any]:
    partners = []
    for p in _PARTNERS.values():
        partners.append({
            "partner_id": p.partner_id,
            "type": p.partner_type,
            "programs": p.programs or [],
            "active_rulesets": p.allowed_rulesets or [],
            "webhooks_count": len(p.webhooks or []),
        })
    return {
        "schema_version": "AIM_NETWORK_V1",
        "partners": sorted(partners, key=lambda x: x["partner_id"]),
    }


def verify_outcome(
    ruleset_id: str,
    participant_id: str,
    event: str,
    verification_source: str,
    partner_id: Optional[str] = None,
) -> Dict[str, Any]:
    if not ruleset_id:
        raise ValueError("ruleset_id is required")
    if not participant_id:
        raise ValueError("participant_id is required")
    if not event:
        raise ValueError("event is required")
    if not verification_source:
        raise ValueError("verification_source is required")

    record = {
        "schema_version": "AIM_OUTCOME_VERIFICATION_V1",
        "ruleset_id": ruleset_id,
        "participant_id": participant_id,
        "event": event,
        "verification_source": verification_source,
        "partner_id": partner_id,
        "verified_at": _utc_iso(),
    }
    _VERIFICATIONS.append(record)

    return {
        "schema_version": "AIM_OUTCOME_VERIFICATION_ACK_V1",
        "ok": True,
        "record": record,
        "verification_count": len(_VERIFICATIONS),
    }
