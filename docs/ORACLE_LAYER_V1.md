# SHS Oracle Layer V1

Oracle Layer V1 is the SHS decision-support layer that decides what verified Truth Spine evidence supports.

## Role

Truth Spine verifies what is true. Oracle decides what verified evidence supports.

Oracle consumes Truth Spine packages, trust metadata, warnings, and report readiness state. It does not verify claims, approve public release, sign packages, or publish public claims.

## Difference From Truth Spine

Truth Spine owns:

- Claims
- Sources
- Verification status
- Trace coverage
- Public approval
- Report readiness
- Truth Packages

Oracle owns:

- Evidence-support cases
- Rulings over Truth Packages
- Confidence scoring
- Reasoning summaries
- Evidence summaries

## Allowed Decisions

- `supportable`
- `unsupported`
- `disputed`
- `insufficient_evidence`

## Confidence Logic

V1 confidence is deterministic and based on:

- Average Truth Spine `trace_coverage`
- Whether included packages are public-approved
- Whether included packages are report-ready
- Warning count
- Missing package count

No-claim cases return `insufficient_evidence` with low confidence.

## Backend Endpoints

- `GET /oracle/health`
- `GET /oracle/cases`
- `POST /oracle/cases`
- `GET /oracle/cases/{case_id}`
- `POST /oracle/cases/{case_id}/rule`
- `GET /oracle/rulings`
- `GET /oracle/rulings/{ruling_id}`
- `GET /oracle/cases/{case_id}/ruling`

## Persistence

V1 uses local JSON files before any database migration:

- `services/shf-agent-fabric/db/oracle/cases.json`
- `services/shf-agent-fabric/db/oracle/rulings.json`
- `services/shf-agent-fabric/logs/oracle.audit.log`

## Admin UI

The admin page lives at:

`/admin.html#/oracle`

It shows:

- Oracle health
- Cases table
- Rulings table
- Create case form
- Rule action
- Ruling detail panel
- Warnings
- Truth Spine Required badge
- Truth Package hashes when present

## Guardrails

- Oracle may reason only over Truth Packages.
- Oracle cannot verify claims.
- Oracle cannot public-approve claims.
- Oracle cannot mark reports ready.
- Oracle rulings must show Truth Spine package hashes and warnings when available.
- Reports must not treat Oracle rulings as verified facts unless Truth Spine packages are verified and report-ready.

## What Oracle Must Not Own

Oracle must not own Truth Spine verification, public approval, report readiness, package signing, source creation, Watchtower risk monitoring, LOO outcome ranking, or Alignment action gates.

## Future Integrations

Future Game Theory and AI Layer work may consume Oracle rulings, but only after Truth Spine packages are present. AI outputs intended for publication must attach Truth Envelopes. Game Theory inputs used in reporting must trace back to Truth Spine packages and Oracle support decisions.
