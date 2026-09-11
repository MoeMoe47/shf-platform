# CivicSure Frontend Product-Face Audit

**Audit date:** 2026-09-07  
**Repository:** `/Users/mikeslate/Projects/shrv1`  
**Branch:** `studio-v1-plus-development`  
**Runtime audited:** accepted GPA v1 surface at current worktree HEAD `444b03e47c154156d831d87f6cb9733ce2794fe9`  
**Frozen reference:** `gpa-v1-accepted-2026-09-06` at `72071116b4bbf9d6ad687fe8fe41282221a4af0c`

## 1. Executive Result

The existing GPA frontend is a functional, API-backed pilot operator surface with broad accepted workflow coverage. It is not yet a finished standalone product face. The implementation is strongest as a controlled operator console and canonical-record inspection layer; it is weaker as an executive, provider, auditor, county-admin, and public experience.

The CivicSure redesign should preserve the existing route contract, centralized GPA client, canonical API boundaries, permission behavior, tables, structured detail projections, lifecycle history, and Phase 8 acceptance harness. The redesign should replace the generic SHF operator shell and the single large tab-driven GPA page with a branded, role-aware product shell and clearer information architecture.

**Audit disposition:** complete for design planning. No runtime code, route, API, migration, or frozen artifact was changed. The in-app browser connection could not initialize in this session because its browser runtime rejected a restricted `node:process` import. Fresh repository Playwright acceptance was therefore used for browser/DOM evidence; no new visual screenshots were captured.

## 2. Repository Baseline

| Item | Evidence |
|---|---|
| Branch | `studio-v1-plus-development` |
| HEAD | `444b03e47c154156d831d87f6cb9733ce2794fe9` |
| Frozen tag | `gpa-v1-accepted-2026-09-06` -> `72071116b4bbf9d6ad687fe8fe41282221a4af0c` |
| County checkpoint | `gpa-county-pilot-prep-2026-09-07` -> current HEAD |
| Dirty files | 44; preserved owner work, not modified or staged |
| Status hash | `ef6bd1e9bb424ff7113b2f351c659bdfb4769e37baf9b97811acef049e36d11c` |
| Migration evidence | Disposable Phase 8 replay applied 001-105; pending/drift/unknown empty |

Relevant frontend roots are `src/entries/index.main.jsx`, `apps/shf-web/src/pages/operator/`, `apps/shf-web/src/layouts/`, `apps/shf-web/src/services/government-assurance-client.js`, `src/styles/`, and `tests/phase8/`.

## 3. Frontend Entrypoints

The normal root Vite entry is `src/entries/index.main.jsx`. It imports `OperatorLayout` and `GovernmentAssurance`, parses hash/path routes, and owns the complete nested GPA route dispatch. `apps/shf-web/src/routes/index.jsx` is a second SHF app route table that exposes only the base GPA route; nested GPA deep links depend on the root entry. This works in the accepted root harness but is an architectural duplication to remove or consolidate during redesign.

The primary GPA page is `apps/shf-web/src/pages/operator/GovernmentAssurance.jsx`. Supporting pages are `GovernmentAssurancePortfolioDetail.jsx`, `GovernmentAssuranceMonitoringDetail.jsx`, `GovernmentAssuranceReconciliationDetail.jsx`, `GovernmentAssuranceSourceDetail.jsx`, `GovernmentAssuranceLineageDetail.jsx`, `GovernmentAssurancePhase8B.jsx`, and `components/LifecycleHistory.jsx`. All data access is centralized in `government-assurance-client.js`.

## 4. Route Inventory

