# SHS Private Beta Constraints V1

## Purpose

SHS Private Beta Constraints V1 defines exactly what SHS private beta allows, prohibits, requires, and exits on. It is an operator-control and governance document only. It does not create runtime features, approve public launch, approve paid production launch, mutate SHF public impact data, or change any route/service behavior.

## Go/No-Go Decision

Private beta: **GO for supervised, operator-managed private beta only.**

Paid launch: **NO-GO.**

Public launch: **NO-GO.**

Self-service onboarding: **NO-GO.**

Unsupervised client operation: **NO-GO.**

The allowed private beta posture is narrow: internal/demo/private beta clients may be moved through the SHS lifecycle only with a named operator managing onboarding, handoffs, build-packet approval, QA signoff, launch signoff, ClientOps activation, and reporting boundaries.

## Allowed Use Cases

The following uses are allowed in private beta:

- Internal/demo/private beta clients.
- Operator-managed onboarding.
- Manual lead qualification and package recommendation.
- Manual sales-to-production handoffs.
- Manual production project setup.
- Manual build packet approval.
- Manual QA signoff.
- Manual launch signoff.
- Manual ClientOps activation.
- Local/demo-grade persistence with a clear warning that records are not production durable.
- Supervised reporting only.
- Private client-facing reports that are not public SHF impact reports.
- Internal ClientOps maintenance rehearsal.
- Internal upgrade opportunity tracking.
- Public browsing only on routes already classified public, including `/`, `/foundation`, `/foundation/impact-report`, `/solutions`, `/studio/templates`, and `/studio/templates/browse`.

## Prohibited Use Cases

The following uses are not allowed in private beta:

- Public launch.
- Paid production launch without written owner approval.
- Self-service onboarding.
- Public SHF impact publication.
- Public-approved SHF data mutation.
- Unsupervised client operation.
- Production persistence assumptions.
- Public reporting from private SHS data.
- Marking private beta claims as public-approved.
- Treating local/demo records as verified public evidence.
- Publishing ClientOps, Production Ops, Sales Ops, QA, launch, or support data to public SHF surfaces.
- Mutating the SHF Impact Data Spine from SHS private beta activity.
- Allowing Reports, AI, Watchtower, LOO, ClientOps, or operator notes to bypass Truth Spine and public approval for public claims.
- Representing beta auth, persistence, reporting, launch, or ClientOps workflows as paid-production ready.

## Entry Criteria

Private beta may begin only when:

- A client is explicitly labeled internal, demo, or private beta.
- The client is not public-approved for SHF impact publication.
- A named SHS operator owns the beta workflow.
- The operator has access to the current Operator Runbook.
- Route smoke evidence exists for required SHS and SHF-Next routes.
- Private/public route classifications are understood.
- Manual handoff, build packet approval, QA signoff, launch signoff, and ClientOps activation are accepted as beta constraints.
- Local/demo persistence limitations are disclosed.
- Reporting is supervised and kept private unless public approval is separately granted.
- The operator confirms no private SHS data will be used as public SHF impact data.

## Exit Criteria

Private beta exits only when:

- At least one internal/demo/private beta client has moved from lead intake through ClientOps and upgrade opportunity tracking.
- Every manual workaround used during beta is documented.
- Route smoke, leakage, build packet, QA, launch, and ClientOps evidence is captured.
- All blockers required before paid launch are logged.
- Report delivery rules are tested without public SHF impact publication.
- The owner makes a written continue/harden/pause decision.
- Paid launch remains blocked unless the owner separately approves it in writing after hardening.

## Operator Rules

Operators must:

- Label every beta record as internal, demo, or private beta.
- Keep private client operations inside private SHS operational surfaces.
- Use manual approval before each handoff.
- Use manual build packet approval before development-ready status.
- Use manual QA signoff before delivery-ready status.
- Use manual launch signoff before ClientOps activation.
- Use manual ClientOps activation after launch approval.
- Record handoff notes, QA notes, launch notes, support tier, owner, and exceptions.
- Treat localStorage, draft records, exports, and manual notes as beta-only unless later hardened.
- Keep public approval false unless Truth Spine/public approval governance explicitly approves otherwise.
- Escalate any route fallback, broken navigation, leakage concern, report-readiness uncertainty, or public/private boundary question.

## Beta Client Disclaimer

Every private beta client must be told, in plain terms:

- SHS private beta is operator-managed.
- Some records may use local/demo-grade persistence.
- Manual review is required before handoff, delivery, launch, ClientOps activation, and reporting.
- Private beta outputs are not public SHF impact publications.
- Private beta does not imply paid-production readiness.
- Public reporting and public SHF impact use require separate approval.

## Known Limitations

- The SHS lifecycle is workable for supervised beta but still operator-driven.
- Production auth/session enforcement is not assumed complete.
- Durable production persistence is not assumed complete.
- Build packet export/signoff remains manual.
- QA signoff remains manual.
- Launch signoff remains manual.
- ClientOps activation remains manual and local/internal.
- Report approval, PDF evidence, and delivery ledger remain manual.
- Website Studio generation-to-delivery remains incomplete for paid launch.
- Public/private leakage checks must be repeated before wider beta or paid use.

## Required Safety Checks

Before beta use, operators must verify:

- Route smoke evidence exists.
- Public/private leakage audit exists or is explicitly scheduled before external sharing.
- Build packet approval evidence exists before development-ready work.
- QA signoff evidence exists before delivery-ready work.
- Launch signoff evidence exists before ClientOps activation.
- ClientOps activation evidence exists before ongoing support is claimed.
- Report outputs remain private unless Truth Spine/public approval allows publication.
- SHF Impact Data Spine is not mutated from private SHS data.
- `npm run check:governance` passes before a beta release checkpoint.

## Risk Controls

- Use demo/internal clients unless the owner explicitly approves a real private-beta client.
- Keep private SHS records out of public SHF routes.
- Keep public approval false by default.
- Keep reports supervised and private.
- Keep local/demo persistence warnings visible to operators.
- Require operator review before each handoff, launch, ClientOps, and report step.
- Capture blockers and exceptions in the beta record.
- Stop the beta flow if public/private boundary risk is unclear.

## Success Criteria

Private beta is successful if:

- An operator can complete the full SHS client journey manually.
- The client journey reaches ClientOps without route failure.
- No private client data appears on public SHF surfaces.
- No beta claim is represented as public-approved.
- Manual handoffs, build packet approval, QA signoff, launch signoff, and ClientOps activation are documented.
- Supervised reporting works without public SHF impact publication.
- Paid-launch blockers are clear and actionable.

## Validation Results

| Command | Result |
| --- | --- |
| `python3 -m json.tool docs/private-beta/SHS_PRIVATE_BETA_CONSTRAINTS_V1.json` | PASS |
| `npm run check:governance` | PASS |

## Final Decision

SHS private beta is allowed only as a supervised, operator-managed workflow for internal/demo/private beta clients. Paid production launch, public launch, self-service onboarding, public reporting from private SHS data, public SHF impact publication, public-approved data mutation, and unsupervised operation are prohibited.
