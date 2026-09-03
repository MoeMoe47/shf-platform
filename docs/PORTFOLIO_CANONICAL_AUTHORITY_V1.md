# Portfolio Canonical Authority V1

## 1. Purpose

This document defines the contract for a future durable Portfolio domain. It is Phase 1 contract work only. It does not create persistence, routes, UI, public sharing, deployment, credentials, Registry integration, or completion behavior.

## 2. Domain Ownership

Portfolio owns learner-centered presentation state: a learner Portfolio and its Portfolio Artifacts. It does not own institutional verification, curriculum completion, credentials, Website hosting, Agent Registry acceptance, or ClientOps.

## 3. Terminology

- **Evidence:** canonical institutional proof owned by the existing Evidence authority.
- **Portfolio Artifact:** durable learner-owned presentation object that references eligible canonical proof/work.
- **Portfolio:** the learner's organized collection of artifacts.
- **Public Showcase:** a later externally visible projection governed by separate visibility, consent, moderation, and age policy.
- **Credential:** separate institutional recognition owned by the credential authority.

## 4. Evidence Boundary

Portfolio may consume an Evidence authority decision that a source is Portfolio-eligible. Portfolio cannot create, verify, revise, supersede, or delete Evidence. Studio Delivery status alone is insufficient. The first supported source contract is `STUDIO_EVIDENCE`; future source types require separate approval.

## 5. Portfolio Artifact Definition

An Artifact is a learner-owned presentation record with an immutable source/provenance section and bounded editable presentation section. Its source identity is the Evidence identity, with Studio Project, Delivery, exact Workspace revision, project type, learner, organization, tenant, finalization time, and assignment/release references where available.

## 6. Portfolio Definition

The minimal durable model is a `Portfolio` record and `PortfolioArtifact` records. Collections, ordering, and presentation metadata are fields until demonstrated complexity requires separate entities. No separate `PortfolioArtifactEvidenceLink` table is required by this contract; the initial Artifact stores the canonical Evidence reference plus source provenance.

## 7. Learner Ownership

The server derives learner ownership from the authenticated actor and canonical Evidence entitlement. A browser cannot assign an artifact to another learner or supply a foreign Evidence, Project, Delivery, organization, or tenant. Learners edit presentation fields. Teachers/admins may read according to existing authorization; they do not silently rewrite personal presentation without an explicit future policy.

## 8. Organization/Tenant Scope

Portfolio, Artifact, Evidence, Studio Project, and Delivery must share learner, organization, and tenant scope. Current SHRV1 convention is `tenant:${organizationId}`. Cross-organization and cross-tenant reads/writes fail closed. Assignment-origin artifacts retain assignment and release references; independent student-idea artifacts retain null assignment lineage.

## 9. Source Eligibility

The server obtains an eligibility projection from the canonical Evidence authority. The contract requires `sourceType=STUDIO_EVIDENCE`, an active/non-superseded Evidence decision as defined by Evidence policy, matching learner/org/tenant scope, exact Studio Delivery and workspace revision provenance, and `portfolioEligible=true` from that authority. Portfolio does not infer eligibility from project type, finalization alone, browser state, or localStorage.

## 10. Immutable Provenance

Immutable fields include learner, organization, tenant, source type, Evidence ID, Studio Project ID, Delivery ID, exact Workspace revision, project type, finalized timestamp, assignment/release references, and canonical competency IDs. A later workspace revision or source supersession does not retarget an existing Artifact.

## 11. Editable Presentation

Editable fields are bounded display title, summary, reflection, thumbnail reference, collection key, visibility within supported policy, and ordering. Editing these fields cannot modify Evidence, QA, Review, Delivery, Completion, assignment lineage, learner ownership, source revision, or competency truth. URLs/media references require later safe validation; arbitrary HTML is not part of this contract.

## 12. Visibility/Privacy

The model reserves `PRIVATE`, `ORGANIZATION`, `UNLISTED`, and `PUBLIC`, but Phase 2 should initially implement only `PRIVATE` and `ORGANIZATION`. New artifacts default to `PRIVATE`. Evidence visibility and Portfolio visibility are separate. `UNLISTED` and `PUBLIC` require a later Public Showcase contract covering consent, minors, organization policy, discoverability, moderation, revocation, and source visibility.

## 13. Lifecycle

