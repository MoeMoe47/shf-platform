# EXR-1 — Role, Capability & Customer Journey Contracts

**Status:** COMPLETE
**Phase boundary:** contract layer only
**Worktree:** `/Users/mikeslate/Projects/shrv1-codex`
**Branch:** `codex/exr`
**Baseline:** `95e6833f053da5f9cc501f256f4b8a0a14995dae`

## 1. Executive Result

EXR-1 establishes the canonical, repository-local contract layer needed to express who should see a capability, under which organization and workflow context, what surface type is appropriate, what next action is authoritative, and where a returning user should resume.

The implementation consumes SEA contracts and does not create a second experience architecture. It does not change routes, navigation, shells, permissions, organization membership, entitlements, source-domain workflows, or Notifications behavior.

## 2. Locked Owner Decisions

The contract registry encodes the approved decisions:

- Foundation is the institutional public entry and Solutions is the SHS service-discovery entry.
- Hub is the SHS/BOS organization operating environment with role projections.
- Onboarding is an applicant case, reviewer queue/detail, approval, activation, first-service transition, then operating experience.
- Accessibility is placed contextually across account/settings, learner support, shared Help, and authorized operator navigation.
- Reporting is context-specific and backed by one governed registry.
- EXR owns shell IA and placement; Notifications owns notification state and projections into EXR-defined slots.

## 3. Canonical Owner

`src/system/exr/exrExperienceContracts.js` is the single EXR-1 contract owner. It is an adapter over `src/system/sea/serviceExperienceContracts.js`; SEA remains the canonical experience architecture and source-domain contracts remain authoritative for state and actions.

## 4. Role / Organization Context Contract

The registry defines 12 bounded role contexts: public, learner, instructor, parent, applicant, organization operator, organization administrator, CivicSure provider, Studio reviewer, SHS administrator, accessibility operator, and ARAG release actor.

Each role context declares:

- organization context required;
- default return target;
- permitted surface kinds.

The registry does not grant access. Existing authenticated organization context, permissions, and entitlement guards remain server-authoritative.

## 5. Capability Exposure Contract

The bounded capability states are:

| State | Meaning |
|---|---|
| `HIDDEN` | not authorized or entitled for ordinary discovery |
| `LOCKED` | known but blocked by permission, prerequisite, or lifecycle |
| `PENDING` | requested, activating, or waiting on workflow state |
| `VISIBLE` | safe informational discovery without active action authority |
| `AVAILABLE` | authorized and ready for the actor’s next action |

Thirteen capability contracts cover public discovery, onboarding, first service, Hub work, Student, Instructor, Career, Studio, CivicSure, Accessibility Settings, accommodations, Accessibility Operations, and reporting. The frontend state is descriptive only; it cannot substitute for authorization.

## 6. Customer Journey Contracts

Nine journeys are represented:

1. Public discovery
2. Organization onboarding
3. Student learning
4. Instructor operations
5. Career progression
6. Studio lifecycle
7. CivicSure assurance
8. Accessibility support
9. ARAG release

Each journey declares audience, bounded states, current-work surface kinds, return target, and next-action source. The contracts intentionally reference domain projections and workflow state machines instead of reimplementing them.

## 7. Next Action Contract

Allowed next-action sources are `DOMAIN_PROJECTION`, `WORKFLOW_STATE_MACHINE`, `OGL_RESOLVER`, `SEA_PROJECTION`, and `NONE`. A next action is not inferred from a card, route visibility, or notification alone.

## 8. Return Experience Contract

`getReturnTarget()` applies the locked sequence:

`Current Organization → Current Role → Current Work → Highest-Priority Next Action`.

It returns `CURRENT_WORK` when active work exists, then `ROLE_QUEUE`, then `PUBLIC_DISCOVERY` for public users, and otherwise `ROLE_DASHBOARD`. This is a resolution helper, not a new persistence mechanism.

## 9. Public Entry Contract

The registry records Foundation, Solutions, Universe, and product destinations as distinct public jobs. Foundation and Solutions remain separate. Universe is optional discovery, not a competing universal home. Career, CivicSure public, OAS, and Store remain secondary destinations according to their existing ownership.

