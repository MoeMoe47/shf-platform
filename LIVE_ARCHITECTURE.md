# LIVE_ARCHITECTURE.md

## Purpose
This file defines the official live file authority for the SHS/SHF flagship infrastructure.
Anything not listed as live here should be treated as:
- deprecated
- restore-only
- experimental
- backup/reference

This file exists to stop architecture drift and prevent editing backup/recovery files by accident.

---

# 1. Flagship surfaces

## Exchange Command Center
**Live file:**  
`src/pages/exchange/CommandCenter.jsx`

**Supporting live files:**  
- `src/pages/exchange/CommandCenterShell.jsx`
- `src/pages/exchange/useCommandCenterData.js`
- `src/pages/exchange/useDerivedCommandState.js`
- `src/pages/exchange/buildActiveAgentContext.js`
- `src/pages/exchange/buildComputedAgentContext.js`
- `src/pages/exchange/buildAnalystNarrative.js`
- `src/pages/exchange/buildDecisionSignal.js`
- `src/pages/exchange/AnalystPredictionCard.jsx`
- `src/pages/exchange/DecisionSignalCard.jsx`

**Related live folders:**  
- `src/pages/exchange/command-center/`
- `src/pages/exchange/sim/`
- `src/pages/exchange/map-stage/`

**Do not edit unless restoring on purpose:**  
- any file in `src/pages/exchange/` containing:
  - `.bak`
  - `BROKEN_RECOVERY`
  - `STABLE_AFTER_RECOVERY`
  - `STOP_LOOP`
  - `safe_working`
  - `legacy`
  - `EVENT_CONFIRMED`
  - `LOOP_STOP_CHECKPOINT`
  - `STABLE_WITH_CARD`

**Notes:**  
This is the official SHS command intelligence surface.

---

## SHS Command Surface
**Live file:**  
`src/pages/exchange/SHSCommandSurface.jsx`

**Supporting live files:**  
- `src/pages/exchange/command-surface/CountyOverlay.jsx`
- `src/pages/exchange/command-surface/IEPSystemCard.jsx`
- `src/pages/exchange/command-surface/shs-command-surface.css`
- `src/pages/exchange/command-surface/shs-county-overlay.css`
- `src/pages/exchange/command-surface/shs-layout-fix.css`
- `src/pages/exchange/command-surface/shs-map-alive.css`
- `src/pages/exchange/command-surface/shs-signal-layer.css`

**Do not edit unless restoring on purpose:**  
- any `SHSCommandSurface.jsx.*`
- any `*.safe_working`
- any `*.broken_now`
- any `*.fixbackup_*`
- any `.bak_*`

**Notes:**  
This is the official surface shell for SHS command presentation.
If behavior and shell disagree, this file is the surface authority, while `CommandCenter.jsx` remains the command logic authority.

---

## SHF Impact Command Center
**Live file:**  
`src/pages/shf-command/SHFImpactCommandCenter.jsx`

**Supporting live files:**  
- `src/pages/shf-command/shf-impact-command-center.css`
- `src/pages/shf-command/sections/AIAnalystPanel.jsx`
- `src/pages/shf-command/sections/ImpactGuidancePanel.jsx`
- `src/pages/shf-command/sections/ImpactKpiBand.jsx`
- `src/pages/shf-command/sections/ImpactOverviewWheelPanel.jsx`
- `src/pages/shf-command/sections/ProgramHealthPanel.jsx`
- `src/pages/shf-command/sections/ReportsBriefingsPanel.jsx`
- `src/pages/shf-command/sections/TrustVerificationPanel.jsx`

**Do not edit unless restoring on purpose:**  
- any `SHFImpactCommandCenter.jsx.bak*`
- any `shf-impact-command-center.css.bak*`

**Notes:**  
This is the official SHF institutional command surface.

---

## SHF Tactical / Map Authority
**Current live runtime map file:**  
`src/pages/shf-command/components/SHFImpactOhioMap.jsx`

