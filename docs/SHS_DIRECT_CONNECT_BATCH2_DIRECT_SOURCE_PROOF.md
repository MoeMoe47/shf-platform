# SHS Direct Connect Batch 2 - Direct Source Proof

## Executive Summary

SHS Direct Connect Batch 2 implements Direct Connect as **direct_source_proof**. It creates local proof records, source evidence references, approved and deferred source categories, deterministic readiness scoring, an internal admin Proof Center, and a validator that blocks drift toward live integrations or banking/account connection behavior.

Batch 2 is local/admin proof modeling only. It does not connect to banks, accounts, credentials, OAuth, external APIs, scraping, payment systems, warehouse writes, report publishing, Truth Spine claim creation, public approval, or SHF Impact Data Spine mutation.

## Corrected Framing

Direct Connect means direct-source proof that a claim, record, metric, report, or operational statement is backed by an identifiable source, source owner, evidence reference, and verification pathway.

Direct Connect does not mean banking/account connection, Plaid-like integration, payment processor integration, credentialed access, live sync, scraping, or automatic public approval.

## What Batch 2 Built

- Canonical direct-source proof record model.
- Canonical source evidence reference model.
- Ten approved local source categories.
- Eight deferred/not-enabled source categories.
- Deterministic readiness scoring.
- LocalStorage-safe proof storage and operator actions.
- Internal admin Proof Center at `admin.html#/ops/direct-connect`.
- SHS-admin-only route access and sidebar navigation.
- Validator script and package check.

## Direct-Source Proof Record Model

Implemented in `src/data/directConnect/directSourceProofRecords.js`.

The model includes source owner, source reference, Source Registry reference, Evidence Package reference, related claim/metric/report/client/project, verification pathway, verification status, approval status, readiness score, privacy status, ownership status, visibility, reporting/public safety flags, blockers, warnings, and audit events.

Required safety defaults:

- `visibility = internal_only`
- `safe_for_shf_public_surface = false`
- `public_approved = false`
- `truth_spine_claim_created = false`
- `shf_impact_data_mutated = false`
- `live_connection_enabled = false`
- `credential_required = false`
- `external_api_called = false`

## Source Evidence Reference Model

Implemented in `src/data/directConnect/directSourceEvidenceRefs.js`.

The model records evidence type, title, summary, source owner, source date, received method, storage status, verification notes, PII/secret flags, privacy review requirement, ownership review requirement, and public approval default.

No file upload, credential storage, or live source connection is created in Batch 2.

## Approved Source Categories

- `client_supplied_document`
- `partner_attestation`
- `internal_shs_operational_record`
- `internal_shs_report`
- `public_agency_record`
- `public_dataset_reference`
- `manual_review_record`
- `system_export_reference`
- `audit_review_record`
- `governance_review_record`

## Deferred Source Categories

Each deferred category is marked `status = deferred`, `live_connection_enabled = false`, and `credential_required = false`.

- `bank_account_connection`
- `financial_account_aggregation`
- `payment_processor_connection`
- `payroll_connection`
- `EHR_connection`
- `live_case_management_connection`
- `live_government_api_connection`
- `private_system_scraping`

## Readiness Scoring

Implemented in `src/data/directConnect/directSourceProofSafety.js`.

Readiness starts at 100 and subtracts:

- 25 if source owner is missing.
- 20 if evidence reference is missing.
- 20 if Source Registry reference is missing.
- 20 if Evidence Package reference is missing.
- 20 if privacy is not clear.
- 20 if ownership is not clear.
- 25 if verification is not ready or reviewed.
- 50 if `public_approved` is true.
- 50 if `live_connection_enabled` is true.
- 50 if `credential_required` is true.
- 50 if `external_api_called` is true.
- 50 if SHF Impact Data Spine mutation is claimed.

Ready for SHS internal reporting requires score >= 80, internal-only visibility, source owner, evidence reference, privacy clear, ownership clear, no public flags true, and no live connection flags true.

Batch 2 is never ready for SHF public surfaces.

## Admin/UI Integration

Route: `admin.html#/ops/direct-connect`

The Proof Center shows:

