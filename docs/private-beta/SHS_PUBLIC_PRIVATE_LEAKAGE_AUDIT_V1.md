# SHS Public / Private Leakage Audit V1

## Executive Summary

This audit checks whether private SHS operational data can accidentally appear on public SHF or public SHS routes during private beta. It inspected SHS Spine doctrine, ClientOps and Production Ops governance audits, Operator Runbook boundaries, route smoke evidence, SHRV1 routes, SHF Impact Data Spine helpers, Reports routes, SHF-Next public routes, SHF-Next internal Ops routes, and SHF-Next Data Approval Gateway routing.

Result: **No critical SHS private-data leakage path was found.**

Leakage risk score: **18 / 100**

Critical leakage found: **No**

Private beta safe: **Yes, supervised only**

Paid launch safe: **No**

Launch recommendation: **GO for supervised private beta. NO-GO for public launch or paid production launch until public-approval semantics, browser leakage evidence, and production auth/session controls are hardened.**

## Public Routes Checked

| Route | App | Status | Evidence |
| --- | --- | --- | --- |
| `/` | SHF-Next | PASS | Public home returns before `OpsShell` and explicitly says it does not expose internal operations, ClientOps records, bridge state, or governance controls. |
| `/solutions` | SHF-Next | PASS | Public solutions route returns before `OpsShell` and says internal production methods and ops workflows are not exposed. |
| `/foundation` | SHF-Next | PASS | Public foundation route returns before `OpsShell` and says internal ops tools, approval controls, and identity metadata are not exposed. |
| `/foundation/impact-report` | SHF-Next | WARNING | Uses SHF Impact Data Spine helpers and labels data Sample/Draft/Not Verified, but sample records are marked `publicApproved: true`. |
| `/foundation/impact-report/print` | SHF-Next | WARNING | Same SHF sample/public-approved semantics as the report generator. |
| `/foundation/report` | SHF-Next | WARNING | Routes to the same public impact report generator path family. |
| `/studio/templates` | SHF-Next | PASS | Public Website Studio page imports local template data only and does not import ClientOps, Production Ops, Sales, QA, or internal reports. |
| `/studio/templates/browse` | SHF-Next | PASS | Public template browse page imports local template data only and stays outside `OpsShell`. |
| `/solutions.html#/request-demo` | SHRV1 | PASS | Public lead/demo route loads `SHSRequestDemoPage`; not an internal ops data surface. |

## Private Routes Checked

| Route | App | Status | Evidence |
| --- | --- | --- | --- |
| `admin.html#/ops/*` | SHRV1 | PASS | Mounted under `AuthGuard`, wrapped in `protect(...)`, and SHS-admin restricted in `hubAccessControl.js`. |
| `admin.html#/hub/sales-pipeline` | SHRV1 | PASS | Protected Hub route; not mounted in public solutions/foundation routes. |
| `admin.html#/hub/opportunities` | SHRV1 | PASS | Protected Hub route; not mounted in public solutions/foundation routes. |
| `admin.html#/hub/bundles` | SHRV1 | PASS | Protected Hub route; not mounted in public solutions/foundation routes. |
| `admin.html#/reports` | SHRV1 | PASS | Protected Reports admin route with permission guard. |
| `admin.html#/reporting` | SHRV1 | PASS | Protected reporting command surface with permission guard. |
| `/reports/snapshot` | Agent Fabric | PASS | Backend summary exposes governance metadata, not client ops records; layer notes state no public data mutation or report publishing. |
| `/ops/command` | SHF-Next | WARNING | Internal and bridge-noticed, but not production-auth gated. |
| `/ops/sales` | SHF-Next | WARNING | Internal and bridge-noticed; Sales data remains under `OpsShell`, but production auth is not implemented. |
| `/ops/projects` | SHF-Next | WARNING | Internal and bridge-noticed; Production Projects remain under `OpsShell`, but production auth is not implemented. |
| `/ops/library` | SHF-Next | WARNING | Internal and bridge-noticed; Development Library remains under `OpsShell`, but production auth is not implemented. |
| `/ops/qa` | SHF-Next | WARNING | Internal and bridge-noticed; QA remains under `OpsShell`, but production auth is not implemented. |
| `/ops/clientops` | SHF-Next | WARNING | Internal and bridge-noticed; ClientOps remains under `OpsShell`, but production auth is not implemented. |
| `/foundation/data-approval` | SHF-Next | WARNING | Classified non-public/foundation-admin and shows `CrossAppAccessNotice`; path remains reachable without production auth in V1. |

## Findings

