# Government Program Assurance v1 Freeze

**Freeze date:** 2026-09-06
**Repository:** `/Users/mikeslate/Projects/shrv1`
**Branch:** `studio-v1-plus-development`
**Accepted HEAD:** `f02eff81c193f63fcb2878fc949689f8a5b75627`
**Accepted migration baseline:** `105`

## Purpose

This document records the exact Government Program Assurance v1 software boundary that completed internal Phase 8C acceptance. It is an internal checkpoint for the County Pilot Acceptance Gate. It does not represent county participation, production authorization, county UAT, or external county acceptance.

## Accepted Phases

Phases 1, 2, 3, 4, 5, 6, 7, 8A, 8B, and 8C are accepted at this checkpoint.

Accepted final verdict:

`GOVERNMENT PROGRAM ASSURANCE PHASE 8C FINAL ACCEPTANCE COMPLETE — READY FOR COUNTY PILOT ACCEPTANCE GATE`

Readiness:

- Software state: `READY_FOR_COUNTY_ACCEPTANCE`
- Score: `94/100`
- `P0_INTERNAL = []`
- County acceptance remains an external gate.

## Repository Baseline

The accepted pre-freeze worktree baseline was:

- Dirty-file count: `85`
- Status hash: `933776d4e46d5afcc2c82c5c323ada36530454feb12c2009686f0c1e39a1302f`
- Owner changes were preserved.

The status hash above intentionally describes the accepted repository before these freeze artifacts were added. Future verification must record the complete post-freeze status separately.

## Canonical Authority Freeze

GPA v1 consumes and extends the following canonical authorities without duplicating them:

Organization, Tenant, Program, Provider/Organization, Funding, Source System, Source Authority, Data Use Policy, Evidence, Claim, Verification, Verification Method, Metric, Truth, Reconciliation, Entity Resolution, Data Quality, Monitoring, Finding, Corrective Action, Audit, Decision, Reporting, Public Disclosure, and AI Governance.

GPA UI pages, dashboards, assistant responses, lineage views, reports, and exports are projections or controlled workflow clients. They do not own canonical Truth.

Claim remains separate from Verification and Truth. Reconciliation remains separate from Truth promotion. Reporting and AI remain consumers/advisors, not institutional authorities.

## Governed AI Freeze

The GPA assistant is advisory only. Accepted capabilities include explaining Program, Provider, Funding, Metric/Truth lineage, Claim readiness, Reconciliation, Monitoring, Findings, Corrective Actions, Audits, and institutional Decisions.

AI may not:

- create Truth or raise Verification levels;
- verify its own Claim;
- resolve Reconciliation or merge entities;
- issue or resolve Findings;
- approve Corrective Actions;
- determine Fraud or create Recovery orders;
- impose sanctions;
- create final institutional Decisions;
- publish restricted information.

These are v1 non-negotiable constraints. Future connectors or context adapters must not weaken them without explicit architectural review.

## AI Security Freeze

The accepted AI boundary includes organization and tenant scope, principal identity, delegation, purpose, Data Use Policy, classification, resource authorization, input-security/prompt-injection scanning, bounded context retrieval, provenance, human approval for high-impact decisions, and security/event logging.

County connectors and production integrations inherit these controls. Technical tool capability does not grant agent authority.

## Report-Artifact Freeze

Canonical Reporting remains the existing `ReportArtifactService` and `report_artifacts` authority. Accepted report types are:

- Executive Assurance Report
- Program Assurance Report
- Provider Assurance Report
- Funding Lineage Report
- Audit Packet

Official values must be sourced server-side from canonical GPA authorities. Browser state and AI-generated numbers are never official inputs. Reports preserve organization, tenant, scope, classification, verification state, canonical references, generated metadata, and AI involvement metadata when applicable.

Truth acceptance does not imply public approval. Public Disclosure remains a separate authority.

## Controlled Pilot Fixture Freeze

The fixture created by `scripts/run-phase8-acceptance-env.mjs` is disposable, deterministic, test-only, and never production authority. It creates isolated PostgreSQL, test identities, tenant/org scope, canonical GPA records, and stable references including:

- Pilot Configuration: `phase8_pilot_gpa`
- Program: `phase8_program_a`
- Providers: `phase8_provider_a`, `phase8_provider_b`
- Funding: `phase8_award_a`, `phase8_obligation_a`, `phase8_obligation_b`
- Sources: `phase8_source_finance`, `phase8_source_outcomes`
- Source Authorities: `phase8_authority_finance`, `phase8_authority_outcomes`
- Data Use Policy: `phase8_policy_gpa`
- Claim: `phase8_claim_placements`
- Verification: `phase8_verification_placements`
- Verification Method: `phase8_method_authoritative`
- Metric/Result: `phase8_metric_verified_placements`, `phase8_metric_result_placements`
- Truth Fact: `phase8_truth_placements`
- Monitoring: `phase8_monitoring_plan_a`, `phase8_monitoring_activity_a`, `phase8_evidence_request_a`
- Oversight: `phase8_finding_a`, `phase8_provider_response_a`, `phase8_corrective_action_a`
- Reconciliation: `phase8_reconciliation_case_a`
- Entity Resolution: `phase8_entity_resolution_a`
- Data Quality: `phase8_quality_rule_freshness`, `phase8_quality_eval_case_a`
- Duplicate candidate: `phase8_duplicate_candidate_a`
- Schema drift: `phase8_schema_observation_a`
- Rejected record: `phase8_rejected_record_a`
- Audit: `phase8_audit_a`, `phase8_workpaper_a`, `phase8_sample_a`, `phase8_sample_result_a`
- AI delegation: `phase8_gpa_ai_delegation`

The fixture also contains controlled prompt-injection, public-disclosure, reporting, and authorization scenarios. Fixture records are not production Truth.

## Acceptance Harness Freeze

The canonical harness is `scripts/run-phase8-acceptance-env.mjs`. It creates a temporary PostgreSQL cluster/database, replays migrations, runs fixture SQL, starts the API on a temporary port, starts the root frontend on a temporary port, supplies test authentication and organization context, exposes a fixture manifest, runs Playwright, and cleans up the database and processes.

The accepted verification paths are:

- Phase 8 browser suites under `tests/phase8/`;
- GPA API suites under `apps/shs-api/tests/government-program-assurance-*.test.ts`;
- AI governance tests under `apps/shs-api/tests/ai-governance-authority.test.ts`;
- Reporting/Public Disclosure tests under `apps/shs-api/tests/report-*.test.ts`;
- migration replay and fixture validation through the harness;
- API typecheck/build, UI contract validation, manifest validation, and root build.

## Frozen Core

The following are frozen for v1:

- canonical authority boundaries;
- Claim, Evidence, Verification, Metric, and Truth semantics;
- Truth promotion gates;
- Source Authority and Data Use controls;
- Reconciliation, Entity Resolution, and Data Quality authorities;
- Monitoring, Finding, Corrective Action, Audit, and Decision authorities;
- Public Disclosure separation;
- AI action guards and security boundary;
- Reporting/artifact authority;
- migration 105 schema baseline;
- organization/tenant/classification isolation;
- deterministic disposable fixture and acceptance harness principles.

## County-Pilot Extensible Areas

The following may be configured for a county without changing the frozen core:

- county Programs and Providers;
- Source Systems and connector adapters;
- secure credential references;
- Data Use agreements and policy configuration;
- county users, roles, and organization membership;
- report branding/templates;
- workflow thresholds and mappings;
- pilot dates and approved purposes.

## Deferred Areas

Deferred work includes autonomous institutional decisions or sanctions, national-scale optimization, multi-jurisdiction benchmarking, advanced graph visualization, broad connector expansion, and advanced report customization.

## Change-Control Rule

Any future change touching frozen core must record the affected boundary, reason, compatibility impact, migration impact, security impact, test impact, rollback strategy, and whether GPA v1 remains backward compatible. County configuration within extensible areas does not automatically constitute an architecture change.

## Accepted Test Baseline

- Full Phase 8 browser matrix: `14 passed, 0 failed, 0 skipped`.
- Phase 8B browser suite: `3 passed`.
- Focused GPA/API/AI governance/reporting/Public Disclosure suite: `92 passed, 0 failed`.
- API typecheck/build: passed.
- Manifest/UI validation: passed.
- Root production build: passed.
- Migration replay through 105: clean.
- `git diff --check`: passed.

## External Acceptance Boundary

The County Pilot Acceptance Gate remains responsible for county participation, actual users, source credentials/connectivity, Data Use/legal approvals, security review, UAT, and county sign-off. This freeze establishes the software baseline for that gate and does not claim external acceptance.