- Proof records.
- Selected proof detail.
- Evidence references.
- Readiness status.
- Safety flags.
- Approved and deferred source categories.
- Local operator actions for internal review, privacy clear, ownership clear, note, and block.

Visible UI copy:

> Direct Connect Batch 2 is direct-source proof only. It does not connect to bank accounts, external systems, credentials, APIs, or payment systems.

## Governance Layer Integration

Batch 2 connects conceptually to:

- Source Registry
- Evidence Package
- Data Verification
- Data Approval
- Audit & Verification
- Readiness Gate
- Security / Privacy
- Data Ownership / IP
- SHS Spine

It does not bypass any of these layers.

## SHS/SHF Boundary Rules

- SHS proof records are internal-only by default.
- SHF public surfaces are always false in Batch 2.
- `public_approved` stays false.
- Truth Spine claims are not created automatically.
- SHF Impact Data Spine is not mutated.
- Public use requires future Data Approval Gateway and Truth Spine pathways.

## Backend Boundary

Batch 2 does not add backend Direct Connect routes. It remains frontend/admin local proof modeling only.

Forbidden endpoint types remain absent:

- connect bank
- connect account
- OAuth
- token
- sync
- scrape
- payment
- live fetch
- external API call

## Validation Results

Validation commands run:

```bash
python3 -m json.tool docs/SHS_DIRECT_CONNECT_BATCH2_DIRECT_SOURCE_PROOF.json
python3 -m py_compile scripts/check_shs_direct_connect_batch2.py
python3 scripts/check_shs_direct_connect_batch2.py
npm run check:direct-connect-batch2
python3 scripts/check_shs_direct_connect_layer.py
python3 scripts/check_shs_direct_connect_direct_source_proof.py
npm run check:governance
python3 scripts/check_master_layer_registry.py
python3 scripts/check_truth_spine_freeze.py
python3 scripts/check_duplicate_layer_cleanup.py
python3 scripts/check_runtime_log_hygiene.py --strict
bash scripts/run_daily_governance_audit.sh
bash scripts/run_paid_launch_checks.sh
npm run build
```

Results:

- `python3 -m json.tool docs/SHS_DIRECT_CONNECT_BATCH2_DIRECT_SOURCE_PROOF.json`: PASS
- `python3 -m py_compile scripts/check_shs_direct_connect_batch2.py`: PASS
- `python3 scripts/check_shs_direct_connect_batch2.py`: PASS
- `npm run check:direct-connect-batch2`: PASS
- `python3 scripts/check_shs_direct_connect_layer.py`: PASS
- `python3 scripts/check_shs_direct_connect_direct_source_proof.py`: PASS
- `npm run check:governance`: PASS
- `python3 scripts/check_master_layer_registry.py`: PASS
- `python3 scripts/check_truth_spine_freeze.py`: PASS
- `python3 scripts/check_duplicate_layer_cleanup.py`: PASS
- `python3 scripts/check_runtime_log_hygiene.py --strict`: PASS
- `bash scripts/run_daily_governance_audit.sh`: PASS
- `bash scripts/run_paid_launch_checks.sh`: PASS
- `npm run build`: PASS with existing Vite large-chunk warning.

## Browser Smoke Results

Browser smoke verified:

- `admin.html#/ops/direct-connect` loads.
- Direct Connect Proof Center is visible.
- Admin sidebar Direct Connect link is visible.
- Corrected direct-source proof copy is visible.
- Proof records, readiness, safety, and source category panels render.
- Approved/deferred count renders as 10 approved / 8 deferred.
- Live connection, credential, external API, public approval, and SHF Impact mutation flags render false.
- Public home route `/` loads and does not expose the Proof Center.
- Browser console had no error logs during the Direct Connect route smoke.

## Remaining Risks

- Batch 2 state is local/browser storage only.
- No durable proof ledger exists yet.
- No actual file upload exists in Batch 2.
- Public approval and Truth Spine package attachment remain future gated work.

## Batch 2 Complete

Yes. SHS Direct Connect Batch 2 is complete as local/admin direct-source proof modeling with no live integrations.
