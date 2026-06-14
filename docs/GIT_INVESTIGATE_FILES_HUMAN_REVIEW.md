# Git INVESTIGATE Files Human Review

Generated: 2026-06-14T10:43:52
Updated: 2026-06-14T11:02:46

This is a review-only human decision packet for the 11 INVESTIGATE files from `docs/GIT_NEEDS_REVIEW_DECISION_REPORT.json`.

## Owner Decision Update

Owner approved BuilderHub/WebMaker boundary as active work. BuilderHub is the admin/internal control surface, WebMakerPage is the public/user-facing builder page, and web-maker.css remains the shared current stylesheet for now. Shared assets may be refactored later but should not block staging.

## Why These 11 Were Marked INVESTIGATE

- They touch active entrypoints, admin routes, public Website Studio routing, SHF Impact map/report data, Identity & Access, or Production Ops.
- The prior stabilization pass could not confidently tie them to the frozen governance sprint, so they need owner review before staging.
- Several untracked files are imported by active modified code, so archiving them without coordinated source changes would break build or route behavior.

## Current Status Summary

| Classification | Count |
|---|---:|
| KEEP_ACTIVE | 0 |
| STAGE_AFTER_OWNER_APPROVAL | 11 |
| ARCHIVE_AFTER_OWNER_APPROVAL | 0 |
| SPLIT_OR_MERGE_REQUIRED | 0 |
| RESTORE_OR_REVERT_AFTER_OWNER_APPROVAL | 0 |
| IGNORE_RUNTIME | 0 |
| BLOCKED_PENDING_HUMAN_DECISION | 0 |
| Total | 11 |

## Current Git Status For Each

| Path | Status | Tracked | Active | Classification |
|---|---:|---:|---:|---|
| `src/entries/index.main.jsx` | `M` | true | true | STAGE_AFTER_OWNER_APPROVAL |
| `src/pages/admin/BuilderHub.jsx` | `M` | true | true | STAGE_AFTER_OWNER_APPROVAL |
| `src/pages/shf-command/SHFImpactCommandCenter.jsx` | `M` | true | true | STAGE_AFTER_OWNER_APPROVAL |
| `src/pages/shf-command/components/SHFImpactOhioMap.jsx` | `M` | true | true | STAGE_AFTER_OWNER_APPROVAL |
| `src/pages/shf-command/components/shf-impact-ohio-map.css` | `M` | true | true | STAGE_AFTER_OWNER_APPROVAL |
| `src/system/identity/hubAccessControl.js` | `M` | true | true | STAGE_AFTER_OWNER_APPROVAL |
| `src/system/identity/identityRouting.js` | `M` | true | true | STAGE_AFTER_OWNER_APPROVAL |
| `src/data/shfImpactData.js` | `??` | false | true | STAGE_AFTER_OWNER_APPROVAL |
| `src/pages/admin/ops/` | `??` | false | true | STAGE_AFTER_OWNER_APPROVAL |
| `src/pages/admin/web-maker.css` | `??` | false | true | STAGE_AFTER_OWNER_APPROVAL |
| `src/pages/public/WebMakerPage.jsx` | `??` | false | true | STAGE_AFTER_OWNER_APPROVAL |

## Files Safe To Keep

All 11 reviewed paths are active working-tree files and should remain in the working tree until staged or otherwise handled with explicit owner approval. None should be archived automatically.

