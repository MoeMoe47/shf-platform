# CivicSure Wave 3: Early Warning and Money-at-Risk

Wave 3 adds a bounded proactive-assurance projection over the existing GPA authorities. It observes canonical assurance inputs, evaluates versioned deterministic rules, emits explainable non-conclusive risk signals, and derives financially grounded Money-at-Risk exposures.

## Authority boundaries

Truth Spine, Evidence, Platform Metric Registry, Programs, Organizations, Findings, Corrective Actions, Decisions, Agent Fabric, and Reporting/Public Disclosure remain the canonical authorities. Risk rules, evaluations, signals, and Money-at-Risk rows are derived assurance records and do not replace those authorities.

## Contract

`Observe -> Detect -> Assess -> Quantify -> Review -> Find -> Correct -> Verify -> Decide -> Resolve/Escalate -> Prove`

Rules are append-only by `(rule_id, version)` and evaluations retain their rule version, inputs, result, explanation, and provenance. Signals are non-conclusive and carry severity, materiality, scope, affected references, and explanation. Money-at-Risk requires an identifiable financial basis, explicit calculation version, currency, and scope.

Exposure identity is deduplicated by `(organization, tenant, exposure_reference)`, so multiple signals do not multiply the same financial amount. `NONE` and `RESOLVED` exposures are excluded from active totals. No exposure state implies fraud, loss, overpayment, or recovery authority.

Provider and program risk responses are read-only, non-authoritative projections. Review ordering is deterministic by severity and age. Consequential finding, corrective-action, recovery, and publication decisions remain human-authorized. Agent Fabric may explain or recommend, but cannot approve those actions.

## Live acceptance

The Wave 3 PostgreSQL harness uses the existing Wave 2 disposable fixture. It creates a versioned evidence-completeness rule, triggers a scoped signal for Provider B / Workforce, derives one `$50,000 USD` potential exposure, verifies duplicate signal references and exposure replay do not double count, and confirms the signal appears in the deterministic risk review queue.

Restricted risk data remains behind protected GPA routes and is not added to the public disclosure DTO.
