# DGAL-3 — Document/Packet Instances, Rendering, Evidence Links & Retention Metadata

## 1. Executive Result
DGAL-3 establishes a durable, scoped document-instance and packet-instance foundation. Instances bind to exact DGAL-1 template versions, render through an HTML-first provider-neutral contract, store private artifact references and SHA-256 integrity metadata, expose deterministic packet manifests, support explicit Evidence links without auto-promoting generated documents, and carry PR-2-aligned retention metadata.

## 2. Repository Baseline
Repository `/Users/mikeslate/Projects/shrv1`, branch `studio-v1-plus-development`, starting HEAD `9eaaa0cf7b54905ca5eaedcea542ed4c298cb061`. Prior PR/DGAL changes and owner artifacts were preserved. No commit or push was performed.

## 3. DGAL-3 Gap IDs
Scope is `DGAL-GAP-004`, `DGAL-GAP-007`, `DGAL-GAP-008`, and `DGAL-GAP-013`.

## 4. Scope Boundaries
Implemented instance/packet metadata, rendering, private artifact references, integrity, explicit Evidence links, retention metadata, API authorization, and focused acceptance. Acknowledgments, agreements, manual signatures, e-signature, notifications, and Document Center remain deferred.

## 5. Existing Renderer / Storage Reuse
DGAL-3 reuses the Reporting renderer primitives where the ownership boundary permits: the canonical `hashBytes` integrity helper, HTML-first/print conventions, the existing Playwright PDF strategy, `ReportFileStorage` private scoped storage, and Reporting artifact metadata through a reference-only adapter. Reporting remains the owner of report snapshots, rendered files, report branding, and report download/export authorization. DGAL stores only a scoped reference and immutable metadata; it does not clone report payloads or mutate report rows. Evidence remains in `verified-evidence`; PR-2/Legal remain retention and hold authorities.

## 6. Document Instance Model
`dgal_document_instances` stores stable identity, document/template/version references, ownership, org/tenant, service/workflow/resource scope, classification, state, artifact metadata, source manifest, retention metadata, supersession, and idempotency.

## 7. Document State Model
The implemented states are `PENDING`, `GENERATED`, `FAILED`, `VOIDED`, `SUPERSEDED`, and `ARCHIVED`. No acknowledgment, signature, or approval states were introduced.

## 8. Template Version Binding
Generation requires an active DGAL-1 template version and persists `template_version_id`, version number, and revision. There is no “current template” lookup after generation.

## 9. Instance Immutability
Generated historical metadata is not edited in place by the service. Regeneration creates a separate instance/idempotency operation; supersession fields preserve explicit history. Template activation cannot mutate an old instance.

## 10. Source Snapshot / References
The instance keeps a bounded source manifest and field-name manifest, while structured source values are used only for rendering. Canonical references are preferred over duplicating protected source payloads.

## 11. Smart Prefill
The service accepts bounded structured source data from authorized canonical flows. It does not infer legal conclusions, statuses, secrets, credentials, or Evidence acceptance.

## 12. Human Confirmation Boundary
DGAL-3 renders structured values; it does not treat field editing as acknowledgment, consent, approval, or signature. Later phases own those interactions.

## 13. Packet Definition Model
`dgal_packet_definitions` and ordered definition items provide a durable reference/orchestration model for document templates, guidance, domain artifacts, and `REPORT_ARTIFACT_REFERENCE` items. A Reporting item retains artifact ID, snapshot ID, artifact/report versions, rendered-file ID, format, renderer version, content hash, and storage reference as metadata only. Domain-owned artifacts remain external references.

## 14. Packet Instance Model
`dgal_packet_instances` and `dgal_packet_instance_items` store scoped packet identity, service/workflow/resource context, child references, classification, manifest, hash, state, and retention metadata.

## 15. Packet Manifest
The service creates a stable ordered manifest with item key, order, type, reference, source owner, required flag, state, and optional hash. Reporting references additionally retain the exact snapshot/rendered-file identity and report version without copying the snapshot payload. The manifest hash is SHA-256 over deterministic JSON.

