# Identifier rules

OAS owns allocations. Standard: `OAS-<positive integer>` (existing OAS-1 retained). Version: explicit numeric major.minor.patch, optionally a lowercase prerelease suffix; current new snapshot is 0.0.0-public-review.1. Release: `<standard_id>@<standard_version>`. Working draft/public review snapshots always use prerelease versions; adopted releases do not. Zero major here means unadopted catalog pin, not adopted OAS 1.0.0. Display labels and artwork do not allocate IDs. No floating latest.

Domain: `<standard_id>-D<two-digit ordinal>`, current D01–D08. Ordinal is a legacy public presentation key retained separately; new IDs are immutable and labels may evolve only in new snapshots. Report ordinals are a different namespace.

Requirement: `<standard_id>-REQ-<at-least-four-digit serial>`. A serial names one immutable normative requirement text and its originating release. Never recycle it. Allocate a new serial and supersession link for changed wording; later releases can reference historical source requirements only after explicit applicability support is added to the schema. Current schema restricts profile membership and declarations to the same release to fail closed; cross-release applicability is not inferred. No serials are published yet. R0–R4 are risk classes, never requirement IDs.

Profile: `<standard_id>-P-<lowercase slug>@<profile_version>`. Slug is allocated independently of display name. Each profile record pins one standard release and owns explicit membership; change version for changes, use new slug only for a new conceptual profile. No profiles are allocated yet.

All IDs are deterministic from allocated components, globally unique within their catalog entity namespace, case-sensitive and whitespace-free. Allocate explicitly in OAS review; never generate from mutable labels, array order or a consumer's local data. Published IDs/versions/bytes are never edited or reused. Validators reject duplicates, invalid formats, dangling/mismatched references, cross-standard supersession and cycles. The catalog/schema version 1.0.0 versions the machine contract, not the normative standard.
