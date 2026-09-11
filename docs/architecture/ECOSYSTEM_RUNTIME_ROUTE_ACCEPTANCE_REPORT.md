# Ecosystem Runtime Routing Acceptance

## 1. Executive Result

The reported collapse of ecosystem URLs into the SHF Operator Dashboard was reproduced as a development-server selection problem, not a root repository MPA routing defect. `localhost:5173` selected an IPv6 listener owned by `apps/shf-web`, a separate single-entry Vite app whose fallback returned its `SHF Web` shell for unrelated HTML paths. The canonical root `shrv1` Vite server was also running on IPv4 `127.0.0.1:5173` and returned distinct entries. A clean root-server proof on `127.0.0.1:5174` confirmed the result.

## 2. Repository Baseline

- Repository: `/Users/mikeslate/Projects/shrv1`
- Branch: `studio-v1-plus-development`
- HEAD: `8989328eeb2fdb3e223a951bde006a2b86505e64`
- Existing FE-6 checkpoint and tag were preserved.
- Known generated/runtime artifacts remain uncommitted and were not modified.

## 3. Port 5173 Process Inventory

Two Node/Vite listeners were present:

| PID | Address | Working directory | Command | Result |
| --- | --- | --- | --- | --- |
| 21069 | `[::1]:5173` | `/Users/mikeslate/Projects/shrv1/apps/shf-web` | `node .../apps/shf-web/node_modules/.bin/vite` | Separate SHF Web SPA fallback |
| 33616 | `127.0.0.1:5173` | `/Users/mikeslate/Projects/shrv1` | `node .../node_modules/.bin/vite` | Canonical root MPA |

`localhost` selected the IPv6 listener on this machine, which explains the observed operator-like shell. No process was killed.

## 4. Root Cause Classification

**WRONG DEVELOPMENT SERVER / PORT OWNERSHIP**, caused by dual IPv4/IPv6 loopback listeners and hostname resolution. No root MPA, HTML-entry, registry, router, proxy, service-worker, or browser-cache defect was found.

## 5. Root Startup Command

From the repository root, use:

```bash
cd /Users/mikeslate/Projects/shrv1
npm run dev
```

The root `vite.config.js` explicitly binds `127.0.0.1`. When another listener occupies the port, use the repository-defined command on an unused port, for example:

```bash
npm run dev -- --host 127.0.0.1 --port 5174
```

Use `http://127.0.0.1:<port>/...` during verification rather than ambiguous `localhost` when both address families are occupied.

## 6. Root MPA Inventory

The current root Vite input map contains 29 current HTML inputs, including `index`, `foundation`, `solutions`, `admin`, `curriculum`, `career`, `arcade`, `catalog`, `oas`, `universe`, `civic`, `sales`, `employer`, `capital`, `allocation`, `ai`, `credit`, `debt`, `fuel`, `launch`, `ledger`, `lord-of-outcomes`, `store`, `treasury`, and `verifier`, plus OAS subentries.

Each current root HTML file points to its corresponding `src/entries/*` module. No unrelated root HTML file points to the `apps/shf-web` operator entry.

## 7. Critical HTTP Acceptance

The canonical root server was probed at `http://127.0.0.1:5174`:

| App | URL | HTML identity | Entry | Status |
| --- | --- | --- | --- | --- |
| Foundation | `/foundation.html` | `Foundation — Silicon Heartland` | `foundation.main.jsx` | WORKING |
| Solutions | `/solutions.html` | `Solutions — Silicon Heartland` | `solutions.main.jsx` | WORKING |
| Admin | `/admin.html#/hub` | `SHF Admin` | `admin.main.jsx` | WORKING; hash resolved by app router |
| Curriculum | `/curriculum.html#/dashboard` | `Curriculum — Silicon Heartland` | `curriculum.main.jsx` | WORKING; hash resolved by app router |
| Career | `/career.html` | `SHF Career` | `career.main.jsx` | WORKING |
| Arcade | `/arcade.html` | `Arcade — Silicon Heartland` | `arcade.main.jsx` | WORKING |
| Catalog | `/catalog.html` | `Catalog` | `catalog.main.jsx` | WORKING |
| OAS | `/oas.html` | `Open Autonomous Standard` | `oas.main.jsx` | WORKING |
| Universe | `/universe.html` | `Silicon Heartland Universe` | `universe.main.jsx` | WORKING |
| CivicSure | `/civic.html` | `Civic — Silicon Heartland` | `civic.main.jsx` | FRAME/DEFERRED; not promoted by this audit |

All critical root responses had distinct body hashes and distinct entry modules. The IPv6 `apps/shf-web` listener returned the same `SHF Web` HTML body for every tested path.

## 8. Application Boundaries

- SHF Operator source: `apps/shf-web/src/pages/operator/OperatorDashboard.jsx`, mounted by `apps/shf-web/src/main.jsx`.
- It is a separate package and must not serve the root ecosystem MPA.
- Studio remains `/curriculum.html#/studio`.
- ARAG-1 remains `/admin.html#/release-assurance`.
- Agent Fabric remains `/admin.html#/agent-fabric`.
- Universe destination registry remains the canonical destination authority.
- CivicSure remains frame/deferred; this audit did not promote it.

## 9. Regression Coverage

Added `tests/ecosystemRuntimeRouting.test.mjs` to verify Foundation, Solutions, Admin, Curriculum, Career, Arcade, Catalog, OAS, Universe, and CivicSure HTML-to-entry mappings, root Vite input presence, distinct entries, and critical router mounts. This is source-level regression protection; live HTTP evidence is recorded above.

## 10. Validation

- Root `npm run dev` preflight: manifest validation PASS; UI validation PASS.
- Isolated root server HTTP acceptance: PASS.
- Existing FE-6 focused tests: PASS before this audit.
- No product routing code was changed.

## 11. Defects

- P0 root routing defects: 0.
- P1 root routing defects: 0.
- Environment/process configuration issue: one separate `apps/shf-web` server was reachable through `localhost` IPv6 and returned its SPA fallback.

## 12. FE-7 Status

FE-7 has not started. It remains blocked until this routing checkpoint is accepted; the repository-local root routing evidence is now complete.

## Final Verdict

1. The multiple-dashboard observation was caused by `localhost` selecting the `apps/shf-web` IPv6 Vite server.
2. The canonical root `shrv1` MPA works when addressed as `127.0.0.1`.
3. No redirect hack or application redesign is required.
4. Start the ecosystem with `cd /Users/mikeslate/Projects/shrv1 && npm run dev` and verify using the printed `127.0.0.1` URL.
5. FE-7 remains untouched.
