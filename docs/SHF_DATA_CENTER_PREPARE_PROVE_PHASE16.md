# SHF Prepare / Prove Phase 16 Boundary

This document records the minimum institutional boundary used by the first safe Grade 11 proof scenario. It does not activate Grade 11 curriculum lessons, issue credentials, create readiness, or expose student records to employers.

## Domain ownership

| Domain | Owner | Institutional fact |
| --- | --- | --- |
| Curriculum | Curriculum | lesson identity, requirements, and lesson completion |
| Assessment / Project / Arcade / Reflection | source domain | execution and result/submission facts when those domains are used |
| Prepare / Prove activity | `prepare_prove_activity_results` | synthetic activity result |
| Evidence | `prepare_prove_evidence` | traceable evidence candidate derived from a source result |
| Competency definition | `competency_definitions` | versioned capability criteria, not learner state |
| Review / competency | `learner_competency_decisions` | authorized, auditable learner decision |
| Truth / reporting | existing integration outbox and governed ingestion | downstream projections only |
| Credential / readiness / portfolio / employer | existing or future owning domains | deferred; none is authored here |

## Canonical lineage

`activity result -> evidence -> authorized review -> learner competency decision -> competency.reviewed outbox event -> governed reporting ingestion`

Lesson completion is learning history only. It cannot create evidence or a competency decision. Activity success and evidence creation are also insufficient without review.

## Proof scenario

`SIMULATED_INFRASTRUCTURE_MONITORING` / `grade11-technical-operations-monitoring-proof` uses synthetic temperature, utilization, service, network, and alert observations. The learner records observations, an affected-system hypothesis, uncertainty, a safe next step, and escalation/documentation. It is a simulation-only future Grade 11 technical-operations proof candidate and does not activate a Grade 11 lesson.

## Review, privacy, and history

The review route requires the existing explicit `verification.review` and `verification.approve` permissions. Organization membership alone is insufficient, and the reviewer must differ from the learner. Every record carries learner, organization, tenant, source, provenance, reviewer, and criteria-version context. Unique keys make repeated submission/review idempotent; a later evidence record can create a new decision without erasing prior history.

Evidence and competency records are organization/tenant scoped. No employer or partner read/share route is added. Portfolio, Career, credential, and readiness domains remain consumers or future authorities, never authors of this fact.

## Status

The competency definition and generic persistence/API proof foundation are implemented. No competency is issued by lesson completion, browser state, activity result alone, evidence alone, credential issuance, readiness scoring, employer access, or Grade 11 lesson activation.