| Surface | Exact route | Component path | Status | Direct/refresh | Browser evidence |
|---|---|---|---|---|---|
| Overview | `#/operator/government-assurance` | `GovernmentAssurance` | Functional summary | Yes | `gpa-acceptance`, 1/1 |
| Programs | `#/operator/government-assurance` + Programs view | `GovernmentAssurance` | Functional list | Base route | `gpa-acceptance` |
| Program detail | `#/operator/government-assurance/programs/:id` | `GovernmentAssurancePortfolioDetail` | Functional projection | Yes | `program-provider-funding-audit-lineage`, 3/3 |
| Providers | Base route + Providers view | `GovernmentAssurance` | Functional list | Base route | Same |
| Provider detail | `#/operator/government-assurance/providers/:id` | `GovernmentAssurancePortfolioDetail` | Functional projection | Yes | Same |
| Funding | Base route + Funding view | `GovernmentAssurance` | Functional list | Base route | Same |
| Funding detail | `#/operator/government-assurance/funding/:id` | `GovernmentAssurancePortfolioDetail` | Functional lineage projection | Yes | Same |
| Claims | Base route + Claims view | `GovernmentAssurance` | Functional list/detail/actions | Base route | `gpa-claim-verification`, 2/2 |
| Claim detail | `#/operator/government-assurance/claims/:id` | `GovernmentAssurance` | Functional canonical detail | Yes | Same |
| Verification | Base route + Verification view | `GovernmentAssurance` | Functional queue/detail/actions | Base route | Same |
| Verification detail | `#/operator/government-assurance/verification/:id` | `GovernmentAssurance` | Functional canonical detail | Yes | Same |
| Monitoring queue | Base route + Monitoring view | `GovernmentAssurance` | Functional queue | Base route | `gpa-monitoring`, 2/2 |
| Plan/activity/request | `#/operator/government-assurance/monitoring/{plans,activities,evidence-requests}/:id` | `GovernmentAssuranceMonitoringDetail` | Functional detail | Yes | Same |
| Finding | `#/operator/government-assurance/findings/:id` | `GovernmentAssuranceMonitoringDetail` | Functional detail/action | Yes | Same |
| Provider response | `#/operator/government-assurance/monitoring/provider-responses/:id` | `GovernmentAssuranceMonitoringDetail` | Functional detail | Yes | Same |
| Corrective action | `#/operator/government-assurance/corrective-actions/:id` | `GovernmentAssuranceMonitoringDetail` | Functional detail/retest | Yes | Same |
| Reconciliation | Base route + Reconciliation view | `GovernmentAssurance` | Functional detail/action | Base route | `gpa-reconciliation-quality`, 3/3 |
| Reconciliation detail | `#/operator/government-assurance/reconciliation/:id` | `GovernmentAssuranceReconciliationDetail` | Functional review | Yes | Same |
| Audit | Base route + Audit view | `GovernmentAssurance` | Functional list/detail | Base route | `gpa-program-provider-funding-audit-lineage` |
| Audit detail | `#/operator/government-assurance/audits/:id` | `GovernmentAssurancePortfolioDetail` | Functional packet projection | Yes | Same |
| Data Sources | Base route + Data Sources view | `GovernmentAssurance` | Functional list | Base route | `gpa-reconciliation-quality` |
| Source detail | `#/operator/government-assurance/data-sources/:id` | `GovernmentAssuranceSourceDetail` | Functional detail | Yes | Same |
| Lineage | `#/operator/government-assurance/lineage/{truth,metric}/:id` | `GovernmentAssuranceLineageDetail` | Functional bounded list | Yes | `program-provider-funding-audit-lineage` |
| Assistant | `#/operator/government-assurance/assistant` | `GovernmentAssurancePhase8B` | Functional governed prompt | Yes | `gpa-ai-reporting`, 3/3 |
| Reports | `#/operator/government-assurance/reports` | `GovernmentAssurancePhase8B` | Functional generation/export | Yes | Same |
| Pilot Administration | Base route + Pilot Administration view | `GovernmentAssurance` | Read/config projection | Base route | `gpa-acceptance` |
| Public | Base route + Public view | `GovernmentAssurance` | Public-safe projection | Base route | `gpa-acceptance` |

Auth, organization, and tenant scope are primarily enforced by the canonical API and client headers. The UI does not present a separate, visible auth guard or role-aware shell. Direct URL isolation is covered by the acceptance suites, including cross-organization and cross-tenant denial cases.

## 5. Screen Inventory

