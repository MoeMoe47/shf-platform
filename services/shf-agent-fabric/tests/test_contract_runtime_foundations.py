from __future__ import annotations

from services.contract_runtime.core import ContractEnvelope, IdempotencyLedger, PermissionScope, failure_record, validate_envelope
from services.contract_runtime.registry import contract_foundation_record, foundation_payload


def test_contract_envelope_validation_redacts_and_requires_trace_fields():
    envelope = ContractEnvelope(
        contract_id="CONTRACT-V1-001",
        contract_version="v1",
        producer_layer_id="SHS-LAYER-001",
        consumer_layer_id="SHS-LAYER-005",
        actor_id="usr_test-admin",
        payload={"authorization": "Bearer secret", "safe": "ok"},
    ).as_dict()

    result = validate_envelope(envelope)

    assert result["ok"] is True
    assert envelope["payload"]["authorization"] == "[REDACTED]"
    assert result["payload_hash"]


def test_contract_envelope_rejects_invalid_identity_and_version():
    envelope = ContractEnvelope(
        contract_id="CONTRACT-V1-001",
        contract_version="v1",
        producer_layer_id="SHS-LAYER-001",
        consumer_layer_id="SHS-LAYER-005",
        actor_id="bad",
    ).as_dict()
    envelope["envelope_version"] = "wrong"

    result = validate_envelope(envelope)

    assert result["ok"] is False
    assert "invalid_envelope_version" in result["errors"]
    assert "invalid_actor_id" in result["errors"]


def test_permission_scope_can_narrow_but_not_broaden():
    upstream = PermissionScope(organization_id="org_1", client_id="client_1")

    assert upstream.narrows_or_matches(PermissionScope(organization_id="org_1", client_id="client_1", program_id="program_1"))
    assert not upstream.narrows_or_matches(PermissionScope(organization_id="org_2", client_id="client_1"))


def test_idempotency_and_failure_foundations_are_bounded():
    ledger = IdempotencyLedger()

    first = ledger.claim("idem-1", {"status": "accepted"})
    second = ledger.claim("idem-1", {"status": "different"})
    failure = failure_record("source_not_ready", retryable=True, reason="fixture")

    assert first["replayed"] is False
    assert second["status"] == "accepted"
    assert second["replayed"] is True
    assert failure["retryable"] is True
    assert failure["failure_code"] == "source_not_ready"


def test_foundation_payload_has_35_contracts_and_no_runtime_wired_contracts():
    payload = foundation_payload(force_refresh=True)

    assert payload["metadata"]["canonical_owner"] == "admin.html#/ops/executive-command"
    assert len(payload["contracts"]) == 35
    assert all(contract["runtime_wired"] is False for contract in payload["contracts"])
    assert len(payload["representative_contracts"]) >= 10


def test_contract_foundation_registry_lookup_is_batch_01_scoped():
    contract = contract_foundation_record("CONTRACT-V1-001")
    missing = contract_foundation_record("NOPE")

    assert contract is not None
    assert contract["batch_01_gate"]["foundation_gate_status"] == "passed"
    assert contract["runtime_wired"] is False
    assert missing is None
