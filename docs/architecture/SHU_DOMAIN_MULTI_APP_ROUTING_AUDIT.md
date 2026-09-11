# SHU Domain and Multi-App Routing Audit

**Audit date:** 2026-09-07  
**Repository:** `/Users/mikeslate/Projects/shrv1`  
**Branch:** `studio-v1-plus-development`  
**Audit mode:** read-only; no runtime, deployment, DNS, authentication, API, or schema changes made.

## 1. Executive Result

The repository can support the planned Silicon Heartland Universe subdomain model, but it is currently an MPA/path-entry system rather than a hostname-aware multi-product system. The lowest-cost safe v1 is one shared frontend deployment or edge artifact serving multiple explicitly registered hostnames, with hostname-to-product selection added as a bounded adapter. The shared API, Identity, Organization/Tenant, storage, logging, and deployment foundations can remain centralized.

The following are implementation prerequisites before creating real product DNS records:

1. Add a product/host registry and explicit unknown-host behavior.
2. Decide whether the edge rewrites a hostname to an existing HTML entry or the application selects a product shell at runtime.
3. Replace origin-scoped development token assumptions with a reviewed SSO/session strategy.
4. Add all approved product origins to the production CORS allowlist.
5. Define product-aware absolute links, report links, telemetry, CSP, and deployment configuration.
6. Correct the existing `src/entries/index.main.jsx` fallthrough reference to undefined `pathname` before relying on the root entry for additional products.
7. Resolve the production frontend deployment artifact: Azure Terraform currently accepts an optional frontend image, but the repository has no canonical frontend container build context.

The annotated `gpa-v1-accepted-2026-09-06` tag peels to the supplied frozen commit `72071116b4bbf9d6ad687fe8fe41282221a4af0c`; the tag object itself has a different SHA, as expected for an annotated tag. The current working tree is dirty and contains owner work; this audit did not stage or alter it.

## 2. Repository Baseline

| Item | Observed value |
| --- | --- |
| Repository | `/Users/mikeslate/Projects/shrv1` |
| Branch | `studio-v1-plus-development` |
| HEAD | `444b03e47c154156d831d87f6cb9733ce2794fe9` |
| Dirty files | 68 |
| Status hash | `83286405a1a06518a896f8909c43fb3e01e3319d204e0e8aa72da8a2051e0f42` |
| Remote | `origin git@github.com:MoeMoe47/shf-platform.git` |
| Frozen GPA tag | `gpa-v1-accepted-2026-09-06` -> `72071116b4bbf9d6ad687fe8fe41282221a4af0c` |
| Migration state | GPA accepted baseline is 105; current dirty R1 work adds migration 106 |
| Root frontend | Vite/React application at `src/` |
| Additional frontend package | `apps/shf-web/` |
| API package | `apps/shs-api/` |
| Deployment infrastructure | `infra/azure/` Terraform; no canonical frontend image build context |

Relevant frontend roots are `src/entries/`, `src/router/`, `src/routes/`, `src/apps/`, `src/components/`, `src/shared/`, and `apps/shf-web/src/`. Relevant deployment files are `vite.config.js`, `infra/azure/*.tf`, and GitHub workflows under `.github/workflows/`.

## 3. Frontend Entrypoints

### Active root HTML/entry map

The root Vite configuration declares 29 Rollup inputs. The repository contains 31 root HTML files, including files that are not currently declared as Vite inputs.

