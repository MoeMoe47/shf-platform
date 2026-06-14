# SHS Truth Spine V1

Truth Spine V1 is the SHS verification layer for claims, sources, public approval, and report readiness.

## Role

Truth Spine verifies what is true.

Oracle decides what evidence supports. Watchtower observes coverage and risk. LOO ranks outcomes. Reports communicate only verified and readiness-approved information.

## Backend Endpoints

- `GET /truth/health`
- `GET /truth/coverage`
- `GET /truth/drift`
- `GET /truth/federation`
- `POST /truth/federation/systems`
- `GET /truth/federation/systems/{system_id}`
- `GET /truth/claims`
- `POST /truth/claims`
- `GET /truth/claims/{claim_id}`
- `GET /truth/packages`
- `GET /truth/package/{claim_id}`
- `GET /truth/sources`
- `POST /truth/sources`
- `GET /truth/envelope/{claim_id}`
- `GET /truth/readiness/{claim_id}`
- `GET /truth/replay/{claim_id}`
- `PATCH /truth/public-approval/{claim_id}`
- `GET /truth/audit-feed`

## Persistence

V1 uses local JSON files before any database migration:

- `services/shf-agent-fabric/db/truth/claims.json`
- `services/shf-agent-fabric/db/truth/sources.json`
- `services/shf-agent-fabric/db/truth/federation_registry.json`
- `services/shf-agent-fabric/logs/truth.audit.log`

## Claim Model

Required claim fields:

- `claim_id`
- `app_id`
- `project_id`
- `client_id`
- `program_id`
- `claim_type`
- `claim_text`
- `metric_name`
- `metric_value`
- `source_ids`
- `verification_status`
- `trust_level`
- `trace_coverage`
- `public_approved`
- `report_ready`
- `created_at`
- `updated_at`

## Source Model

Required source fields:

- `source_id`
- `source_type`
- `title`
- `uri`
- `evidence_type`
- `verification_status`
- `created_at`
- `updated_at`

## V1 Verification Rules

- No `source_ids` means `verification_status` is `missing_source`.
- Existing but unverified sources keep the claim in `draft`.
- Verified sources plus `trace_coverage >= 80` produce `verification_status: verified`.
- `public_approved` can only be true when `verification_status` is `verified`.
- `report_ready` is true only when `verification_status` is `verified` and `trace_coverage >= 80`.
- `trust_level` values are `draft`, `sample`, `verified`, and `public_approved`.

## Admin UI

The admin page lives at:

`/admin.html#/truth-spine`

It shows:

- Claims table
- Sources table
- Truth coverage
- Drift findings
- Severity counts
- Trust envelope panel
- Readiness status
- Public approval toggle
- Warnings for missing source, low trace coverage, and unverified claims
- Truth Package hash and display scope
- Replay timeline
- Federation registry summary

## Truth Packages

Truth Packages are deterministic claim envelopes for downstream systems.

Each package includes the claim, linked sources, verification status, trust level, trace coverage, public approval, report readiness, display scope, issuer, package version, and warnings.

The V1 signature is hash-signed:

- `package_version`: `truth_package_v1`
- `issued_by`: `shs-truth-spine-v1`
- `signature_status`: `hash_signed_v1`
- `package_hash`: deterministic SHA256 of the canonical package payload

Packages are internal unless the claim is public-approved. A verified or report-ready claim without public approval remains `display_scope: internal`.

## Replay Engine

`GET /truth/replay/{claim_id}` returns a deterministic replay view from claim/source timestamps and current Truth Spine state.

The response includes:

- `timeline`
- `current_state`
- `source_events`
- `approval_events`
- `verification_events`
- `warnings`

V1 replay is local and deterministic. It does not infer facts beyond stored claim/source state and audit-safe gate outcomes.

## Federation Registry

The federation registry records systems allowed to send or own claims and sources.

Default systems are seeded locally:

- `shs`
- `shf`
- `kermit`
- `abram`
- `career`
- `clientops`

Trust modes are:

- `local`
- `trusted_partner`
- `review_required`
- `blocked`

New systems default to `review_required`. V1 does not perform remote federation sync.

## Integrations

Reports include a `truth` status block in `/reports/snapshot`.

Watchtower includes a `truth_coverage` block in `/watchtower/summary` so missing or weak coverage can be flagged.

LOO score output includes a `trust` metadata block when truth metadata is supplied in the payload.

ClientOps and Hub surfaces must not describe data as report-ready unless Truth Spine readiness allows it.

Oracle may consume Truth Packages and replay output in future evidence-support decisions, but Oracle does not replace Truth Spine as the verification ledger.
