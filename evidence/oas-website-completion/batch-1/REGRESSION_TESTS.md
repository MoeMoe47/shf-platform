# Regression foundation

New tests/oas-website/website.test.mjs: 22 behavioral tests using real compiled pages, Chromium and static HTTP responses. Fifteen route/nav/reflow/accessibility checks (three per page), four raw artifact response checks, one full link/fragment/resource CTA check, one reduced-motion check, and one mobile Risk keyboard-scroll check.

Coverage: all five render/reachability; 25 cross-page navigation clicks; same nav/current page; pinned ID/date/count/contract/evaluation presentation; absence of obsolete draft labels; real JSON/Markdown/currentness/schema; exact bytes; Purpose links; all reachable links/fragments; body reflow; menu/Escape/focus; axe; reduced motion; risk table keyboard access.

No disabled/skipped test or inflated timeout. Keyboard style assertions use Playwright's ordinary retry to wait for actual media-query paint rather than taking a synchronous pre-paint sample. See tests/oas-website/README.md for reproducible commands. Existing frozen-stage tests run in isolated historical checkouts and are explicitly distinguished from the live website suite.