| Entry | Vite input / file | Product or surface | Auth posture | Hostname readiness |
| --- | --- | --- | --- | --- |
| Root | `index.html` -> `src/entries/index.main.jsx` | Universe gateway plus operator/GPA routes | Mixed | Shared path entry; no host selection |
| Universe | `universe.html` -> `src/entries/universe.main.jsx` | SHU Universe | Public-first | Dedicated entry, no hostname selection |
| OAS | `oas.html` -> `src/entries/oas.main.jsx` | Open Autonomous Standard | Public-first | Dedicated entry |
| OAS subpages | `oas-1.html`, `oas-control-domains.html`, `oas-purpose-boundaries.html`, `oas-risk-classification.html` | OAS documentation surfaces | Public-first | Dedicated entries |
| Admin | `admin.html` -> `src/entries/admin.main.jsx` | SHF admin and operations | Authenticated | Dedicated entry; hash router |
| Foundation | `foundation.html` -> `src/entries/foundation.main.jsx` | Foundation/app gallery | Mixed/public-first | Dedicated entry; contains development HMR script literals |
| Solutions | `solutions.html` -> `src/entries/solutions.main.jsx` | Solutions surface | Mixed/public-first | Dedicated entry; contains development HMR script literals |
| Public | `public.html` -> `src/entries/public.main.jsx` | SHS Exchange public view | Public | HTML exists but is not a Vite Rollup input |
| SHF legacy | `shf.html` -> `src/shf-entry.jsx` | SHF Impact Command Center | Authenticated/mixed | HTML exists but is not a Vite Rollup input |
| Other MPA entries | `career`, `civic`, `credit`, `curriculum`, `debt`, `employer`, `fuel`, `launch`, `ledger`, `lord-of-outcomes`, `sales`, `store`, `treasury`, `ai`, `allocation`, `capital`, `catalog`, `arcade` | Existing SHF apps | Mostly public or app-specific | Dedicated path entries, not hostname-aware |

There are 30 active `src/entries/*.main.jsx` files when the OAS and auxiliary entries are included. The `src/apps/manifest/registry.js` is a shared app-availability registry, not a product-host registry; it contains app IDs such as `career`, `foundation`, `admin`, `curriculum`, `arcade`, `civic`, `credit`, `debt`, `treasury`, `employer`, `sales`, `loo`, `ai`, `fuel`, `launch`, `store`, and `solutions`, but no CivicSure/OAS/Registry/BOS host model.

## 4. Current SHU Product Map

| Planned product | Current classification | Evidence | Assessment |
| --- | --- | --- | --- |
| SHU root | `DEDICATED_ENTRYPOINT` plus Universe route | `index.html`, `universe.html`, `UniverseApp` | Existing gateway/directory role is plausible |
| CivicSure | `SHARED_ENTRYPOINT` / `ROUTE_ONLY` | `index.main.jsx`, `/operator/government-assurance/*`, `CivicSureShell` | Functional product surface, no dedicated HTML or host |
| OAS | `DEDICATED_ENTRYPOINT` | `oas.html` and four OAS HTML entries | Strongest existing product-specific entry pattern |
| Registry | `PARTIAL` / `ROUTE_ONLY` | Universe destination record, admin `/registry`, `/ops/system-registry`; autonomous registry may be separate repository | No single canonical frontend product entry in this repository |
| Studio | `ROUTE_ONLY` / `PARTIAL` | `CurriculumRoutes`, `/studio/*`, `admin.html#/studio/templates` | Substantial routes, shared/legacy shells, no dedicated Studio HTML |
| BOS | `PARTIAL` / `ROUTE_ONLY` | Admin executive command route and Universe destination registry | Authenticated admin surface, not an independent frontend entry |
| Foundation | `DEDICATED_ENTRYPOINT` / `PARTIAL` | `foundation.html`, `foundation.main.jsx` | Dedicated entry exists; production HMR literals require review |
| Solutions | `DEDICATED_ENTRYPOINT` / `PARTIAL` | `solutions.html`, `solutions.main.jsx` | Dedicated entry exists; production HMR literals require review |

The Universe destination registry explicitly documents that BOS and SHF are served by this repository, while Autonomous Registry is a genuinely separate application/repository with an environment-configurable origin. That distinction must be preserved in any host registry.

## 5. Routing Architecture

The current request flow is:

```text
browser URL
  -> selected HTML file or root path
  -> Vite entry module
  -> local pathname/hash parser or React Router tree
  -> page/layout registry
  -> shared or app-specific client
  -> SHS API origin
  -> canonical domain service
```

The architecture is hybrid:

- Vite MPA inputs create separate HTML entrypoints.
- `src/entries/index.main.jsx` is a custom pathname/hash dispatcher for the root application.
- `apps/shf-web/src/routes/index.jsx` is a hash-oriented operator router.
- `src/router/*.jsx` contains React Router route trees for individual app entries.
- Some routes are still explicitly `.html#/...` links.
- No active hostname-aware product selector was found.

The root dispatcher handles GPA paths including overview, Programs, Providers, Funding, Claims, Verification, Monitoring, Findings, Corrective Actions, Reconciliation, Audits, Data Sources, Lineage, Assistant, and Reports. The CivicSure shell wraps these existing pages rather than owning a new route authority.

Existing path/route issues relevant to a future host adapter:

