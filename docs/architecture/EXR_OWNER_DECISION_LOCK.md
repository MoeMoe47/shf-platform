# EXR Owner Decision Lock — Pre-EXR-1 Architecture Decision Package

**Status:** READY FOR OWNER APPROVAL
**Worktree:** `/Users/mikeslate/Projects/shrv1-codex`
**Branch:** `codex/exr`
**Baseline:** `95e6833f053da5f9cc501f256f4b8a0a14995dae`
**Scope:** decision package only; no implementation

## 1. Executive Summary

EXR-0 established that the repository’s main experience problem is fragmented presentation of organization, role, entitlement, workflow state, and next action. This package locks the smallest set of architectural choices needed before EXR-1 can define role, capability, and journey contracts.

Six topics require owner approval because they affect ecosystem IA: public entry, Hub ownership, onboarding composition, Accessibility placement, reporting entry, and shared-shell coordination with Notifications. Four topics are already determined by SEA, existing authority boundaries, and repository infrastructure: dashboard-versus-workflow classification, organization/role context, capability exposure, and return experience.

No production source, route, navigation, shell, permission, migration, main worktree, or Claude worktree was changed.

## 2. EXR-0 Baseline

EXR-0 inventoried 40 meaningful route records, 37 page surfaces, 20 dashboard-like surfaces, 14 navigation systems, and 16 journeys. It identified zero P0 findings and assigned P1/P2/P3 IA findings to later EXR phases. AX-GAP-021 is the Accessibility placement and route-IA handoff.

## 3. Governing Experience Law

`Identity → Organization → Role → Entitlement → Workflow State → Available Capability → Relevant Experience → Next Action`.

SEA remains canonical for experience contracts and dashboard hierarchy. OGL, DGAL, Accessibility, Notifications, and source domains retain their existing authority.

## 4. Public Entry Decision

### CURRENT STATE

Foundation, Solutions, Universe, Career, CivicSure public, OAS, Impact, and Store/Catalog are all valid public or discovery surfaces. The repository currently exposes several public doors and aliases rather than one clearly prioritized hierarchy.

### PROBLEM

A visitor can encounter multiple “home” experiences without understanding whether the destination is mission, service discovery, public data, career discovery, orientation, or catalog browsing.

### OPTION A — Foundation as the single universal home

Foundation owns mission, impact, public application directory, and all first-level public routing. Solutions and product surfaces become descendants.

**Tradeoff:** strong mission hierarchy, but service buyers may need extra steps and product boundaries become less direct.

### OPTION B — Solutions as the single universal home

Solutions owns service discovery and routes mission, impact, career, CivicSure, and catalog destinations.

**Tradeoff:** clear commercial/service discovery, but Foundation’s public-benefit and institutional identity becomes secondary.

### OPTION C — Coordinated two-level public hierarchy

Foundation is the institutional/public-benefit entry; Solutions is the SHS service-discovery entry; product/public experiences remain destinations reached from the appropriate parent. Universe and OAS are optional discovery/orientation experiences, not competing universal homes.

**Tradeoff:** preserves real ownership boundaries while requiring a clear cross-link and destination taxonomy.

### RECOMMENDED OPTION

**Option C — coordinated two-level public hierarchy.**

### WHY

Repository ownership already distinguishes Foundation from SHS Solutions. CivicSure public, Career, Store, OAS, and Universe have distinct jobs and should not be flattened into one generic home. This follows SEA’s discovery-versus-operational boundary without deleting valid public experiences.

### WHAT THIS UNLOCKS

A public destination map, canonical CTA ownership, coherent visitor orientation, and safe EXR-2 navigation contracts.

### WHAT IT DOES NOT CHANGE

No product ownership, public content authority, CivicSure authority, Career architecture, Universe design, or route implementation.

## 5. Hub Ownership Decision

### CURRENT STATE

Hub/BOS contains workspace, network, intake, queues, lifecycle, reports, growth, sales, opportunities, bundles, and intelligence surfaces. Admin command, executive, reporting, and platform routes coexist nearby.

### PROBLEM

Hub can read as either an SHS customer operating environment or a generic ecosystem super-dashboard. Technical/admin capabilities are discoverable beyond the organization’s actual role and entitlement context.

