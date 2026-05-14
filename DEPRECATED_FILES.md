# DEPRECATED_FILES.md

## Purpose
These files are not to be edited as active architecture unless intentionally restoring from them.

## Exchange patterns
- `*.bak*`
- `*.BROKEN_RECOVERY*`
- `*.STABLE_AFTER_RECOVERY*`
- `*.STOP_LOOP*`
- `*.safe_working`
- `*.broken_now`
- `*.legacy*`
- `*.EVENT_CONFIRMED*`
- `*.LOOP_STOP_CHECKPOINT*`
- `*.STABLE_WITH_CARD*`

## SHF Command patterns
- `*.bak*`
- `*.broken_*`
- restore-only historical variants of:
  - `SHFImpactCommandCenter.jsx`
  - `SHFImpactOhioMap.jsx`
  - `SHFRegionalCountyCluster.jsx`
  - `shf-impact-command-center.css`
  - `shf-impact-ohio-map.css`

## Services
- anything under:
  - `services/_graveyard/`

## Rule
If a file matches one of the patterns above, do not edit it unless:
1. you are intentionally restoring from it
2. you first note that in the daily tracker
3. you re-declare which file becomes live afterward