- `src/entries/index.main.jsx` references `pathname` in the `/studio/templates` branch even though the local variable is `routePath`; non-GPA fallthrough can therefore throw before rendering Universe or Studio content.
- Root-level routes depend on the root entry and cannot currently be selected by hostname.
- Hash links such as `#/operator/government-assurance?view=...` are not product-domain links.
- `src/router/appMeta.js` and `src/router/detectBase.js` infer app identity from `.html` paths, not hostnames.

## 6. Hostname Routing

No active `window.location.hostname`, `location.host`, host map, tenant-from-host, or product-from-host implementation was found in the frontend. Hostnames are currently transport/deployment concerns, not application routing inputs.

The smallest safe adapter is a trusted product-host registry used by the edge and, optionally, the root bootstrap:

```text
approved hostname
  -> product key
  -> HTML entry or shell configuration
  -> existing route tree
```

The adapter must validate the complete hostname, reject unknown hosts, and never derive Organization/Tenant from the host. Host selects product experience; authenticated Identity and canonical Organization/Tenant membership select data scope.

Unknown hosts must return an edge 404 or redirect to the SHU gateway. They must never default to `index.html` in a way that exposes CivicSure or another authenticated product.

## 7. Vite Multi-Page Architecture

`vite.config.js` defines a single Vite build with 29 HTML inputs and shared manual chunks for React, maps, charts, motion, export/data utilities, pages, components, and shared code. There is no configured `base`, so generated assets are root-relative. This works when each HTML entry is served at a host root, but it is fragile behind path prefixes or arbitrary reverse-proxy rewrites.

The current build can technically produce multiple product entry bundles, but it does not produce a product/hostname manifest. A subdomain deployment can reuse the same output if the edge maps each hostname to a known HTML entry, or if a bounded runtime host adapter selects the product. Separate per-host path prefixes would require explicit `base` and asset policy work.

Additional concerns:

- `public.html` and `shf.html` exist but are not Rollup inputs.
- `foundation.html` and `solutions.html` include literal `/@vite/client` and `/@react-refresh` script references, which are development-specific and should be removed or gated before production serving.
- Relative/shared chunks are safe at a host root but must be tested under every edge rewrite.
- Dev server configuration is localhost-oriented and does not currently model multiple local hostnames.

## 8. Deployment Options

### Option A: one deployment, many hostnames

All approved subdomains point to one edge/static deployment. Edge rules select the product entry or product configuration. This is the lowest direct cost and reuses one build, one API integration, one operational pipeline, and shared CDN/TLS. It has the largest frontend blast radius and requires strong unknown-host, cache, and product-entry controls.

### Option B: one repository, separate frontend deployments

Each product has a deployment target and hostname. This gives independent rollback, cache, and release cadence, but increases hosting, build, configuration, TLS, monitoring, and operational cost. It also multiplies the chance of auth/CORS/config drift.

### Option C: hybrid

Public/static products share a deployment, while high-sensitivity or independently operated products receive separate targets later. This improves isolation where justified without multiplying every surface.

**Recommendation:** start with Option A for the first subdomain rollout, with a product-host registry, explicit edge mapping, shared API, managed TLS, and strict host allowlisting. Move CivicSure to a separately rollbackable target only if its release cadence, security boundary, or blast radius proves materially different. Option C is the likely long-term shape; Option B is not justified by current repository evidence.

## 9. Shared Core vs Product Frontends

### Shared core to preserve

- Identity/Auth0 session exchange and API auth middleware.
- Organization/Tenant membership and active organization request context.
- SHS API gateway and domain services.
- GPA canonical authorities, Reporting, Public Disclosure, AI Governance, storage, audit, and logging.
- Shared React/Vite dependencies and selected UI primitives.
- Azure Container Apps environment, PostgreSQL, Key Vault, ACR, and Log Analytics where operationally appropriate.

### Product-specific concerns

- HTML entry and product shell.
- Branding, navigation, terminology, metadata, and public/authenticated posture.
- Route registry and product feature flags.
- Product-aware links and telemetry tags.
- Product environment configuration, not secrets embedded in bundles.

## 10. Authentication Architecture

Production API authentication reads the `shs_session` cookie and uses `Auth0SessionService`. `/auth/session/exchange` verifies the external identity and sets an HTTP-only secure session cookie with `SameSite=Lax` and `Path=/`. Logout clears the same cookie. Production cookie configuration does not set a `Domain` attribute, so the cookie is host-only by default.