| Path | Status | Classification | Next Action |
|---|---:|---|---|
| `src/entries/index.main.jsx` | `M` | STAGE_AFTER_OWNER_APPROVAL | Keep in repo. Stage only with WebMakerPage.jsx and web-maker.css after owner confirms /studio/templates should be public from index.html. |
| `src/pages/admin/BuilderHub.jsx` | `M` | STAGE_AFTER_OWNER_APPROVAL | Stage after owner approval as active BuilderHub/WebMaker work; keep BuilderHub as the admin/internal control surface for now. |
| `src/pages/shf-command/SHFImpactCommandCenter.jsx` | `M` | STAGE_AFTER_OWNER_APPROVAL | Keep active. Stage only after owner confirms the report generator route and dev/prod href are correct. |
| `src/pages/shf-command/components/SHFImpactOhioMap.jsx` | `M` | STAGE_AFTER_OWNER_APPROVAL | Stage only as part of SHF Impact Data Spine bundle with shfImpactData.js and CSS after owner validates public/sample language. |
| `src/pages/shf-command/components/shf-impact-ohio-map.css` | `M` | STAGE_AFTER_OWNER_APPROVAL | Stage only with SHFImpactOhioMap.jsx after owner visual review of desktop/mobile map panel. |
| `src/system/identity/hubAccessControl.js` | `M` | STAGE_AFTER_OWNER_APPROVAL | Stage only with AdminRoutes/AdminSidebar and ops/governance route bundle after owner confirms role policy. |
| `src/system/identity/identityRouting.js` | `M` | STAGE_AFTER_OWNER_APPROVAL | Owner/security approval required before staging; confirm production builds cannot expose the override and that localStorage keys are acceptable. |
| `src/data/shfImpactData.js` | `??` | STAGE_AFTER_OWNER_APPROVAL | Keep active. Stage only with SHF map bundle after owner validates data, labels, and source-of-truth relationship with shf-next. |
| `src/pages/admin/ops/` | `??` | STAGE_AFTER_OWNER_APPROVAL | Stage only as a Production Ops bundle with AdminRoutes/AdminSidebar/hubAccessControl after owner confirms it is current official Production Ops work. |
| `src/pages/admin/web-maker.css` | `??` | STAGE_AFTER_OWNER_APPROVAL | Stage after owner approval as the shared current stylesheet for BuilderHub/WebMaker; shared assets may be refactored later. |
| `src/pages/public/WebMakerPage.jsx` | `??` | STAGE_AFTER_OWNER_APPROVAL | Stage after owner approval as active public/user-facing WebMaker builder page. |


## Files Needing Owner Approval Before Staging / Approved Boundary

All 11 files now fall under `STAGE_AFTER_OWNER_APPROVAL`. The BuilderHub/WebMaker boundary is owner-approved as active work; remaining staging should still be deliberate and bundled by area.

| Path | Status | Classification | Next Action |
|---|---:|---|---|
| `src/entries/index.main.jsx` | `M` | STAGE_AFTER_OWNER_APPROVAL | Keep in repo. Stage only with WebMakerPage.jsx and web-maker.css after owner confirms /studio/templates should be public from index.html. |
| `src/pages/admin/BuilderHub.jsx` | `M` | STAGE_AFTER_OWNER_APPROVAL | Stage after owner approval as active BuilderHub/WebMaker work; keep BuilderHub as the admin/internal control surface for now. |
| `src/pages/shf-command/SHFImpactCommandCenter.jsx` | `M` | STAGE_AFTER_OWNER_APPROVAL | Keep active. Stage only after owner confirms the report generator route and dev/prod href are correct. |
| `src/pages/shf-command/components/SHFImpactOhioMap.jsx` | `M` | STAGE_AFTER_OWNER_APPROVAL | Stage only as part of SHF Impact Data Spine bundle with shfImpactData.js and CSS after owner validates public/sample language. |
| `src/pages/shf-command/components/shf-impact-ohio-map.css` | `M` | STAGE_AFTER_OWNER_APPROVAL | Stage only with SHFImpactOhioMap.jsx after owner visual review of desktop/mobile map panel. |
| `src/system/identity/hubAccessControl.js` | `M` | STAGE_AFTER_OWNER_APPROVAL | Stage only with AdminRoutes/AdminSidebar and ops/governance route bundle after owner confirms role policy. |
| `src/system/identity/identityRouting.js` | `M` | STAGE_AFTER_OWNER_APPROVAL | Owner/security approval required before staging; confirm production builds cannot expose the override and that localStorage keys are acceptable. |
| `src/data/shfImpactData.js` | `??` | STAGE_AFTER_OWNER_APPROVAL | Keep active. Stage only with SHF map bundle after owner validates data, labels, and source-of-truth relationship with shf-next. |
| `src/pages/admin/ops/` | `??` | STAGE_AFTER_OWNER_APPROVAL | Stage only as a Production Ops bundle with AdminRoutes/AdminSidebar/hubAccessControl after owner confirms it is current official Production Ops work. |
| `src/pages/admin/web-maker.css` | `??` | STAGE_AFTER_OWNER_APPROVAL | Stage after owner approval as the shared current stylesheet for BuilderHub/WebMaker; shared assets may be refactored later. |
| `src/pages/public/WebMakerPage.jsx` | `??` | STAGE_AFTER_OWNER_APPROVAL | Stage after owner approval as active public/user-facing WebMaker builder page. |


