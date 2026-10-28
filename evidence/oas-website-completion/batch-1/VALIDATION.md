# Fresh validation

| Check | Result | Context |
| --- | --- | --- |
| New compiled OAS website suite | 22/22 PASS | Active Batch 1 tree, real static HTTP + Chromium + axe |
| Existing OAS adoption suites | 95/95 PASS | Isolated immutable 164798c8a684e4c3605fc89492918ca00552e70b checkpoint; eight stage-specific suites |
| Final publication tests | 9/9 PASS | Isolated immutable 9fc98273119dd1ccb43078b56abb1de02071214f checkpoint |
| Existing OAS reporting suite | 5/5 PASS | Active tree, report-u2-studio-oas.test.ts |
| Related broader routing suites | 12/12 PASS | Active tree, ecosystemRuntimeRouting/fe2ShellAdoption/fe5RoleExperiences/fe8FinalIntegratedAcceptance |
| Frozen publication/source verification | PASS | Original publication verifier in frozen checkpoint + new active-tree byte verifier |
| Adoption/preparation/RC checksum verifiers | PASS | Stage-appropriate historical checkpoint |
| TypeScript/checkJs | PASS | New metadata, source verifier, scoped config and all five pages/shared/motion imports |
| Eight historical OAS TypeScript configs | 8 PASS | Seven adoption configs + final publication config |
| Scoped production build | PASS | vite build --config vite.oas-website.config.mjs |
| Built direct artifacts | 4 PASS | Strict static server and independent actual Vite preview: MIME, content and exact Git bytes; no fallback/redirect |
| Links/fragments | PASS | All reachable page anchors checked via built server |
| Automated accessibility | PASS | Zero reported WCAG A/AA violations in ten page/viewport runs |
| 320px reflow/menu/focus/reduced motion | PASS | Real browser |
| Incoming working-tree preservation | PASS | All 271 incoming modified tracked files remain exact baseline hashes |

143 tests passed across all listed contexts (39 active-tree checks, 104 frozen-stage checks). This is a scoped validation total, not a claim that every test in the large unrelated SHRV1 workspace ran. Historical pre-publication expectations are tested against their matching checkpoint, never rewritten to make final-publication behavior pass. No backend/identity/deployment work or normative changes.

Raw logs, source-verification.json, historical-typescript.json and browser-results.json accompany this report. Only the standalone OAS build was run; root package.json/vite.config.js remain incoming user work. No live production launch was performed.
