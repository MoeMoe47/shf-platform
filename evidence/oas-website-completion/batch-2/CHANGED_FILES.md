# OAS Website Batch 2 — Changed Files

Implementation:

- src/pages/oas/oasStandard.js
  Centralized release-derived presentation model for requirements/domains.

- src/pages/oas/OAS1Page.jsx
  Canonical requirement/domain presentation and working standard navigation.

- src/pages/oas/OASControlDomainsPage.jsx
  Centralized domain metadata consumption and stable domain anchors.

- src/pages/oas/oas1-page.css
  Responsive requirement/domain presentation styles.

Testing:

- tests/oas-website/website.test.mjs
  Added explicit Batch 2 regression gates for requirement count, domain
  count, exact IDs, membership, stable links, release identity and
  NOT_EVALUATED boundaries.

Documentation/evidence:

- docs/OAS_WEBSITE_COMPLETION_MATRIX.md
- docs/OAS_WEBSITE_COMPLETION_ROADMAP.md
- evidence/oas-website-completion/batch-2/*
