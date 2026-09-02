# SHF Accessibility & Inclusive Experience Constitution v1

Status: Phase 0 (Reconciliation & Naming) — binding architectural constitution, no implementation.
Layer name: **SHF Accessibility & Inclusive Experience Layer ("AIEL")** — locked, collision-free
(verified: zero repository hits for `AIEL`, `Accessibility & Inclusive Experience`, `Inclusive
Experience`, or `Inclusive Layer` prior to this document).

This document supersedes no code. It binds future design decisions (Phase 1 onward) and formally
retires no existing mechanism yet — see the Reconciliation Register (§19 of the Phase 0 report)
for what changes, and when.

## 1. Mission

AIEL exists to make SHF's learner-facing experience perceivable, operable, understandable, and
appropriately adaptable for every learner — as one coordinated system instead of the three
uncoordinated fragments the Phase 0 audit found today (reduced motion, content simplification, and
skip-link handling each implemented 2-3 times independently, with no shared source of truth).

## 2. Scope

AIEL's scope is **presentation, interaction, and authorized adaptation** of experiences that
already exist. It spans every learner-facing SHF application reachable through the shared provider
tree (`src/entries/RootProviders.jsx`) — Career, Curriculum, Arcade, Store, and future learner
surfaces. It explicitly excludes the SHS Capital/Impact/Finance-side applications (Allocation,
Capital, Catalog, Foundation, Lord of Outcomes, Public, Universe, Verifier), which are not
learner-facing and do not currently share this provider tree.

## 3. Canonical Responsibility

AIEL MUST be the single source of truth for:
- A learner's personal accessibility preferences (§5, Concept Class 1).
- The shared runtime mechanism that applies those preferences across every learner-facing app.
- The coordination point through which Companion, Celebration, and content-rendering components
  read presentation preferences — never a per-app reimplementation.
- Discovery of accessibility *capabilities* already declared by content and applications (never
  the declaration itself — see §6/§7).

## 4. Five Concept Classes

1. **Personal Accessibility Preference** — learner-controlled, self-service, never implies
   diagnosis. Examples: reduced motion, larger text, higher contrast, caption/transcript
   preference, celebration intensity.
2. **Learning Support** — an assistive tool made available to the learner, activated by the
   learner or by product context; must never silently alter institutional mastery standards.
   Examples: read-aloud, reading-level content variant, step-by-step explanation.
3. **Authorized Accommodation** — an institutionally authorized adaptation, applied in a defined
   organizational/enrollment context, **never self-authorized by a student**. Examples: extended
   assessment time, interpreter, alternate testing conditions.
4. **Content Accessibility Capability** — a fact about content (this video has captions; this
   image has alt text). Owned by the content's own domain (Curriculum, etc.), never by AIEL.
5. **Application Accessibility Capability** — a fact about an application or activity (this Arcade
   activity supports keyboard-only play; this Live Learning session exposes captions). Owned by
   that application's own domain, never by AIEL.

## 5. Ownership Boundaries