### OPTION A — Generic ecosystem super-dashboard

All users receive one broad capability directory with role-based hiding.

**Tradeoff:** easy to explain internally, but violates progressive exposure and makes customer work compete with platform administration.

### OPTION B — SHS/BOS customer operating environment

Hub is the operating home for an organization using SHS services. SHF/SHS administration and platform command surfaces remain separate.

**Tradeoff:** strong customer boundary, but leadership and service-specific views need projections into the operating home.

### OPTION C — Organization operating environment with role projections

Hub is the organization operating environment, implemented as the SHS/BOS customer home. It projects operator, leader, service, and entitlement-specific work while keeping platform/admin authorities outside the customer shell.

### RECOMMENDED OPTION

**Option C — organization operating environment with role projections.**

### WHY

This is the most precise expression of the existing Hub/BOS evidence. It keeps Hub useful for customers and operators without turning it into a universal admin surface. Leadership belongs as a role projection; SHF/SHS platform administration does not.

### WHAT THIS UNLOCKS

Canonical Hub ownership, role-aware navigation, entitlement-aware service entry, and an activated-organization return path.

### WHAT IT DOES NOT CHANGE

Identity, organization membership, permissions, service catalog authority, reporting authority, Agent Fabric, ARAG, Truth, or source-domain workflows.

## 6. Onboarding Composition Decision

### CURRENT STATE

Organization onboarding has a real lifecycle and operator surface, but applicant and reviewer concerns are composed in one experience. Activation does not yet consistently become a first-use transition into entitled services.

### PROBLEM

Applicants can encounter reviewer-shaped controls, and approved organizations can be returned to a generic operator surface rather than the first available service action.

### OPTION A — Onboarding dashboard

One dashboard remains the home for applicants, reviewers, activation, and post-activation work.

**Tradeoff:** simple route model, but mixes authority and lifecycle stages.

### OPTION B — Case/workflow view with role-specific queues

Applicant sees a bounded application case/status view. Reviewers see an authorized queue and case detail. Approval/activation transitions to an entitled-service first-use experience, then Hub.

### OPTION C — Separate applicant and reviewer products

Applicants and reviewers receive entirely separate applications and route families.

**Tradeoff:** strongest visual separation but unnecessary duplication for the existing shared case domain.

### RECOMMENDED OPTION

**Option B — case/workflow view with role-specific queues and a first-use transition.**

### WHY

The domain is stateful and authority-sensitive. A case/workflow is a better type than a dashboard. A shared detail projection can preserve common data while keeping applicant, reviewer, and approver actions separate.

### WHAT THIS UNLOCKS

Progressive exposure: public/service discovery → apply → review → approval → activation → first entitled service → Hub daily operations.

### WHAT IT DOES NOT CHANGE

Onboarding state authority, DGAL agreements, permissions, entitlements, or activation semantics.

## 7. Accessibility Placement Decision

### CURRENT STATE

AX-2, AX-4, AX-6, Companion, and human escalation are complete and intentionally separate. Entry points currently appear in Curriculum, operator, help, Companion, and accessibility-specific surfaces.

### PROBLEM

Discoverability is distributed, and moving all accessibility functions into one destination would incorrectly merge personal preference, institutional accommodation, operations, and human support authority.

### OPTION A — One dedicated Accessibility destination

All settings, accommodations, operations, Companion, and support live under one accessibility application.

**Tradeoff:** easy to name, but creates a false single workflow and exposes sensitive/operator functions broadly.

### OPTION B — Contextual placement with explicit separation

Personal settings live under account/settings and contextual help. Accommodation request/status appears in learner/account support and authorized organization workflows. Companion and human help appear in the shared Help affordance. Operations remains authorized operator/admin navigation.

### OPTION C — Help-only placement

All accessibility entry points are discoverable only through Help/Companion.

**Tradeoff:** preserves shell simplicity but underexposes settings and institutional workflow actions.

### RECOMMENDED OPTION

**Option B — contextual placement with explicit separation.**

Canonical entry contract:

| Capability | Primary placement | Secondary contextual entry | Authority boundary |
|---|---|---|---|
| Personal Accessibility Settings | Account/Settings | Help and supported learning shell | user preference only |
| Accommodation request/status | Learner support / organization workflow | Help and Companion guidance | AX-4 human institutional decision |
| Accessibility Help / Companion | Shared Help affordance | contextual page help | explain/guide/escalate only |
| Accessibility Operations Center | Authorized operator/admin navigation | none for ordinary users | AX-6 issue/support operations |

### WHY

It closes AX-GAP-021 through IA while preserving the non-negotiable boundaries: Personal Accessibility ≠ Accommodation ≠ Operations ≠ Human Support.

### WHAT THIS UNLOCKS

EXR-2 placement and navigation contracts, safe role projections, and discoverable support without private-data overexposure.

### WHAT IT DOES NOT CHANGE

Accessibility runtime, profile schema, accommodation authority, operations authority, Companion boundaries, or human escalation semantics.

## 8. Reporting Entry Decision

### CURRENT STATE

Reporting appears in Hub, `/reporting`, `/reports`, `/ops/reports`, operating brief, executive command, impact, Truth, Oracle, and role-specific contexts.

### PROBLEM

One generic Reports entry would collapse different audiences and source authorities. Existing aliases also make multiple report command surfaces appear canonical.

### OPTION A — One generic Reports destination

All reporting, impact, executive, institutional, and personal reports share one entry.

**Tradeoff:** easy to find, but high risk of role leakage, confusing provenance, and incorrect data expectations.

### OPTION B — Context-specific reporting with one governed registry

Personal progress remains in Student/Curriculum. Operational and institutional reports live in Reporting/Hub projections. Executive intelligence remains Executive Command. Public impact/transparency remains Foundation/CivicSure public. Grant/funder reports remain scoped to authorized funding surfaces. Truth/Oracle remain inspection authorities, not generic reports.

### RECOMMENDED OPTION

**Option B — context-specific reporting with one governed registry and canonical source labels.**

### WHY

The repository already has distinct sources, permissions, and report types. SEA requires context, attention, work, progress, intelligence, and help to be meaningful for the actor; reporting is not one universal job.

### WHAT THIS UNLOCKS

Canonical report entry projections, safe role/organization filtering, report provenance, and cleanup of aliases in EXR-3.

### WHAT IT DOES NOT CHANGE

Truth Spine, Evidence, Oracle, impact attribution, grant authority, or personal learning progress authority.

## 9. Shared Shell / Notifications Boundary

### CURRENT STATE

EXR owns the navigation and information architecture problem. Notifications is a separate project. The repository already contains shared headers, RootProviders, operator layouts, SEA attention concepts, Companion/help, and notification-related infrastructure.

### PROBLEM

Both projects may touch global shell, header actions, attention regions, providers, and dashboard entry points. Without a contract, merge conflicts could create duplicate navigation or duplicate attention authority.

### RECOMMENDED SHELL CONTRACT

| Region | EXR owns | Notifications owns |
|---|---|---|
| Global header frame | placement, hierarchy, context order | no structural ownership |
| Organization context | active org marker and switch entry rules | no ownership |
| Role context | active role marker and projection rules | no ownership |
| Primary navigation | canonical destinations, grouping, visibility | no ownership |
| Secondary navigation | workflow/context links and breadcrumbs | no ownership |
| Help/Companion | placement and destination taxonomy | notification deep links only |
| Attention region | slot, label, relationship to next action | unread/action-required notification projection |
| Bell/inbox | reserved shell slot and route placement | communication state, unread state, notification UI |
| RootProviders | preserve provider ownership/order | add only notification provider/context as agreed |

Notifications may signal attention; it may not become a second navigation authority or mutate workflow state. EXR may consume notification projections as signals; it must not duplicate communication state.

### WHAT THIS UNLOCKS

Independent implementation followed by controlled integration: EXR contract first, Notifications additive projection second, combined shell acceptance third.

### WHAT IT DOES NOT CHANGE

Notification delivery semantics, event ownership, permissions, source-domain workflow authority, or Claude branch contents.

## 10. Dashboard vs Workflow Rule

### LOCKED RULE

A surface remains a **DASHBOARD** only when the actor has a recurring need for meaningful context, attention, work, progress, intelligence, and help. A surface that primarily performs one stateful task is a workflow or queue. A surface that primarily selects destinations is a landing page or directory. A surface that primarily inspects one record is a detail page. A source-backed aggregation is a report.

