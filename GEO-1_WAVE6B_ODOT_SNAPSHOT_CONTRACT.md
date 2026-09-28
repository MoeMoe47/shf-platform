# GEO-1 Wave 6B ODOT Snapshot Contract

## Required Metadata

```text
snapshotId
publisher
service
layer
serviceItemId
sourceUrl
retrievedAt
sourceUpdatedAt
nativeCrs
requestedExportCrs
featureCount
fipsSetHash
geometryHash
schemaHash
rawSnapshotHash
rightsStatus
attribution
reviewStatus
approvedBy
approvedAt
supersedesSnapshotId
```

`sourceUpdatedAt` is nullable when the service does not expose a canonical
update timestamp. It must not be invented.

## Deterministic Identity

Use retrieval timestamp plus raw SHA-256 when no official version exists:

```text
odot-county:<retrievedAt>:<rawSnapshotHash>
```

This is a snapshot identity, not an ODOT dataset version.

## Lifecycle

```text
RETRIEVED -> VALIDATED -> DIFF_REVIEWED -> APPROVED -> ACTIVE
                                             \-> REJECTED
ACTIVE -> SUPERSEDED
ACTIVE -> prior APPROVED/SUPERSEDED snapshot for rollback
```

No snapshot becomes `ACTIVE` automatically.

## Approval and Refresh

Activation requires 88 valid unique Ohio FIPS, schema review, geometry review,
relevant-attribute review, provenance validation, acceptable rights status,
human approval, and recorded approval metadata.

Check annually or when an official update is detected. Retrieve temporarily,
hash it, compare FIPS/schema/geometry/attributes, produce a change report,
approve or reject, and retain the prior approved snapshot.

## Runtime Rule

`ODOT service -> controlled retrieval -> governed snapshot -> approval -> adapter`

The production adapter must consume only an approved snapshot. It must never
fetch ODOT from a browser or application runtime.

## Snapshot Gate

`SNAPSHOT_GATE_CLEAR_WITH_CONDITIONS`

The contract is defined, but no production snapshot repository, approval record,
or active ODOT snapshot exists yet.
