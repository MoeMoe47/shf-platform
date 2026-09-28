# GEO-1 Wave 6C Metaverse Regional Feature Design

## Proposed Contract Only

No runtime implementation is authorized by this document.

### Regional Scene Feature

```text
domain: metaverse-regional
featureType: regional-scene
sourceAuthority: silicon-heartland-metaverse-regional-scene-registry
sourceRecordId: stable scene id, for example oil-rig
coordinateFamily: METAVERSE
coordinateSpaceId: metaverse.regional-scene
```

The projected feature would be limited to a stable scene identity, display
label, qualified scene-local presentation extent or asset reference, and
provenance. It would not include domain workflow, traffic state, water
mobility, or navigation ownership.

### Relationships Deferred

`regional-transition` is a future candidate only. Current scene order and
`nextScene`/`previousScene` fields remain Metaverse route authority and must not
be silently reclassified as geometric paths or Spatial navigation.

## Feature ID

Use the existing deterministic helper with the future values above. Do not
handcraft IDs, reuse Quick Map IDs, or use array position as source identity.

## Planned Red-Test Contract

Twenty planned cases across domain/source/feature identity, coordinate-space
acceptance, scene ordering, provenance, asset immutability, no implicit
transforms, Quick Map/master-city isolation, navigation authority, publication
boundary, accessibility, mobility-authority isolation, and rejection of
runtime-invented scenes. These are planning cases only and are not created in
Wave 6C.