### CONFIRMED DASHBOARDS

| Surface | Decision | Reason |
|---|---|---|
| Student | remain dashboard | recurring learning context, progress, work, and next lesson |
| Career | remain dashboard | recurring pathway/progress and career action context |
| Hub/Leadership | remain dashboard | recurring organization situational awareness and intelligence |
| Executive Command | remain dashboard | recurring executive attention and intelligence |
| Accessibility Operations | remain dashboard with queues | health plus recurring remediation/retest/support work |
| ARAG | remain governed dashboard/workflow hybrid | recurring gate attention plus review workflow |

### SURFACES THAT SHOULD STOP BEING GENERIC DASHBOARDS

Onboarding becomes a workflow/case view; Studio QA/review becomes role-specific workflow queues; Reporting becomes report command/detail; Hub action queue becomes a queue; CivicSure public and Universe remain discovery; Career detail becomes detail; public app galleries remain directories.

### WHAT THIS DOES NOT CHANGE

Existing routes or pages. This is an EXR-1/2 contract for classification and later implementation.

## 11. Organization / Role Context Contract

### LOCKED CONTRACT

Every authenticated operational surface must expose the current organization before the primary action, show the active role when the role affects available work, and identify the service/workflow/project context in the page heading or breadcrumb.

| Context | Contract |
|---|---|
| Active organization | visible in authenticated shell; resolved from server-authoritative organization context |
| Active role | visible when multiple role projections or authority boundaries exist |
| Entitlement | reflected through available, pending, locked, or hidden capability state |
| Workflow context | shown in page heading/status and next action |
| Multiple organizations | explicit organization selection; no silent cross-org carryover |
| Different service availability | recompute capability visibility after org switch; preserve server guards |
| Role switching | allowed only where existing membership/permission infrastructure supports it; never client-only |

This is architecture-determined by identity, organization-context, permission, and service-entitlement infrastructure. No new backend behavior is proposed.

## 12. Capability Exposure Contract

### LOCKED VOCABULARY

| State | Meaning | UI behavior |
|---|---|---|
| HIDDEN | actor is not entitled or authorized to know/use the capability | omit from ordinary navigation |
| LOCKED | capability is known but blocked by permission, prerequisite, or lifecycle | show bounded reason and safe next action where policy permits |
| PENDING | requested/activated workflow is incomplete | show status and next action, not unusable controls |
| AVAILABLE | entitlement and state permit entry | show active entry and canonical next action |
| VISIBLE | informational discovery is allowed but action is not currently available | show truthful explanatory state, never imply access |

The server remains authoritative. The frontend must not expose a giant menu of everything, and hiding a control must never substitute for authorization.

## 13. Return Experience Contract

### LOCKED RULE

Returning authenticated users resume at **Current Organization → Current Role → Current Work → Highest-Priority Next Action** when durable context exists. A true dashboard remains the exception when the actor needs broad situational awareness rather than one active task.

| Situation | Return target |
|---|---|
| active workflow/case/project | current work detail and next action |
| queued work | queue filtered to current org/role |
| no active work but recurring awareness needed | canonical role dashboard |
| public visitor | canonical public entry or last safe discovery context |
| expired/invalid context | safe organization/role selection and orientation |

This follows SEA and existing workflow state. It does not create a new persistence model.

## 14. Owner Decision Register

| Decision ID | Topic | Current Problem | Options | Codex Recommendation | Why | EXR Phase Blocked |
|---|---|---|---|---|---|---|
| EXR-D001 | Public entry | competing public doors | Foundation; Solutions; coordinated hierarchy | coordinated Foundation → Solutions hierarchy | preserves real ownership and public discovery jobs | EXR-2 |
| EXR-D002 | Hub ownership | Hub reads as super-dashboard or customer OS | generic; SHS/BOS; org projections | organization operating environment with role projections | matches Hub/BOS and progressive exposure | EXR-1/2 |
| EXR-D003 | Onboarding | applicant/reviewer/post-activation concerns co-located | dashboard; case/workflow; separate products | case/workflow plus role queues and first-use transition | preserves authority and progressive exposure | EXR-1/4 |
| EXR-D004 | Accessibility placement | settings, accommodation, help, operations are discoverable in different places | one destination; contextual; help-only | contextual placement with explicit separation | closes AX-GAP-021 without merging authority | EXR-2 |
| EXR-D005 | Reporting entry | reports are spread across audience/source contexts | generic; context-specific governed registry | context-specific reporting with governed registry | preserves provenance and role boundaries | EXR-2/3 |
| EXR-D006 | Shell/Notifications | shared header and attention-region conflict risk | Notifications first; EXR first; contract | EXR IA contract, then additive Notifications projection | avoids duplicate navigation and attention authority | EXR-2 |