## Files Needing Owner Approval Before Archive

| Path | Status | Classification | Next Action |
|---|---:|---|---|
| None | - | - | - |


## Files Requiring Split/Merge/Revert

| Path | Status | Classification | Next Action |
|---|---:|---|---|
| None | - | - | - |


## Files Blocked Pending Human Decision

| Path | Status | Classification | Next Action |
|---|---:|---|---|
| None | - | - | - |


## Detailed File Review

### src/entries/index.main.jsx

- Current git status: `M`
- Tracked/untracked: tracked modified
- Active: yes
- Related layer(s): Website Studio, Public Page, API Gateway/Entry Routing
- What it is: Main index entrypoint and launcher surface.
- Why dirty/untracked: Adds a public /studio/templates path branch that renders WebMakerPage instead of the normal app launcher.
- Summary of diff/content: One new import plus pathname routing branch for /studio/templates.
- Active references found:
- active entrypoint for index.html
- imports src/pages/public/WebMakerPage.jsx
- special-cases window.location.pathname === /studio/templates
- Risk if staged: Makes /studio/templates a public index.html route and couples index entry behavior to an untracked WebMaker page.
- Risk if archived: Not archivable; this is an active tracked entrypoint. Reverting/removing without approval could remove intended public Website Studio routing.
- Recommended classification: **STAGE_AFTER_OWNER_APPROVAL**
- Recommended next action: Keep in repo. Stage only with WebMakerPage.jsx and web-maker.css after owner confirms /studio/templates should be public from index.html.
- Owner question: Should /studio/templates be a public index route, or should Website Studio live only under admin.html hash routes?
### src/pages/admin/BuilderHub.jsx

- Current git status: `M`
- Tracked/untracked: tracked modified
- Active: yes
- Related layer(s): Website Studio, Admin, Production Ops
- What it is: Tracked active admin BuilderHub page.
- Why dirty/untracked: Original internal BuilderHub links/cards were replaced by a Website Studio/WebMaker landing page with template previews and sound toggle.
- Summary of diff/content: Large rewrite from internal builder navigation to Website Studio marketing/workflow UI; duplicates much of WebMakerPage.jsx content.
- Active references found:
- imported by src/router/AdminRoutes.jsx
- mounted at /builder, /web-maker, and /studio/templates in admin hash routes
- imports src/pages/admin/web-maker.css
- Risk if staged: Could unintentionally remove/replace the internal BuilderHub navigation and blur admin/public Website Studio boundaries.
- Risk if archived: Not archivable; active AdminRoutes depends on this page for /builder and Website Studio aliases.
- Recommended classification: **STAGE_AFTER_OWNER_APPROVAL**
- Recommended next action: Stage after owner approval as active BuilderHub/WebMaker work; keep BuilderHub as the admin/internal control surface for now.
- Owner question: Resolved: owner approved BuilderHub as admin/internal control surface.
- Owner decision note: Owner approved BuilderHub/WebMaker boundary as active work. BuilderHub is the admin/internal control surface, WebMakerPage is the public/user-facing builder page, and web-maker.css remains the shared current stylesheet for now. Shared assets may be refactored later but should not block staging.
### src/pages/shf-command/SHFImpactCommandCenter.jsx

