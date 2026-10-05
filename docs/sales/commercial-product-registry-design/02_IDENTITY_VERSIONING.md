# Identity And Versioning

Commercial product identity must be stable and independent of UI routes, display names, marketing campaigns, and temporary packaging.

## Canonical Fields

- `commercial_product_id`: stable immutable identifier, for example `cp_data_center_pathway`.
- `canonical_name`: durable internal product name.
- `display_name`: Sales-facing name, renameable.
- `slug`: stable URL/API slug; may change only through alias and redirect policy.
- `commercial_family`: governed family classification.
- `subfamily`: governed narrower classification.
- `product_type`: governed type such as `LICENSE`, `SERVICE`, `PROGRAM`, `SPONSORSHIP`, `ASSESSMENT`, `MANAGED_SERVICE`, or `IMPLEMENTATION_PACKAGE`.
- `commercial_form`: one or more governed commercial forms.
- `description`: descriptive summary with source provenance.
- `short_description`: concise Sales-facing summary.
- `status`: lifecycle status.
- `version`: registry record version.

## Stable Identity

`commercial_product_id` is never derived from display name, route, buyer, price, or campaign. It persists through rename, packaging description changes, and review gate updates.

## Versioning Behavior

Increment `version` when:

- Commercial form changes.
- Source authority reference changes materially.
- Buyer compatibility changes.
- Readiness or sellability changes.
- Pricing, margin, commission, entitlement, funding, regulated-program, support, or implementation status changes.
- A relationship is added or removed.

Minor copy edits that do not affect commercial meaning may be recorded as descriptive edits without creating a new product identity.

## Rename Behavior

Renames update `display_name`; material identity changes require governance review. Previous display names remain in `aliases` with effective dates and provenance.

## Sunset, Archival, And Replacement

- `SUNSET`: no new sales; existing obligations may continue.
- `RETIRED`: no active selling, renewal, or expansion unless a replacement policy explicitly allows migration.
- `archived_at`: immutable archival timestamp.
- `replacement_product_id`: optional pointer to successor.
- `supersedes_product_ids`: optional predecessor list.

Replacement and supersession are modeled through explicit product relationships, not name similarity.