Portfolio status is minimal: `ACTIVE` and `ARCHIVED`. Artifact presentation status may be `ACTIVE`, `HIDDEN`, `ARCHIVED`, or `REMOVED`. These are presentation states, not Review, Evidence verification, Completion, Credential, Deployment, or Registry states.

## 14. Source Versioning/Staleness

An Artifact created from Studio revision N remains bound to N when the learner creates revision N+1. N+1 requires its own Evidence eligibility path and explicit new Artifact or future version action. Existing Artifact provenance is historical and must remain interpretable if the source is stale or superseded.

## 15. Evidence Invalidation Behavior

Evidence authority owns invalidation/supersession. Portfolio must not delete provenance. If Evidence becomes superseded, the Artifact may remain historical while its institutional indicator is re-read or its visibility is restricted by future policy. Current Evidence has supersession support; the exact Portfolio display reaction is a Phase 2 policy decision.

## 16. Studio Integration Boundary

Future flow: Studio Finalized -> canonical Evidence -> What You Proved -> learner explicitly requests Add to Portfolio. A future service endpoint may be shaped like `POST /portfolio/artifacts/from-evidence`, but Phase 1 does not create it. The server resolves the eligible Evidence and all Studio provenance; the browser supplies no authority IDs or verification flags.

## 17. Competencies/Skills Boundary

Portfolio may display competency IDs/names supplied by canonical Evidence/outcome facts. It must not infer skills from project type, page visits, creation events, or learner prose. Dynamic links are preferred when the read model is stable; an immutable reference snapshot may be retained for historical interpretability.

## 18. Credential Boundary

Portfolio may later show read-only earned credentials from the credential authority. It cannot determine eligibility, issue, revoke, or infer a credential from Artifact existence.

## 19. Completion Boundary

Portfolio actions never mark lesson, assignment, course, pathway, or project completion. Completion Policy remains the only evaluator of full requirements. Portfolio consumes established facts and cannot satisfy unrelated requirements.

## 20. Public Showcase Boundary

Public Showcase is not implemented. It is a separate visibility/publishing projection over eligible Portfolio content. Public sharing must address consent, minors, organization approval, moderation, age restrictions, privacy, takedown, and revocation without changing Evidence verification.

## 21. localStorage Legacy Boundary

`portfolio:items`, `civic:portfolio:artifacts`, lesson “Save to Portfolio” behavior, and existing Portfolio pages remain legacy/application-local surfaces. They may be kept for compatibility and later migrated, but localStorage is not canonical Portfolio truth and must not be used as Studio Evidence, Completion, or institutional Portfolio state.

## 22. Security Model

Phase 2 must test cross-org and cross-tenant read/write, cross-learner Evidence attachment, forged learner/org/tenant/Evidence/Project/Portfolio IDs, presentation authority injection, public visibility escalation, ineligible/revoked Evidence, duplicate requests, replay, oversized content, unsafe URLs/media metadata, and HTML/script injection. Server scope and source eligibility are authoritative.

## 23. Idempotency

The recommended identity is one active Artifact per `(portfolio, sourceType, evidenceId)`. Repeated Add to Portfolio requests return the existing Artifact or a deterministic conflict; they do not create duplicate institutional or presentation records unless a future explicit “duplicate presentation” feature is approved.

## 24. Removal/Archive Semantics

Remove from Portfolio, archive, hide, and delete presentation metadata are distinct operations. None deletes Studio Project, Workspace, Delivery, Evidence, assignment, release, or Completion. Hard deletion should be avoided until retention and audit policy is explicit; removal should preserve source provenance and history.

## 25. Operational Event Contract

Future events may include `portfolio.created`, `portfolio.artifact.created`, `portfolio.artifact.updated`, `portfolio.artifact.archived`, and `portfolio.artifact.visibility_changed`, using existing outbox conventions. They describe Portfolio operations only and must not masquerade as Evidence, Completion, Credential, Truth, Deployment, Registry, or ClientOps events.

## 26. Phase 2 Persistence Entry Contract

Phase 2 may add additive PostgreSQL persistence, a Portfolio service, authenticated scoped routes, Evidence-backed Artifact creation, bounded presentation editing, listing/detail reads, supported visibility enforcement, archive/remove behavior, deterministic idempotency, and operational events. It must preserve the contract above, test every authority boundary, and leave public Showcase, deployment, credentials, Registry, Completion writes, and localStorage migration out of scope.
