# Wave 6C Oil Rig Draft Schema
```text
{
  sceneId: "oil-rig",
  coordinateFamily: "METAVERSE",
  coordinateSpace: "metaverse.regional-scene",
  geometryType: "Polygon",
  geometry: { type: "Polygon", coordinates: [...] },
  geometryHash,
  compositionFamilyId,
  assetFamilyHash,
  assetAlignment,
  authoringMetadata,
  status: "DRAFT"
}
```

The schema carries no approval fields, navigation commands, mobility records,
or client state. Canonical export requires a valid closed Polygon and matching
geometry hash. APPROVED records are preview-only inputs and cannot be edited in
place.
