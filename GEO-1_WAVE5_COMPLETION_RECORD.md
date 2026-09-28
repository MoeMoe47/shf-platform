# GEO-1 Wave 5 Completion Record

## Wave Matrix

| Phase | Status | Result |
| --- | --- | --- |
| Wave 5A | `COMPLETE_WITH_CONDITIONS` | Map estate and source-authority audit; no mappings created. |
| Wave 5B | `COMPLETE` | Existing map regression baseline frozen; `37/37 PASS`, zero regressions and unexpected failures. |
| Wave 5C | `COMPLETE` | Qualified Census source and production county adapter; ODOT remains independent. |
| Wave 5D | `COMPLETE_WITH_ROLLBACK_CONDITION` | IEP identity, client, dual-run, browser certification, and Spatial-default cutover complete. |
| Wave 5E | `COMPLETE_WITH_ROLLBACK_CONDITION` | IEP migration accepted; DEV rollback and diagnostics retained, legacy default retired. |

## Final IEP Architecture

```text
U.S. Census Bureau 2010 Cartographic Boundary File match
  -> census-geography / county adapter
  -> Spatial Projection Pipeline
  -> IEP county client adapter
  -> existing IEP renderer
```

IEP owns domain records and navigation. Census owns county base geometry.
Joins require explicit validated five-digit Ohio FIPS. No coordinate transform,
publication transfer, entity inference, or Franklin fallback is introduced.

## Verification

- Full Spatial: `383/383 PASS`
- IEP regression: `6/6 PASS`
- Cutover tests: `20/20 PASS`
- Browser certification and Quick Map set: `10/10 PASS`
- Wave 5E focused acceptance: `2/2 PASS`
- Build: `PASS`
- Production preview: `PASS`
- Census and ODOT assets: unchanged

## Conditions Outside This Migration

- Future authoritative IEP producers must supply `countyFips: string | null`.
- Exchange/Capital, SHF publication, ODOT operational onboarding, and disconnected globe disposition remain separate work.
- The unrelated global `entityToCounty` defect remains outside the migrated IEP canonical path.

## Status

`WAVE_5_COMPLETE_WITH_CONDITIONS`

Wave 6 is `READY_WITH_CONDITIONS` for a separately approved additional-client
phase. No Wave 6 implementation begins in this record.