## 10. Hub Contract

Hub ownership is `SHS/BOS`. Its purpose is `Organization operating environment with role projections`. It explicitly excludes a generic ecosystem super-dashboard, SHF platform administration, and source-domain workflow authority. Organization, role, and entitlement context are required inputs.

## 11. Onboarding Contract

Onboarding is a stateful workflow:

`DISCOVERY → APPLICATION → SUBMITTED → UNDER_REVIEW → APPROVED → ACTIVATED → FIRST_SERVICE_USE → OPERATING`.

Applicant and reviewer projections are distinct in authority while remaining compatible with a shared case/detail implementation. Entitled-service UI becomes available only after activation.

## 12. Accessibility Placement Contract

| Capability | Contract placement |
|---|---|
| Personal Accessibility | `ACCOUNT_SETTINGS` |
| Institutional Accommodation | `LEARNER_SUPPORT_OR_ORGANIZATION_WORKFLOW` |
| Help / Companion | `SHARED_HELP` |
| Accessibility Operations | `AUTHORIZED_OPERATOR_ADMIN` |

The registry preserves separation among personal preferences, institutional accommodations, operations, and human support. AX-GAP-021 remains an IA placement concern for EXR-2.

## 13. Reporting Contract

Reporting uses `CONTEXT_SPECIFIC_GOVERNED_REGISTRY`:

- personal progress: Curriculum;
- operational reporting: Reporting and Hub projections;
- executive intelligence: Executive Command;
- public impact: Foundation and CivicSure public;
- funder reporting: authorized funding surfaces;
- Truth and Oracle: source-authority inspection.

## 14. Notifications Boundary

EXR owns shell IA, primary and secondary navigation, organization/role context, placement slots, and page composition. Notifications owns notification state, recipient projection, bell/inbox behavior, communication delivery state, and attention data projected into EXR-defined slots. No notification UI or behavior was implemented here.

## 15. Validation

The canonical validator is `npm run exr:contracts:validate`. It validates unique roles, capabilities, and journeys; bounded vocabularies; state contracts; next-action sources; return targets; Hub ownership; Accessibility separation; reporting strategy; and EXR/Notifications shell ownership.

Focused tests are `tests/exr-1-experience-contracts.test.mjs` and cover Hub ownership, capability state resolution, Accessibility placement, reporting/Notifications boundaries, and return targeting.

Evidence from this phase:

- EXR validator: PASS, 12 roles / 13 capabilities / 9 journeys
- EXR focused tests: 5/5 PASS
- SEA contract validator: PASS, 40 services
- Manifest validation: PASS
- UI contract validation: PASS
- Orientation validation: PASS
- `git diff --check`: PASS

## 16. Scope Boundaries

EXR-1 did not modify route definitions, navigation, shells, application entry points, permissions, migrations, API behavior, source-domain workflows, Notifications, Frontend Design, EXR-2, the main worktree, or the Claude worktree.

## 17. Files Created

| File | Purpose |
|---|---|
| `src/system/exr/exrExperienceContracts.js` | canonical EXR-1 contract registry and helpers |
| `scripts/validate-exr-contracts.mjs` | deterministic contract validator |
| `tests/exr-1-experience-contracts.test.mjs` | focused EXR-1 tests |
| `docs/architecture/EXR-1_ROLE_CAPABILITY_CUSTOMER_JOURNEY_CONTRACTS.md` | architecture and acceptance report |

## 18. Files Modified

| File | Change |
|---|---|
| `package.json` | added `exr:contracts:validate` script |

## 19. Git State

No commit or push was performed. Existing EXR-0 and owner-decision documentation remains untracked in this worktree. Main and Claude worktrees were not touched.

## 20. EXR-1 Decision

**EXR-1 COMPLETE.** The role, capability, journey, public-entry, Hub, onboarding, Accessibility placement, reporting, shared-shell, capability-state, next-action, and return-experience contracts are implemented and validated without beginning EXR-2.

## 21. Exact Next Phase

**EXR-2 — INFORMATION ARCHITECTURE & NAVIGATION RECONCILIATION**

EXR-2 must use these contracts to reconcile routes and navigation. It should begin only as a separate phase.
