# Studio Phase 4: Project Resources / Development Library Integration

## 1. Canonical owner

SHRV1's canonical resource owner is the Curriculum Catalog resource domain: `curriculum_resources`, its lesson links, and the immutable `curriculum_releases.snapshot`. SHF-Next's Development Library remains a static commercial prototype catalog and is not promoted to institutional truth.

## 2. Adapter architecture

Assignment-origin Studio projects use their server-owned assignment and release lineage. The Studio resource read endpoint authorizes the project first, resolves the handoff's unit and lesson keys, reads that exact organization's published release snapshot, and returns only student-safe resource fields. The browser never queries global resources or filters another organization's data.

The path is:

`Studio Project -> authorized handoff/release lineage -> curriculum release snapshot -> Studio resource response -> Project Resources UI`

Independent student-idea projects have no assignment lineage and therefore receive an honest empty resource response. No project-resource relationship or resource completion state was added.

## 3. Visibility and truthfulness

Published release snapshots are the student-facing boundary. Draft and unpublished live catalog records are not queried by Studio. Required/recommended semantics and stage relevance are not returned because the canonical model does not currently provide them; the UI does not invent those claims. Resource links may be opened, but viewing a resource cannot mutate project status, completion, Evidence, Portfolio, QA, review, delivery, or reporting.

## 4. Student presentation

The shared project shell now presents `Project Resources`, groups assignment-linked resources under `From your assignment`, and shows a truthful empty or unavailable state. Technical identifiers and source internals remain hidden in the default Beginner presentation. The existing Advanced mode remains presentation-only; it does not unlock resource access or permissions.

## 5. Companion boundary

The existing Companion receives a bounded, read-only summary of resource id, title, type, description, and source label. It can explain or suggest a resource but has no resource mutation or institutional authority.

## 6. Security and separation

The API uses the existing Studio project permission, organization/tenant scope, and project authorization path. A missing project, foreign project, malformed project id, unauthorized learner, or missing organization context fails through the existing error boundary. No ClientOps, Evidence, Portfolio, completion, milestone, or celebration behavior was added.

## 7. Deferred work

Resource authoring, general Development Library redesign, project-specific resource attachment, resource completion/favorites/ratings, richer required/recommended metadata, stage relevance metadata, resource analytics, and Evidence/Portfolio actions remain deferred until their canonical domains and contracts exist.

## 8. Phase 5 entry contract

Phase 5 may build the Build Packet boundary over the existing Studio project and assignment/release lineage. It must continue to consume Project Resources through this read-only adapter, keep resource state separate from lifecycle truth, and preserve the same organization/tenant authorization rules.