| Concept Class | AIEL Role |
|---|---|
| Personal Accessibility Preference | **OWN** |
| Learning Support (delivery mechanism) | **COORDINATE** — content/technique stays with the owning domain (e.g. reading-level content variants stay Curriculum's) |
| Authorized Accommodation | **CONSUME + ENFORCE presentation** — the authorization *decision* belongs to an institutional role/permission workflow outside AIEL; AIEL enforces the *presentation* of an already-authorized accommodation, never grants one |
| Content Accessibility Capability | **CONSUME** |
| Application Accessibility Capability | **CONSUME** |
| Aggregate accessibility reporting | **REPORT ONLY** (via the existing Security/Privacy Layer V1 gate — see §8) |

## 6. Forbidden Responsibilities (Do-Not-Own)

AIEL MUST NOT own, and MUST NOT be permitted by any future implementation to silently begin
owning: identity, authentication, permissions, organization membership, tenant isolation,
enrollment, Curriculum content, lesson completion, assignments, assessment results, Reflection
submissions, Learning Arcade Activity/Attempt/Result, mastery, Live Learning attendance, Project
submissions, Portfolio evidence, Credentials, Career facts, Truth Spine, Operational Events,
Evidence, Metric Registry, or institutional reporting truth.

**Governing principle:** AIEL may change how a learner perceives, navigates, interacts with, or is
authorized to access an experience. AIEL MUST NOT manufacture the underlying domain fact.

## 7. State-Scope Rules

- Personal Accessibility Preference: **user-scoped** (`user_id`), following the person across every
  organization they participate in, matching the existing `memberships` table's own precedent for
  a stable per-person identity anchor independent of any single organization.
- Authorized Accommodation: **membership/enrollment/organization-scoped**. MUST NOT follow a person
  automatically across organizations. An accommodation authorized in Organization A MUST NOT be
  visible, active, or inferable in Organization B without a separate, explicit authorization in B.
- Content Accessibility Capability: **content/resource-scoped**.
- Application Accessibility Capability: **application/activity-scoped**, declared by that
  application's own domain contract.
- Device/session-scoped state (today's localStorage-only reality) is acceptable as a *fallback* for
  an unauthenticated or offline session, but MUST NOT remain the only persistence layer once a
  canonical profile exists.

## 8. Privacy Rules

1. AIEL MUST NOT infer, store, or expose a disability or diagnosis label from any preference or
   accommodation record.
2. AIEL MUST NOT require a diagnosis to enable an ordinary Personal Accessibility Preference.
3. Personal Accessibility Preferences MUST NOT appear in public or cross-organization reporting.
4. Individual accommodation details MUST NOT appear in impact/institutional reports (only
   aggregate, non-identifying facts — see §14 of the full report).
5. Accommodation data MUST NOT be exposed across organizations for the same person.
6. Logs MUST NOT contain sensitive accommodation details (mirrors the existing, verified discipline
   in this codebase's own external-secret/token handling from this session's Calendar work — no
   sensitive value logged, ever).
7. AIEL MUST reuse the existing Security / Privacy Layer V1 redaction gate
   (`docs/SECURITY_PRIVACY_LAYER_V1.md`) for anything that could reach public reporting — it
   already flags `diagnosis`/`disability` category indicators and must not be duplicated.
8. AIEL MUST use the existing tenant/membership/permission infrastructure
   (`apps/shs-api/src/auth/tenant-context.ts`, `security-permissions.ts`) for every authorization
   check — it MUST NOT invent a parallel identity or scoping system.

## 9. Cross-Organization Rules

A learner participating in multiple organizations keeps one Personal Accessibility Preference
profile (user-scoped, portable). Each organization's Authorized Accommodations are independent,
membership-scoped records. Moving between organizational contexts MUST NOT carry an accommodation
across the boundary; it MAY carry the ordinary personal preference, since that preference implies
no institutional claim.

## 10. Domain Integration Rules

AIEL integrates with each domain by **consuming a capability signal that domain already owns**,
never by re-implementing that domain's own logic:
- Curriculum: consumes content-accessibility facts (captions/transcripts/alt text) once Curriculum
  models them; owns none of the underlying content.
- Assessment: enforces the *presentation* of an already-authorized accommodation (e.g., extended
  time); the authorization itself is granted through an institutional role workflow outside AIEL.
- Learning Arcade: consumes an interaction-capability declaration once real activities exist; does
  not build or grade activities.
- Live Learning: consumes a caption/transcript-availability signal once the provider contract
  (`live-learning-provider.ts`) is extended to expose it; does not build captioning technology.
- Career Center: consumes AIEL's preferences to affect already-existing, already-strong ARIA
  implementations; does not alter Career's own facts (Events, Opportunities, Credentials, Pathway).

## 11. Brainiact / Learning Companion Boundary

AIEL MAY tell Companion: reduced motion, communication mode, text scale, sensory intensity,
preferred representation, accessibility support context.
Companion retains ownership of: hint content, coaching behavior, charades behavior, career
guidance behavior, conversational logic.
Celebration retains its own trigger logic based on verified achievement facts it does not own
either (that truth lives further upstream). AIEL MAY influence how a celebration is *presented*
(motion intensity, acknowledgement-only mode). AIEL MUST NOT decide whether an achievement
occurred.

**Verified fit with current code:** `celebrationPolicy.js`'s `applyPresentationPreferences()` is
already architected exactly this way — a pure function taking `reducedMotion`/`intensity` as
parameters, never deciding the underlying achievement. The only defect is *where those parameters
currently come from* (a fragile direct-localStorage bypass read, per the Phase 0 audit) — the
contract shape itself is already correct and should be preserved, only its input source should
change.

## 12. Student Guidance Boundary

A separate SHF Student Guidance & Onboarding Layer (evaluated separately, not built here) owns:
first-run state, walkthrough state, feature introductions, "Guide Me," contextual platform help,
onboarding completion, tutorial replay, platform readiness.

AIEL owns only *how* that guidance is presented accessibly: reduced motion, larger text, captions,
simplified presentation applied to whatever Guidance decides should run. AIEL never decides whether
a walkthrough should run, or its content.

No repository evidence contradicts this split — no onboarding/guidance system currently exists in
this codebase (confirmed absent during the underlying Phase 0 audit's tooling/shared-shell
research), so this boundary is proposed cleanly rather than reconciled against an existing
conflict.

## 13. Truth Spine / Reporting Boundary

AIEL data never enters Truth Spine, Operational Events, or Evidence as a source fact. The only
permitted path toward institutional reporting is **aggregate, non-identifying** facts (e.g., "X% of
lesson videos have captions"), fed by Content/Application Accessibility Capability facts that
belong to their owning domains — never by AIEL exporting individual preference or accommodation
records. Any such aggregate MUST pass through the existing Security / Privacy Layer V1 gate before
reaching Reports/Watchtower.

## 14. Accessibility Capability Model

A "capability" is a fact declared by the owning domain (content has captions; an activity supports
keyboard play), not manufactured or asserted by AIEL. AIEL's only role is discovery/aggregation of
capabilities already declared elsewhere, for its own presentation decisions and for the reporting
boundary above.

## 15. Runtime Direction

The future AIEL runtime extends `src/entries/RootProviders.jsx` — the existing, verified,
18-of-27-real-entry shared provider tree already reaching every current learner-facing app (Career,
Curriculum, Arcade, Store). It does not invent a new mounting mechanism. Non-learner-facing SHS
Capital/Impact/Finance apps are out of scope and are not expected to migrate into this tree for
AIEL's purposes.

## 16. Migration / Reconciliation Principles

- No existing mechanism is deleted in Phase 0 or Phase 1.
- Each duplicated mechanism (reduced motion, simplification, skip links) gets one designated
  canonical implementation; others migrate onto it in a later phase, never simultaneously deleted
  and replaced in one step.
- OS-level `prefers-reduced-motion` detection remains a permanent, valid input signal alongside any
  future stored preference — it is not replaced, only supplemented.
- Demo/fabricated surfaces (the "IEP" pages, `docs/SHF_REPORTING_LINEAGE_MATRIX.md`'s own flagged
  `iep.fabricated.student.data`) are not treated as a foundation for Authorized Accommodation design
  — they are legacy/demo and out of AIEL's migration path entirely.

## 17. Rules for Adding Future Accessibility Features

Before any new accessibility-adjacent feature is added anywhere in SHF:
1. It MUST be classified into one of the five concept classes in §4.
2. It MUST declare its scope per §7.
3. It MUST NOT duplicate an existing mechanism already reconciled under this constitution — it
   extends the canonical one.
4. If it touches Authorized Accommodation, it MUST route through an institutional
   role/permission check — never a student-facing self-service control.
5. If it could ever reach reporting, it MUST be evaluated against §13 before design begins, not
   after.
