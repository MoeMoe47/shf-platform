# Environment / ADMIN_API_KEY Guidance V1

## Executive Summary

Environment / ADMIN_API_KEY Guidance V1 defines how SHRV1, Agent Fabric, and SHF-Next should handle local, staging, production, and demo configuration without leaking secrets or weakening governance boundaries.

This is a documentation and placeholder-env pass only. It does not change auth checks, route behavior, services, persistence, or deployment logic.

V1 decision:

- `.env`, `.env.*`, and `.env.local` must remain uncommitted.
- `.env.example` may be committed only with placeholders and non-secret local defaults.
- `ADMIN_API_KEY` is server-side/admin-smoke configuration only.
- Cross-app URL configuration uses `VITE_SHRV1_BASE_URL` and `VITE_SHF_NEXT_BASE_URL`.
- Real keys must live in local ignored files or environment/secret manager configuration, never source control.

## Environment Levels

| Environment | Host / Base URL Pattern | ADMIN_API_KEY Expectation | Route Bridge Expectation | Identity Bridge Expectation | Secret Handling |
| --- | --- | --- | --- | --- | --- |
| Local dev | Loopback SHRV1 and SHF-Next Vite hosts, usually `http://127.0.0.1:5174` and `http://127.0.0.1:5175` | Optional unless calling protected admin endpoints | Defaults are acceptable; explicit env vars are safer | Local-dev metadata only | Placeholder or local-only ignored files |
| Local smoke | Loopback app and Agent Fabric services | Required for admin-protected smoke calls | Explicit local base URLs when both apps run | Internal/local route classifications | Shell env or ignored local files only |
| Staging | HTTPS staging domains or owner-approved internal staging URLs | Required and stored in staging secret manager | Explicit staging `VITE_SHRV1_BASE_URL` and `VITE_SHF_NEXT_BASE_URL` | Staging identity context; internal surfaces stay gated/noticed | Secret manager only |
| Production | Canonical HTTPS production domains | Required, high-entropy, owner-controlled, rotated | Explicit production base URLs; no localhost defaults | Production identity/session rules before paid/public launch | Secret manager only; never client bundle/logs/docs |
| Demo / funder demo | Demo-approved local, staging, or controlled public demo URL | Demo/staging key only for operator-run protected actions | Public routes stay public-safe; internal routes are controlled | Clearly demo/internal where applicable | No real keys in decks, screenshots, recordings, or reports |

## ADMIN_API_KEY Rules

- `ADMIN_API_KEY` is a server-side setting for admin-protected Agent Fabric operations.
- It must never be embedded in Vite client code.
- It must never appear in URLs, query strings, docs, screenshots, reports, or committed files.
- Protected smoke commands may send it as `X-Admin-Key` from a local shell or managed runtime secret.
- Missing keys on protected endpoints must fail closed.
- Staging and production must use different keys.
- Demo keys must not reuse production keys.
- A suspected leak requires immediate rotation.

## Cross-App Base URL Guidance

Canonical cross-app env vars:

- `VITE_SHRV1_BASE_URL`
  - Local default: `http://127.0.0.1:5174`
  - Purpose: SHRV1 admin route bridge target.
  - Secret: no.
- `VITE_SHF_NEXT_BASE_URL`
  - Local default: `http://127.0.0.1:5175`
  - Purpose: SHF-Next public/internal route bridge target.
  - Secret: no.
- `SHF_WEB_ORIGIN`
  - Local example: `http://127.0.0.1:5174`
  - Purpose: optional backend CORS origin configuration.
  - Secret: no.

The route bridge must not carry secrets in base URLs. Existing bridge safety rejects secret-looking URL patterns such as admin API keys, bearer tokens, token query params, roles, and permissions.

## `.env` Policy

Current policy:

- `.env` is ignored.
- `.env.*` is ignored.
- `.env.local` is ignored.
- `.env.example` is allowed.
- `.env.sample` and `.env.template` are allowed if placeholder-only.

Rules:

- Commit only placeholder environment templates.
- Do not commit real `.env` files.
- Do not paste real secrets into docs.
- Do not stage generated runtime logs or local JSON persistence.
- Do not rely on `.env.example` as a production configuration source.

## Secret Scanning Checklist

Before staging or release packaging:

1. Run `git status --short`.
2. Review `git diff --name-status`.
3. Review `.env.example` changes.
4. Search staged changes for `ADMIN_API_KEY=`, `Bearer `, `authorization`, `client_secret`, `api_key`, `token=`, and private-key markers.
5. Confirm no `.env`, `.env.local`, runtime logs, local persistence files, `dist/`, `node_modules/`, cache, or screenshots containing secrets are staged.
6. Confirm demo decks, reports, and screenshots do not reveal headers or keys.

## Local Setup Checklist

1. Copy `.env.example` to an ignored local env file such as `.env.local`.
2. Replace the placeholder `ADMIN_API_KEY` locally only if admin smoke checks are required.
3. Start SHRV1 on `VITE_SHRV1_BASE_URL`.
4. Start SHF-Next on `VITE_SHF_NEXT_BASE_URL` when testing cross-app links.
5. Run governance and build checks before staging related environment docs.

## Staging Setup Checklist

1. Configure `ADMIN_API_KEY` in staging secret management.
2. Configure `VITE_SHRV1_BASE_URL` to a staging HTTPS SHRV1 origin.
3. Configure `VITE_SHF_NEXT_BASE_URL` to a staging HTTPS SHF-Next origin.
4. Configure backend allowed web origin for the staging frontend.
5. Run route bridge and identity bridge smoke checks.
6. Confirm no staging secrets appear in logs or build artifacts.

## Production Setup Checklist

1. Generate a production-only high-entropy `ADMIN_API_KEY`.
2. Store it in production secret management.
3. Configure production HTTPS base URLs explicitly.
4. Confirm production CORS origins.
5. Confirm public/private route classification.
6. Smoke test protected endpoints with missing, invalid, and valid keys.
7. Run final secret scan, governance checks, and build.
8. Record owner approval before paid or public launch.

## Key Rotation Checklist

1. Generate a new environment-specific key.
2. Update the target environment's secret manager.
3. Restart or redeploy services that read `ADMIN_API_KEY`.
4. Smoke test missing, invalid, and valid key cases.
5. Revoke the old key.
6. Record the rotation owner, date, and reason outside public docs.

## Suspected Leak Checklist

1. Treat the key as compromised.
2. Rotate it immediately.
3. Search current diffs, staged changes, git history, logs, screenshots, exported docs, and demo artifacts.
4. Quarantine or remove exposed artifacts.
5. Audit protected endpoint access around the exposure window.
6. Document the incident without writing the leaked value.

## Release Validation

Required release checks:

```bash
python3 -m json.tool docs/ENVIRONMENT_ADMIN_API_KEY_GUIDANCE_V1.json
npm run check:governance
python3 scripts/check_master_layer_registry.py
python3 scripts/check_truth_spine_freeze.py
python3 scripts/check_duplicate_layer_cleanup.py
python3 scripts/check_runtime_log_hygiene.py
npm run build
git status --short
git diff --name-status
git diff --stat
```

Because `.env.example` was created in this pass, also run:

```bash
git diff -- .gitignore .env.example
```

## Files Changed

- `.env.example`
- `docs/ENVIRONMENT_ADMIN_API_KEY_GUIDANCE_V1.md`
- `docs/ENVIRONMENT_ADMIN_API_KEY_GUIDANCE_V1.json`

## Remaining Risks

- This pass does not implement production auth/session hardening.
- Production secret storage depends on deployment infrastructure outside this repo.
- Operators must continue to avoid exposing keys in terminal recordings, screenshots, logs, and reports.
- Paid launch still requires production persistence, launch gates, and owner approval.

## Validation Results

| Command | Result |
| --- | --- |
| `python3 -m json.tool docs/ENVIRONMENT_ADMIN_API_KEY_GUIDANCE_V1.json` | PASS |
| `npm run check:governance` | PASS |
| `python3 scripts/check_master_layer_registry.py` | PASS |
| `python3 scripts/check_truth_spine_freeze.py` | PASS |
| `python3 scripts/check_duplicate_layer_cleanup.py` | PASS |
| `python3 scripts/check_runtime_log_hygiene.py` | PASS |
| `npm run build` | PASS with existing Vite large-chunk warning |
| `git diff -- .gitignore .env.example` | PASS; no tracked diff output because `.env.example` is newly untracked |

## V1 Complete

Yes. Environment / ADMIN_API_KEY Guidance V1 is complete as documentation and placeholder environment guidance. No runtime behavior, auth checks, services, routes, persistence, or package scripts were changed.