## 16. Packet Partial/Failure Semantics
Required `MISSING`, `FAILED`, or `PENDING` items produce `PARTIAL`; external references remain `EXTERNAL`. The packet never claims complete atomic generation when a required child is unavailable.

## 17. Rendering Architecture
The structured document instance is the source contract. DGAL rendering produces HTML or explicitly requested PDF derivative artifacts, while Reporting continues to render report artifacts through `CivicSureRenderAdapter` and its existing HTML/PDF/export path. A packet can compose both DGAL-managed instances and Reporting-owned artifact references. PDF bytes are not the source of truth.

## 18. Renderer Contract
`DocumentationRenderer` accepts title, type, exact template version, scope, classification, and structured data. It returns bytes, media type, format, hash, renderer ID/version, and accessibility metadata. Its hash delegates to Reporting's `hashBytes`; Reporting-owned reports retain their own renderer/template metadata and are referenced through `ReportingArtifactReferenceService`.

## 19. HTML / Print
Generated HTML is semantic, uses headings, scoped table headers, readable typography, responsive layout, and print CSS. It is the canonical accessible presentation base for this slice.

## 20. PDF
PDF is supported through the existing Playwright strategy with explicit `format=PDF`. It remains a derivative artifact. PDF tagging/UA compliance is not claimed.

## 21. Accessibility
HTML output includes `lang`, semantic headings, labeled metadata, table row/column semantics, text scaling, contrast-conscious colors, and print styles. The repository-local acceptance is accessible HTML/print; tagged PDF remains unproven and is not overstated.

## 22. Branding
This foundational renderer carries explicit classification and service/document identity. Branding remains bounded by the owning domain/template; arbitrary tenant content cannot change authority or classification.

## 23. Artifact Storage
Artifact bytes use the existing private `ReportFileStorage` abstraction with scoped references under organization/tenant/instance/hash. DGAL creates no object-storage system.

## 24. Artifact Authorization
Document and artifact routes require explicit documentation permissions and resolve rows by actor organization and tenant. The raw storage reference is never a public static URL.

## 25. Content Hash / Integrity
HTML/PDF bytes and packet manifests use SHA-256. Instance metadata preserves content hash, renderer ID/version, media type, and exact template version.

## 26. Evidence Boundary
Generation does not create or verify Evidence. A generated document remains a DGAL artifact until an authorized canonical flow explicitly creates a link.

## 27. Evidence Link Model
`dgal_evidence_links` stores document instance, Evidence reference, relationship type, owning domain, org/tenant, source reference, linker, and timestamp with scoped uniqueness.

## 28. Evidence Authorization
Evidence linking requires `documentation.evidence.link`, generated-instance state, explicit relationship/source metadata, and actor scope. Existing Evidence remains the authority for verification and Truth projection.

## 29. Retention Metadata
Instances and packets carry classification, retention policy key, retention start/reference, legal-hold reference, and disposition state. Classification defaults to internal/restricted and public state is not a publication action.

## 30. Retention Authority Boundary
PR-2 retention policy and lifecycle remain authoritative. DGAL stores references and safe metadata; it does not schedule retention or decide policy.

## 31. Legal Hold
Legal/Retention remains hold authority. DGAL can preserve and surface a hold reference, but no DGAL route creates or removes legal holds.

## 32. Archive / Delete / Disposition
Archive, `VOIDED`/`SUPERSEDED`, `DELETE_REQUESTED`, and `DISPOSED` are conceptually distinct; the schema carries archive/supersession/disposition metadata without introducing hard-delete behavior.

## 33. Backup / Restore
The new tables are in the migration chain and therefore participate in existing database backup/restore. Their scoped metadata and references are restored with the database; private artifact storage remains covered by the existing private storage/recovery boundary.