| Screen | Role | Status | Quality | Recommendation | CivicSure priority |
|---|---|---|---|---|---|
| Overview | Executive/operator | Implemented | Adequate | Keep + restructure | P1 |
| Program list/detail | Program manager | Implemented | Partial | Restructure | P2 |
| Provider list/detail | Program manager/provider monitor | Implemented | Partial | Restructure | P2 |
| Funding list/detail | Finance/program manager | Implemented | Partial | Restructure | P1 |
| Claims/detail | Verifier/monitor | Implemented | Adequate | Keep + polish | P2 |
| Verification queue/detail | Verifier | Implemented | Adequate | Keep + polish | P2 |
| Monitoring lifecycle | Monitor | Implemented | Partial | Restructure | P2 |
| Findings/corrective actions | Monitor/provider | Implemented | Partial | Restructure | P2 |
| Reconciliation/quality | Data steward/reviewer | Implemented | Partial | Restructure | P2 |
| Audit/packet | Auditor | Implemented | Partial | Restructure | P3 |
| Data Sources | Data steward/admin | Implemented | Partial | Restructure | P3 |
| Lineage | Auditor/executive | Implemented | Weak-to-partial | Redesign interaction model | P1 |
| GPA Assistant | All authorized operators | Implemented | Partial | Keep architecture, redesign UI | P1 |
| Reports | Executive/operator | Implemented | Partial | Redesign presentation | P1 |
| Pilot Administration | County admin | Implemented projection | Weak | Restructure | P3 |
| Public transparency | Public | Implemented projection | Partial | Redesign public face | P4 |

Most screens have explicit loading, empty, error, and status text. Detail components use generic object-to-definition-list rendering in places, which is useful for coverage but not a finished product information design.

## 6. Product Shell Assessment

The shell is a **generic SHF operator UI**, not a standalone government SaaS application. `OperatorLayout.jsx` displays `SHF Operator`, a plain vertical list of links, and a padded content column. It has no CivicSure product identity, logo/wordmark, organization switcher, role context, user/account area, notifications, help, search, settings, breadcrumbs, or visible session controls. The shell is usable and responsive at a basic level, but it communicates an internal platform module rather than a customer-facing assurance product.

The GPA page itself adds a second navigation layer: fourteen flat buttons in one horizontally scrollable tab row. This is compact for a pilot but does not scale as a role-aware product hierarchy.

## 7. Branding Assessment

Current visible product identity is `SHF Operator`, `Government Assurance`, `Government Program Assurance`, `GPA`, and `County pilot operating view`. `SHF` and `SHS` also appear in shared operator labels, client defaults, and adjacent modules. There is no CivicSure mark, welcome surface, branded login, county identity treatment, or formal product subtitle.

For CivicSure, the shell should use **CivicSure** as the product name and **Government Program Assurance Platform** as the formal descriptor. Internal terms such as GPA may remain in technical documentation and compact secondary labels, but should not lead the customer-facing navigation.

## 8. Design System Assessment

The GPA surface mixes shared global styles with page-local inline CSS. `GovernmentAssurance.jsx` defines its own navy/cool-gray palette (`#16324f`, `#243b53`, `#52606d`, `#d9e2ec`), table geometry, button states, grid breakpoints, and alert styles inside a `<style>` block. Detail pages use local class names and repeated `Panel`, `Table`, and `<dl>` patterns. `OperatorLayout` uses inline layout styles.

The broader repository has reusable SHF tokens in `src/styles/theme-shf.css`: warm sand background, orange brand, white surfaces, 12/16px radii, shadows, status colors, and badge/button primitives. It also has multiple other shell systems. GPA does not clearly consume one shared design-token layer, so its current visual language is consistent enough for a pilot but not a coherent product system.

Reusable primitives already present: `PageHeader`, `StatusChip`, accessible table captions, `Panel`/`Table` patterns, responsive overflow wrappers, labeled forms, `LifecycleHistory`, and canonical error/status conventions. Preserve these concepts and consolidate them into CivicSure tokens/components.

## 9. Information Architecture

