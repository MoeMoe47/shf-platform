from __future__ import annotations

import hashlib
import json
import re
import secrets
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

CONTRACT_ENVELOPE_VERSION = "shs.contract.envelope.v1"
FOUNDATION_VERSION = "SHS_BOS_BATCH_01_CONTRACT_FOUNDATION_V1"
TRACE_ID_RE = re.compile(r"^trc_[a-f0-9]{16,64}$")
REQUEST_ID_RE = re.compile(r"^req_[a-f0-9]{16,64}$")
ACTOR_ID_RE = re.compile(r"^(usr|svc|agt)_[A-Za-z0-9._:-]{3,96}$")
SENSITIVE_KEYS = {"password", "token", "secret", "api_key", "authorization", "cookie", "session"}


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def stable_hash(value: Any) -> str:
    encoded = json.dumps(value, sort_keys=True, separators=(",", ":"), default=str)
    return hashlib.sha256(encoded.encode("utf-8")).hexdigest()


def new_trace_id() -> str:
    return "trc_" + secrets.token_hex(16)


def new_request_id() -> str:
    return "req_" + secrets.token_hex(16)


def redact_payload(value: Any) -> Any:
    if isinstance(value, dict):
        redacted: dict[str, Any] = {}
        for key, item in value.items():
            lowered = str(key).lower()
            if any(token in lowered for token in SENSITIVE_KEYS):
                redacted[str(key)] = "[REDACTED]"
            else:
                redacted[str(key)] = redact_payload(item)
        return redacted
    if isinstance(value, list):
        return [redact_payload(item) for item in value]
    return value


@dataclass(frozen=True)
class ContractPrincipal:
    actor_id: str
    actor_type: str
    role: str
    permissions: tuple[str, ...] = ()
    organization_id: str = ""
    client_id: str = ""

    @classmethod
    def from_session(cls, session: Any) -> "ContractPrincipal":
        if isinstance(session, dict):
            return cls(
                actor_id=str(session.get("user_id") or "usr_unknown"),
                actor_type="human_operator",
                role=str(session.get("role") or "client"),
                permissions=tuple(session.get("permissions") or ()),
                organization_id=str(session.get("organization_id") or ""),
                client_id=str(session.get("client_id") or ""),
            )
        return cls(actor_id="usr_unknown", actor_type="human_operator", role="client")


@dataclass(frozen=True)
class PermissionScope:
    organization_id: str = ""
    client_id: str = ""
    program_id: str = ""
    layer_id: str = ""

    def narrows_or_matches(self, downstream: "PermissionScope") -> bool:
        for field_name in ("organization_id", "client_id", "program_id"):
            current = getattr(self, field_name)
            next_value = getattr(downstream, field_name)
            if current and next_value and current != next_value:
                return False
            if not current and next_value:
                continue
        return True


@dataclass
class ContractEnvelope:
    contract_id: str
    contract_version: str
    producer_layer_id: str
    consumer_layer_id: str
    actor_id: str
    trace_id: str = field(default_factory=new_trace_id)
    request_id: str = field(default_factory=new_request_id)
    timestamp: str = field(default_factory=utc_now)
    envelope_version: str = CONTRACT_ENVELOPE_VERSION
    event_id: str = ""
    parent_event_id: str = ""
    workflow_id: str = ""
    organization_id: str = ""
    client_id: str = ""
    program_id: str = ""
    source_id: str = ""
    source_record_id: str = ""
    entity_id: str = ""
    entity_type: str = ""
    idempotency_key: str = ""
    payload: dict[str, Any] = field(default_factory=dict)

    def as_dict(self) -> dict[str, Any]:
        return {
            "envelope_version": self.envelope_version,
            "contract_id": self.contract_id,
            "contract_version": self.contract_version,
            "producer_layer_id": self.producer_layer_id,
            "consumer_layer_id": self.consumer_layer_id,
            "trace_id": self.trace_id,
            "request_id": self.request_id,
            "event_id": self.event_id,
            "parent_event_id": self.parent_event_id,
            "workflow_id": self.workflow_id,
            "actor_id": self.actor_id,
            "timestamp": self.timestamp,
            "organization_id": self.organization_id,
            "client_id": self.client_id,
            "program_id": self.program_id,
            "source_id": self.source_id,
            "source_record_id": self.source_record_id,
            "entity_id": self.entity_id,
            "entity_type": self.entity_type,
            "idempotency_key": self.idempotency_key,
            "payload": redact_payload(self.payload),
        }


def validate_envelope(envelope: dict[str, Any]) -> dict[str, Any]:
    errors: list[str] = []
    required = {
        "envelope_version",
        "contract_id",
        "contract_version",
        "producer_layer_id",
        "consumer_layer_id",
        "trace_id",
        "request_id",
        "actor_id",
        "timestamp",
    }
    missing = sorted(field_name for field_name in required if not envelope.get(field_name))
    errors.extend(f"missing_required_field:{field_name}" for field_name in missing)
    if envelope.get("envelope_version") != CONTRACT_ENVELOPE_VERSION:
        errors.append("invalid_envelope_version")
    if envelope.get("trace_id") and not TRACE_ID_RE.match(str(envelope["trace_id"])):
        errors.append("invalid_trace_id")
    if envelope.get("request_id") and not REQUEST_ID_RE.match(str(envelope["request_id"])):
        errors.append("invalid_request_id")
    if envelope.get("actor_id") and not ACTOR_ID_RE.match(str(envelope["actor_id"])):
        errors.append("invalid_actor_id")
    return {
        "ok": not errors,
        "errors": errors,
        "validated_at": utc_now(),
        "payload_hash": stable_hash(redact_payload(envelope.get("payload", {}))),
    }


class JsonlRepository:
    def __init__(self, path: Path):
        self.path = path

    def append(self, record: dict[str, Any]) -> dict[str, Any]:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        safe_record = dict(record)
        safe_record.setdefault("recorded_at", utc_now())
        with self.path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(safe_record, sort_keys=True) + "\n")
        return safe_record

    def tail(self, limit: int = 50) -> list[dict[str, Any]]:
        if not self.path.exists():
            return []
        rows = self.path.read_text(encoding="utf-8").splitlines()[-limit:]
        return [json.loads(row) for row in rows if row.strip()]


class IdempotencyLedger:
    def __init__(self) -> None:
        self._records: dict[str, dict[str, Any]] = {}

    def claim(self, key: str, result: dict[str, Any]) -> dict[str, Any]:
        if key in self._records:
            existing = dict(self._records[key])
            existing["replayed"] = True
            return existing
        record = dict(result)
        record["idempotency_key"] = key
        record["replayed"] = False
        self._records[key] = record
        return dict(record)


def failure_record(code: str, *, retryable: bool, reason: str, trace_id: str = "") -> dict[str, Any]:
    return {
        "failure_id": "fail_" + secrets.token_hex(8),
        "failure_code": code,
        "retryable": retryable,
        "reason": reason,
        "trace_id": trace_id,
        "created_at": utc_now(),
    }