## 34. Authoritative vs Derivative Data
Instance identity, exact template binding, scope, state, source manifest, retention references, Evidence links, and packet manifest are authoritative DGAL metadata. Rendered HTML/PDF bytes are derivative artifacts recoverable from structured data where permitted.

## 35. Publication Boundary
Generated, classified, or Evidence-linked documents remain private/restricted. No public projection or publication route was added.

## 36. Preview / Download
`GET /documentation/documents/:id` returns scoped metadata and `/artifact` returns bytes only after the same authorization guard and scoped lookup. The service rejects missing/non-generated artifacts and unsafe storage references.

## 37. API Surface
Added bounded routes: `POST /documentation/documents`, scoped document metadata/artifact GETs, explicit Evidence-link POST, packet creation POST, and scoped packet GET. No unrestricted CRUD or authoring UI was added.

## 38. Regeneration
Repeated generation with the same scoped idempotency key returns the existing instance. A new input/idempotency key creates a separate instance and does not replace historical bytes.

## 39. Supersession
The schema provides explicit `supersedes_document_instance_id` and replacement metadata. Historical rows remain queryable; no delete-based replacement is used.

## 40. Failure / Retry / Idempotency
Render failures mark the instance `FAILED` with bounded error metadata and no fabricated artifact. Storage references are exclusive-created. Repeated idempotent requests do not create duplicate instances.

## 41. Concurrency
Database uniqueness protects scoped generation idempotency and packet item ordering. The focused service harness verifies replay behavior; production concurrency uses the database uniqueness constraint rather than client state.

## 42. First Service Slice
CivicSure Provider Verification Packet is the primary slice: a provider-owned requirement can bind to a CivicSure template version, render scoped data, produce an accessible preview/print artifact, reference an existing Reporting report artifact with exact snapshot/version/hash identity, and later be linked by an authorized canonical Evidence flow.

## 43. CivicSure Packet Acceptance
Provider-specific scope, source references, classification, template version, artifact hash, Reporting snapshot/rendered-file identity, and explicit Evidence-link boundary are represented. Provider self-service cannot create Evidence links unless the explicit authorized permission is present. Report state remains Reporting-owned and packet composition performs no report mutation.

## 44. Secondary Domain Acceptance
The deterministic packet harness includes an external guidance item, a DGAL document item, and a Reporting artifact reference, proving that packet composition can reference domain-owned artifacts and report outputs without claiming ownership. Reporting HTML is checked for print-safe markup and shared hash semantics; report PDF/export remains Reporting-owned.

## 45. UI
DGAL-3 keeps UI bounded to server metadata/artifact preview/download surfaces; no Document Center or broad navigation was added. The HTML artifact itself is a usable preview/print surface.

## 46. Accessibility UI
HTML preview is semantic and print-safe. API state exposes generated/failed/partial semantics for a later UI. No inaccessible PDF compliance claim is made.

## 47. Responsive Behavior
The generated HTML uses responsive metadata/table styles and print media rules, so preview remains usable across desktop, tablet, and mobile widths.

## 48. Security
Scope is actor-derived; direct IDs, artifact references, Evidence links, classification, and retention references are not trusted as authorization. Storage paths are scoped and hash-based; no arbitrary filesystem path is accepted.

## 49. Performance / Limits
Document generation is one bounded structured render and one artifact write. Packet manifests are bounded by request item count and stored deterministically; list/pagination expansion remains reserved for the later Document Center phase.

## 50. Tests
`dgal-document-instances.test.ts` covers accessible HTML, stable hashing, exact version binding, artifact metadata, idempotency, packet ordering/partial state, and Evidence-link boundaries. `dgal-reporting-integration.test.ts` proves Reporting artifact references retain report/snapshot/rendered-file identity, remain org/tenant scoped, do not copy payloads or mutate report state, and use the shared hash/print-ready HTML contract. The existing `CivicSureRenderAdapter.renderPdf()` produced a non-empty `application/pdf` artifact with a SHA-256 hash in the acceptance check. `dgal3StaticContracts.test.mjs` checks authority boundaries and scoped artifact/evidence tables. Migrations 133-134 applied cleanly to an isolated PostgreSQL database.

