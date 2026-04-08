from fabric.governance.store import (
    open_dispute,
    resolve_dispute,
    create_override,
    create_approval,
    list_disputes,
)


def test_governance_store_smoke():
    dispute = open_dispute(
        reference_type="PAYOUT_INTENT",
        reference_id="pi_test_001",
        reason="Destination mismatch",
        opened_by="ops_user_1",
    )

    assert dispute["state"] == "OPEN"

    resolved = resolve_dispute(
        dispute_id=dispute["dispute_id"],
        resolved_by="ops_manager_1",
        resolution_notes="Verified destination and closed case",
    )

    assert resolved["state"] == "RESOLVED"
    assert resolved["resolved_by"] == "ops_manager_1"

    override_row = create_override(
        reference_type="CREDIT",
        reference_id="cred_test_001",
        override_type="MANUAL_RELEASE",
        reason="Approved exception flow",
        requested_by="ops_admin_1",
    )

    assert override_row["override_type"] == "MANUAL_RELEASE"

    approval = create_approval(
        reference_type="DISPUTE",
        reference_id=dispute["dispute_id"],
        approver="director_1",
        decision="APPROVED",
        notes="Governance approval recorded",
    )

    assert approval["decision"] == "APPROVED"

    disputes = list_disputes()
    assert any(x["dispute_id"] == dispute["dispute_id"] for x in disputes)
