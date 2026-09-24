# SHF Home Page Upgrade Implementation

## Route

- Public homepage: `/foundation.html`
- Hash routes preserved by `src/foundation/App.jsx`: `#/top`, `#/about`, `#/mission`, `#/programs`, `#/partners`, `#/get-involved`, `#/reports`
- `#reports` remains treated as the top surface for existing return-to-Universe behavior.

## Main Components

- `src/foundation/pages/Home.jsx`
- `src/foundation/layout/FoundationHeader.jsx`
- `src/foundation/layout/FoundationFooter.jsx`
- `src/foundation/App.jsx` remains the app router and was not changed.

## Styles

- `src/foundation/styles/shf-home-mock.css`
- The existing Foundation shell class `.shf-home-mock` is retained, but the visual treatment was replaced with the approved SHF institutional direction: ivory/off-white surfaces, charcoal/navy text, and International Orange accents.

## Assets Used

- `/assets/shf-command/brand/shf-globe-logo.png`
- `/assets/foundation/hero-main.jpg`
- `/assets/shf-command/maps/shf-impact-ohio-board-art.png`
- `src/assets/brand/shf-footer-landscape-light.webp`
- `src/assets/brand/hero-bg-ohio.png`
- `src/assets/brand/hero-people-cutout.png`
- `src/assets/store/catalog/ai-literacy.webp`
- `src/assets/store/catalog/data-center.webp`
- `src/assets/store/catalog/educator-pd.webp`
- `src/assets/store/catalog/community-incubator.webp`
- `/assets/career/pathways/family-technology.jpg`

## Data Sources

- `fetchPublicCurriculumLessonCompletions` remains the only live public metric used on the homepage.
- The repository's SHF impact data spine currently has no `publicApproved: true` records, so homepage impact counts are not represented as verified numerical claims.

## Seed / Static Content

- Program cards, partner categories, story placeholders, map markers, and reporting cards are front-end presentation content for the public homepage.
- Success story cards are explicitly written as public-ready story formats, not verified participant testimonials.
- Impact count areas use safe labels such as `Pending`, `Public`, and `Active` rather than unsupported mock numbers.

## Impact Map Integration

- The homepage includes a public-safe visual impact map module and routes deeper reporting actions to `#/reports`.
- No map records, county outcomes, funding values, or private operational records are fabricated.

## Transparency / Report Links

- Reporting, ledger, funding, and governance cards route to `#/reports`, where existing public reporting guardrails explain disclosure boundaries.

## Partner Sources

- Partner cards are category-level only: schools and CTE, community colleges, nonprofits, employers, workforce boards, and local government.
- No specific partner institution is claimed as formal unless surfaced elsewhere by public-ready data.

## Accessibility And Responsive Behavior

- Semantic sections and headings are used throughout the homepage.
- Header, CTAs, cards, and report links have visible focus states.
- Images are decorative where appropriate and use empty alt text.
- Responsive breakpoints cover desktop, tablet, and mobile stacking without horizontal overflow.

## Future Work

- Connect program cards to canonical program detail pages when public program records exist.
- Replace story placeholder cards with consented, publication-approved stories.
- Promote public impact records into the homepage only after the reporting/public-disclosure authority marks them public-approved.
