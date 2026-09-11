# CivicSure Wave 2 Provider / Program Assurance

Wave 2 adds recurring, multi-provider and multi-program assurance coordination
over the existing GPA authorities. `gpa_assurance_cycles` defines a reporting
period and `gpa_assurance_cycle_scope` records provider/service enrollment for
that period. Neither table is a provider or program master.

Provider and program assurance profiles are derived projections over claims,
verification, metric results, monitoring, findings, corrective actions,
reconciliation, decisions, and public-disclosure records. Closed-cycle profile
snapshots are append-only historical projections; they do not replace Truth,
metric definitions, evidence, reporting, or decision records.

Status is rule-based and explainable: open corrective action takes precedence,
then open findings, failed verification or unresolved reconciliation, otherwise
`IN_GOOD_STANDING`. The profile returns the reasons and underlying counts.

Provider comparison is allowed only for the same canonical metric and version
and compatible reporting period. Otherwise the API returns `NOT COMPARABLE`.
Program comparison reuses the same boundary and adds an explicit service and
population semantics review reason when the available result records cannot
prove compatibility.
Warnings remain monitoring signals and findings remain evidence-backed GPA
issues. Corrective actions and consequential status changes require existing
human decision authority. Agent Fabric remains advisory-only.

Protected APIs provide cycle creation, scope enrollment, closure, provider and
program profiles/history, provider comparison, and a review queue. Public data
continues through Reporting/Public Disclosure only; cycle snapshots are not a
public API.

Wave 2 acceptance data must use isolated test identifiers, retain claim-level
lineage, preserve failed verification and unresolved reconciliation negative
paths, and prove that closing one cycle followed by opening another does not
rewrite historical snapshots.

Source-health impact is derived through the bounded
`gpa_source_assurance_dependencies` projection. The source-health record remains
owned by the registered source system boundary; the dependency links a source
to an existing provider, program, or service within tenant and organization
scope and retains provenance. It does not create Truth or replace source
authority.

Provider, program, and cycle assurance packets are read-only derived projections
over canonical GPA, Truth, metric, monitoring, audit, and publication records.
They are explicitly non-authoritative and are filtered by the requesting
tenant/organization scope. Closed-cycle history is verified with deterministic
stable-field digests; later cycles may add new snapshots but cannot rewrite the
closed cycle's authoritative references.

The Wave 2 isolation fixture uses the existing Organization Onboarding
submission, independent review, approval, and activation lifecycle. No direct
organization insertion or alternate tenant authority is used.

Accepted GPA determinations retain the canonical Truth Spine row identity in
the existing determination provenance after signed Agent Fabric ingestion.
This is a reference only: `truth_spine_records` remains the sole authoritative
Truth persistence. The Wave 2K closure harness resolves this reference forward
and backward and compares every applicable Q1 metric, finding, corrective
action, and decision row before and after safe later-cycle reads.