The current navigation mirrors backend/workspace domains: Overview, Programs, Providers, Funding, Claims, Verification, Monitoring, Reconciliation, Audit, Data Sources, Assistant, Reports, Pilot Administration, Public. That is appropriate for a controlled operator acceptance surface, but it is too flat and technical for multiple user types.

Recommended future grouping is in section 29. The current IA should be treated as an implementation inventory, not the final CivicSure navigation. Keep stable deep links while introducing grouped navigation and role-aware “My Work” entrypoints.

## 10. Role Experience Assessment

| Role | Rating | Finding |
|---|---|---|
| Executive | PARTIAL | Overview has six KPI-style metrics and action counts, but no polished decision dashboard or executive report-first flow. |
| Program Manager | PARTIAL | Program, funding, claims, monitoring, findings, and audit data exist, but are distributed and technically labeled. |
| Provider | WEAK | Provider projection exists, but no provider-facing shell, task inbox, submission experience, or clear scoped “what I owe” view. |
| Verifier | ADEQUATE | Queue, detail, evidence, contradiction, determination, and history are present; presentation is dense. |
| Monitor | PARTIAL | Lifecycle is covered and canonical, but the queue and detail hierarchy require domain knowledge. |
| Auditor | PARTIAL | Engagement, workpapers, samples, packet, and lineage are available; workflow navigation is not auditor-centered. |
| Investigator | PARTIAL | Restricted content is protected/hidden in acceptance tests, but there is no dedicated restricted-access experience. |
| County Admin | WEAK | Pilot Administration is a read/config projection rather than a complete admin console. |
| Public | PARTIAL | Public-safe facts are separated correctly, but the view is an internal table rather than a credible public transparency experience. |

## 11. Executive Dashboard

A basic executive summary exists in the Overview view: programs, providers, funding awarded, accepted Truth facts, open findings, overdue corrective actions, action-required counts, pilot readiness, and a small lineage list. It does not yet behave as a true executive dashboard. Missing or underdeveloped areas are verified outcomes in context, assurance coverage trend, source health narrative, decisions required, material issue prioritization, reporting period controls, audience-specific language, and a direct path to the Executive Assurance Report.

## 12. Program Experience

Program detail uses canonical `getProgramAssurance`, oversight, funding references, Claims, Metric Results, and Truth Facts. It answers “what is connected to this program?” better than “is this program healthy, verified, and under control?” Generic field dumps, limited cross-links, no visual assurance posture, and no clearly prioritized material issues create cognitive load. **Recommendation: RESTRUCTURE**, preserving the projection/client/API and introducing an identity header, assurance summary, delivery/funding sections, issue queue, and time/period context.

## 13. Provider Experience

Provider detail uses the accepted Provider Integrity projection and shows funding references, claims, metrics, Truth, and related fields. It is useful as an operator inspection surface but not understandable as a provider experience without GPA vocabulary. There is no provider task inbox, response-first workflow, or clear separation between financial exposure, assurance status, and required action. Restricted Investigation content is not exposed by the tested paths. **Recommendation: RESTRUCTURE** with role-specific provider work and explicit permitted-scope messaging.

## 14. Funding Experience

Funding detail provides a canonical lineage table with from/to references, relationship, amount, period, and provenance, plus funding references and readiness blockers. This is the strongest foundation for a finance workflow, but a county finance user still has to interpret a technical edge table. Forward and reverse context, allocation explanations, provider/program grouping, verified expenditure summary, and discrepancy treatment should become first-class visual sections. **Recommendation: KEEP ARCHITECTURE + REDESIGN PRESENTATION.**

## 15. Claim / Verification Experience

Claim and Verification are the most operationally complete verticals. Stable detail routes, readiness, Evidence/admissibility, custody counts, lifecycle history, queue/detail navigation, Start, contradiction, and determination actions are present and browser-tested. The main UX weaknesses are generic key/value rendering, action placement at the bottom of a long detail, technical V-level language without explanation, and no clear “next best action” hierarchy. **Recommendation: KEEP + POLISH**, then use the pattern as the component baseline for other workspaces.

## 16. Monitoring / Findings Experience

