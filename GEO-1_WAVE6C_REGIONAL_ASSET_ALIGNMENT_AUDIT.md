# GEO-1 Wave 6C Regional Asset Alignment Audit

## Oil Rig

DAY, DUSK, and NIGHT assets are all `1536x1024`. Visual review shows the rig
and horizon composition are strongly consistent. However, the assets use
different PNG channel characteristics and the repository has no landmark or
registration manifest. Result: `INSUFFICIENT_EVIDENCE` for shared production
geometry until alignment evidence is recorded.

## Open Sea

The asset dimensions are:

| Variant | Dimensions |
| --- | --- |
| DAY | `1584x993` |
| DUSK | `1580x995` |
| NIGHT | `1578x997` |

The variants depict the same broad horizon/ocean composition, but the
dimensions differ and no alignment manifest exists. Result:
`INSUFFICIENT_EVIDENCE` for shared production geometry.

## Consequence

Variant sharing is not approved for either scene. A future authoring review
must either establish a common scene frame with measured registration or mark
geometry variant-specific. Images are unchanged.
