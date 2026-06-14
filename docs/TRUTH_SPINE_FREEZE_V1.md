# SHS Truth Spine Freeze V1

Truth Spine V1 is frozen as the official SHS anti-drift authority for verified claims, public approval, report readiness, Truth Packages, replay, and local federation registry state.

## Freeze Rule

No SHS surface may present a claim as verified, public-approved, or report-ready unless Truth Spine says so.

No Reports, Watchtower, LOO, AI output, ClientOps workflow, admin page, or app-specific feature may create an independent verification gate when a Truth Spine claim or package exists.

## Required Boundaries

- Truth Spine verifies what is true.
- Reports must display Truth metadata and communicate only verified/readiness-approved information.
- Watchtower must monitor Truth coverage, missing sources, low trace coverage, and drift.
- LOO must expose trust metadata and must not convert unverified claims into verified outcomes.
- AI outputs must eventually attach a Truth Envelope before publication.
- Oracle may reason only over Truth Packages when publication, reporting, or approval is involved.
- New layers must be registered in `docs/MASTER_LAYER_REGISTRY.md` before implementation.
- New claims must have sources or be marked `missing_source` or `draft`.

## Publication Gate

Public-facing information must satisfy all applicable Truth Spine gates:

- `verification_status` is `verified`
- `trace_coverage` is at least `80`
- `report_ready` is true for reports
- `public_approved` is true for public release
- Truth Package `display_scope` is `public`

Verified but non-public claims remain internal.

## Architecture Gate

The Master Layer Registry is the official architecture registry. New architecture cannot bypass it, duplicate a registered layer, or create a parallel authority for truth, evidence support, risk monitoring, outcomes ranking, governance, reporting, or public approval.

Run the governance checks before new builds:

- `npm run check:governance`
- `python3 -m pytest services/shf-agent-fabric/tests/test_truth_routes.py`
- `npm run build`