The Monitoring page is a queue of plan/activity/request/finding/corrective-action rows. Detail pages expose related records, backend actions, retest controls, and lifecycle history. The canonical workflow is present, but the user must understand the full chain and identify the next step from IDs/statuses. A grouped lifecycle timeline, due-date emphasis, assignment filters, and “my work” views are needed. **Recommendation: RESTRUCTURE, preserve service/action model.**

## 17. Reconciliation / Data Quality Experience

Reconciliation detail is rich in data coverage: Source A/B comparison, Source Authority, Entity Resolution, dimension-level Data Quality, rules, readiness impact, duplicate candidates, downstream impact, determination, and history. It is technically credible but visually dense and still reads like a diagnostic panel. The UI should explain “why this record is blocked” in an evidence hierarchy, not a sequence of implementation panels. **Recommendation: RESTRUCTURE.**

## 18. Audit Experience

Audit detail exposes engagement fields, workpapers, samples, packet provenance, sample results counts, findings, and history through one projection. This is adequate for pilot verification but not an auditor’s working environment: workpaper review, sample execution, exceptions, and packet assembly are not distinct task spaces. **Recommendation: RESTRUCTURE**, with a workpaper-first workspace and packet readiness summary.

## 19. Lineage Explorer

The current lineage view is a bounded ordered list: root Truth/Metric, Metric Definition, Verification, Claim, Evidence, Source Provenance, Source Authority, and Program/Provider/Funding context. This preserves canonical references and avoids unsafe graph behavior. It is not yet an interactive explorer: nodes are not expandable, many references are plain text rather than navigable links, reverse lineage is not presented as a user model, and redaction is not visually explained. **Recommendation: REDESIGN interaction model while preserving the canonical lineage API.**

## 20. GPA AI Assistant

The assistant is a controlled two-column panel with prompt textarea, delegation status, response status/security, canonical facts, analysis, recommendation, and inspectable references. This is a good governance foundation and passes prompt-injection/report browser tests. Product UX remains partial: no task templates, conversation history, source chips, confidence/coverage explanation, clear “insufficient records” state, feedback/review workflow, or strong separation between factual evidence and advisory language beyond headings. **Recommendation: KEEP governance and client contract; REDESIGN product experience.**

## 21. Reporting

Reports are generated from a select, optional canonical subject reference, and a button. The response shows artifact ID, classification, generated time, reference count, and a bounded JSON download. The authority boundary is good; the operator experience is not executive-ready. Missing are scoped filters, reporting period controls, report preview, readable document output, report history, generation progress, metadata explanation, and a clear internal/public designation. **Recommendation: REDESIGN presentation, preserve ReportArtifactService authority.**

## 22. Pilot Administration

Pilot Administration is a table of provisioned configurations with name, status, program/provider counts, and effective date. It communicates a read-only status projection, not a county administrator’s control plane. It should eventually group organization/tenant, users/roles, service access, sources, Data Use, AI, reporting, approvals, and lifecycle. **Recommendation: RESTRUCTURE after the core product shell.**

## 23. Public Experience

The Public view clearly states that only Truth facts explicitly approved for public disclosure appear. That is a strong boundary. The presentation is still an internal table with technical columns such as verification level and accepted date. A CivicSure public transparency face needs plain-language definitions, source/approval context, accessible filtering, period labels, disclosure status, and a public navigation shell without exposing internal terminology.

## 24. Responsive UX

The accepted suite reports 15/15 browser tests, including responsive staff pages with no document overflow. GPA itself uses a responsive grid and overflow-wrapped tables; at narrow widths the tab row scrolls horizontally and tables preserve a 620px minimum width. This prevents page-level breakage but creates mobile scanning and interaction cost. Desktop is the intended operator environment; tablet is viable; mobile is usable for review but not ideal for dense operational work. Detail actions and long tables need responsive grouping rather than only horizontal scrolling.

## 25. Accessibility UX