Frontend development and several GPA clients also use `localStorage`, notably `shfOperatorToken` and `shfOperatorOrganizationId`, with development defaults. Local storage is origin-scoped and cannot provide cross-subdomain SSO. Some legacy clients use hard-coded localhost API origins, while newer clients use `VITE_SHS_API_BASE` or `VITE_API_BASE`.

The canonical Identity backend can support a shared SSO strategy, but the current frontend is not ready for transparent cross-subdomain session reuse.

## 11. Cross-Subdomain Sessions

Current classification: **CONFIGURATION_REQUIRED and SECURITY_REVIEW_REQUIRED**.

The current host-only `shs_session` cookie is the safer default for reducing sibling-subdomain compromise blast radius, but it requires a central login/redirect flow when moving between products. A shared `.siliconheartland.org` cookie would improve navigation convenience but would make every subdomain part of the session trust boundary and would require a deliberate security review, CSRF review, logout design, and subdomain takeover controls.

Recommended v1:

1. Use a central `login.siliconheartland.org` identity/SSO entry backed by existing Identity/Auth0.
2. Keep product sessions host-only unless the security architecture explicitly approves a shared cookie.
3. Pass a signed/validated return target, never an arbitrary redirect URL.
4. Do not use local storage as the cross-product session authority.

## 12. Login Domain Strategy

Recommend a shared central login domain with product-local entry redirects. This avoids duplicating login UX while preserving host-only application sessions and a clear identity trust boundary. `civicsure.siliconheartland.org/login` can redirect to the central identity entry with a validated return URL; it should not become a second authentication authority.

## 13. Organization / Tenant Context

The frontend stores the active organization ID in origin-local storage and clients send `x-shs-organization-id`; backend services validate membership and derive tenant context from canonical identity/session state. The host must not select tenant or organization. A host can select CivicSure versus OAS, but organization, tenant, classification, purpose, and data permissions must remain authenticated backend context.

A product transition must clear or revalidate stale UI organization state against the current session. Public hosts must not inherit an authenticated operator organization context.

## 14. API Addressing

The repository uses mixed API addressing:

- Vite proxies `/api` to `http://127.0.0.1:8091` during development and removes the `/api` prefix.
- Newer clients use `VITE_SHS_API_BASE` or `VITE_API_BASE`.
- Several older clients default directly to `http://127.0.0.1:8091`.
- Azure Terraform supplies a separate `shs_api_origin` and optional `frontend_origin`.

All planned hosts can call one shared API, but production configuration needs a single documented origin strategy. Relative `/api` through an edge gateway is simplest for same-deployment products; absolute API origin is workable if CORS and credentials are explicit. Legacy hard-coded localhost defaults should be treated as a pre-production configuration risk.

## 15. CORS

`apps/shs-api/src/server.ts` requires `AUTH_ALLOWED_ORIGINS` in production, parses an explicit comma-separated allowlist, enables credentials, and does not use a production wildcard. Azure currently sets the value from `frontend_origin` and `shs_api_origin` only.

Each approved product origin will need an explicit allowlist entry or a carefully implemented controlled origin function. Do not use `*` with credentials. UAT and production origins should have separate environment configuration and tests.

## 16. CSP / Security Headers

No complete frontend/edge security-header policy was found in the root deployment path. The API config inspected does not establish a full CSP, HSTS, `Referrer-Policy`, `Permissions-Policy`, or `frame-ancestors` policy for the frontend. A separate Agent Fabric security-header helper exists, but it is not a substitute for frontend edge policy.

Before subdomains go live, define vendor-neutral edge headers with per-product `connect-src` and approved identity/API origins. `frame-ancestors` should be explicit, HSTS should be enabled only when the domain topology is ready, and asset/CDN origins must be known. Public and authenticated products may require different policies.

## 17. Cookie Security

| Strategy | Convenience | Blast radius | Recommendation |
| --- | --- | --- | --- |
| Host-only product cookies | Lower | Lower | Recommended default |
| `.siliconheartland.org` shared cookie | Higher | Higher across every subdomain | Only after security review |
| Local storage token sharing | Not actually cross-origin | High XSS exposure | Do not use as SSO |

