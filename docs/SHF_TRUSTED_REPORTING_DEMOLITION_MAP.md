# SHF Trusted Reporting Demolition Map

This is a deletion-control artifact. It identifies unsafe or obsolete paths but
does not authorize deletion by itself. The rebuild registry is the structured
control plane; this map records the required proof before removal.

| Candidate | Current role | Replacement | Runtime/dependency evidence | Delete gate | Status |
|---|---|---|---|---|---|
| `src/shared/truth-spine/truthSpineApi.js` | browser Truth adapter and dev-token bridge | authenticated producer adapters and Reporting Service | Hub intake removed as a caller; Hub Reports and other legacy surfaces still require caller review | all remaining callers migrated; route graph checked; fallback tests replaced | ACTIVE_LEGACY |
| `src/data/shsReports/shsReportSeedData.js` | seed report fallback | backend-owned report storage or explicit fixture boundary | imported by legacy report storage/tests | import graph and fixture consumers reviewed | ACTIVE_LEGACY |
| `src/pages/admin/reports/ShsExportMetadataPage.jsx` fabricated path | official-looking export metadata | authorized canonical export | surface registry and Wave 1 safety audit | replacement export tested; no production caller remains | ACTIVE_LEGACY |
| `src/pages/shf-command/components/SHFImpactOhioMap.jsx` static values | public impact fallback | approved public metric/report projection | Wave 1 suppression; no producer exists | public replacement or explicit route-removal decision | ACTIVE_LEGACY |
| `src/pages/shf-command/SHFImpactCommandCenter.jsx` static/mock values | public/internal impact fallback | approved public/internal Reporting Service projection | Wave 1 suppression | replacement and public predicate tests pass | ACTIVE_LEGACY |
| browser-authoritative SHS/Exchange/Grant Binder stores | institutional records or aggregation | authenticated backend services | surface registry browser-authority findings | each complete vertical slice cut over and migration decision recorded | ACTIVE_LEGACY |

No candidate is `SAFE_TO_DELETE` in this checkpoint. No destructive deletion was
performed.

## Legacy/orphan closure review (2026-08-26)

`src/data/shsReports/shsReportSeedData.js` has no runtime import, but its
controlled references in the reporting lineage registry and implementation
status documentation mean the deletion gate is not complete. It remains
`DEVELOPMENT_TEST_ONLY` until those control references are intentionally
migrated.

`src/data/shsReports/shsReportStorage.js` remains
`REPLACED_BUT_CALLERS_REMAIN`: `/ops/reports` and
`/ops/reports/export-metadata` still import it. The browser Truth Spine
adapter/engine remains `COMPATIBILITY_BRIDGE_ACTIVE` / `REPLACED_BUT_CALLERS_REMAIN`
for Hub and administrative readers. The legacy `reports.publish` permission
remains in regression coverage and its retirement is not proven. No other
candidate met the delete gate. Canonical Truth, Evidence, governance, audit,
snapshot, publication, migration, identity, and public projection data were
not deleted. No source artifact was deleted in this review.

The Grant Binder review confirmed that `/grant-binder` renders
`src/pages/admin/GrantBinder.jsx`, which aggregates the browser-local admin and
civic log keys through `src/utils/logAggregator.js`. No backend Grant Binder
record or producer exists. The aggregation and export path remains
`ACTIVE_LEGACY`; a backend-owned replacement and caller/dependency proof are
required before any deletion decision.

The follow-up authority review found no existing backend grant/application/
submission domain to extend. The proposed minimal workspace contract is
documented in `docs/SHF_GRANT_BINDER_BACKEND_AUTHORITY_CONTRACT.md`; this is a
prerequisite only and does not authorize a producer, ingestion, or deletion.

The authority prerequisite is now implemented by `grant_binders` persistence,
scoped API routes, and the Grant Binder client. Browser log aggregation remains
`ACTIVE_LEGACY`; no deletion or backfill is authorized. The next gate is a
separate producer review.

The SHS Create slice now has backend-owned draft persistence through
`/reporting/drafts`; `ShsCreateReportPage` and its direct preview/history path
no longer use `shsReportStorage.js` as canonical authority. That legacy module
still has other SHS report consumers, including export metadata and dashboard
paths, so its deletion gate remains closed until the full caller graph is
migrated and replacement tests pass.

The SHS history slice now reads backend-owned report drafts and scoped,
content-minimized `report_draft_revisions` through the authenticated reporting
API. `ShsReportHistoryTable` no longer calls the legacy
`shsReportStorage.createReportVersion`; the legacy store remains active for
other report consumers and is not deletion-eligible. The backend draft-only
lifecycle has no canonical locked/exported version mutation, so no new lock or
approval state was invented.

The first curriculum slice replaced the hardcoded lesson count in
`src/pages/curriculum/sections/LearningProgressCard.jsx`. The surrounding
browser progress and unrelated dashboard values remain active legacy paths;
this does not authorize deletion of `progressClient.js` or any dashboard
component.

The `surface.curriculum.lesson_completion` review found a personal lesson-detail
workflow at `/curriculum/lesson/:id`, implemented by `LessonBody`. It retains
learner-local completion and backend-sync status only; it does not display an
institutional aggregate. It is therefore retained as `KEEP` / `NOT_APPLICABLE`
to canonical report migration. No deletion or Reporting Service binding is
authorized for this personal UX path.

The `surface.assignments` review found placeholder-only open items and
component-state completion movement in `src/pages/Assignments.jsx`. No
institutional assignment value is present. Keep the navigation/interaction
regression coverage, but do not treat the placeholder list as a producer or
metric source. No deletion is authorized from this review.

The Hub referral runtime review is now backed by isolated development proof:
operational event, Evidence, unverified Source, and draft Truth creation with
idempotent replay. `IntakeNavigatorConsole` now uses SHS API business success
and backend reporting delivery status only; failed API creation no longer
creates local Truth. The shared Truth adapter remains `ACTIVE_LEGACY` because
other Hub readers still use it. No deletion is authorized.

The infrastructure checkpoint now includes the bounded
`npm run worker:trusted-reporting` entrypoint and migration/concurrency contract
tests. This is deployment-ready code, not proof of migration execution or a
running worker; no Hub fallback deletion gate has been satisfied.
