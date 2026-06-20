# SHS Route Smoke Evidence V1

## Executive Summary

This audit verifies the route surfaces required for SHS private beta operation across SHRV1 and SHF-Next. The audit is static-plus-build evidence: route definitions, page/component presence, navigation references, public/private classification, and build/governance validation were checked. No runtime behavior was changed.

Private beta route readiness score: **92 / 100**

Route count: **30**

Classification counts:

- PASS: **25**
- WARNING: **5**
- FAIL: **0**

Private beta ready: **YES, with warnings**

The route set is sufficient for supervised private beta operation. The main improvements before broader use are stronger route discoverability for Hub sales pages, a dedicated Watchtower admin surface or clearer alias labeling, and production-grade auth/session enforcement for SHF-Next internal ops routes.

## Evidence Sources

- `src/router/AdminRoutes.jsx`
- `src/components/admin/AdminSidebar.jsx`
- `src/system/identity/hubAccessControl.js`
- `src/router/SolutionsRoutes.jsx`
- `src/entries/solutions.main.jsx`
- `src/pages/admin/ops/`
- `src/pages/hub/`
- `/Users/mikeslate/shf-next/src/App.tsx`
- `/Users/mikeslate/shf-next/src/pages/`
- `/Users/mikeslate/shf-next/package.json`

## Route Status Table

| Route | App | Classification | Status | Navigation | Notes |
| --- | --- | --- | --- | --- | --- |
| `admin.html#/hub/sales-pipeline` | SHRV1 | Private Hub / client_admin+shs_admin | WARNING | Shared Hub business nav and in-page links; not AdminSidebar | Route exists and is protected. Consider main nav discoverability for private beta operators. |
| `admin.html#/hub/opportunities` | SHRV1 | Private Hub / client_admin+shs_admin | WARNING | Shared Hub business nav and in-page links; not AdminSidebar | Route exists and is protected. Consider main nav discoverability for private beta operators. |
| `admin.html#/hub/bundles` | SHRV1 | Private Hub / client_admin+shs_admin | WARNING | Shared Hub business nav and in-page links; not AdminSidebar | Route exists and is protected. Consider main nav discoverability for private beta operators. |
| `/solutions.html#/request-demo` | SHRV1 | Public lead intake | PASS | Public Solutions route | Route exists in `SolutionsRoutes.jsx` and loads `SHSRequestDemoPage`. |
| `admin.html#/ops/production` | SHRV1 | Private Production Ops / shs_admin | PASS | AdminSidebar Production Ops | Route exists, protected, and linked. |
| `admin.html#/ops/projects` | SHRV1 | Private Production Ops / shs_admin | PASS | AdminSidebar Production Ops | Route exists, protected, and linked. |
| `admin.html#/ops/brand-profile` | SHRV1 | Private Production Ops / shs_admin | PASS | AdminSidebar Production Ops | Route exists, protected, and linked. |
| `admin.html#/ops/page-intent` | SHRV1 | Private Production Ops / shs_admin | PASS | AdminSidebar Production Ops | Route exists, protected, and linked. |
| `admin.html#/ops/layout-blueprint` | SHRV1 | Private Production Ops / shs_admin | PASS | AdminSidebar Production Ops | Route exists, protected, and linked. |
| `admin.html#/ops/visual-treatment` | SHRV1 | Private Production Ops / shs_admin | PASS | AdminSidebar Production Ops | Route exists, protected, and linked. |
| `admin.html#/ops/assets` | SHRV1 | Private Production Ops / shs_admin | PASS | AdminSidebar Production Ops | Route exists, protected, and linked. |
| `admin.html#/ops/data-binding` | SHRV1 | Private Production Ops / shs_admin | PASS | AdminSidebar Production Ops | Route exists, protected, and linked. |
| `admin.html#/ops/mock-review` | SHRV1 | Private Production Ops / shs_admin | PASS | AdminSidebar Production Ops | Route exists, protected, and linked. |
| `admin.html#/ops/build-packet` | SHRV1 | Private Production Ops / shs_admin | PASS | AdminSidebar Production Ops | Route exists, protected, and linked. |
| `admin.html#/ops/screenshot-qa` | SHRV1 | Private Production Ops / shs_admin | PASS | AdminSidebar Production Ops | Route exists, protected, and linked. |
| `admin.html#/ops/learning` | SHRV1 | Private Production Ops / shs_admin | PASS | AdminSidebar Production Ops | Route exists, protected, and linked. |
| `admin.html#/truth-spine` | SHRV1 | Private Governance / shs_admin | PASS | AdminSidebar System | Route exists, protected, and linked. |
| `admin.html#/oracle` | SHRV1 | Private Governance / shs_admin | PASS | AdminSidebar System | Route exists, protected, and linked. |
| `admin.html#/agent-fabric` | SHRV1 | Private Governance / shs_admin | PASS | AdminSidebar System | Route exists, protected, and linked. |
| `admin.html#/reports` | SHRV1 | Private Reports / client_admin+shs_admin plus permission guard | PASS | AdminSidebar Operations | Route exists, protected, and linked. |
| `admin.html#/watchtower` | SHRV1 | Private Governance alias / shs_admin | WARNING | No direct sidebar link; redirects to Agent Fabric | Route exists as a protected alias target via `/agent-fabric`, but there is no dedicated Watchtower page. |
| `/ops/command` | SHF-Next | Internal Ops | PASS | OpsShell nav | Manual pathname route exists and shows CrossAppAccessNotice. |
| `/ops/sales` | SHF-Next | Internal Ops | PASS | OpsShell nav | Manual pathname route exists and shows CrossAppAccessNotice. |
| `/ops/projects` | SHF-Next | Internal Ops | PASS | OpsShell nav | Manual pathname route exists and shows CrossAppAccessNotice. |
| `/ops/library` | SHF-Next | Internal Ops | PASS | OpsShell nav | Manual pathname route exists through Development Library fallback and shows CrossAppAccessNotice. |
| `/ops/qa` | SHF-Next | Internal Ops | PASS | OpsShell nav | Manual pathname route exists and shows CrossAppAccessNotice. |
| `/ops/clientops` | SHF-Next | Internal Ops | PASS | OpsShell nav | Manual pathname route exists and shows CrossAppAccessNotice. |
| `/studio/templates` | SHF-Next | Public Studio | PASS | Public home and solutions links | Public route renders outside OpsShell and does not show bridge notice. |
| `/studio/templates/browse` | SHF-Next | Public Studio | PASS | Studio template links | Public browse route renders outside OpsShell and does not show bridge notice. |
| `/foundation/data-approval` | SHF-Next | Internal/Foundation Admin | WARNING | Foundation report link | Route shows CrossAppAccessNotice and data approval gateway, but remains path-accessible without production auth. Treat as private-beta internal only. |