Keep `Secure`, `HttpOnly`, and explicit `SameSite` behavior. Centralized SSO with host-only sessions is the safest low-cost approach. Treat every subdomain as a separately compromiseable application until proven otherwise.

## 18. Public vs Authenticated Hosts

| Surface | Likely posture |
| --- | --- |
| `siliconheartland.org` / Universe | Public-first ecosystem gateway |
| CivicSure | Authenticated-first, with a separate public-safe Transparency surface |
| OAS | Public-first standard/documentation site |
| Registry | Mixed; public registry and restricted operations must be separated by canonical policy |
| Studio | Authenticated-first |
| BOS | Authenticated/admin-first |
| Foundation | Public-first with administrative app-gallery functions |
| Solutions | Public-first/product information |

Do not serve public and authenticated applications under one ambiguous host fallback. CivicSure public transparency should remain a policy-controlled route, not a consequence of accepting internal Truth.

## 19. Static Assets

Vite and HTML entries use root-relative asset paths. This is compatible with host-root deployments but not automatically with path-prefix mounting. Image imports and generated chunks are generally Vite-managed; public assets are served from root-relative paths. The edge should preserve host-root semantics or the build should explicitly configure a product base.

The OAS entry intentionally does not import shared SHF/SHS global CSS, which is a useful product isolation precedent. Foundation and Solutions development HMR script literals must be removed/gated before production. HTML entry and asset smoke tests are required per hostname.

## 20. Environment Variables

| Variable family | Classification | Current examples / implications |
| --- | --- | --- |
| API base | Shared plus environment-specific | `VITE_SHS_API_BASE`, `VITE_API_BASE`, legacy localhost defaults |
| Auth/API identity | Shared plus environment-specific | Auth0 issuer/audience and API origin are configured server/deployment-side |
| Product identity | Missing as a unified registry | Titles and labels are hard-coded per HTML/entry |
| Public URLs | Environment/product-specific | `SHF_FRONTEND_BASE_URL` exists in API examples; no product host registry |
| Feature flags | Product/environment-specific | Existing app manifest/local mode flags are not host-aware |
| Analytics | Missing unified product tag | Add product and hostname metadata without putting secrets in bundles |
| Reporting/AI | Shared authority, environment-specific endpoints/config | Preserve canonical service boundaries |
| Secret references | Server/secret-store only | Azure Key Vault is present; frontend must not receive secret values |

## 21. Product Identity Configuration

Product identity is currently distributed among HTML titles, entry modules, app manifests, Universe destination records, and page-local labels. There is no single host/product manifest. A future bounded registry should include `productKey`, approved hostnames, entry key, display name, shell, auth mode, public route, API policy, and environment. It must be configuration metadata, not a duplicate Organization/Tenant or authorization authority.

## 22. DNS Recommendation

Use the apex `siliconheartland.org` as the SHU gateway and point approved product subdomains to the same managed edge/static deployment initially. Prefer individual CNAMEs to the hosting edge when the platform supports them; use wildcard DNS only if the edge can validate and reject unknown hosts and the operational certificate model is clear.

Do not create a wildcard that causes every arbitrary subdomain to serve the root app. The DNS design must make the approved-host registry authoritative at the edge.

## 23. TLS Recommendation

Use managed TLS from the chosen hosting/edge provider. Per-host managed certificates are simplest for a small, explicit product set. A wildcard certificate can reduce certificate administration if the provider manages renewal and the organization accepts the broader certificate scope. No manual certificate provisioning is required by current repository evidence.

## 24. Edge / Reverse Proxy

The current repository does not contain Nginx, Cloudflare, Vercel, Netlify, or other product-host edge rules. Azure Container Apps provides an optional frontend ingress but no checked-in custom-domain mapping was found. A vendor-neutral edge/reverse-proxy layer is therefore required for hostname-to-entry mapping, TLS, unknown-host rejection, cache policy, and security headers.

The edge should either:

- rewrite `civicsure.siliconheartland.org` to the CivicSure-capable root HTML entry while preserving browser paths, or
- route each host to a dedicated generated HTML entry.

The second is clearer for public OAS/Foundation/Solutions entries; the first avoids rebuilding CivicSure into a second runtime. The choice should be captured in a product host registry and tested before DNS creation.

## 25. Deployment Tooling

Observed deployment infrastructure:

- Azure Terraform under `infra/azure/` for a shared Container Apps environment, API, worker/agent services, PostgreSQL, ACR, Key Vault, VNet, and Log Analytics.
- Optional `azurerm_container_app.frontend`, enabled only when `frontend_image` is provided.
- No canonical frontend Dockerfile/container build context in the repository according to `infra/azure/README.md`.
- GitHub Actions for validation/governance, but no checked-in frontend multi-host deployment workflow was identified.
- No checked-in Vercel, Netlify, Cloudflare, Nginx, or frontend custom-domain configuration.

The next deployment decision is therefore partly external: choose the managed static/edge host or add a deliberately bounded frontend image/build context. Do not infer a provider-specific DNS plan from the current Terraform alone.

## 26. CI/CD Impact

The current root build produces all configured MPA inputs together. A change can therefore affect every entry that shares chunks, and no product-scoped deploy trigger was found. Cheapest v1 is one validated artifact with one deployment and host-specific smoke tests. Later, changed-path or separate product deploys can reduce blast radius, but they add build/deploy configuration and need shared chunk/version coordination.

## 27. Rollback / Blast Radius

One shared deployment means a broken shared chunk, root shell, or Vite config can affect all products. Separate deployments improve rollback independence but multiply operations. A practical mitigation for Option A is immutable artifact deployment, fast whole-artifact rollback, per-host smoke tests, and product-specific feature gating. CivicSure should be the first candidate for a separately rollbackable deployment only if it becomes a materially higher-risk authenticated product than the public entries.

## 28. Analytics / Observability

No unified product/hostname tagging system was found in the frontend audit. Minimum future telemetry fields should be `product_key`, `hostname`, `environment`, `route`, and authenticated organization/tenant identifiers only where policy permits. API and edge logs should preserve host, request ID, origin, and outcome without logging tokens or sensitive payloads.

## 29. Email / Link Generation

The repository contains environment base URL configuration such as `SHF_FRONTEND_BASE_URL` and return-path guards, but no product-host registry controlling all absolute links. Invitations, password resets, report links, notifications, and public links should use an approved product/environment base URL from server-side configuration. Never accept arbitrary browser-provided base URLs.

## 30. Report Links

Current CivicSure reporting uses the canonical Reporting authority and API paths; report artifact authority is not tied to a product hostname. Future links should resolve through a configured CivicSure base such as `https://civicsure.siliconheartland.org/...`, while authorization, tenant scope, classification, and Public Disclosure remain server-side. A hostname change must not create a second artifact authority.

## 31. Public SEO

OAS has a title and description in its HTML. Other entries often have only a title, and no systematic per-host canonical URL, Open Graph, robots, or sitemap strategy was found. Each public hostname should receive independent title, description, canonical URL, Open Graph metadata, robots policy, and sitemap ownership. Authenticated CivicSure/admin hosts should generally discourage indexing.

## 32. Local Development

The lowest-complexity local model is one Vite server plus host simulation using `civicsure.localhost`, `oas.localhost`, and similar names, or explicit `/etc/hosts` aliases. Vite currently binds to `127.0.0.1` and has no host-product logic; a future implementation would need allowed-host configuration and a local product registry. Separate localhost ports remain a useful fallback for dedicated MPA entries.

Do not require developers to run a separate infrastructure stack per product. The dev harness should be able to select a host and entry deterministically while retaining the same API proxy.

## 33. Product Routing Table

