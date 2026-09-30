# Arcade Phase 2A Experience Projection Architecture

## Purpose

Phase 2A introduces an Arcade Experience Projection foundation for discovery, presentation, launch/runtime metadata, capability description, and references to authoritative systems. It is a read model and descriptor boundary only. It does not create gameplay, runtime execution, UI changes, database schema, evidence verification, mastery, rewards, publishing, or institutional truth.

The organizing principle is:

**SEPARATE AUTHORITIES, SHARED COORDINATION.**

## Existing Arcade Authority

The backend remains the canonical owner of Arcade operational facts:

- `arcade_activities` owns canonical Arcade Activity definitions.
- `arcade_attempts` owns learner execution records.
- `arcade_results` owns immutable Arcade outcomes and remains the source for mastery.
- `mastery_achieved` is derived server-side from the stored deterministic Activity policy.
- `arcade.resulted` remains the downstream integration boundary for Verified Evidence.

The Phase 2A descriptor does not replace or duplicate those facts.

## Why This Is a Projection

The projection composes an Arcade-owned descriptor with an optional canonical Arcade Activity returned by the backend. If a descriptor references an `arcade_activity_id` but no Activity is supplied, the projection surfaces the reference as unresolved. It never fabricates an `ArcadeActivity`.

The projection may expose references to external systems, but it must not copy Curriculum, Career, Treasury, Verified Evidence, Truth Spine, Metaverse, Studio, Identity, or Agent Fabric truth into Arcade-owned data.

## Descriptor-Owned Fields

The descriptor owns presentation/runtime metadata only:

- stable descriptor identity: `id`, `slug`
- Arcade Activity reference: `activityReference.arcadeActivityId`
- product grouping: `family`, `experienceType`
- lifecycle display/runtime flags: `status`, `launchable`, `playable`
- launch metadata: `route`, `runtimeType`
- presentation metadata: title, short title, description, category, difficulty, artwork, thumbnail
- capability description: leaderboard, tournament, multiplayer, spectator, evidence-result capability
- reference-only relationships to external authorities
- accessibility requirements
- descriptor provenance

Classic preview-only experiences may exist without `arcadeActivityId` when they do not produce results. Learning experiences that claim evidence-result capability must reference a real Arcade Activity.

## Reference-Only External Relationships

External relationships are references, not copied truth:

- Career references may identify pathway references, but Career remains the pathway/readiness authority.
- Metaverse references may identify related experience references, but Metaverse remains its own authority.
- Agent Fabric references may identify capability references, but Agent Fabric keeps policy authority.
- Treasury references may identify reward policy references, but Treasury keeps economy authority.
- Studio references may identify project references, but Studio registry/moderation keeps publishing authority.

Arcade descriptors do not store Curriculum Lesson linkage. Curriculum Lesson <-> Arcade Activity relationships are resolved exclusively through `curriculum_lesson_arcade_activities`.

## Prohibited Authority Claims

Descriptors and projections must not include or derive:

- mastery/completion state
- verified evidence state
- credential issuance
- career readiness or employment eligibility
- reward earned state
- wallet or balance state
- credit score or economy outcomes
- identity, permission, Agent Fabric policy, Metaverse completion, or Truth Spine facts

Those claims belong to their canonical authorities.

## Migration 052 Relationship

Migration `052_arcade_activities.sql` defines the existing canonical Arcade Activity structure. Phase 2A keys descriptors to `arcade_activity_id` only when an experience maps to a real Arcade Activity. It does not modify `arcade_activities`, `arcade_attempts`, or `arcade_results`.

`arcade_activities.lesson_id` is legacy/free-text compatibility metadata. It is not canonical for new Phase 2 Curriculum linkage and must not be used for new relationships in this phase.

## Migration 064 Relationship

Migration `064_curriculum_resource_arcade_linkage.sql` establishes `curriculum_lesson_arcade_activities` as the canonical Curriculum Lesson to Arcade Activity relationship. Phase 2A descriptors may reference an Arcade Activity through `activityReference.arcadeActivityId`, but they do not store Curriculum Lesson linkage. Curriculum linkage remains resolved exclusively through that join table.

## Outcomes, Evidence, and Economy

`arcade_results` remains the canonical Arcade outcome and mastery record. The `arcade.resulted` event remains the downstream boundary to Verified Evidence, and Verified Evidence remains the evidence authority.

Treasury remains the economy and rewards authority. A descriptor may reference a Treasury policy identifier, but it cannot declare rewards earned, balances, transactions, or spendable value.

Truth Spine remains the institutional truth authority. Phase 2A does not write Truth Spine facts or create a new source of institutional truth.
