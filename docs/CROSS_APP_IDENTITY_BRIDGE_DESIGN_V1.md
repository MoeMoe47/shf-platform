# Cross-App Identity Bridge Design V1

Generated: 2026-06-15T10:06:15.668448+00:00

## Executive Summary

Cross-App Identity Bridge Design V1 defines how SHRV1 remains the Identity / Access Control authority while SHF-Next consumes route boundary metadata for live operations, studio, foundation presentation, and ClientOps surfaces. This is a design and safe scaffold pass: it does not create real authentication, duplicate user storage, production token signing, or backend enforcement.

## Identity Authority Decision

- SHRV1 is the governance/admin/identity authority.
- SHF-Next consumes route access boundaries and future bridge identity context.
- Cross-App Identity Bridge is not a new layer; it belongs under Identity & Access.
- Truth Spine remains the authority for truth, evidence, report readiness, and public approval state.

## App Ownership Map

### shrv1
- Identity authority
- Governance routes
- Admin role model
- Truth Spine
- Oracle
- AI Guardrails
- Game Theory
- Agent Fabric
- Registry
- Watchtower
- Reports readiness
- LOO trust/governance

### shf-next
- /ops/*
- /ops/clientops / ClientOps
- /studio/*
- /studio/templates/browse
- /foundation/data-approval
- /foundation/impact-report
- public foundation/presentation pages
- template/studio/customer-facing surfaces

## SHF-Next Route Class Matrix

| route | owner app | class | required roles | public/internal | spine dependency | recommended behavior | production risk | phase |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | shf-next | PUBLIC | public | public | none | no notice, no bridge identity required | low; current fallback may expose internal DevelopmentLibrary on unknown routes if not hardened | phase_1_design |
| `/ops` | shf-next | INTERNAL_OPS | shs_admin, shs_ops | internal | Identity & Access, Production Ops, Watchtower later | show non-blocking internal notice in V1; block only after signed/session bridge | internal ops data may be public if hosted without route guard | phase_2_notice |
| `/ops/command` | shf-next | INTERNAL_OPS | shs_admin, shs_ops | internal | Identity & Access, Reports, Watchtower, SHF Impact Data Spine | show non-blocking internal notice; later require bridge identity | command metrics/workflow state could leak | phase_2_notice |
| `/ops/sales` | shf-next | INTERNAL_OPS | shs_admin, shs_sales, shs_ops | internal | Identity & Access, SHS Sales Layer, Reports | show notice; later enforce sales/admin roles | sales pipeline data could leak | phase_2_notice |
| `/ops/projects` | shf-next | INTERNAL_OPS | shs_admin, shs_ops | internal | Identity & Access, Production Ops, QA + Delivery | show notice; later enforce ops/admin roles | project delivery data could leak | phase_2_notice |
| `/ops/library` | shf-next | INTERNAL_OPS | shs_admin, shs_ops | internal | Identity & Access, Development Library, Production Ops | show notice; later enforce ops/admin roles | build packet and reusable process material could be exposed | phase_2_notice |
| `/ops/qa` | shf-next | INTERNAL_OPS | shs_admin, shs_qa, shs_ops | internal | Identity & Access, QA + Delivery | show notice; later enforce QA/admin roles | QA status and delivery issues could leak | phase_2_notice |
| `/ops/clientops` | shf-next | INTERNAL_CLIENTOPS | shs_admin, shs_clientops | internal | Identity & Access, ClientOps, Reports readiness, Truth Spine links | show notice; later enforce clientops/admin identity | client/project facts and reports workflow could leak | phase_2_notice |
| `/studio` | shf-next | INTERNAL_STUDIO_ADMIN | shs_admin, shs_studio_admin | internal if routed outside /studio/templates | Identity & Access, Website Studio | owner decision; public template pages stay public, admin studio route class requires bridge later | risk of accidentally admin-gating public template marketplace or exposing studio admin tools | phase_3_local_dev_enforcement |
| `/studio/templates` | shf-next | PUBLIC | public | public | Website Studio, public content only | no notice; no bridge identity required | public page should not reveal internal controls | phase_1_design |
| `/studio/templates/browse` | shf-next | PUBLIC | public | public | Website Studio marketplace | no notice; keep public | low if page stays public/catalog only | phase_1_design |
| `/studio/templates/floral-boutique` | shf-next | PUBLIC | public | public | Website Studio template preview | no notice; keep public preview | low if preview contains no internal admin data | phase_1_design |
| `/foundation/data-approval` | shf-next | FOUNDATION_ADMIN | shs_admin, shf_admin, shf_reviewer | internal/foundation admin | Identity & Access, SHF Data Approval Gateway, Truth Spine, Reports readiness | show notice in V1; later require signed reviewer/admin identity | approval actions without identity can weaken audit trail | phase_2_notice |
| `/foundation/impact-report` | shf-next | PUBLIC_FOUNDATION | public | public presentation | SHF Impact Data Spine, Reports, Truth metadata where published | no notice; keep public/report presentation unless editing/approval controls appear | public claims need Truth Spine/readiness metadata before publication | phase_1_design |
| `/foundation/impact-report/print` | shf-next | PUBLIC_FOUNDATION | public | public presentation/print | SHF Impact Data Spine, Reports readiness | no notice; do not admin-gate print route in V1 | print claims need verified/report-ready backing | phase_1_design |
| `/foundation/report` | shf-next | PUBLIC_FOUNDATION | public | public alias | SHF Impact Data Spine, Reports readiness | no notice; canonicalize later if needed | alias drift risk | phase_1_design |
| `/foundation` | shf-next | PUBLIC_FOUNDATION | public | public | Public foundation presentation | no notice | owner decision if additional foundation admin routes are added | phase_1_design |
| `/solutions` | shf-next or shrv1 depending host | PUBLIC | public | public | public marketing/presentation | no notice | route ownership and host ambiguity if both apps expose solutions surfaces | phase_1_design |
| `/terms, /privacy, /contact` | shf-next TBD | OWNER_DECISION_REQUIRED | public or shs_admin after owner decision | owner decision | legal/public page ownership | route explicitly before production; avoid current fallback to internal-looking library | public footer links can fall into OpsShell fallback | phase_3_local_dev_enforcement |
| `unmatched paths` | shf-next TBD | OWNER_DECISION_REQUIRED | shs_admin | owner decision | Route Integrity, Identity & Access | do not classify as public by default; show notice if rendered through app shell until route hardening | unknown public URLs can expose internal fallback | phase_3_local_dev_enforcement |

## Role Matrix

| role family | SHRV1 alignment | routes | notes |
| --- | --- | --- | --- |
| `shs_admin` | maps to existing SHRV1 shs_admin | all internal bridge classes | broad admin family for local-dev bridge and future production authority |
| `shs_ops` | new bridge family derived from Production Ops boundary; not an SHRV1 login role yet | /ops, /ops/command, /ops/projects, /ops/library | future granular ops role; shs_admin remains compatible |
| `shs_clientops` | new bridge family derived from ClientOps boundary | /ops/clientops | future client/project workflow access |
| `shs_sales` | new bridge family derived from SHS Sales Layer | /ops/sales | future sales workflow access |
| `shs_qa` | new bridge family derived from QA + Delivery | /ops/qa | future QA workflow access |
| `shs_studio_admin` | new bridge family derived from Website Studio admin boundary | /studio admin class | must not gate public /studio/templates |
| `shf_admin` | new foundation admin bridge family | /foundation/data-approval | future SHF foundation admin/reviewer access |
| `shf_reviewer` | new foundation reviewer bridge family | /foundation/data-approval | future approval/review actions |
| `public` | public route marker, not an authenticated role | /, /studio/templates, /foundation/impact-report, /solutions | must not access internal routes |

## Bridge Data Contract

```json
{
  "identityAuthority": "shrv1",
  "subject": "local-dev-user-or-session-id",
  "roles": [
    "shs_admin"
  ],
  "orgId": "demo-org",
  "permissions": [],
  "issuedBy": "shrv1",
  "environment": "local|staging|production",
  "expiresAt": null,
  "bridgeVersion": "v1"
}
```

## Local Dev Behavior

- Storage keys: shs.identity.bridge.v1, shrv1.identity.bridge.v1
- Allowed: SHF-Next may read localStorage bridge identity only for local development and advisory notices.
- Not allowed: no ADMIN_API_KEY
- Not allowed: no secrets in URLs
- Not allowed: no hardcoded production credentials
- Not allowed: no duplicate user DB
- Current scaffold behavior: existing scaffold shows non-blocking notices on internal routes and does not block rendering

## Production Behavior

- Required future model: signed/session-backed identity handoff owned by SHRV1 and validated server-side or through approved gateway
- Forbidden: browser-exposed admin keys
- Forbidden: query-string secrets
- Forbidden: parallel auth authority in SHF-Next
- Enforcement: not implemented in design V1; future phases only

## Cross-App Link Behavior

SHRV1 to SHF-Next:
- use environment base URL config
- no secrets in query strings
- optional non-sensitive context query only
- include returnTo route only when safe
- same/new tab based on route type

SHF-Next to SHRV1:
- link to governance pages through normal admin shell
- never expose ADMIN_API_KEY
- route users through SHRV1 login/admin flow

## Scaffold Files Created

No new scaffold files were created in this design pass. Existing safe scaffold files are:
- `src/system/identity/crossAppIdentityBridge.js`
- `/Users/mikeslate/shf-next/src/data/crossAppIdentityBridge.ts`
- `/Users/mikeslate/shf-next/src/components/CrossAppAccessNotice.tsx`

## Master Layer Registry Note

No new registry edit was required in this design pass. The existing Identity & Access note states that Cross-App Identity Bridge V1 is not a new layer, SHRV1 remains authority, and SHF-Next consumes route boundary metadata.

## Risk Model

- SHF-Next internal pages can be reachable publicly if hosted without a guard.
- Hardcoded admin keys or URL secrets would compromise governance authority.
- A duplicate identity system in SHF-Next would drift from SHRV1 authority.
- Route drift can make public/internal boundaries inaccurate.
- Public foundation/report pages could be accidentally admin-gated and break public presentation workflows.
- ClientOps/Ops routes may expose sensitive client, delivery, or project data.
- Unknown shf-next paths currently fall to a DevelopmentLibrary-style fallback until a later route hardening pass.

## Implementation Phases

- phase_1: Design docs, route access matrix, and non-invasive bridge config.
- phase_2: Visible access warnings/notices on SHF-Next internal routes without blocking.
- phase_3: Local-dev bridge identity enforcement after owner approval.
- phase_4: Production-safe signed/session-backed bridge with server-side validation.
- phase_5: Watchtower/Reports monitoring for bridge violations, route drift, and missing identity coverage.

## Validation Results

shrv1:
- `python3 scripts/check_master_layer_registry.py`: PASS.
- `python3 scripts/check_truth_spine_freeze.py`: PASS.
- `python3 scripts/check_oracle_layer.py`: PASS.
- `python3 scripts/check_ai_guardrails_layer.py`: PASS.
- `python3 scripts/check_game_theory_layer.py`: PASS.
- `npm run check:governance`: PASS.
- `npm run build`: PASS, existing large chunk warning only.

shf-next:
- `npm run build`: PASS, existing large chunk warning only.
- `npm run lint`: PASS.

## Files Changed

- `docs/CROSS_APP_IDENTITY_BRIDGE_DESIGN_V1.md`
- `docs/CROSS_APP_IDENTITY_BRIDGE_DESIGN_V1.json`

## Remaining Risks

- SHF-Next internal pages can be reachable publicly if hosted without a guard.
- Hardcoded admin keys or URL secrets would compromise governance authority.
- A duplicate identity system in SHF-Next would drift from SHRV1 authority.
- Route drift can make public/internal boundaries inaccurate.
- Public foundation/report pages could be accidentally admin-gated and break public presentation workflows.
- ClientOps/Ops routes may expose sensitive client, delivery, or project data.
- Unknown shf-next paths currently fall to a DevelopmentLibrary-style fallback until a later route hardening pass.

## V1 Complete

V1 complete: true.

Cross-App Identity Bridge Design V1 is complete. The authority decision, ownership map, route class matrix, role matrix, data contract, local-dev behavior, production behavior, cross-app link rules, risk model, and implementation phases are documented. No duplicate identity layer, secrets, production auth behavior, backend auth enforcement, file moves, deletes, commits, or broad rewrites were introduced.
