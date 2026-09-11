from __future__ import annotations

import hashlib
import hmac
import json
import os
import time
from dataclasses import dataclass
from typing import Any, Mapping


SERVICE_ID = "service:shs-api"
PERMISSION = "shf.event.create"
INTERNAL_INGESTION_PATH = "/shf/internal/ingestion/events"
MAX_CLOCK_SKEW_SECONDS = 30
ALLOWED_SERVICE_EVENTS = {
    ("curriculum.lesson", "lesson.completed"),
    ("hub.referral", "referral.created"),
    ("shs.reporting", "report.created"),
    ("shs.grant_binder", "grant_binder.created"),
    ("shs.exchange", "funding_commitment.committed"),
    ("shf.workforce", "employment_started.verified"),
    ("shs.government_assurance", "government_assurance.truth_determination.accepted"),
}


@dataclass(frozen=True)
class InternalServicePrincipal:
    service_id: str
    permission: str
    key_id: str
    principal_type: str = "service"


def canonical_request_bytes(method: str, path: str, body_digest: str, issued_at: str, expires_at: str, key_id: str) -> bytes:
    return "|".join((method.upper(), path, body_digest, issued_at, expires_at, key_id)).encode("utf-8")


def authenticate_internal_request(*, method: str, path: str, body: Mapping[str, Any], headers: Mapping[str, str]) -> InternalServicePrincipal:
    normalized = {str(key).lower(): str(value).strip() for key, value in headers.items()}
    service_id = normalized.get("x-shf-service-id", "")
    key_id = normalized.get("x-shf-service-kid", "")
    issued_at = normalized.get("x-shf-service-iat", "")
    expires_at = normalized.get("x-shf-service-exp", "")
    signature = normalized.get("x-shf-service-signature", "")
    if not all((service_id, key_id, issued_at, expires_at, signature)):
        raise ValueError("invalid_internal_service_authentication")
    if service_id != SERVICE_ID:
        raise ValueError("unauthorized_internal_service")
    try:
        issued = int(issued_at)
        expires = int(expires_at)
    except ValueError as exc:
        raise ValueError("invalid_internal_service_timestamp") from exc
    now = int(time.time())
    if issued > now + MAX_CLOCK_SKEW_SECONDS or expires <= now or expires - issued > 300:
        raise ValueError("expired_internal_service_credential")

    keys = _load_keyring()
    secret = keys.get(key_id, "")
    if not secret:
        raise ValueError("unknown_internal_service_key")
    body_bytes = json.dumps(dict(body), sort_keys=True, separators=(",", ":")).encode("utf-8")
    body_digest = hashlib.sha256(body_bytes).hexdigest()
    message = canonical_request_bytes(method, path, body_digest, issued_at, expires_at, key_id)
    expected = hmac.new(secret.encode("utf-8"), message, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, signature):
        raise ValueError("invalid_internal_service_signature")
    if path != INTERNAL_INGESTION_PATH or method.upper() != "POST":
        raise ValueError("invalid_internal_service_audience")

    producer_id = str(body.get("producer_id") or "").strip()
    event_type = str(body.get("event_type") or "").strip()
    if (producer_id, event_type) not in ALLOWED_SERVICE_EVENTS:
        raise ValueError("internal_service_event_not_allowed")
    return InternalServicePrincipal(service_id=service_id, permission=PERMISSION, key_id=key_id)


def _load_keyring() -> dict[str, str]:
    if any(os.getenv(name, "").strip().lower() == "production" for name in ("SHS_AUTH_ENV", "NODE_ENV")) and not os.getenv("SHF_INTERNAL_SERVICE_KEYS_REF", "").strip():
        raise ValueError("production_internal_service_key_provider_required")
    raw = os.getenv("SHF_INTERNAL_SERVICE_KEYS_JSON", "").strip()
    if not raw:
        raise ValueError("internal_service_keyring_missing")
    try:
        values = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError("internal_service_keyring_invalid") from exc
    if not isinstance(values, dict) or not values or not all(isinstance(k, str) and isinstance(v, str) and v for k, v in values.items()):
        raise ValueError("internal_service_keyring_invalid")
    return values
