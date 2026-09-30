# Arcade Phase 2B Legacy Catalog Adapter

## Purpose

Phase 2B adds a pure compatibility adapter from the legacy frontend catalog to the Phase 2A Arcade Experience Descriptor. It supports catalog discovery and migration preparation without introducing a new source of institutional truth.

**SEPARATE AUTHORITIES, SHARED COORDINATION.**

Legacy Arcade catalog metadata may describe historical UI intent but cannot establish Arcade Activity existence, mastery, verified evidence, career readiness, reward entitlement, credential state, or institutional truth.

## Legacy Catalog Boundary

`src/data/arcade.js` remains intact because existing UI and shared Arcade consumers still depend on its exports. Current direct consumers include `src/pages/arcade/ArcadeLibrary.jsx`, `src/shared/arcade/useArcadeLedger.js`, and `src/shared/arcade/useArcadeHistory.js`; `src/shared/arcade/arcadeRules.js` also describes the legacy metadata contract. Phase 2B does not migrate those consumers.

## Classification

The four `arcadeGames` entries are adapted as Learning previews:

- `debt-hunter`: game
- `career-rush`: game
- `client-sim`: simulation
- `resume-quest`: game

Each has `status: preview`, `launchable: false`, `playable: false`, no launch route, no result capability, and a null Arcade Activity reference. The old route can appear in provenance and debug-only legacy metadata, but it is not promoted to a launch route. No Activity ID is inferred from a game ID, slug, title, route, tags, or comments.

The eight `sections` display games are adapted as Classic game previews. Their title, category tag, and artwork are presentation metadata. They have no Activity reference, no playable/launchable state, and no result-producing capabilities. Legacy hue is retained only as compatibility metadata outside the descriptor.

## Legacy Fields

`xpReward`, `polygonAction`, `selTags`, and `workforceTags` remain only in the adapter's explicitly non-authoritative `legacyMetadata` field, where available. They cannot authorize Treasury rewards, Polygon actions, verified skills, evidence, mastery, credentials, or Career readiness. The Phase 2A descriptor does not gain fields for these values.

## Phase 2A Relationship

The adapter emits a descriptor and the deterministic result of `validateArcadeExperienceDescriptor()`. Catalog projection can later compose valid descriptors with canonical Arcade Activities through the Phase 2A projection helpers. This slice does not query the backend or create Activity records. Curriculum linkage continues to come only from `curriculum_lesson_arcade_activities`; Arcade results, Verified Evidence, Truth Spine, Treasury, Career, Identity, Metaverse, Agent Fabric, and Studio/Registry/Moderation retain their existing authorities.

## Later Migration

Later bounded slices may migrate individual consumers after their authority and compatibility behavior is addressed. Until then, `src/data/arcade.js`, `useArcadeLedger`, `useArcadeHistory`, and `arcadeRules` remain in place and unchanged. The adapter is a compatibility boundary, not a replacement catalog or runtime implementation.
