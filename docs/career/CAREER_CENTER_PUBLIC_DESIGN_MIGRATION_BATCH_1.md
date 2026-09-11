# Career Center Public Design Migration Batch 1

## Scope

This batch migrates the five public Career Center surfaces onto the shared public visual system. The authenticated `/planner` implementation in `src/pages/CareerPathways.jsx` remains a personal tool and is intentionally not migrated to the public shell.

## Pages

- Career Home: shared `CareerPublicHero`, `CareerSectionHeader`, `CareerCard`, and `CareerPublicCTA`.
- Explore Careers / Career Pathways: shared public hero and section header; canonical Career API and existing cluster behavior preserved.
- Career Detail: shared public hero with canonical identity metadata; existing safe unavailable states preserved.
- Pathway Detail: shared public hero with explicit pathway semantics; curriculum and public opportunity boundaries preserved.

## System Adoption

All five pages render through `CareerPublicLayout`, which provides the shared heart-branded header and footer. Public pages do not render the personal sidebar, and the personal Brainiact control is hidden only while the public layout is mounted.

Shared tokens remain scoped to `.career-public` in `career-public.css`. Shared component classes cover hero, section headers, cards, buttons, filters, search, CTA banners, responsive breakpoints, focus states, and reduced motion.

## Inline and Legacy Styling

The Career Home page no longer contains an inline visual stylesheet and now uses shared primitive markup. Explore, Career Detail, and Pathway Detail retain limited legacy page styles for existing drawer, curriculum-reference, and information-layout behavior. These are scoped page modifiers and are not new duplicate design systems. The authenticated planner is intentionally unchanged.

## Truth and Authority

No backend, API, migration, data model, or domain authority changed. Career, curriculum, opportunity, organization, portfolio, credential, identity, and permission data remain owned by their existing authorities. No unsupported salary, demand, placement, employer, regional, or outcome claims were introduced.

## Responsive and Accessibility Results

Focused browser verification covers 1440x900, 768x1024, and 390x844. Public navigation, hero wrapping, route links, personal handoff, no-sidebar behavior, console errors, and horizontal overflow checks pass. Public primitives include semantic landmarks, focus states, labelled controls, and reduced-motion support.

## Remaining Art Direction

Approved photography, regional outline motifs, and complete page-by-page mock composition remain a later visual batch. The shared system is ready to support those additions without changing route or data architecture.

## Batch 2 Readiness

Ready for the next migration batch after the remaining legacy page styles are converted incrementally, beginning with Opportunities, Employer Directory/Profile, and Discovery.