## 15. Decisions Already Determined by Architecture

The following do not require a strategic owner choice before EXR-1:

| Topic | Determination |
|---|---|
| Dashboard vs workflow | SEA test and existing page jobs determine classification; implementation follows later |
| Organization/role context | server-authoritative org, role, permission, and entitlement context must drive visibility |
| Capability exposure | HIDDEN/LOCKED/PENDING/VISIBLE/AVAILABLE states are required; no client-only authority |
| Return experience | resume current org, role, work, and next action when durable context exists |
| Authority boundaries | source domains, AX, OGL, DGAL, Notifications, Evidence, Truth, and ARAG retain their owners |
| Accessibility separation | Personal Accessibility, Accommodation, Operations, Companion, and human support remain distinct |
| No implementation in this run | this package changes documentation only |

## 16. Decisions Requiring Owner Approval

| ID | Question | Recommended choice | Owner Approval Needed? |
|---|---|---|---|
| EXR-D001 | What is the primary public hierarchy? | Foundation institutional entry → Solutions service discovery → product destinations | YES |
| EXR-D002 | What is Hub? | SHS/BOS organization operating environment with role projections | YES |
| EXR-D003 | How should onboarding compose? | applicant case, reviewer queue/detail, activation-to-first-service transition | YES |
| EXR-D004 | Where should Accessibility entry points live? | contextual account/help/operator placement with strict separation | YES |
| EXR-D005 | What is the reporting strategy? | context-specific entries backed by one governed registry | YES |
| EXR-D006 | How do EXR and Notifications share the shell? | EXR owns IA; Notifications owns communication state and projection | YES |
| D-ARCH-001 | Should dashboards require recurring SEA dimensions? | yes | NO — ARCHITECTURE ALREADY DETERMINES |
| D-ARCH-002 | Should server permissions remain authoritative? | yes | NO — ARCHITECTURE ALREADY DETERMINES |
| D-ARCH-003 | Should return experience prefer active work? | yes, with dashboard exception | NO — ARCHITECTURE ALREADY DETERMINES |
| D-ARCH-004 | Should personal Accessibility remain separate from accommodation and operations? | yes | NO — ARCHITECTURE ALREADY DETERMINES |

## 17. EXR-1 Entry Conditions

EXR-1 may begin only after the owner has approved or explicitly rejected the six genuinely strategic recommendations. Before EXR-1 implementation begins, record:

1. public hierarchy decision;
2. canonical Hub ownership;
3. onboarding composition and first-use transition;
4. Accessibility entry placement for AX-GAP-021;
5. reporting entry strategy;
6. EXR/Notifications shared-shell contract.

EXR-1 must then define role/capability/journey contracts without changing source-domain authority or implementing broad navigation consolidation prematurely.

## 18. Files Created

| File | Purpose |
|---|---|
| `docs/architecture/EXR_OWNER_DECISION_LOCK.md` | owner-facing decision package |

## 19. Git State

The Codex worktree remains on `codex/exr` at `95e6833f053da5f9cc501f256f4b8a0a14995dae`. The pre-existing EXR-0 audit remains untracked. This phase added only this documentation artifact. No production source, route, navigation, shell, migration, commit, or push was performed. Main and Claude worktrees were not touched.

## 20. Exact Next Step

**OWNER REVIEW AND APPROVAL OF EXR-D001 THROUGH EXR-D006**

After approval, the exact implementation phase is:

**EXR-1 — ROLE, CAPABILITY & CUSTOMER JOURNEY CONTRACTS**

Do not begin EXR-1 in this run.