The accepted browser suite passes accessible names, headings, focus, and status semantics, and the GPA components include semantic headings, table captions, labels, `role=status`, `role=alert`, and `aria-live`. Product-quality gaps remain: focus destination after hash navigation is not clearly managed, generic table/detail content can be hard to scan with a screen reader, some statuses depend strongly on visual color chips, and the lineage list lacks expandable semantics because it is not yet expandable. Accessibility is technically acceptable for the pilot baseline, but CivicSure needs a dedicated component-level accessibility polish pass.

## 26. Content / Terminology

| Internal technical label | Potential user-facing label | Keep technical term visible? |
|---|---|---|
| Truth Fact | Accepted program fact | Secondary only |
| Verification Method | Verification standard | Yes in detail/help |
| Verification level / V-level | Assurance level | Yes with explanation |
| Reconciliation Case | Record conflict review | Secondary only |
| Source Authority | Authoritative source rule | Yes in data steward view |
| Readiness blocker | What must be resolved | No as primary label |
| Provider Integrity projection | Provider assurance view | No |
| Canonical reference | Record reference | Secondary only |
| Determination | Review decision | Yes where action is formal |
| Data Use Policy | Authorized data use | Yes with plain-language summary |
| Public-safe Truth | Public-approved result | No as primary label |

The product should retain exact canonical vocabulary in metadata, audit, and advanced views while leading with plain-language explanations.

## 27. CivicSure Product-Face Gap Analysis

| Capability | Assessment |
|---|---|
| CivicSure logo/wordmark | MISSING |
| Branded shell | MISSING; current shell says SHF Operator |
| Product login/welcome | MISSING from GPA surface |
| Role-aware dashboard | PARTIAL; shared overview only |
| Executive dashboard | PARTIAL |
| Operator navigation | ALREADY EXISTS, needs grouping |
| Search/global record lookup | MISSING |
| Notifications/help/settings/profile | MISSING |
| County branding | MISSING |
| Terminology layer | MISSING |
| Reporting polish | PARTIAL |
| Mobile workflow polish | PARTIAL |
| Public transparency page | PARTIAL |
| Empty/error states | ALREADY EXISTS, needs content polish |
| Accessibility foundation | ALREADY EXISTS, needs product polish |

## 28. Reuse vs Redesign Matrix

| Surface | Keep | Polish | Restructure | Redesign | Replace |
|---|---:|---:|---:|---:|---:|
| Canonical GPA client/API contract | Yes |  |  |  |  |
| Phase 8 route/deep-link contract | Yes |  |  |  |  |
| Operator shell layout concept |  | Yes | Yes |  |  |
| Overview metrics | Yes | Yes | Yes |  |  |
| Claim/Verification actions and detail data | Yes | Yes |  |  |  |
| Monitoring lifecycle data model | Yes | Yes | Yes |  |  |
| Reconciliation/quality data coverage | Yes |  | Yes |  |  |
| Funding lineage API and references | Yes | Yes | Yes |  |  |
| Audit packet projection | Yes |  | Yes |  |  |
| Lineage API | Yes |  |  | Yes |  |
| AI governance/client contract | Yes |  |  | Yes UI only |  |
| Reporting authority/artifacts | Yes |  |  | Yes UI only |  |
| Public disclosure authority | Yes | Yes |  | Yes presentation |  |
| Pilot Administration projection | Yes |  | Yes |  |  |

## 29. Recommended CivicSure Information Architecture

### Home
- Executive Overview
- My Work

### Programs
- Programs
- Providers
- Funding

### Assurance
- Claims
- Verification
- Monitoring
- Findings
- Corrective Actions

### Data Integrity
- Reconciliation
- Data Quality
- Sources

### Audit
- Engagements
- Workpapers
- Audit Packets

### Intelligence
- CivicSure Assistant
- Lineage Explorer
- Reports

### Administration
- Pilot Configuration
- Users & Roles
- Service Access
- Data Use
- Sources

### Public
- Transparency

This should be implemented as grouped navigation over stable existing routes, not as a new domain or authority layer.

## 30. Recommended Visual Direction