## 51. DGAL-GAP-004 Closure
**RESOLVED** — durable document and packet instance tables, ordered packet items/manifests, exact version binding, partial state, idempotency, and focused acceptance exist. Packet manifests can reference Reporting-owned artifacts without copying report snapshots.

## 52. DGAL-GAP-007 Closure
**RESOLVED** — artifact metadata and an explicit, scoped DGAL Evidence-link table/service exist; generation does not auto-promote Evidence and authorized-link tests pass. Reporting snapshot/rendered-file references retain hash/version identity and remain separate from Evidence authority.

## 53. DGAL-GAP-008 Closure
**RESOLVED** — classification, retention policy/start references, hold reference, disposition state, archive/supersession distinctions, and migration-backed restore participation exist without a second retention engine.

## 54. DGAL-GAP-013 Closure
**RESOLVED for repository-local scope** — accessible semantic HTML and print output are generated and tested. Tagged PDF/PDF-UA is not claimed; any future tagged-PDF tooling remains an explicitly unimplemented external/tooling dependency.

## 55. Files Created
`apps/shs-api/migrations/133_dgal_document_instances_packets.sql`, `134_dgal_reporting_artifact_packet_refs.sql`; documentation renderer, repository, service, Reporting reference adapter, API routes; focused DGAL-3 tests; this report.

## 56. Files Modified
`apps/shs-api/src/api/router.ts`; `apps/shs-api/src/auth/security-permissions.ts`; DGAL-0 gap register; existing Reporting files were read and reused by reference, not modified.

## 57. Owner Work Preservation
Existing PR-1 through DGAL-2 changes, databases, evidence, generated artifacts, and runtime files were preserved. No unrelated work was reverted.

## 58. Validation
The isolated migration reached head with no drift. Focused renderer/instance/packet/Evidence tests pass, API typecheck passes, and root manifests/UI/build/Layer/Truth/Oracle/diff checks are run as final acceptance. Existing Vite chunk warnings remain non-blocking.

## 59. DGAL-3 Decision
DGAL-GAP-004, 007, 008, and 013 are resolved for repository-local scope. Generated documents remain distinct from approval, acknowledgment, signature, and Evidence acceptance. DGAL-1 and DGAL-2 remain intact; DGAL-4 was not started.

## 60. Exact Next Phase
`DGAL-4 — AGREEMENTS, ACKNOWLEDGMENTS & MANUAL PAPER WORKFLOW`.

### Closure Matrix

| DGAL Gap ID | Starting Status | Work Performed | Tests | Final Status | Evidence |
|---|---|---|---|---|---|
| DGAL-GAP-004 | OPEN — P1 | Added document/packet instance schema, repositories, manifests, exact template binding, idempotency, partial state, and Reporting artifact-reference packet items | Instance/packet tests; Reporting integration tests; migrations 133-134 | RESOLVED | `DocumentationInstanceService`, `ReportingArtifactReferenceService`, packet manifest snapshot/version/hash assertions |
| DGAL-GAP-007 | OPEN — P1 | Added artifact metadata and explicit scoped Evidence-link model/action; packet references preserve Reporting artifact/snapshot/rendered-file identity without cloning or mutating report state | Evidence boundary tests; Reporting integration tests; static scope tests | RESOLVED | `dgal_artifact_links`, `dgal_evidence_links`, authorized-link service, Reporting-owned reference adapter |
| DGAL-GAP-008 | OPEN — P1 | Added classification, retention policy/start, hold reference, disposition state, archive/supersession metadata | Migration/schema acceptance; metadata tests | RESOLVED | PR-2-aligned instance/packet retention fields |
| DGAL-GAP-013 | OPEN — P2 | Added semantic accessible HTML, print CSS, stable preview metadata, optional PDF renderer with honest tagging flag | Renderer accessibility/hash test; build | RESOLVED | `DocumentationRenderer`; PDF tagging not claimed |