| Product | Target hostname | Current entry | Current route | Proposed serving model | Auth | Public | Changes needed |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SHU root | `siliconheartland.org` | `index.html` / `universe.html` | `/`, `/universe`, Universe destinations | Shared gateway entry | Mixed | Yes | HOSTING_CONFIG, FRONTEND_ROUTING, SEO |
| CivicSure | `civicsure.siliconheartland.org` | `index.html` | `/operator/government-assurance/*` | Shared artifact with CivicSure host adapter initially | Auth-first | Public-safe Transparency only | FRONTEND_ROUTING, AUTH_CONFIG, API/CORS, SECURITY_HEADERS |
| OAS | `oas.siliconheartland.org` | `oas.html` plus subpages | OAS HTML roots | Dedicated existing entry through shared deployment | Public-first | Yes | HOSTING_CONFIG, DNS_ONLY, SEO |
| Registry | `registry.siliconheartland.org` | No single entry; Universe/admin/separate repo references | `/registry`, `/ops/system-registry`, external origin possibility | Separate explicit product mapping after ownership is confirmed | Mixed | Policy-dependent | CODE_ADAPTER, HOSTING_CONFIG, AUTH_CONFIG |
| Studio | `studio.siliconheartland.org` | `curriculum.html` / `admin.html` | `/studio/*`, `/studio/templates` | Shared artifact initially; dedicated entry later if cadence warrants | Auth-first | No | FRONTEND_ROUTING, AUTH_CONFIG, links |
| BOS | `bos.siliconheartland.org` | `admin.html` | `/ops/*`, executive command | Shared admin entry initially | Auth/admin | No | HOSTING_CONFIG, AUTH_CONFIG, CORS |
| Foundation | `foundation.siliconheartland.org` | `foundation.html` | Foundation routes | Dedicated existing entry through shared deployment | Public-first/mixed | Yes | HOSTING_CONFIG, HTML cleanup, SEO |
| Solutions | `solutions.siliconheartland.org` | `solutions.html` | Solutions routes | Dedicated existing entry through shared deployment | Public-first | Yes | HOSTING_CONFIG, HTML cleanup, SEO |

## 34. SHU Root Domain

`siliconheartland.org` should be the ecosystem gateway, directory, and trust front door. The existing Universe page and `universeDestinationRegistry.js` are the strongest current candidates. It should explain the SHU product family and route to approved product hosts, not silently mount every authenticated product inside one generic page.

## 35. Unknown Host Behavior

An unknown host such as `unknown.siliconheartland.org` must fail closed at the edge with a 404 or redirect to the SHU gateway. It must not default to the root MPA, CivicSure, Admin, or an authenticated page. Host allowlisting should be tested for production, UAT, and local development behavior.

## 36. Environment Domain Pattern

Recommended pattern:

| Environment | Example |
| --- | --- |
| Production | `civicsure.siliconheartland.org` |
| UAT | `civicsure-uat.siliconheartland.org` |
| Development | `civicsure.localhost` or protected local host alias |

Use the same product key across environments, but keep API origins, cookies, CORS, classification defaults, reporting, and data stores environment-specific. Avoid creating a full domain for every ephemeral branch.

## 37. Cost Comparison

| Cost dimension | Option A: one deployment | Option B: multiple deployments | Option C: hybrid |
| --- | --- | --- | --- |
| Domain/DNS | Low; several records or one controlled wildcard | Similar record count | Moderate |
| TLS | One managed edge/cert model | Per deployment/host management | Mixed |
| Hosting | Lowest | Highest | Moderate |
| Build minutes | One coordinated build | Repeated product builds | Mixed |
| API/database | Shared | Still commonly shared | Shared with selective isolation |
| Observability | Simpler | More streams and dashboards | Moderate |
| Maintenance | Lowest initially | Highest | Moderate |
| Product independence | Lowest | Highest | Selective |
| Rollback | Whole artifact | Per product | Selective |
| Current fit | Good after host adapter | Not justified | Good later |

Vendor pricing is intentionally not estimated because the repository does not identify a chosen frontend hosting vendor. The cost winner at current scale is one managed edge/static deployment with shared API and explicit product host configuration.

## 38. Security Decision Matrix

| Decision | Cheapest | Safest | Recommended |
| --- | --- | --- | --- |
| Shared deployment | One artifact | Separate rollback domains | Shared first, immutable rollback |
| Shared API | One API | Separate trust boundaries | Shared API with explicit origins/auth |
| Shared cookie | Easy SSO | Host-only cookies | Central SSO plus host-only sessions |
| Wildcard DNS | Few records | Explicit approved hosts | Use only with unknown-host rejection |
| Wildcard TLS | Simple renewal | Per-host isolation | Managed wildcard only if edge controls are strong |
| Central login | One identity flow | Central identity with local sessions | Recommended |
| Public/auth mixed host | Fewer hosts | Separate public/auth trust boundaries | Separate host or explicit public projection |
| Environment subdomains | Few environments | Clear isolation | Production and UAT product hosts, local aliases for dev |

## 39. Required Change Matrix