CivicSure should feel institutional, calm, modern, and trustworthy: high information clarity, restrained contrast, strong typography, excellent tables, explicit status labels, and modest use of color. Use a neutral civic base with one disciplined brand accent, accessible status colors, compact but generous data layouts, and clear role context. Avoid startup-style gradients, decorative illustrations, excessive rounded cards, and dashboard decoration that competes with evidence and decisions.

The design system should consolidate tokens for surface, text, border, focus, status, spacing, density, radius, and typography. Tables and detail sections should be first-class components. The current cool navy GPA palette can be retained as a starting point, but should be reconciled with the broader SHF theme rather than continued as page-local hex values.

## 31. Product-Face Priority Plan

### P0 — Product identity and shell
- CivicSure wordmark and formal descriptor
- branded operator shell
- organization/tenant context
- role context, profile, session, help, notifications
- grouped navigation and breadcrumbs

### P1 — Executive experience
- executive overview
- decisions-required panel
- verified outcomes and funding assurance
- Executive Assurance Report preview/history
- source health and material issue narrative

### P2 — Core operator workflows
- Program, Provider, Funding redesign
- Monitoring/Finding lifecycle workspace
- Reconciliation/Quality review
- Claim/Verification polish
- actionable work queues

### P3 — Administration
- Pilot Administration
- users/roles and service access
- Data Use and source configuration
- county-specific configuration views

### P4 — Public transparency
- public shell
- plain-language disclosures
- approved result browsing
- public report boundaries and accessibility

### P5 — Polish and advanced visualization
- interactive lineage expansion
- advanced filtering/search
- trend visualizations
- report customization
- deeper responsive optimization

## 32. Frontend Architecture Map

```text
Root Vite index entry
  -> src/entries/index.main.jsx
    -> route/hash parser
      -> OperatorLayout
        -> GovernmentAssurance
          -> workspace tables / tab state
          -> PortfolioDetail
          -> MonitoringDetail
          -> ReconciliationDetail
          -> SourceDetail
          -> LineageDetail
          -> Phase8B Assistant + Reports
            -> government-assurance-client.js
              -> GPA API routes
                -> canonical GPA authorities and Reporting/AI governance
```

Shared infrastructure includes `RootProviders`, `PageHeader`, `StatusChip`, global/shell CSS, inline GPA primitives, and `LifecycleHistory`. The principal architecture risk is not authority duplication; it is page composition: most workspace behavior remains in `GovernmentAssurance.jsx`, with route dispatch and tab state coupled to the root entry.

## 33. Audit Document

This file is the requested read-only product audit. It is the only file created by this audit. No runtime code, route, API, migration, acceptance fixture, frozen artifact, or owner file was modified.

## 34. Files Created

- `docs/government-program-assurance/CIVICSURE_FRONTEND_PRODUCT_FACE_AUDIT.md`

## 35. Files Modified

None outside the audit document above. Existing dirty files were preserved unchanged.

## 36. Runtime Integrity

Fresh evidence:

- Full repository Phase 8 browser harness: **15 passed, 0 failed**.
- GPA overview acceptance: **1 passed, 0 failed**.
- Claim/Verification: **2 passed, 0 failed**.
- Monitoring: **2 passed, 0 failed**.
- Reconciliation/Quality: **3 passed, 0 failed**.
- Program/Provider/Funding/Audit/Lineage: **3 passed, 0 failed**.
- AI/Reporting: **3 passed, 0 failed**.
- Root UI contract validation: pass.
- API TypeScript typecheck: pass.
- Root production build: pass, with existing non-blocking large-chunk warnings.
- `git diff --check`: pass.
- Disposable migration replay: 001 through 105 applied; pending `[]`, drift `[]`, unknown applied `[]`.

The in-app browser runtime could not initialize because the browser plugin rejected a restricted `node:process` import. The repository Playwright acceptance specs still exercised Chromium against disposable API/frontend environments and supplied fresh route, DOM, accessibility, responsive, isolation, and workflow evidence. Visual screenshot capture should be repeated when the browser runtime is available before final design sign-off.

**Recommended next step:** begin CivicSure design work with P0 shell/product identity, while treating the current GPA API/client, route contract, canonical detail projections, acceptance harness, and governance boundaries as the implementation foundation.
