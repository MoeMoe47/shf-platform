# UX and accessibility

Read-only Chromium runs: all five pages at 1440, 768, 375 and 320 CSS pixels; normal/reduced motion; keyboard traversal; automated axe WCAG A/AA tag checks; screenshots. These are targeted checks, not full WCAG certification or production-host validation.

Confirmed strengths: all five pages render their intended H1/main/nav/footer; no console page errors or failed image loads; actual linked pages/working fragments resolve; mobile menu buttons expand/collapse; no whole-page horizontal overflow at 1440/768/375; risk matrix is keyboard-scrollable in current Chromium; reduced motion removes Purpose/Risk canvases and risk CSS animation, and stops the domain auto-cycle (01 stays 01; normal mode advances to 02). Existing local OAS design identity is independent of Registry/SHS UI.

Confirmed defects:

- Color contrast violations on all five pages: 31 affected nodes across route runs (shared components repeat), serious axe color-contrast findings. Home 3, Standard 16, Domains 3, Purpose 4, Risk 5. Header taglines, accent text/buttons, Home Registry circle, some fact/TOC labels are affected. Examples measure 4.15–4.2:1 where 4.5:1 is required. Full selectors/results are in browser-results.json.
- At 320px all pages overflow horizontally: Home scrollWidth 373, others 351. This is a reflow defect despite successful wider layouts. Screenshot/mobile evidence at 375 must not hide the 320 failure.
- Purpose has two broken keyboard-accessible section anchors. Domain 02 is otherwise unreachable through the site's active links.
- Mobile flywheel labels are crowded/small. Hero/illustration scale and footer create long mobile scroll, but no redesign is prescribed.
- Sampled focus-visible states include zero-width outlines/no shadow on some plain/skip/footer links while primary CTAs have visible outlines. The shared source contains a focus rule, so verify cascade and actual visual indicators before claiming keyboard compliance; this is an observed inconsistency, not a claim that every focus state fails. Skip links move the reading/scroll location and next Tab enters main content; activeElement itself remains BODY in Chromium.
- Mobile menu remains open on Escape. Because this is a nonmodal disclosure, treat this as a usability enhancement/review item, not an automatic modal-dialog WCAG violation.
- Why OAS contains a real blank illustration placeholder. The Control Domains flywheel and Purpose/Risk hero artwork are implemented; stale Phase 1 comments must not be counted as missing graphics.

Axe reports incomplete checks for some backgrounds; manual contrast/image-text and assistive-technology review remain necessary. No live screen reader, browser matrix, 200/400% zoom or production mobile-device lab was completed. Font stacks are local/system fallbacks; no website API/session dependency or user submission exists.
