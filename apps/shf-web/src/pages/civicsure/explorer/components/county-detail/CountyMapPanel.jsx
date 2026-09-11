// CountyMapPanel.jsx — thin wrapper around the existing
// ExplorerMapPanel.jsx (built for the Explorer main page) rather than
// a second CSS-gradient map implementation. Passes this county's own
// overlay stats and omits the "View County Details" action (the page
// is already the county detail page, so a link back to itself would
// be a dead end) — see ExplorerMapPanel.jsx for the props that make
// this reuse possible. DEMO / FRAME DATA (see
// ../../countyDetailMockData.js).
import React from "react";
import ExplorerMapPanel from "../ExplorerMapPanel.jsx";

export default function CountyMapPanel({ county }) {
  return (
    <ExplorerMapPanel
      overlayTitle={county.name}
      overlayStats={county.mapOverlayStats}
      mapLabel={`Illustrative map of ${county.name} with placeholder program and provider location markers`}
    />
  );
}
