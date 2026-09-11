# CivicSure Product Shell v1

## Identity

**Customer-facing name:** CivicSure  
**Formal name:** CivicSure — Government Program Assurance Platform  
**Category:** Government Program Assurance Infrastructure  
**Developer/company:** Silicon Heartland  
**Positioning:** Know what was funded. Know what was delivered. Know what actually worked. Prove it.  
**Assurance expression:** Public Dollar → Verified Outcome

This shell is an authenticated product frame around the accepted GPA runtime. It is not a new authority, router domain, authentication system, or reporting system.

## Visual Principles

CivicSure is institutional, calm, credible, modern, highly legible, restrained, evidence-oriented, operational, and trustworthy. The shell uses a white surface, light neutral canvas, charcoal text, soft borders, and a deep civic blue accent. It avoids gradients, neon, decorative charts, excessive shadows, novelty visuals, and marketing-style hero composition.

## Shell Anatomy

- Skip link and semantic application landmarks.
- Top application bar with CivicSure wordmark, formal descriptor, active organization context, role context, current user context, and a disabled Help foundation until a supported help destination exists.
- Grouped responsive sidebar: Home, Programs, Assurance, Data Integrity, Audit, Intelligence, Administration, and Public.
- Breadcrumbs derived from the current canonical hash/path route.
- Main content frame preserving the existing GPA page and detail projections.
- Mobile drawer with keyboard focus, Escape close, backdrop, and selected-route state.

## Navigation IA

The sidebar maps to existing functionality only. Programs, Providers, Funding, Claims, Verification, Monitoring, Reconciliation, Data Sources, Audits, CivicSure AI, Reports, Pilot Administration, and Transparency use existing GPA views or existing stable routes. Findings, Corrective Actions, Data Quality, and Lineage are presented as grouped entry foundations where the current product does not have a separate list route; no fake functionality or duplicate authority was introduced.

The query form `#/operator/government-assurance?view=...` is a presentation-level view selector for existing GPA tabs. Existing detail URLs under `/operator/government-assurance/...` remain unchanged.

## Design Tokens

The namespaced `civicsure.css` layer defines:

- canvas `#f7f8fa`
- surface `#ffffff`
- text `#17202a`
- muted text `#5d6875`
- border `#d9e0e7`
- primary civic blue `#17324d`
- primary hover `#10263a`
- secondary accent `#3e607c`
- light accent `#eaf0f5`
- success, warning, danger, restricted, and focus tokens
- shell width, spacing, focus, navigation, status, and responsive behavior

The layer is namespaced under `.civicsure-shell` so unrelated SHF surfaces keep their existing styles.

## Reusable Primitives

- `CivicSureShell`
- `CivicSurePageHeader`
- `CivicSureStatus`
- `civicSureTerminology` / `presentCivicSureTerm`

Existing GPA tables, detail projections, `LifecycleHistory`, `PageHeader` consumers outside GPA, canonical client, and backend services remain reusable and unchanged in authority.

## Terminology Presentation

The UI may lead with plain-language labels while retaining canonical vocabulary in advanced context:

| Canonical term | Primary presentation |
|---|---|
| Truth Fact | Verified fact |
| Reconciliation Case | Data conflict review |
| Source Authority | Authoritative source |
| V-level | Verification level |
| Readiness blocker | What needs attention |

Backend names, audit events, API payloads, and canonical identifiers are not renamed.

## Role-Aware Navigation Principles

The shell provides role context and grouped navigation without becoming an authorization authority. Backend permissions remain final. Future permission-aware navigation may hide or disable unavailable surfaces, but must preserve safe direct-URL denial behavior. Organization and tenant context are displayed from the existing active context mechanism; no organization selector or account authority was added.

## Responsive Behavior

- Desktop: persistent sidebar and top bar.
- Tablet: collapsible drawer sidebar with backdrop.
- Mobile: drawer navigation, compact context display, stacked page headers, and preserved access to the existing content frame.
- Tables and dense GPA pages retain their existing bounded horizontal overflow behavior; full workflow-specific mobile redesign is deferred.

## Accessibility

The shell provides a skip link, semantic header/nav/main landmarks, grouped navigation headings, `aria-current`, visible focus, labeled mobile controls, Escape-to-close behavior, focus movement when the drawer opens/closes, readable status labels, and reduced-motion support. Status colors are paired with text.

## Preserved GPA Architecture

The shell wraps, rather than recreates:

- GPA route parsing and stable detail URLs
- `government-assurance-client.js`
- Organization/Tenant scope
- Claim/Verification
- Monitoring/Finding/Corrective Action
- Reconciliation/Data Quality
- Program/Provider/Funding
- Audit and Lineage
- AI Governance
- Reporting and Public Disclosure

No migration, API route, canonical authority, or frozen GPA artifact changed in this wave.

## Future Design Waves

P1 should redesign the executive Overview, Reports, CivicSure AI, and Lineage presentation. P2 should reorganize core operator work queues and detail layouts. P3 should complete county administration. P4 should redesign public transparency. P5 may add advanced visualization and deeper mobile optimization.