## Missing Routes

No required private beta route was missing.

## Broken Navigation

No broken navigation reference was found for required routes. Warnings:

- Hub sales routes are cross-linked inside Hub business pages but are not listed in `AdminSidebar.jsx`.
- `admin.html#/watchtower` redirects to Agent Fabric and has no direct sidebar link.
- SHF-Next `/foundation/data-approval` is reachable by public path but protected only by visible bridge notice in this V1 app.

## Public / Private Risks

1. SHF-Next internal ops routes use manual client-side routing and CrossAppAccessNotice, not production auth.
2. `/foundation/data-approval` is intentionally treated as internal/foundation-admin, but it is reachable at a public-looking path.
3. SHRV1 `/watchtower` is not a dedicated page; operators may expect Watchtower-specific navigation.

## Top Fixes

1. Add explicit operator navigation for `admin.html#/hub/sales-pipeline`, `admin.html#/hub/opportunities`, and `admin.html#/hub/bundles` if these are daily private beta routes.
2. Either add a dedicated Watchtower admin surface later or rename the alias/navigation expectation to make Agent Fabric the official Watchtower-visible surface.
3. Before paid launch, replace SHF-Next CrossAppAccessNotice-only internal separation with production auth/session gating.
4. Keep `/studio/templates` and `/studio/templates/browse` public and outside OpsShell.
5. Keep ClientOps, Production Ops, Sales Ops, QA, and Data Approval private/internal.

## Validation Results

| Command | Result |
| --- | --- |
| `python3 -m json.tool docs/private-beta/SHS_ROUTE_SMOKE_EVIDENCE_V1.json` | PASS |
| `npm run build` | PASS with existing Vite large-chunk warning |
| `npm run check:governance` | PASS |
| `(shf-next) npm run build` | PASS with Vite large-chunk warning; required escalated rerun because sandbox blocked TS build-info writes outside SHRV1 |
| `(shf-next) npm run lint` | PASS |

## Final Decision

SHS Route Smoke Evidence V1 is complete as a route audit. Current evidence supports supervised private beta route readiness with warnings, not paid-launch-grade auth readiness.
