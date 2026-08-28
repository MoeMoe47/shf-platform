# SHF Trusted Reporting Legacy / Orphan Closure

Status: `LEGACY_CLEANUP_COMPLETE_ACTIVE_COMPATIBILITY_BRIDGES_REMAIN`

## Inventory summary

| Classification | Count | Summary |
|---|---:|---|
| `CANONICAL_ACTIVE` | 12 | SHS reporting routes/repositories, Agent Fabric Truth/metric/report services, and canonical public projection |
| `LEGACY_PRESENTATION_ONLY` | 9 | Static Impact/dashboard values, browser UX history, export/history presentation, and non-authoritative Hub fields |
| `DEVELOPMENT_TEST_ONLY` | 8 | Fixtures, seed/test records, JSONL/SQLite local stores, mock providers and test-only data |
| `REPLACED_SAFE_TO_DELETE` | 0 | No candidate met every deletion gate |
| `REPLACED_BUT_CALLERS_REMAIN` | 2 | `shsReportStorage.js`; browser Truth bridge/engine |
| `DUPLICATE_AUTHORITY_RISK` | 0 | No active duplicate canonical report/publication authority found |
| `ORPHAN_CONFIRMED` | 0 | No candidate met every invocation/dependency check |
| `COMPATIBILITY_BRIDGE_ACTIVE` | 2 | Truth Spine Hub bridge and curriculum public-population compatibility path |
| `DEFERRED_EXTERNAL` | 3 | Azure, Auth0, and Hub real canonical data |
| `UNKNOWN_REQUIRES_REVIEW` | 0 | No production authority left unclassified in the reviewed scope |

Counts are bounded audit categories, not a claim that every repository file is
a reporting artifact.

## Deletion review

`src/data/shsReports/shsReportSeedData.js` has no runtime import, but the
reporting lineage registry and implementation-status documentation still name
it as a controlled legacy artifact. Because documentation and registry
references are required control dependencies, the deletion gate is not
complete. The module is retained as `DEVELOPMENT_TEST_ONLY` until those
control references are deliberately migrated in a separate review. No database
or institutional data was touched.

## Retained legacy and development paths

`src/data/shsReports/shsReportStorage.js` remains active because
`ShsReportsCommandPage.jsx` and `ShsExportMetadataPage.jsx` import it. It is
not canonical Trusted Reporting authority, but deleting it now would break
live presentation surfaces and their regression assumptions.

The browser Truth Spine adapter/engine remains active for Hub reports,
referral lifecycle, partner queue, and administrative Truth views. It contains
development auth and local fallback behavior and must not be treated as a
production authority; its callers and the explicit curriculum compatibility
bridge require a separate migration proof before retirement.

Static Impact values, Hub workflow/export values, browser report history,
localStorage progress/audit, JSONL/SQLite Agent Fabric stores, fixtures, mock
providers, and demo records remain presentation-only or development/test-only.
They are not promoted into Truth, Metric Registry, Reporting Service, or
publication authority. Production guards already exclude fixture/demo identity
and JSONL canonical authority paths.

## Route and authority findings

Canonical SHS routes include authenticated reporting drafts, public eligibility,
disclosure, snapshots, publication authorization/execution, restricted
distribution, and the intentional public Impact projection read. Hub routes
remain authenticated in the frontend. No orphan production route or duplicate
publication route was proven. `reports.publish` remains a legacy permission
reference in authorization regression tests and is not the canonical snapshot
or publication execution path; callers and policy retirement are not yet
proven absent, so it was retained.

The canonical public curriculum projection and governance/publication chain are
preserved. Public projection failure remains unavailable rather than falling
back to static impact values. Oracle/AI code remains advisory and no reviewed
Trusted Reporting path promotes it to canonical Truth.

## Registry and bridge status

The reporting surface registry and lineage matrix accurately retain migration
statuses for mixed/legacy surfaces, including `shsReportStorage`, Hub Reports,
and the Truth bridge. No registry update was justified by this deletion. The
curriculum public-population compatibility bridge remains active by contract.

No package dependency was removed: the retained seed module has no package
boundary, and all remaining dependencies retain verified callers.

## Proof and unresolved work

The seed module has no runtime callers, but has documented control references.
Canonical curriculum public reads,
governance/publication routing, auth/security boundaries, and no-fallback
behavior were regression-checked. No canonical data, history, migration row,
identity link, or public record was deleted.

Remaining demolition requires caller migration and replacement proof for the
legacy report store, browser Truth bridge/engine, fabricated export path, mixed
Hub Reports fields, and browser-authority paths outside the completed vertical
slices. Broad backup files and unrelated application mocks were not deleted
because ownership or consumer requirements were not proven in this slice.
