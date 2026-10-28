# Accessibility and reflow

The audit recorded 31 contrast-failing nodes across five route runs. Scoped bronze/rust text/button accents were darkened for light surfaces. Footer headings use a lighter accent on dark surfaces. Purpose next-link text and the Risk R3 badge were corrected. The Standard eyebrow and release card have appropriate light text on dark surfaces; screenshot review caught and corrected inherited horizontal-flex layout in the new card.

All five pages have document scrollWidth equal to viewport width at 320, 375, 768 and 1440px. Actual causes were fixed: shrinking/wrapping header lockup, homepage strip statement/tags and mobile footer wrapping. No page-level overflow hiding was introduced. Wide Risk data remains locally scrollable and now has a named, focusable region with tested ArrowRight scrolling.

Axe WCAG 2 A/AA + 2.1 A/AA: zero reported violations across ten desktop/mobile page runs (1440 and 320). Raw inconclusive results are preserved in browser-results.json; automated success is not full accessibility certification. Keyboard navigation/menu/Escape/focus and reduced-motion behavior pass. Screenshots were reviewed at desktop/mobile. Full screen-reader, device/browser matrix and comprehensive zoom/manual contrast assessment remain later accessibility validation.

The existing Purpose particle type is now explicitly documented with JSDoc, including its already-used optional _height. This fixes a preexisting checkJs inference error without changing runtime behavior or motion/reduced-motion logic.
