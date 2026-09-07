# County Pilot Pre-Acceptance Packet

## Scope

This packet records internal pre-acceptance readiness for a bounded county pilot. It does not represent external county acceptance, production provider acceptance, or a public certification.

## Architecture

The pilot consumes the existing canonical Organization/Tenant, Program, Funding, Source Authority, Data Use, Evidence, Claim, Verification, Metric, Truth, Reconciliation, Data Quality, Monitoring, Finding, Audit, Investigation, Recovery, Decision, Reporting, Public Disclosure, and AI Governance authorities.

Dashboards and exports are projections. They cannot create Truth, resolve conflicts, issue Findings, approve Corrective Actions, or execute financial actions.

## Pilot Configuration

Migration 105 adds the bounded, organization/tenant-scoped `gpa_pilot_configurations` authority. It stores pilot references and lifecycle state without replacing Organization, Tenant, Program, Provider, Funding, Source, or Public Disclosure ownership. Activation requires an explicit approved transition. A controlled test configuration is provisionable through the pilot configuration API; real county configuration remains an external acceptance condition.

## Roles

Internal roles use existing organization-scoped permissions for executive viewing, program administration, monitoring, financial review, audit, investigation, assurance administration, and decision determination. Provider users receive only provider-scoped permitted views. Public consumers receive public-approved facts only.

## Assurance Workflow

Source data is admitted through source authority and data-use controls, then proceeds through Claim, Evidence, Verification, Metric, Truth, funding/provider/program lineage, reconciliation, data quality, monitoring, findings, corrective actions, audit, and decision provenance.

## Reporting and Transparency

The internal Government Assurance operating view exposes canonical counts, funding summaries, action-required states, readiness conditions, monitoring queues, pilot configuration state, governed assistant responses, controlled report artifacts, and public-approved Truth facts. Public output is filtered by `public_approval_status='APPROVED'` and does not expose internal reconciliation, investigation, evidence, or credentials. Reports preserve scope, classification, generated metadata, verification state, and canonical references.

## Governed AI

The existing Conductor and Agent Governance architecture remains the AI boundary. The bounded GPA assistant requires scoped delegation, purpose, organization/tenant context, AI governance evaluation, and input-security scanning. It returns canonical facts separately from advisory analysis and recommendations, with inspectable references. AI cannot determine Truth, raise Verification, issue Findings, resolve Reconciliation, determine Fraud, create Recovery, publish restricted data, or make institutional Decisions.

## Verification Evidence

- Full GPA/API, AI governance, reporting, and public-disclosure regression set: 92 passed, 0 failed.
- Full Phase 8 browser matrix: 14 passed, 0 failed, 0 skipped, using disposable PostgreSQL, API, frontend, test authentication, and controlled fixture data.
- Phase 8B browser suite: 3 passed, including grounded assistant references, prompt-injection blocking, report generation, artifact metadata, bounded JSON download, and cross-tenant scoping.
- API typecheck/build: passed.
- Manifest validation and UI contract validation: passed.
- Root production build: passed; existing dynamic-import and large-chunk warnings remain non-blocking.
- `git diff --check`: passed.
- Fresh disposable PostgreSQL replay through migration 105: migrations 001-105 applied, `pending: []`, `drift: []`, `unknownApplied: []`; fixture validation passed.
- Controlled fixture validation: passed, including pilot configuration, canonical Truth, public-safe records, AI entitlement, and Phase 8 workflow records.
- AI Governance and reporting/public-disclosure regression tests: 44 passed, 0 failed.
- Accessibility foundation: semantic headings, labels, status regions, keyboard-focusable controls, table headers, and readable status text verified in GPA surfaces. No dedicated axe scanner is configured in this repository; Phase 8C acceptance used browser coverage plus source-level semantic inspection.
- Responsive CSS and bounded list/detail behavior were inspected for pilot-sized use. National-scale optimization remains deferred.

## Known Limitations

- External county/state connectors are not part of this phase.
- Real county data, policies, users, and source credentials require deliberate operational provisioning.
- The operating view is a bounded pilot console, not a national-scale analytics platform.
- AI narrative generation remains advisory and bounded by existing Conductor/session/security controls.
- Accessibility automation beyond the repository's available browser/UI checks should be repeated during county-specific UAT.

## Readiness Classification

The readiness resolver returns `READY_WITH_CONDITIONS` or `READY_FOR_COUNTY_ACCEPTANCE` from deterministic persisted configuration and canonical authority checks. The controlled fixture resolves to `READY_FOR_COUNTY_ACCEPTANCE`; this means the software boundary is prepared for external acceptance and does not mean a county has accepted the system. It does not use AI. The internal Phase 8C review has no P0 software blocker.

Internal readiness score: `94/100`, based on executable API, browser, migration, build, authorization, AI-governance, reporting, public-disclosure, and fixture evidence. The remaining six points reflect county-specific provisioning and UAT conditions rather than unfinished internal authority work.

Blocker classification:

- `P0_INTERNAL`: none.
- `P1_COUNTY_ACCEPTANCE_CONDITION`: county participation, actual users, source credentials/connectivity, Data Use/legal approvals, county security review, county UAT, and county sign-off.
- `P2_POST_PILOT`: richer lineage visualization, broader accessibility automation, advanced analytics, and additional export formats.
- `P3_MATURITY`: national-scale performance, multi-jurisdiction benchmarking, and production connector breadth.

## Acceptance Checklist

- [x] Pilot organization and tenant configured in the controlled fixture
- [x] Agency, programs, providers, and users configured in the controlled fixture
- [x] Source systems and Source Authorities active in the controlled fixture
- [x] Data Use Policies active in the controlled fixture
- [x] Metric and Verification Method versions active
- [x] Pilot Claims, Evidence, and Truth lineage accepted in the controlled fixture
- [x] Monitoring and audit authorities operational
- [x] Public facts explicitly approved and filtered
- [x] AI sessions/delegations, input security, and tool restrictions verified
- [x] P0 internal blocker list is empty
- [ ] P1 county acceptance conditions scheduled and authorized by the participating county

## Status

This is an internal pre-acceptance artifact. Phase 8C software acceptance is complete for the controlled pilot configuration and the product is ready for the County Pilot Acceptance Gate. Real county configuration, credentials, legal/data-use approvals, security review, UAT, and county sign-off remain external acceptance conditions. This packet does not claim external county acceptance.

## Recommended V1 Freeze

Freeze the Phase 8A/8B product authorities, routes, governed assistant boundary, report artifact boundary, migration baseline 105, and acceptance harness as the controlled v1 checkpoint. Defer new connectors, national-scale optimization, advanced lineage visualization, expanded accessibility automation, and autonomous actions to later work.

## Accepted GPA v1 Freeze

- Freeze date: `2026-09-06`
- Migration baseline: `105`
- Freeze document: `docs/government-program-assurance/GPA_V1_FREEZE_2026-09-06.md`
- Freeze manifest: `docs/government-program-assurance/GPA_V1_FREEZE_MANIFEST.json`
- Accepted readiness score: `94/100`
- `P0_INTERNAL = []`

The freeze preserves the accepted canonical authority, governed AI, report-artifact, public-disclosure, security, fixture, and acceptance-harness boundaries. External county acceptance conditions remain outstanding. Future pilot changes must be evaluated against the frozen baseline using `docs/government-program-assurance/COUNTY_PILOT_CHANGE_DELTA_TEMPLATE.md`.
