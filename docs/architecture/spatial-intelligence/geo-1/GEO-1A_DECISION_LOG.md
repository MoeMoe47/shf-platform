# GEO-1A Decision Log

## GEO1A-DEC-001

Decision ID: GEO1A-DEC-001
Question: Should Spatial own domain state?
Decision: No. Spatial owns projection and coordination behavior only.
Alternatives considered: Centralize domain state in Spatial; leave every map isolated.
Repository evidence: GEO-0 found SHF, Exchange/Capital, CivicSure, Metaverse, missions, and reporting authorities already exist separately.
Reason: Centralizing domain truth in Spatial would transfer authority and risk fabricating or overriding source systems.
Affected phases: GEO-1 through GEO-10.
Revisit condition: Only if a future governance decision explicitly creates a spatial source-of-truth service.

## GEO1A-DEC-002

Decision ID: GEO1A-DEC-002
Question: Should Quick Map and master-city coordinates be treated as one space?
Decision: No. They remain separate coordinate spaces.
Alternatives considered: Normalize all Metaverse coordinates into one shared 0-100 plane.
Repository evidence: GEO-0 confirmed Quick Map image dimensions differ from the master-city plate and no transform was found.
Reason: Shared numeric ranges do not prove shared geometry.
Affected phases: GEO-3, GEO-4, GEO-8, GEO-10.
Revisit condition: A calibrated transform registry with evidence and tests exists.

## GEO1A-DEC-003

Decision ID: GEO1A-DEC-003
Question: Should disconnected maps/globes be removed when Spatial Engine starts?
Decision: No. Preserve until GEO-10 acceptance evidence supports retirement.
Alternatives considered: Delete disconnected implementations during GEO-1 or GEO-4.
Repository evidence: GEO-0 identified disconnected or checkpoint-only map/globe candidates.
Reason: Preservation before replacement protects recovery evidence and parity analysis.
Affected phases: GEO-8, GEO-10.
Revisit condition: GEO-10 parity/migration gate accepts retirement.

## GEO1A-DEC-004

Decision ID: GEO1A-DEC-004
Question: Should route presence imply authority?
Decision: No. Routes and mounts prove presentation availability only.
Alternatives considered: Treat mounted components as authoritative.
Repository evidence: GEO-0 found mounted maps with hardcoded, suppressed, or unverified data.
Reason: Presentation cannot approve, verify, or publish domain data.
Affected phases: GEO-1 through GEO-7.
Revisit condition: None; this is a standing authority rule.

## GEO1-WAVE1-DEC-001

Decision ID: GEO1-WAVE1-DEC-001
Question: What format should projected spatial feature IDs use in Wave 1?
Decision: Use `spatial:<domain>:<featureType>:<sourceAuthority>:<sourceRecordId>`.
Alternatives considered: Use domain record id only; use random UUIDs; omit source authority.
Repository evidence: GEO-1B identified feature IDs as a foundation blocker and required stable, deterministic, namespaced IDs that preserve source authority.
Reason: Including source authority avoids pretending that two domains with the same record id own the same feature, while still preserving deterministic projection identity.
Affected phases: GEO-1 Wave 1, GEO-3, GEO-6, GEO-10.
Revisit condition: Revisit if a later canonical source-id service exists.

## GEO1-WAVE1-DEC-002

Decision ID: GEO1-WAVE1-DEC-002
Question: Should Wave 1 register coordinate transforms?
Decision: No. Wave 1 registers coordinate spaces only and rejects cross-space transforms.
Alternatives considered: Add placeholder transforms; allow normalized METAVERSE spaces to interoperate.
Repository evidence: GEO-0 and GEO-1A found no confirmed Quick Map to master-city transform.
Reason: Shared normalized ranges are not evidence of shared geometry.
Affected phases: GEO-1 Wave 1, GEO-3, GEO-8.
Revisit condition: Revisit only when an explicit transform registry with evidence and tests exists.

## GEO1-WAVE2A-DEC-001

Decision ID: GEO1-WAVE2A-DEC-001
Question: Should the Wave 1 feature ID format be accepted for Wave 2 planning?
Decision: ACCEPT `spatial:<domain>:<featureType>:<sourceAuthority>:<sourceRecordId>`.
Alternatives considered: Add version to the ID; preserve source colons literally; use domain record IDs only; switch to random UUIDs.
Repository evidence: Wave 1 tests prove deterministic normalization, namespace safety, source-authority preservation, and collision separation by authority.
Reason: The format is stable, URL-safe after normalization, case-normalized, and preserves source authority without inventing domain identity. Source record IDs containing colons are normalized for ID safety while the original source record remains in `sourceRecordId` and provenance.
Affected phases: GEO-1 Wave 2A, GEO-1 Wave 2B, GEO-3, GEO-6.
Revisit condition: Revisit only if a canonical source-id service or source authority requires versioned projected identity.

## GEO1-WAVE2A-DEC-002

Decision ID: GEO1-WAVE2A-DEC-002
Question: What runtime shape should Wave 2B use for shared selection?
Decision: Design for a pure JavaScript in-memory single-selection store first.
Alternatives considered: React context first; existing SHS Event Bus; browser storage; network/distributed event infrastructure.
Repository evidence: The repo contains small no-dependency local event helpers and larger SHS event/command bus systems; GEO-1B recommends lightweight shared modules under `src/shared/spatial/`.
Reason: Single in-memory selection is deterministic, testable, framework-light, and avoids persistence, authorization, or domain mutation.
Affected phases: GEO-1 Wave 2B, GEO-7.
Revisit condition: Revisit when a real client needs React provider ergonomics, multi-selection, URL sync, or cross-tab sync.

## GEO1-WAVE2A-DEC-003

Decision ID: GEO1-WAVE2A-DEC-003
Question: Should spatial interactions replay by default?
Decision: No. Transient interactions are not replayed; canonical selection state is stored separately; domain actions are never replayed automatically.
Alternatives considered: Replay all events to late subscribers; replay only last event per type; persist event history.
Repository evidence: GEO-1A and GEO-1B separate selection state from interaction envelopes and prohibit domain authority transfer.
Reason: No replay is safer for UI interactions and avoids accidental domain action re-execution.
Affected phases: GEO-1 Wave 2B.
Revisit condition: Revisit only for development-only debugging hooks or an explicitly approved replay design.
