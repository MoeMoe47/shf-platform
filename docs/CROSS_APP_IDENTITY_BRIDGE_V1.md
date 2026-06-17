# Cross-App Identity Bridge V1

Generated: 2026-06-15T09:58:03.572443+00:00

## Executive Summary

Cross-App Identity Bridge V1 establishes SHRV1 as the Identity & Access authority and SHF-Next as a consumer of route boundary metadata. V1 is intentionally local-dev and non-blocking: it shows internal route notices in SHF-Next without creating a duplicate login system, user database, backend auth path, secret-bearing URL, or production token mechanism.

## What V1 Implements

- SHRV1 config-only bridge metadata in `src/system/identity/crossAppIdentityBridge.js`.
- SHF-Next mirrored route-class rules in `src/data/crossAppIdentityBridge.ts`.
- SHF-Next `CrossAppAccessNotice` component that is visible on internal routes and hidden on public routes.
- App-level SHF-Next integration for `/ops/*` and `/foundation/data-approval`, with no route blocking.
- A Master Layer Registry note that this bridge belongs under Identity & Access and is not a new layer.

## What V1 Does Not Implement

- No duplicate login system.
- No duplicate user database.
- No `ADMIN_API_KEY` usage or browser-exposed secrets.
- No production token signing or session exchange.
- No backend auth enforcement changes.
- No blocking of SHF-Next routes.

## SHRV1 Authority Model

SHRV1 remains the Identity & Access authority. It owns role families, route boundary metadata, and the future production bridge posture. Truth Spine remains the authority for verified facts; this bridge does not verify claims, approve public output, or mark report readiness.

## SHF-Next Consumer Model

SHF-Next consumes the boundary metadata through local route-class helpers. In V1 it reads only local-dev bridge identity objects from safe localStorage keys and uses them to explain route posture. Rendering continues even when identity is missing.

## Route Class Matrix

| route | class | required roles | notice behavior |
| --- | --- | --- | --- |
| `/ops` | INTERNAL_OPS | shs_admin, shs_ops | shown |
| `/ops/command` | INTERNAL_OPS | shs_admin, shs_ops | shown |
| `/ops/sales` | INTERNAL_OPS | shs_admin, shs_sales, shs_ops | shown |
| `/ops/projects` | INTERNAL_OPS | shs_admin, shs_ops | shown |
| `/ops/library` | INTERNAL_OPS | shs_admin, shs_ops | shown |
| `/ops/qa` | INTERNAL_OPS | shs_admin, shs_qa, shs_ops | shown |
| `/ops/clientops` | INTERNAL_CLIENTOPS | shs_admin, shs_clientops | shown |
| `/studio` | INTERNAL_STUDIO_ADMIN | shs_admin, shs_studio_admin | shown if routed |
| `/studio/templates` | PUBLIC | public | hidden |
| `/studio/templates/browse` | PUBLIC | public | hidden |
| `/foundation/data-approval` | FOUNDATION_ADMIN | shs_admin, shf_admin, shf_reviewer | shown |
| `/foundation/impact-report` | PUBLIC_FOUNDATION | public | hidden |
| `/foundation` | PUBLIC_FOUNDATION | public | hidden |
| `/solutions` | PUBLIC | public | hidden |
| `/` | PUBLIC | public | hidden |
| `unmatched` | OWNER_DECISION_REQUIRED | shs_admin | shown if routed through app shell |

## Role Matrix

| role family | scope |
| --- | --- |
| `shs_admin` | all internal V1 bridge notices; authority/admin family |
| `shs_ops` | /ops, /ops/command, /ops/projects, /ops/library |
| `shs_clientops` | /ops/clientops |
| `shs_sales` | /ops/sales |
| `shs_qa` | /ops/qa |
| `shs_studio_admin` | /studio admin route class |
| `shf_admin` | /foundation/data-approval |
| `shf_reviewer` | /foundation/data-approval |
| `public` | public studio, public foundation report, solutions, homepage |

## Bridge Data Contract

```json
{
  "version": "v1",
  "authority": "shrv1",
  "consumer": "shf-next",
  "subjectId": "string",
  "displayName": "string",
  "email": "string",
  "roleFamily": "allowed role family",
  "roles": [
    "allowed role family"
  ],
  "organization": "string",
  "issuedAt": "ISO-8601 string",
  "expiresAt": "ISO-8601 string optional for local dev",
  "environment": "local-dev",
  "source": "shrv1 local-dev bridge identity or future signed/session bridge"
}
```

## Local Dev Behavior

SHF-Next reads only `shs.identity.bridge.v1` and `shrv1.identity.bridge.v1` from localStorage. If an internal route has no identity, it shows: “Internal route — SHRV1 identity bridge required before production use.” If an identity is present, it shows: “Internal route — identity recognized from SHRV1 bridge.”

## Production Warning

V1 is not production authentication. Production must use a signed/session-backed bridge, server-side validation, no browser secrets, and owner-approved enforcement before blocking routes or enabling approval actions.

## Files Changed

SHRV1:
- `src/system/identity/crossAppIdentityBridge.js`
- `docs/MASTER_LAYER_REGISTRY.md`
- `docs/CROSS_APP_IDENTITY_BRIDGE_V1.md`
- `docs/CROSS_APP_IDENTITY_BRIDGE_V1.json`

SHF-Next:
- `/Users/mikeslate/shf-next/src/data/crossAppIdentityBridge.ts`
- `/Users/mikeslate/shf-next/src/components/CrossAppAccessNotice.tsx`
- `/Users/mikeslate/shf-next/src/App.tsx`

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

## Browser Smoke Results

- `/studio/templates/browse`: PASS, public route rendered without internal notice.
- `/ops/command`: PASS, internal notice rendered with required roles.
- `/ops/clientops`: PASS, internal notice rendered with required roles.
- `/foundation/data-approval`: PASS, foundation admin notice rendered with required roles.
- `/foundation/impact-report`: PASS, public foundation route rendered without internal notice.
- `/`: PASS, public homepage/default route rendered without internal notice.
- Browser console errors: none observed.
- Note: live browser seeding for the “identity present” localStorage case was not performed because this browser runtime exposes page evaluation as read-only. The recognized-identity branch is covered by the component/config logic and successful TypeScript build/lint.

## Remaining Risks

- V1 is local-dev metadata only and does not authenticate users in production.
- Routes are not blocked in V1; the notice is advisory so public pages are not disrupted.
- A future signed/session-backed bridge is required before production enforcement.
- shf-next remains outside the shrv1 git repo and is not a git repository in this environment.
- Unmatched shf-next paths are OWNER_DECISION_REQUIRED in config but may still render the existing fallback DevelopmentLibrary page until a later route hardening pass.

## V1 Complete

V1 complete: true.

Cross-App Identity Bridge V1 is complete as a local-dev, non-blocking identity boundary bridge. SHRV1 remains the Identity & Access authority; SHF-Next consumes route boundary metadata and displays safe internal notices without creating duplicate auth, secrets, or route blocking.
