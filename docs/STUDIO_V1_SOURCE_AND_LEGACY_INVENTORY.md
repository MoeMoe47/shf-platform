# SHRV1 Studio V1 Source and Legacy Inventory

Certification inventory for 2026-09-02. This is a classification aid, not a deletion plan.

## Active Studio Source

| Surface | Classification | Authority / role |
|---|---|---|
| `apps/shs-api/src/domain/studio/` | CANONICAL | Studio project, workspace, QA, Review, Delivery, and institutional integration services. |
| `apps/shs-api/migrations/069_studio_handoff_project.sql` through `074_studio_completion_requirement.sql` | CANONICAL | Durable Studio schema and the Studio-to-completion linkage. |
| `apps/shs-api/src/domain/studio/api/studio-project-routes.ts` | CANONICAL | Authenticated Studio API boundary. |
| `src/pages/studio/` | CANONICAL | Student Studio shell, project, builder, QA, review, delivery, institutional status, and assignment progress views. |
| `src/lib/studio/` and `src/styles/studio.css` | SUPPORTING | Studio API client, projections, resource/build-packet helpers, and presentation styles. |
| `src/router/CurriculumRoutes.jsx` Studio branch | CANONICAL | Student route map under the curriculum shell. |
| assignment routes/services and completion-policy adapters | CANONICAL | Assignment entitlement, Studio requirement evaluation, and whole-policy completion authority. |
| verified Evidence service and existing outbox/event infrastructure | CANONICAL | Institutional Evidence provenance and downstream projection boundaries. |
| `apps/shs-api/tests/studio*.test.ts`, `tests/studio-*.test.mjs`, and `tests/phase*` Studio specs | SUPPORTING | Contract, browser, security, and regression evidence. |
| `docs/STUDIO_PHASE_*` and `docs/STUDIO_V1_*` | REFERENCE ONLY | Historical phase contracts and consolidated V1 decisions; source remains authoritative. |

## Canonical Route and API Ownership

The student route tree is the `CurriculumRoutes.jsx` `/studio` branch. The backend route file above owns handoff, projects, resources, Build Packet, workspace, QA, Review, Delivery, institutional status/Evidence, and assignment progress. No legacy builder route is used as the student Studio authority.

## Legacy and Overlapping Surfaces

| Surface | Classification | Disposition |
|---|---|---|
| `src/pages/admin/BuilderHub.jsx` and protected `/builder` | CLIENT / ADMIN LEGACY | KEEP for existing admin workflow; do not treat as student Studio truth. |
| protected `/web-maker` and `/studio/templates` aliases in `src/router/AdminRoutes.jsx` | LEGACY BRIDGE | KEEP for compatibility; student canonical templates are `/studio/templates` in `CurriculumRoutes.jsx`. |
| `src/pages/public/WebMakerPage.jsx` | LEGACY / PRESENTATION | REFERENCE ONLY for the older public Web Maker surface; no durable Studio authority. |
| `src/router/*.bak_*` route snapshots | REFERENCE ONLY | Do not execute or remove during Studio certification. |
| SHF-Next route bridge/audit documents | REFERENCE ONLY | Preserve the route classification; do not promote prototype routes into Studio authority. |
| `src/pages/career/Portfolio.jsx`, `src/pages/PortfolioNew.jsx`, domain-specific Portfolio pages, and related UI | SEPARATE / LEGACY PORTFOLIO | KEEP for existing non-Studio experiences; Studio Portfolio remains `NOT_CONNECTED`. |
| `LessonTemplate.jsx`, lesson-body “Save to Portfolio” controls, and local persistence helpers | BROWSER / LEGACY | KEEP for existing lesson behavior; not canonical Studio Evidence or Portfolio state. |
| `src/pages/admin/agents/AgentWorkbenchPage.jsx` localStorage task state | ADMIN PROTOTYPE | KEEP as explicitly non-production/non-Studio execution; no Registry or Studio authority. |
| audit-output storage/localStorage inventories | REFERENCE ONLY | Preserve as historical audit evidence, not runtime truth. |

## Certification Rules

Do not delete or merge a legacy surface solely because it overlaps in naming. Removal requires a caller inventory, route regression proof, and owner-approved deprecation. New Studio work must use the canonical student route, the SHRV1 API, PostgreSQL-backed Studio tables, and the existing Evidence/Completion authorities. Browser storage, prototype builders, and Portfolio UI cannot satisfy institutional Studio facts.