| ID | Status | Finding | Evidence | Risk |
| --- | --- | --- | --- | --- |
| LKG-001 | PASS | ClientOps private data is not mounted on public routes. | SHF-Next `/ops/clientops` renders inside `OpsShell`; public routes return before `OpsShell`; `SHS_CLIENTOPS_SPINE_METADATA` blocks direct SHF public surfaces. | Low |
| LKG-002 | PASS | Production Ops private data is not mounted on public routes. | SHRV1 `/ops/*` is protected; SHF-Next `/ops/projects` is internal/bridge-noticed; `SHS_PRODUCTION_OPS_SPINE_METADATA` blocks direct public exposure. | Low |
| LKG-003 | PASS | Sales pipeline data is private/internal. | SHRV1 sales routes are protected Hub routes; SHF-Next `/ops/sales` lives under `OpsShell`. | Low |
| LKG-004 | PASS | Internal reports are private/protected. | SHRV1 Reports routes are protected; `/reports/snapshot` returns governance summary data and states layers do not publish reports or mutate public data. | Low |
| LKG-005 | PASS | SHS Spine operational data remains private by doctrine and metadata. | `shsSpine.js` says SHS does not own public approval, public SHF impact publication, or SHF Impact Data Spine mutation. | Low |
| LKG-006 | PASS | SHF public routes use SHF impact/template data, not ClientOps/Production/Sales data. | `ShfImpactReportGenerator.tsx` imports `shfImpactData`; public template pages define template arrays locally. | Low |
| LKG-007 | PASS | `/studio/templates` and `/studio/templates/browse` remain public product pages without private ops imports. | SHF-Next route order returns those pages before OpsShell; page files import only public template/style context. | Low |
| LKG-008 | PASS | `/ops/*` routes remain internal/bridge-noticed in SHF-Next. | `App.tsx` wraps non-public fallback in `OpsShell` and `CrossAppAccessNotice`; identity bridge classifies `/ops/*` as internal. | Medium |
| LKG-009 | WARNING | `/foundation/data-approval` is classified internal/foundation-admin and bridge-noticed, but remains path-accessible without production auth. | `App.tsx` shows `CrossAppAccessNotice` and `ShfDataApprovalGateway`; identity bridge marks route as non-public. | Medium |
| LKG-010 | WARNING | SHF public impact records are Sample/Draft/Not Verified but often `publicApproved: true`. | `shfImpactData.js` and SHF-Next `shfImpactData.ts` filter public routes by `publicApproved` while keeping dataStatus Sample. | Medium |
| LKG-011 | WARNING | SHF-Next internal route protection is classification/notice-based, not production auth. | `CrossAppAccessNotice` returns null for public routes and shows role metadata for non-public routes, but it does not block rendering. | Medium |
| LKG-012 | WARNING | Browser DOM leakage proof was not captured in this pass. | This audit is static-plus-build; it does not include screenshots or automated public-route text scans. | Medium |
| LKG-013 | PASS | SHF Impact Data Spine helper filters public map/report outputs through public-approved helpers. | `isPublicApprovedImpactRecord`, `getPublicApprovedMapCounties`, `getProgramLaneById`, and status summaries enforce public-approved filtering. | Low |
| LKG-014 | WARNING | One cross-app source route for SHRV1 WebMaker uses `/studio/templates` without `admin.html#`, which can confuse public/internal ownership. | `crossAppRouteBridge.js` has `shrv1WebMakerToShfTemplatesBrowse.sourceRoute` as `/studio/templates`. | Low |
| LKG-015 | PASS | No critical leakage from private SHS data into public SHF surfaces was found. | Combined route and import inspection. | Low |

## Leakage Risk Score

Score: **18 / 100**

Scoring basis:

- No critical direct import/render path from ClientOps, Production Ops, or Sales into public routes.
- SHRV1 internal routes are protected.
- SHF-Next public routes return before internal OpsShell routing.
- SHF public report surfaces use SHF Impact Data Spine helpers.
- Risk remains from sample records marked `publicApproved: true`, bridge-notice-only internal routes, and missing browser DOM proof.

## Recommended Fixes

1. Clarify SHF public data semantics so Sample/Draft records are not treated as production public-approved records before public launch.
2. Add browser leakage smoke that scans public routes for private strings: ClientOps, Production Ops, support tickets, contract status, payment status, lead details, localStorage keys, and internal route metadata.
3. Replace SHF-Next bridge-notice-only internal route separation with production auth/session gating before paid launch.
4. Normalize `crossAppRouteBridge.js` source route for SHRV1 WebMaker to `admin.html#/studio/templates` or document the intentional public/admin split.
5. Add an automated import-boundary check that public SHF/SHS routes do not import SHF-Next ops components or SHRV1 private ops datasets.

## Launch Recommendation

Supervised private beta: **GO**.

Public launch: **NO-GO** until public-approval semantics and browser leakage evidence are hardened.

Paid production launch: **NO-GO** until production auth/session, durable persistence, launch/report gates, public/private leakage automation, and final public approval controls are complete.

## Validation Results

| Command | Result |
| --- | --- |
| `python3 -m json.tool docs/private-beta/SHS_PUBLIC_PRIVATE_LEAKAGE_AUDIT_V1.json` | PASS |
| `npm run build` | PASS with existing Vite large-chunk warning |
| `npm run check:governance` | PASS |
| `(shf-next) npm run build` | PASS with Vite large-chunk warning; required escalated rerun because sandbox blocked TypeScript build-info writes outside SHRV1 |
| `(shf-next) npm run lint` | PASS |

## Final Decision

SHS Public / Private Leakage Audit V1 finds no critical leakage of private SHS operational data into public SHF or public SHS routes. Supervised private beta is safe under existing constraints. Paid launch and public launch remain blocked by public-approval semantics, production auth/session, and browser-level leakage proof.
