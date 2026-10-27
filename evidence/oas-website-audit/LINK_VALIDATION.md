# Route and link validation

Temporary unchanged Vite served the requested http://127.0.0.1:5173. Existing port was initially unavailable; the audit started and later stopped its own server. No deployment or source fix was performed.

Five intended page URLs: all HTTP 200, correct OAS headings, no page errors and no failed asset loads observed. All 61 anchor instances were read; 19 unique destinations were checked for HTTP content and fragment identity. Two broken targets: /oas-purpose-boundaries.html#standards-schemas and #related-domains. All other actual anchors resolve. No active external/localhost link exists in the OAS page content.

Semantic failures: Governance -> footer; Watch Overview -> prose; specification CTA -> disabled rows; Explore Full Framework -> Home summary; Purpose Next Domain -> overview rather than requested domain. The Purpose page has no inbound navigation edge from the other four pages. Disabled planned labels are unavailable features, not 404 links.

Missing canonical artifact paths return HTTP 200 text/html with the index application's fallback. They are **not valid JSON/Markdown/currentness**. Hypothetical governance/developer/requirements filenames behave similarly; they are diagnostic probes, not approved routes. Missing schema probe also returns HTML. A future test must assert MIME/body/hash and intended page H1, not status alone.

Raw results: browser-results.json, keyboard-results.json, screenshots/. Root-relative OAS links are development/proxy compatible but no final public origin is configured or validated. Do not invent domains, redirect to Registry, or conflate page routing with the release pin.
