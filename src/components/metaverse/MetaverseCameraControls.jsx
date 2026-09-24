import React from "react";

// MINIMAP V3 — PART 1: "Reset View" moved into the sidebar's Map
// section (MetaverseCityPage.jsx) so it's no longer a persistent
// floating control on the city canvas. This component intentionally no
// longer accepts/renders an onReset button.
//
// UI AUTHORITY RECONCILIATION — owner decision: the sidebar is now the
// canonical navigation/control authority, superseding the older
// MET-7/MET-8 requirement that a floating Locations/Missions/
// Opportunity Exchange cluster also live on the city canvas. Those
// toggles are removed here (see tests/metaverseMissionIntegration.
// test.mjs and tests/metaverseOpportunityExchange.test.mjs for the
// updated coverage proving the SAME underlying capability — opening
// missionsOpen/opportunitiesOpen/navigatorOpen — is reachable from
// MetaverseSidebar's Explore/Missions/Opportunities nav items instead).
// Student Market / Work Passport toggles are untouched — out of scope
// for this reconciliation, and not part of the owner's removal list.
export default function MetaverseCameraControls({
  onZoomIn,
  onZoomOut,
  onBack,
  canGoBack,
  marketOpen,
  onToggleMarket,
  marketCount,
  passportOpen,
  onTogglePassport,
  passportClaimCount,
}) {
  return (
    <div className="met-controls" aria-label="Camera controls">
      <button type="button" onClick={onZoomIn} aria-label="Zoom in">+</button>
      <button type="button" onClick={onZoomOut} aria-label="Zoom out">-</button>
      <button type="button" onClick={onBack} disabled={!canGoBack}>Back</button>
      {onToggleMarket ? (
        <button type="button" onClick={onToggleMarket} aria-expanded={marketOpen}>
          Student Market{typeof marketCount === "number" ? ` (${marketCount})` : ""}
        </button>
      ) : null}
      {onTogglePassport ? (
        <button type="button" onClick={onTogglePassport} aria-expanded={passportOpen}>
          Work Passport{typeof passportClaimCount === "number" ? ` (${passportClaimCount})` : ""}
        </button>
      ) : null}
    </div>
  );
}