- Current git status: `M`
- Tracked/untracked: tracked modified
- Active: yes
- Related layer(s): SHF Impact Command Center, Reports, Oracle Layer, Truth Spine, Public Impact Map
- What it is: Active SHF Impact Command Center surface.
- Why dirty/untracked: Adds SHF impact report generator href and header link, plus a React fragment around the page/drawer output.
- Summary of diff/content: Adds Generate SHF Impact Report link using dev/prod href logic.
- Active references found:
- imported by src/App.jsx route /shf-command
- imported by src/shf-entry.jsx root route
- lazy imported by src/router/FoundationRoutes.jsx path impact
- imports SHFImpactOhioMap.jsx
- Risk if staged: Exposes/report-links a Foundation impact report route; wrong dev/prod URL could create broken navigation or premature report workflow.
- Risk if archived: Not archivable; mounted active route. Removing or reverting without approval may drop intended report generator access.
- Recommended classification: **STAGE_AFTER_OWNER_APPROVAL**
- Recommended next action: Keep active. Stage only after owner confirms the report generator route and dev/prod href are correct.
- Owner question: Is the report generator link approved for the SHF Command header, and should dev use 127.0.0.1:5174?
### src/pages/shf-command/components/SHFImpactOhioMap.jsx

- Current git status: `M`
- Tracked/untracked: tracked modified
- Active: yes
- Related layer(s): Public Impact Map, SHF Impact Command Center, Public Approval, Reports
- What it is: Active SHF Ohio impact map component.
- Why dirty/untracked: Replaces local hardcoded county data with SHF Impact Data Spine functions and public-approved/sample data labeling.
- Summary of diff/content: Adds SHF Data Spine import, public approved county selection, public data status panel content, and label changes from funding/outcome claims to sample/public data fields.
- Active references found:
- imported by SHFImpactCommandCenter.jsx
- imports src/data/shfImpactData.js
- imports shf-impact-ohio-map.css
- Risk if staged: Public impact map semantics change; sample numbers become centralized and public-approved labels may be mistaken for verified impact if not owner-approved.
- Risk if archived: Not archivable; active map route would lose current modifications and may fail if coupled data file is removed.
- Recommended classification: **STAGE_AFTER_OWNER_APPROVAL**
- Recommended next action: Stage only as part of SHF Impact Data Spine bundle with shfImpactData.js and CSS after owner validates public/sample language.
- Owner question: Are the sample county records and public-approved wording approved for SHF map display?
### src/pages/shf-command/components/shf-impact-ohio-map.css

- Current git status: `M`
- Tracked/untracked: tracked modified
- Active: yes
- Related layer(s): Public Impact Map, SHF Impact Command Center
- What it is: Active CSS for SHF Ohio impact map.
- Why dirty/untracked: Adds Data Spine status panel styling and mobile spacing for the new map status UI.
- Summary of diff/content: Adds .shf-map-data-spine-status block and responsive positioning/padding changes.
- Active references found:
- imported by SHFImpactOhioMap.jsx
- defines .shf-map-data-spine-status classes added by map diff
- Risk if staged: May alter map layout on desktop/mobile; visual overlap risk without screenshot review.
- Risk if archived: Not archivable; active CSS. Removing without reverting JSX would leave unstyled status panel and potential layout issues.
- Recommended classification: **STAGE_AFTER_OWNER_APPROVAL**
- Recommended next action: Stage only with SHFImpactOhioMap.jsx after owner visual review of desktop/mobile map panel.
- Owner question: Does the Data Spine status panel placement pass visual approval on SHF map viewports?
### src/system/identity/hubAccessControl.js