| Product | Required change classes |
| --- | --- |
| SHU root | HOSTING_CONFIG, FRONTEND_ROUTING, SEO |
| CivicSure | FRONTEND_ROUTING, AUTH_CONFIG, API/CORS, SECURITY_HEADERS, ENV_CONFIG, CI/CD |
| OAS | DNS_ONLY, HOSTING_CONFIG, SEO |
| Registry | CODE_ADAPTER, HOSTING_CONFIG, AUTH_CONFIG; ownership decision first |
| Studio | FRONTEND_ROUTING, AUTH_CONFIG, ENV_CONFIG, link adapter |
| BOS | HOSTING_CONFIG, AUTH_CONFIG, API/CORS, SECURITY_HEADERS |
| Foundation | HOSTING_CONFIG, HTML/build cleanup, SEO |
| Solutions | HOSTING_CONFIG, HTML/build cleanup, SEO |

No migration, canonical authority, or duplicate identity change is indicated by this audit.

## 40. Recommended Rollout Sequence

### D1 — Product Host Registry

Define approved product keys, hostnames, entry mapping, auth posture, public posture, environment, and unknown-host behavior. Keep it configuration/edge metadata, not a new authority.

### D2 — Local Hostname Routing

Add host simulation and browser tests for `civicsure.localhost`, `oas.localhost`, and the SHU root. Preserve existing `.html` and GPA paths.

### D3 — Auth/API/CORS Hardening

Choose central login, keep host-only sessions by default, configure explicit CORS origins, validate organization/tenant behavior, and add edge security headers.

### D4 — Hosting/DNS Configuration

Choose one managed edge, add approved custom domains/TLS, configure HTML-entry rewrites, asset handling, cache rules, and unknown-host rejection.

### D5 — CivicSure First Production Subdomain

Pilot `civicsure.siliconheartland.org` with the existing GPA shell and routes, smoke-test direct URLs, refresh, auth, reports, public-safe boundaries, and rollback.

### D6 — Remaining Product Subdomains

Add OAS, Foundation, Solutions, Studio, BOS, and Registry only after each has a confirmed entry/ownership/auth posture and host-specific acceptance evidence.

## 41. CivicSure First-Subdomain Readiness

CivicSure is the best first host candidate because it has a coherent product shell, accepted GPA workflows, reporting/AI acceptance evidence, and a bounded route family. It is not ready for DNS creation today because:

- there is no host registry or edge rule;
- session strategy across subdomains is undecided;
- production CORS currently models one frontend origin;
- the frontend deployment artifact is not defined in this repository;
- root-relative asset/MPA behavior needs host smoke tests;
- product-aware absolute links and telemetry are not established;
- the existing root dispatcher has an undefined `pathname` fallthrough defect.

The product can proceed as a configuration/routing implementation wave without changing GPA canonical APIs or migration 105. The accepted GPA tag and authorization boundaries should remain the reference baseline while host routing is introduced.

## 42. Audit Document

This document is the authoritative read-only audit output:

`docs/architecture/SHU_DOMAIN_MULTI_APP_ROUTING_AUDIT.md`

It records current repository evidence, implementation risks, product mapping, security implications, cost tradeoffs, and the recommended rollout sequence. It does not authorize DNS, deployment, authentication, or runtime changes.

## 43. Files Created

- `docs/architecture/SHU_DOMAIN_MULTI_APP_ROUTING_AUDIT.md`

## 44. Files Modified

None. Existing dirty files were preserved. No runtime, route, Vite, API, auth, deployment, DNS, TLS, environment, or migration files were changed.

## 45. Runtime / Deployment Integrity

- Frozen GPA tag remains unchanged and peels to `72071116b4bbf9d6ad687fe8fe41282221a4af0c`.
- No DNS, SSL/TLS, hosting, CORS, cookie, CSP, API, or deployment configuration was changed.
- No migration was added by this audit. The current worktree already contains R1 migration `106`; the accepted GPA baseline remains `105`.
- The disposable Phase 8 browser harness was run successfully after requesting local-listener permission: `3 passed`, `0 failed`, `0 skipped`. It covered governed AI references/injection blocking, report generation, and cross-tenant scope. The first sandboxed attempt failed before application startup with `listen EPERM`; the elevated rerun passed and cleaned up its disposable environment.
- Existing owner modifications and untracked files remain untouched.

### Final assessment

The SHU repository is structurally capable of a low-cost shared multi-host deployment, but it is not yet safe to create real subdomain records. Implement D1–D4 first, with CivicSure as the controlled first host. The main blockers are bounded host selection, production frontend deployment definition, cross-subdomain auth/session design, explicit CORS/security-header configuration, and host-aware link/asset testing.
