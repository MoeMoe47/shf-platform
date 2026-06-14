# Git Needs-Review Decision Report

Generated: 2026-06-14T10:22:45

Source: `docs/GIT_STATUS_STABILIZATION_REPORT.json`

## Executive Summary

Reviewed 18 needs-review paths before staging: 7 modified active files and 11 untracked paths. No git staging, committing, restoring, resetting, deleting, moving, source edits, package edits, route edits, or behavior edits were performed while producing this report.

The conservative decision is: do not stage any needs-review item until a human owner approves the active route/data/identity bundles. Archive-later candidates are generated review snapshots, their root-level helper scripts, and the duplicate ASL sanity-test lesson.

## Classification Counts

| Classification | Count |
|---|---:|
| KEEP | 0 |
| STAGE_LATER | 0 |
| IGNORE_RUNTIME | 0 |
| ARCHIVE_LATER | 7 |
| INVESTIGATE | 11 |
| Total reviewed | 18 |

## Modified Needs-Review Files

| Path | Status | Classification | Risk | Protected | Safe to stage later | Reason |
|---|---:|---|---|---:|---:|---|
| `src/entries/index.main.jsx` | `M` | INVESTIGATE | high | true | false | Active index entrypoint now special-cases /studio/templates and imports the untracked public WebMaker page. This changes public routing behavior and should be owner-reviewed with WebMakerPage.jsx and web-maker.css before staging. |
| `src/pages/admin/BuilderHub.jsx` | `M` | INVESTIGATE | high | true | false | Active admin BuilderHub was replaced with a Website Studio/WebMaker landing experience and imports the new shared web-maker stylesheet. This is active admin behavior outside the governance stabilization scope. |
| `src/pages/shf-command/SHFImpactCommandCenter.jsx` | `M` | INVESTIGATE | high | true | false | Active SHF Impact Command Center now adds an impact report generator link and fragment wrapper. This is a mounted SHF route and impacts a protected reporting/data surface. |
| `src/pages/shf-command/components/SHFImpactOhioMap.jsx` | `M` | INVESTIGATE | high | true | false | Active SHF map now depends on untracked src/data/shfImpactData.js and switches from hardcoded county metrics to SHF public-approved sample data. This is governance-sensitive public impact data behavior. |
| `src/pages/shf-command/components/shf-impact-ohio-map.css` | `M` | INVESTIGATE | medium | true | false | Active SHF map styling adds Data Spine status UI and mobile layout changes. It is coupled to the map/data-spine behavior change. |
| `src/system/identity/hubAccessControl.js` | `M` | INVESTIGATE | high | true | false | Identity/access matrix adds Website Studio, governance pages, and /ops/* admin-only routes. Access-control changes are protected and should not be staged casually. |
| `src/system/identity/identityRouting.js` | `M` | INVESTIGATE | high | true | false | Identity routing adds local development admin override helpers and window.SHS_DEV_IDENTITY exposure in dev localhost. Although guarded by DEV/local host checks, identity behavior needs owner/security review. |


## Untracked Needs-Review Files

| Path | Status | Classification | Risk | Protected | Safe to stage later | Reason |
|---|---:|---|---|---:|---:|---|
| `SHS_FOCUSED_REVIEW.txt` | `??` | ARCHIVE_LATER | low | false | false | Generated root-level review snapshot from shs_focused_review.sh; not runtime, not governance source of truth, and stale as of June 1, 2026. |
| `SHS_LIVE_ONLY_REVIEW.txt` | `??` | ARCHIVE_LATER | low | false | false | Generated root-level live-only review snapshot from shs_live_only_review.sh; not runtime, not current governance documentation. |
| `SHS_PROJECT_REVIEW_SNAPSHOT.txt` | `??` | ARCHIVE_LATER | low | false | false | Generated root-level project snapshot from shs_project_snapshot.sh; large historical inspection artifact, not active source. |
| `shs_focused_review.sh` | `??` | ARCHIVE_LATER | low | false | false | Ad hoc snapshot generator at repo root that writes SHS_FOCUSED_REVIEW.txt. Useful historically, but not an official script under scripts/ and not part of governance checks. |
| `shs_live_only_review.sh` | `??` | ARCHIVE_LATER | low | false | false | Ad hoc live-only snapshot generator at repo root. It is not runtime and not an official governance check script. |
| `shs_project_snapshot.sh` | `??` | ARCHIVE_LATER | low | false | false | Ad hoc full project snapshot generator at repo root. It is not runtime and duplicates inspection/reporting behavior outside official scripts. |
| `src/content/lessons/asl-student/student.asl-01-dup.json` | `??` | ARCHIVE_LATER | medium | false | false | Filename indicates a duplicate lesson fixture; content is a small ASL sanity-test duplicate and no active references were found in the focused scan. |
| `src/data/shfImpactData.js` | `??` | INVESTIGATE | high | true | false | Untracked SHF Impact Data Spine adapter is imported by the modified active SHF map and mirrors a shf-next contract. It controls public-approved/sample labels for impact data. |
| `src/pages/admin/ops/` | `??` | INVESTIGATE | high | true | false | Untracked Production Ops admin surface is imported by the modified AdminRoutes and depends on new /ops/* access-control entries. This is active admin architecture/runtime surface. |
| `src/pages/admin/web-maker.css` | `??` | INVESTIGATE | medium | true | false | Untracked stylesheet is imported by both active BuilderHub and public WebMakerPage. It is part of the Website Studio route behavior change. |
| `src/pages/public/WebMakerPage.jsx` | `??` | INVESTIGATE | high | true | false | Untracked public Website Studio page is imported by the active index entrypoint for /studio/templates. It creates a new public route surface outside the governance stabilization scope. |


## Files Safe To Stage Later

| Path | Status | Classification | Risk | Protected | Safe to stage later | Reason |
|---|---:|---|---|---:|---:|---|
| None | - | - | - | - | - | - |


## Files Not Safe To Stage Without Human Decision

| Path | Status | Classification | Risk | Protected | Safe to stage later | Reason |
|---|---:|---|---|---:|---:|---|
| `src/entries/index.main.jsx` | `M` | INVESTIGATE | high | true | false | Active index entrypoint now special-cases /studio/templates and imports the untracked public WebMaker page. This changes public routing behavior and should be owner-reviewed with WebMakerPage.jsx and web-maker.css before staging. |
| `src/pages/admin/BuilderHub.jsx` | `M` | INVESTIGATE | high | true | false | Active admin BuilderHub was replaced with a Website Studio/WebMaker landing experience and imports the new shared web-maker stylesheet. This is active admin behavior outside the governance stabilization scope. |
| `src/pages/shf-command/SHFImpactCommandCenter.jsx` | `M` | INVESTIGATE | high | true | false | Active SHF Impact Command Center now adds an impact report generator link and fragment wrapper. This is a mounted SHF route and impacts a protected reporting/data surface. |
| `src/pages/shf-command/components/SHFImpactOhioMap.jsx` | `M` | INVESTIGATE | high | true | false | Active SHF map now depends on untracked src/data/shfImpactData.js and switches from hardcoded county metrics to SHF public-approved sample data. This is governance-sensitive public impact data behavior. |
| `src/pages/shf-command/components/shf-impact-ohio-map.css` | `M` | INVESTIGATE | medium | true | false | Active SHF map styling adds Data Spine status UI and mobile layout changes. It is coupled to the map/data-spine behavior change. |
| `src/system/identity/hubAccessControl.js` | `M` | INVESTIGATE | high | true | false | Identity/access matrix adds Website Studio, governance pages, and /ops/* admin-only routes. Access-control changes are protected and should not be staged casually. |
| `src/system/identity/identityRouting.js` | `M` | INVESTIGATE | high | true | false | Identity routing adds local development admin override helpers and window.SHS_DEV_IDENTITY exposure in dev localhost. Although guarded by DEV/local host checks, identity behavior needs owner/security review. |
| `src/data/shfImpactData.js` | `??` | INVESTIGATE | high | true | false | Untracked SHF Impact Data Spine adapter is imported by the modified active SHF map and mirrors a shf-next contract. It controls public-approved/sample labels for impact data. |
| `src/pages/admin/ops/` | `??` | INVESTIGATE | high | true | false | Untracked Production Ops admin surface is imported by the modified AdminRoutes and depends on new /ops/* access-control entries. This is active admin architecture/runtime surface. |
| `src/pages/admin/web-maker.css` | `??` | INVESTIGATE | medium | true | false | Untracked stylesheet is imported by both active BuilderHub and public WebMakerPage. It is part of the Website Studio route behavior change. |
| `src/pages/public/WebMakerPage.jsx` | `??` | INVESTIGATE | high | true | false | Untracked public Website Studio page is imported by the active index entrypoint for /studio/templates. It creates a new public route surface outside the governance stabilization scope. |


## Files To Ignore

| Path | Status | Classification | Risk | Protected | Safe to stage later | Reason |
|---|---:|---|---|---:|---:|---|
| None | - | - | - | - | - | - |


## Files To Archive Later

| Path | Status | Classification | Risk | Protected | Safe to stage later | Reason |
|---|---:|---|---|---:|---:|---|
| `SHS_FOCUSED_REVIEW.txt` | `??` | ARCHIVE_LATER | low | false | false | Generated root-level review snapshot from shs_focused_review.sh; not runtime, not governance source of truth, and stale as of June 1, 2026. |
| `SHS_LIVE_ONLY_REVIEW.txt` | `??` | ARCHIVE_LATER | low | false | false | Generated root-level live-only review snapshot from shs_live_only_review.sh; not runtime, not current governance documentation. |
| `SHS_PROJECT_REVIEW_SNAPSHOT.txt` | `??` | ARCHIVE_LATER | low | false | false | Generated root-level project snapshot from shs_project_snapshot.sh; large historical inspection artifact, not active source. |
| `shs_focused_review.sh` | `??` | ARCHIVE_LATER | low | false | false | Ad hoc snapshot generator at repo root that writes SHS_FOCUSED_REVIEW.txt. Useful historically, but not an official script under scripts/ and not part of governance checks. |
| `shs_live_only_review.sh` | `??` | ARCHIVE_LATER | low | false | false | Ad hoc live-only snapshot generator at repo root. It is not runtime and not an official governance check script. |
| `shs_project_snapshot.sh` | `??` | ARCHIVE_LATER | low | false | false | Ad hoc full project snapshot generator at repo root. It is not runtime and duplicates inspection/reporting behavior outside official scripts. |
| `src/content/lessons/asl-student/student.asl-01-dup.json` | `??` | ARCHIVE_LATER | medium | false | false | Filename indicates a duplicate lesson fixture; content is a small ASL sanity-test duplicate and no active references were found in the focused scan. |


## Files Requiring Human Decision

| Path | Status | Classification | Risk | Protected | Safe to stage later | Reason |
|---|---:|---|---|---:|---:|---|
| `src/entries/index.main.jsx` | `M` | INVESTIGATE | high | true | false | Active index entrypoint now special-cases /studio/templates and imports the untracked public WebMaker page. This changes public routing behavior and should be owner-reviewed with WebMakerPage.jsx and web-maker.css before staging. |
| `src/pages/admin/BuilderHub.jsx` | `M` | INVESTIGATE | high | true | false | Active admin BuilderHub was replaced with a Website Studio/WebMaker landing experience and imports the new shared web-maker stylesheet. This is active admin behavior outside the governance stabilization scope. |
| `src/pages/shf-command/SHFImpactCommandCenter.jsx` | `M` | INVESTIGATE | high | true | false | Active SHF Impact Command Center now adds an impact report generator link and fragment wrapper. This is a mounted SHF route and impacts a protected reporting/data surface. |
| `src/pages/shf-command/components/SHFImpactOhioMap.jsx` | `M` | INVESTIGATE | high | true | false | Active SHF map now depends on untracked src/data/shfImpactData.js and switches from hardcoded county metrics to SHF public-approved sample data. This is governance-sensitive public impact data behavior. |
| `src/pages/shf-command/components/shf-impact-ohio-map.css` | `M` | INVESTIGATE | medium | true | false | Active SHF map styling adds Data Spine status UI and mobile layout changes. It is coupled to the map/data-spine behavior change. |
| `src/system/identity/hubAccessControl.js` | `M` | INVESTIGATE | high | true | false | Identity/access matrix adds Website Studio, governance pages, and /ops/* admin-only routes. Access-control changes are protected and should not be staged casually. |
| `src/system/identity/identityRouting.js` | `M` | INVESTIGATE | high | true | false | Identity routing adds local development admin override helpers and window.SHS_DEV_IDENTITY exposure in dev localhost. Although guarded by DEV/local host checks, identity behavior needs owner/security review. |
| `src/data/shfImpactData.js` | `??` | INVESTIGATE | high | true | false | Untracked SHF Impact Data Spine adapter is imported by the modified active SHF map and mirrors a shf-next contract. It controls public-approved/sample labels for impact data. |
| `src/pages/admin/ops/` | `??` | INVESTIGATE | high | true | false | Untracked Production Ops admin surface is imported by the modified AdminRoutes and depends on new /ops/* access-control entries. This is active admin architecture/runtime surface. |
| `src/pages/admin/web-maker.css` | `??` | INVESTIGATE | medium | true | false | Untracked stylesheet is imported by both active BuilderHub and public WebMakerPage. It is part of the Website Studio route behavior change. |
| `src/pages/public/WebMakerPage.jsx` | `??` | INVESTIGATE | high | true | false | Untracked public Website Studio page is imported by the active index entrypoint for /studio/templates. It creates a new public route surface outside the governance stabilization scope. |


## Recommended Bundles For Owner Review

- Website Studio/WebMaker bundle: `src/entries/index.main.jsx`, `src/pages/admin/BuilderHub.jsx`, `src/pages/public/WebMakerPage.jsx`, `src/pages/admin/web-maker.css`, and matching `/web-maker` or `/studio/templates` access-control/route entries.
- SHF Impact Data Spine bundle: `src/pages/shf-command/SHFImpactCommandCenter.jsx`, `src/pages/shf-command/components/SHFImpactOhioMap.jsx`, `src/pages/shf-command/components/shf-impact-ohio-map.css`, and `src/data/shfImpactData.js`.
- Identity/Production Ops bundle: `src/system/identity/hubAccessControl.js`, `src/system/identity/identityRouting.js`, `src/pages/admin/ops/`, plus already-intentional AdminRoutes/AdminSidebar changes.
- Archive-later artifacts: root `SHS_*REVIEW*.txt` files, root `shs_*review*.sh` snapshot scripts, and `src/content/lessons/asl-student/student.asl-01-dup.json`.

## No-Action Confirmation

This report is review-only. It did not run `git add`, `git commit`, `git restore`, or `git reset`. It did not delete or move files. It did not edit source, package, routes, or runtime behavior.