- Current git status: `M`
- Tracked/untracked: tracked modified
- Active: yes
- Related layer(s): Identity & Access, Admin, Website Studio, Production Ops, Truth Spine, Oracle Layer, AI/Swarm Layer, Game Theory Layer
- What it is: Active role and route access-control matrix.
- Why dirty/untracked: Adds access entries for Website Studio aliases, governance pages, tool-dashboard, and /ops/* routes.
- Summary of diff/content: Adds shs_admin-only access for /web-maker, /studio/templates, /truth-spine, /ai-guardrails, /game-theory, and Production Ops routes.
- Active references found:
- imported by src/router/AdminRoutes.jsx
- imported by src/pages/hub/HubWorkspaceDashboard.jsx
- imported by src/pages/hub/shared/hubBusinessNetworkNav.js
- imported by identityRouting.js
- Risk if staged: Changes access boundaries for admin/governance/ops pages; any missing or extra role could expose or block internal surfaces.
- Risk if archived: Not archivable; active identity file. Reverting without route review may block newly mounted governance or ops pages.
- Recommended classification: **STAGE_AFTER_OWNER_APPROVAL**
- Recommended next action: Stage only with AdminRoutes/AdminSidebar and ops/governance route bundle after owner confirms role policy.
- Owner question: Should all /ops/*, /web-maker, /studio/templates, and V1 governance admin pages be shs_admin-only?
### src/system/identity/identityRouting.js

- Current git status: `M`
- Tracked/untracked: tracked modified
- Active: yes
- Related layer(s): Identity & Access, Security/Privacy, Admin
- What it is: Active identity session and landing-route helper.
- Why dirty/untracked: Adds local-development SHS admin override helpers, localStorage override key, and dev-only window.SHS_DEV_IDENTITY helper.
- Summary of diff/content: Adds local dev admin recovery helper guarded by import.meta.env.DEV and localhost, and modifies getCurrentIdentity role resolution.
- Active references found:
- imported by src/router/AdminRoutes.jsx
- imported by src/pages/auth/SHSLoginPage.jsx
- imported by src/pages/hub/HubWorkspaceDashboard.jsx
- exposes window.SHS_DEV_IDENTITY only in import.meta.env.DEV and local host
- Risk if staged: Security-sensitive identity behavior change; if guards are misunderstood or compiled unexpectedly, it could create improper admin override expectations.
- Risk if archived: Not archivable; active identity file. Reverting may remove intended dev admin recovery path for protected admin/ops pages.
- Recommended classification: **STAGE_AFTER_OWNER_APPROVAL**
- Recommended next action: Owner/security approval required before staging; confirm production builds cannot expose the override and that localStorage keys are acceptable.
- Owner question: Is the local dev SHS admin override an approved development-only recovery tool?
### src/data/shfImpactData.js

- Current git status: `??`
- Tracked/untracked: untracked
- Active: yes
- Related layer(s): SHF Impact Command Center, Public Impact Map, Public Approval, Reports, Data Ownership/IP
- What it is: Untracked SHF Impact Data Spine adapter for public map/report outputs.
- Why dirty/untracked: New untracked data file added to support SHF map public-approved/sample data contract.
- Summary of diff/content: Defines SHF data flow rule, sample program lanes, sample county records, public-approved filters, and totals/status helpers.
- Active references found:
- imported by src/pages/shf-command/components/SHFImpactOhioMap.jsx
- exports SHF_DATA_FLOW_RULE and public-approved impact helpers
- comment says it mirrors /Users/mikeslate/shf-next/src/data/shfImpactData.ts
- Risk if staged: Introduces sample public impact data and publicApproved fields that may be mistaken for verified public truth without owner/data approval.
- Risk if archived: Build or route behavior may break because active SHFImpactOhioMap.jsx imports it.
- Recommended classification: **STAGE_AFTER_OWNER_APPROVAL**
- Recommended next action: Keep active. Stage only with SHF map bundle after owner validates data, labels, and source-of-truth relationship with shf-next.
- Owner question: Should shrv1 own this JS mirror of the shf-next SHF Impact Data Spine, or should the data contract live elsewhere?
### src/pages/admin/ops/

- Current git status: `??`
- Tracked/untracked: untracked
- Active: yes
- Related layer(s): Production Ops, QA + Delivery, Website Studio, Admin, Identity & Access
- What it is: Untracked internal Production Ops admin workflow directory.
- Why dirty/untracked: New admin pages/data/storage/CSS for production workflow, page specs, build packets, screenshot QA, and learning loop.
- Summary of diff/content: Contains OpsProductionDashboard plus wrapper pages, opsData, opsStorage, and ops-production.css. Uses localStorage and is mounted by active AdminRoutes changes.
- Active references found:
- multiple files imported by src/router/AdminRoutes.jsx
- AdminSidebar links /ops/* routes
- hubAccessControl.js adds /ops/* shs_admin-only entries
- Risk if staged: Adds a substantial new admin workflow surface outside the governance sprint; may need registry/process approval and UX review.
- Risk if archived: AdminRoutes/AdminSidebar and access-control changes would point at missing files; build would fail if imports remain.
- Recommended classification: **STAGE_AFTER_OWNER_APPROVAL**
- Recommended next action: Stage only as a Production Ops bundle with AdminRoutes/AdminSidebar/hubAccessControl after owner confirms it is current official Production Ops work.
- Owner question: Is the new /ops/* Production Ops workflow approved as active architecture under the registered Production Ops layer?
### src/pages/admin/web-maker.css

- Current git status: `??`
- Tracked/untracked: untracked
- Active: yes
- Related layer(s): Website Studio, Admin, Public Page
- What it is: Untracked shared CSS for Website Studio/WebMaker pages.
- Why dirty/untracked: New stylesheet added for both admin BuilderHub and public WebMakerPage.
- Summary of diff/content: Large page-level CSS for WebMaker hero, cards, templates, responsive layout, and interaction styling.
- Active references found:
- imported by src/pages/admin/BuilderHub.jsx
- imported by src/pages/public/WebMakerPage.jsx
- Risk if staged: Shared admin/public stylesheet may create coupling and future drift if admin and public WebMaker diverge.
- Risk if archived: Both active WebMaker/BuilderHub imports would fail or render unstyled if archived without code changes.
- Recommended classification: **STAGE_AFTER_OWNER_APPROVAL**
- Recommended next action: Stage after owner approval as the shared current stylesheet for BuilderHub/WebMaker; shared assets may be refactored later.
- Owner question: Resolved: owner approved web-maker.css as shared current stylesheet for now.
- Owner decision note: Owner approved BuilderHub/WebMaker boundary as active work. BuilderHub is the admin/internal control surface, WebMakerPage is the public/user-facing builder page, and web-maker.css remains the shared current stylesheet for now. Shared assets may be refactored later but should not block staging.
### src/pages/public/WebMakerPage.jsx

- Current git status: `??`
- Tracked/untracked: untracked
- Active: yes
- Related layer(s): Website Studio, Public Page, Production Ops
- What it is: Untracked public Website Studio/WebMaker page.
- Why dirty/untracked: New public page added and wired through the modified index entrypoint.
- Summary of diff/content: Public-facing WebMaker page content nearly mirrors the modified BuilderHub Website Studio experience.
- Active references found:
- imported by src/entries/index.main.jsx
- uses src/pages/admin/web-maker.css
- renders for pathname /studio/templates in index entrypoint
- Risk if staged: Creates a new public-facing Website Studio route and duplicates admin BuilderHub behavior; public/admin boundary needs owner approval.
- Risk if archived: index.main.jsx import would break build unless the entrypoint change is also reverted.
- Recommended classification: **STAGE_AFTER_OWNER_APPROVAL**
- Recommended next action: Stage after owner approval as active public/user-facing WebMaker builder page.
- Owner question: Resolved: owner approved WebMakerPage as public/user-facing builder page.
- Owner decision note: Owner approved BuilderHub/WebMaker boundary as active work. BuilderHub is the admin/internal control surface, WebMakerPage is the public/user-facing builder page, and web-maker.css remains the shared current stylesheet for now. Shared assets may be refactored later but should not block staging.


## Recommended Owner Review Bundles

- Website Studio/WebMaker boundary: `src/entries/index.main.jsx`, `src/pages/admin/BuilderHub.jsx`, `src/pages/public/WebMakerPage.jsx`, `src/pages/admin/web-maker.css`, plus `/web-maker` and `/studio/templates` route/access entries. Owner approved the BuilderHub/WebMaker boundary as active work; shared CSS/components may move later but should not block staging.
- SHF Impact Data Spine: `src/pages/shf-command/SHFImpactCommandCenter.jsx`, `src/pages/shf-command/components/SHFImpactOhioMap.jsx`, `src/pages/shf-command/components/shf-impact-ohio-map.css`, and `src/data/shfImpactData.js`.
- Identity and Production Ops: `src/system/identity/hubAccessControl.js`, `src/system/identity/identityRouting.js`, and `src/pages/admin/ops/` with AdminRoutes/AdminSidebar route wiring.

## No-Action Confirmation

No `git add`, `git commit`, `git restore`, `git reset`, delete, move, source edit, package edit, route edit, service edit, or behavior edit was performed while updating this report.