**Current live runtime parent:**  
`src/pages/shf-command/SHFImpactCommandCenter.jsx`

**Related live files:**  
- `src/pages/shf-command/components/shf-impact-ohio-map.css`
- `src/pages/shf-command/components/SHFRegionalCountyCluster.jsx`

**Non-runtime tactical module at present:**  
- `src/pages/shf-command/components/map/OhioImpactTacticalMap.jsx`
- `src/pages/shf-command/components/map/ohio-impact-tactical-map.css`

**Do not edit unless restoring on purpose:**  
- any `SHFImpactOhioMap.jsx.bak*`
- any `shf-impact-ohio-map.css.bak*`
- any `SHFRegionalCountyCluster.jsx.bak*`

**Notes:**  
`SHFImpactOhioMap.jsx` is the current real map authority used in SHF command runtime.  
`OhioImpactTacticalMap.jsx` exists as a tactical map module, but is not currently the primary rendered map in SHF command mode.

---

# 2. Flagship workflow layers

## Aggregation Admin
**Live folder:**  
`src/pages/admin/aggregation/`

**Live files:**  
- `AggregationOverview.jsx`
- `EntityResolutionQueue.jsx`
- `LineageExplorer.jsx`
- `MappingRegistry.jsx`
- `QualityCommandPanel.jsx`
- `ReconciliationWorkbench.jsx`
- `VerificationWorkbench.jsx`
- `admin-aggregation.css`

**Notes:**  
This is the live verified aggregation workbench and should be treated as a flagship product layer.

---

## Hub Collaboration
**Live folder:**  
`src/pages/hub/`

**Live files:**  
- `HubLeadershipDashboard.jsx`
- `IntakeNavigatorConsole.jsx`
- `PartnerActionQueue.jsx`
- `ReferralLifecycleView.jsx`
- `UnmetNeedsQueue.jsx`
- `hub.css`

**Notes:**  
This is the live hub collaboration layer and should be treated as a flagship product layer.

---

# 3. Exchange mode surfaces

## Live dashboards
- `src/pages/exchange/OperatorDashboard.jsx`
- `src/pages/exchange/ProviderDashboard.jsx`
- `src/pages/exchange/InvestorDashboard.jsx`
- `src/pages/exchange/PublicTransparency.jsx`
- `src/pages/exchange/ExchangeLayout.jsx`

**Notes:**  
These are live mode surfaces unless replaced intentionally by future architecture decisions.

---

# 4. Services

## Active services
**Status:** To be confirmed manually today.

Use this section to identify:
- active service root
- active app entry point(s)
- active report/export entry points
- active simulation entry points
- active verification entry points

**Current instruction:**  
Anything under `services/_graveyard/` is non-live unless explicitly restored.

---

# 5. Editing rules

## Safe to patch directly
You may patch directly when:
- one live file is clearly identified
- change is local
- no shared system contract changes
- no cross-surface state changes

Examples:
- local UI bug
- label/text bug
- one CSS fix
- one route typo
- one isolated conditional

## Requires refactor first
Do not patch-first when the issue touches:
- certified context
- shared state
- trust envelope
- publication modes
- map authority
- analyst synchronization
- simulation synchronization
- aggregation model
- hub lifecycle model
- report/export object model

---

# 6. Daily update rule

Before editing any flagship surface:
1. Confirm the live file is listed here
2. Confirm you are not inside a backup/recovery variant
3. State whether the task is:
   - Freeze
   - Refactor
   - Harden
   - Prove
4. Only then start editing

---

# 7. First-pass unresolved items

- [ ] Confirm active backend/service entry points
- [x] Confirm final authority split between `CommandCenter.jsx` and `SHSCommandSurface.jsx`
- [x] Confirm whether `SHFImpactOhioMap.jsx` or `OhioImpactTacticalMap.jsx` is the ultimate primary render authority in all SHF command modes
- [ ] Confirm report/export live entry points
- [ ] Confirm whether any Exchange legacy files still participate in runtime
