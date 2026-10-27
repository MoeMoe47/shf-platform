# Navigation and CTA audit

All 61 actual anchor instances across the five pages were inventoried. They resolve to 19 unique URL/fragment destinations. Five actual page URLs return the intended OAS heading. Two unique fragments fail. Missing artifact/page probes return generic HTML with HTTP 200, so status alone is not success. No active external/localhost cross-authority link exists in these OAS pages.

Shared footer: Why OAS -> /oas.html#why-oas; Ecosystem -> /oas.html#separation-of-authority; OAS-1 -> /oas-1.html. All work. Other 16 footer items are PlannedItem spans, not dead hrefs: Principles, News; Specification, Schemas, Conformance; Implementation Guides, Developer Resources, Use Cases, FAQ; Process, Public Comment, Version History, Contact; Privacy, Terms, Accessibility. OAS.ORG is static display, not a verified canonical domain or hyperlink; owner confirmation is needed before promoting it to routing.

Header drift: Home links Control Domains and Risk. OAS-1 marks both planned; Control Domains/Purpose mark Risk planned. This conceals existing pages. Governance resolves to a footer, not a governance experience. Conformance/Schemas/Implementation are planned everywhere; no route is silently assumed. Brand marks are not Home links, but About/footer allow return to Home.

CTA issues: Watch Overview is a prose anchor (#why-oas), not a video. Read the Specification/Read OAS-1 on /oas-1.html scroll to disabled access rows. Explore Control Domains/Explore Full Framework point to the Home summary instead of the existing detail page. Purpose Next Domain: Capabilities & Resources points to the domains overview, not that missing detail. Domain buttons highlight only; they do not navigate. No other page links to Purpose & Boundaries.

Registry/ATB: Home renders descriptive authority nodes, not clickable Registry/ATB links. No hardcoded Registry URL exists to repair. Contextual verified links are a potential enhancement once approved public destinations exist; OAS must not duplicate their functions.

## Every actual anchor instance

| Page | Area | Text | Destination | Result |
| --- | --- | --- | --- | --- |
| /oas.html | content | Skip to main content | `#oas-main` | resolves; semantic caveats above |
| /oas.html | header | About | `#why-oas` | resolves; semantic caveats above |
| /oas.html | header | OAS-1 | `/oas-1.html` | resolves; semantic caveats above |
| /oas.html | header | Control Domains | `/oas-control-domains.html` | resolves; semantic caveats above |
| /oas.html | header | Risk | `/oas-risk-classification.html` | resolves; semantic caveats above |
| /oas.html | header | Governance | `#site-footer` | resolves; semantic caveats above |
| /oas.html | header | Read OAS-1 | `/oas-1.html` | resolves; semantic caveats above |
| /oas.html | content | Explore OAS-1 | `/oas-1.html` | resolves; semantic caveats above |
| /oas.html | content | Watch Overview | `#why-oas` | resolves; semantic caveats above |
| /oas.html | content | Read OAS-1 | `/oas-1.html` | resolves; semantic caveats above |
| /oas.html | footer | Why OAS | `/oas.html#why-oas` | resolves; semantic caveats above |
| /oas.html | footer | Ecosystem | `/oas.html#separation-of-authority` | resolves; semantic caveats above |
| /oas.html | footer | OAS-1 | `/oas-1.html` | resolves; semantic caveats above |
| /oas-1.html | content | Skip to main content | `#oas1-main` | resolves; semantic caveats above |
| /oas-1.html | header | About | `/oas.html#why-oas` | resolves; semantic caveats above |
| /oas-1.html | header | Governance | `/oas.html#site-footer` | resolves; semantic caveats above |
| /oas-1.html | header | Read OAS-1 | `#read-the-standard` | resolves; semantic caveats above |
| /oas-1.html | content | Read the Specification | `#read-the-standard` | resolves; semantic caveats above |
| /oas-1.html | content | View Summary | `#oas1-covers` | resolves; semantic caveats above |
| /oas-1.html | content | Explore the Control Domains → | `/oas.html#what-oas-governs` | resolves; semantic caveats above |
| /oas-1.html | footer | Why OAS | `/oas.html#why-oas` | resolves; semantic caveats above |
| /oas-1.html | footer | Ecosystem | `/oas.html#separation-of-authority` | resolves; semantic caveats above |
| /oas-1.html | footer | OAS-1 | `/oas-1.html` | resolves; semantic caveats above |
| /oas-control-domains.html | content | Skip to main content | `#oascd-main` | resolves; semantic caveats above |
| /oas-control-domains.html | header | About | `/oas.html#why-oas` | resolves; semantic caveats above |
| /oas-control-domains.html | header | OAS-1 | `/oas-1.html` | resolves; semantic caveats above |
| /oas-control-domains.html | header | Governance | `/oas.html#site-footer` | resolves; semantic caveats above |
| /oas-control-domains.html | header | Read OAS-1 | `/oas-1.html` | resolves; semantic caveats above |
| /oas-control-domains.html | content | A shared standard for a more open future. → | `/oas.html#why-oas` | resolves; semantic caveats above |
| /oas-control-domains.html | content | Explore the Full Framework | `/oas.html#what-oas-governs` | resolves; semantic caveats above |
| /oas-control-domains.html | content | View OAS-1 Specification → | `/oas-1.html` | resolves; semantic caveats above |
| /oas-control-domains.html | footer | Why OAS | `/oas.html#why-oas` | resolves; semantic caveats above |
| /oas-control-domains.html | footer | Ecosystem | `/oas.html#separation-of-authority` | resolves; semantic caveats above |
| /oas-control-domains.html | footer | OAS-1 | `/oas-1.html` | resolves; semantic caveats above |
| /oas-purpose-boundaries.html | content | Skip to main content | `#oaspb-main` | resolves; semantic caveats above |
| /oas-purpose-boundaries.html | header | About | `/oas.html#why-oas` | resolves; semantic caveats above |
| /oas-purpose-boundaries.html | header | OAS-1 | `/oas-1.html` | resolves; semantic caveats above |
| /oas-purpose-boundaries.html | header | Control Domains | `/oas-control-domains.html` | resolves; semantic caveats above |
| /oas-purpose-boundaries.html | header | Governance | `/oas.html#site-footer` | resolves; semantic caveats above |
| /oas-purpose-boundaries.html | header | Read OAS-1 | `/oas-1.html` | resolves; semantic caveats above |
| /oas-purpose-boundaries.html | content | ← Back to Control Domains | `/oas-control-domains.html` | resolves; semantic caveats above |
| /oas-purpose-boundaries.html | content | Overview | `#overview` | resolves; semantic caveats above |
| /oas-purpose-boundaries.html | content | Key Elements | `#key-elements` | resolves; semantic caveats above |
| /oas-purpose-boundaries.html | content | In Practice | `#in-practice` | resolves; semantic caveats above |
| /oas-purpose-boundaries.html | content | Standards & Schemas | `#standards-schemas` | BROKEN fragment |
| /oas-purpose-boundaries.html | content | Related Domains | `#related-domains` | BROKEN fragment |
| /oas-purpose-boundaries.html | content | View OAS-1 Specification → | `/oas-1.html` | resolves; semantic caveats above |
| /oas-purpose-boundaries.html | content | Next Domain CAPABILITIES & RESOURCES | `/oas-control-domains.html` | resolves; semantic caveats above |
| /oas-purpose-boundaries.html | footer | Why OAS | `/oas.html#why-oas` | resolves; semantic caveats above |
| /oas-purpose-boundaries.html | footer | Ecosystem | `/oas.html#separation-of-authority` | resolves; semantic caveats above |
| /oas-purpose-boundaries.html | footer | OAS-1 | `/oas-1.html` | resolves; semantic caveats above |
| /oas-risk-classification.html | content | Skip to main content | `#oasrc-main` | resolves; semantic caveats above |
| /oas-risk-classification.html | header | About | `/oas.html#why-oas` | resolves; semantic caveats above |
| /oas-risk-classification.html | header | OAS-1 | `/oas-1.html` | resolves; semantic caveats above |
| /oas-risk-classification.html | header | Control Domains | `/oas-control-domains.html` | resolves; semantic caveats above |
| /oas-risk-classification.html | header | Governance | `/oas.html#site-footer` | resolves; semantic caveats above |
| /oas-risk-classification.html | header | Read OAS-1 | `/oas-1.html` | resolves; semantic caveats above |
| /oas-risk-classification.html | content | Read OAS-1 Specification → | `/oas-1.html` | resolves; semantic caveats above |
| /oas-risk-classification.html | footer | Why OAS | `/oas.html#why-oas` | resolves; semantic caveats above |
| /oas-risk-classification.html | footer | Ecosystem | `/oas.html#separation-of-authority` | resolves; semantic caveats above |
| /oas-risk-classification.html | footer | OAS-1 | `/oas-1.html` | resolves; semantic caveats above |
