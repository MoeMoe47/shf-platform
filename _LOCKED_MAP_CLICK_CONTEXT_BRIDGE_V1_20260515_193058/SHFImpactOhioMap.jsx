import React, { useMemo, useState } from "react";
import OhioCountyOfficialMapV2 from "@/pages/iep-command-v2/OhioCountyOfficialMapV2.jsx";
import SHFRegionalCountyCluster from "./SHFRegionalCountyCluster.jsx";
import "./shf-impact-ohio-map.css";

const COUNTY_DATA = {
  Franklin:   { programs: "5", people: "3,824", funding: "$4.5M", outcome: "82%", condition: "Stable" },
  Delaware:   { programs: "2", people: "1,120", funding: "$1.2M", outcome: "76%", condition: "Stable" },
  Licking:    { programs: "2", people: "980",  funding: "$980K", outcome: "72%", condition: "Watch" },
  Fairfield:  { programs: "1", people: "640",  funding: "$610K", outcome: "68%", condition: "Stable" },
  Pickaway:   { programs: "1", people: "420",  funding: "$430K", outcome: "66%", condition: "Stable" },

  Cuyahoga:   { programs: "4", people: "2,406", funding: "$3.2M", outcome: "79%", condition: "Watch" },
  Lake:       { programs: "2", people: "870",   funding: "$860K", outcome: "71%", condition: "Stable" },
  Geauga:     { programs: "1", people: "350",   funding: "$370K", outcome: "67%", condition: "Stable" },
  Summit:     { programs: "2", people: "1,240", funding: "$1.4M", outcome: "71%", condition: "Opportunity" },
  Lorain:     { programs: "2", people: "910",   funding: "$930K", outcome: "69%", condition: "Stable" },

  Hamilton:   { programs: "3", people: "1,955", funding: "$2.1M", outcome: "74%", condition: "Stable" },
  Butler:     { programs: "2", people: "820",   funding: "$810K", outcome: "70%", condition: "Stable" },
  Warren:     { programs: "1", people: "510",   funding: "$500K", outcome: "68%", condition: "Stable" },
  Clermont:   { programs: "1", people: "490",   funding: "$470K", outcome: "67%", condition: "Stable" },
  Montgomery: { programs: "2", people: "1,112", funding: "$1.1M", outcome: "69%", condition: "Stable" },

  Carroll:    { programs: "1", people: "500",   funding: "$500K", outcome: "70%", condition: "Stable" },
  Stark:      { programs: "2", people: "980",   funding: "$960K", outcome: "74%", condition: "Stable" },
  Tuscarawas: { programs: "1", people: "420",   funding: "$410K", outcome: "68%", condition: "Stable" },
  Harrison:   { programs: "1", people: "260",   funding: "$250K", outcome: "64%", condition: "Watch" },
  Columbiana: { programs: "1", people: "390",   funding: "$380K", outcome: "66%", condition: "Stable" },

  Coshocton:  { programs: "1", people: "500",   funding: "$500K", outcome: "70%", condition: "Stable" },
  Holmes:     { programs: "1", people: "340",   funding: "$320K", outcome: "65%", condition: "Stable" },
  Knox:       { programs: "1", people: "420",   funding: "$430K", outcome: "68%", condition: "Stable" },
  Muskingum:  { programs: "2", people: "760",   funding: "$740K", outcome: "71%", condition: "Stable" },

  Ashland:    { programs: "1", people: "410",   funding: "$390K", outcome: "67%", condition: "Stable" },
  Richland:   { programs: "2", people: "710",   funding: "$700K", outcome: "70%", condition: "Stable" },
  Wayne:      { programs: "2", people: "660",   funding: "$650K", outcome: "69%", condition: "Stable" },
  Morrow:     { programs: "1", people: "250",   funding: "$240K", outcome: "61%", condition: "Stable" },

  Ashtabula:  { programs: "1", people: "540",   funding: "$520K", outcome: "68%", condition: "Stable" },
  Trumbull:   { programs: "2", people: "780",   funding: "$760K", outcome: "71%", condition: "Stable" },
  Portage:    { programs: "1", people: "590",   funding: "$560K", outcome: "69%", condition: "Stable" },

  Athens:     { programs: "1", people: "430",   funding: "$410K", outcome: "66%", condition: "Stable" },
  Perry:      { programs: "1", people: "300",   funding: "$280K", outcome: "63%", condition: "Watch" },
  Hocking:    { programs: "1", people: "270",   funding: "$260K", outcome: "62%", condition: "Stable" },
  Vinton:     { programs: "1", people: "190",   funding: "$180K", outcome: "60%", condition: "Stable" },
  Morgan:     { programs: "1", people: "210",   funding: "$205K", outcome: "61%", condition: "Stable" },

  Lucas:      { programs: "2", people: "913",   funding: "$940K", outcome: "67%", condition: "Stable" },
};

const PROCESSING_COUNTIES = new Set(["Franklin", "Cuyahoga", "Hamilton"]);

const COUNTY_CLUSTERS = {
  Franklin: ["Franklin", "Delaware", "Licking", "Fairfield", "Pickaway"],
  Cuyahoga: ["Cuyahoga", "Lake", "Geauga", "Summit", "Lorain"],
  Hamilton: ["Hamilton", "Butler", "Warren", "Clermont", "Montgomery"],
  Carroll: ["Carroll", "Stark", "Tuscarawas", "Harrison", "Columbiana"],
  Coshocton: ["Coshocton", "Holmes", "Knox", "Licking", "Muskingum"],
  Richland:  ["Richland", "Ashland", "Knox", "Morrow", "Wayne"],
  Ashtabula: ["Ashtabula", "Lake", "Geauga", "Trumbull", "Portage"],
  Athens:    ["Athens", "Hocking", "Perry", "Vinton", "Morgan"],
};

function normalizeCountyName(name = "") {
  const cleaned = String(name).replace(/\s+County$/i, "").trim();
  if (!cleaned) return "";
  if (/^\d+$/.test(cleaned)) return "";
  return cleaned;
}

function getShownData(activeCounty) {
  if (!activeCounty) return null;

  const base = COUNTY_DATA[activeCounty] || {
    programs: "1",
    people: "500",
    funding: "$500K",
    outcome: "70%",
    condition: "Stable",
  };

  const riskStatus =
    base.condition === "Watch" ? "Monitored" :
    base.condition === "Opportunity" ? "Needs Review" :
    "Stable";

  const interventionStatus =
    activeCounty === "Franklin" ? "Active" :
    activeCounty === "Cuyahoga" ? "Queued" :
    activeCounty === "Hamilton" ? "Tracked" :
    "Available";

  const fundingState =
    activeCounty === "Franklin" ? "Tracked" :
    activeCounty === "Cuyahoga" ? "Active" :
    "Open";

  const priority =
    activeCounty === "Franklin" ? "High" :
    base.condition === "Watch" ? "Moderate" :
    "Normal";

  return {
    ...base,
    riskStatus,
    interventionStatus,
    fundingState,
    priority,
  };
}

function getCommandState(activeCounty, shown, regionalMode) {
  const countyLabel = activeCounty || "Ohio";
  const risk = shown?.condition || "Stable";
  const funding = shown?.funding || "$0";
  const next =
    regionalMode
      ? "Review county packet"
      : "Select county";
  const confidence =
    countyLabel === "Franklin" ? "91%" :
    countyLabel === "Cuyahoga" ? "88%" :
    countyLabel === "Hamilton" ? "86%" :
    "82%";

  return {
    countyLabel,
    mode: regionalMode ? "Regional" : "Statewide",
    risk,
    funding,
    next,
    confidence,
  };
}


function dispatchSHFMapCountyContext(countyName, source = "map_click") {
  if (typeof window === "undefined" || !countyName) return;

  window.dispatchEvent(
    new CustomEvent("shf:map-county-context", {
      detail: {
        county: countyName,
        source,
        surface: "impact_command_center",
        page: "shf_impact_map",
        map_mode: "county_or_regional_focus",
        timestamp: new Date().toISOString(),
      },
    })
  );
}

export default function SHFImpactOhioMap() {
  const [hoveredCounty, setHoveredCounty] = useState(null);
  const [selectedCounty, setSelectedCounty] = useState("Franklin");
  const [statusMessage, setStatusMessage] = useState("Initializing statewide command surface…");
  const [statusVisible, setStatusVisible] = useState(true);
  const [isDrilldownOpen, setIsDrilldownOpen] = useState(false);
  const [countyCentroids, setCountyCentroids] = useState({});
  const [isCountyDrawerOpen, setIsCountyDrawerOpen] = useState(false);

  const regionalMode = isDrilldownOpen && Boolean(selectedCounty);
  const activeCounty = hoveredCounty || selectedCounty || null;
  const shown = getShownData(activeCounty);
  const commandState = getCommandState(activeCounty, shown, regionalMode);

  const showStatus = (message, duration = 1400) => {
    setStatusMessage(message);
    setStatusVisible(true);
    window.clearTimeout(window.__shfStatusTimer);
    window.__shfStatusTimer = window.setTimeout(() => setStatusVisible(false), Math.max(duration, 2400));
  };

  const activeCluster = useMemo(() => {
    if (!selectedCounty) return [];
    return COUNTY_CLUSTERS[selectedCounty] || [selectedCounty];
  }, [selectedCounty]);

  const statewideSignalNodes = useMemo(() => {
    return ["Franklin", "Cuyahoga", "Hamilton"]
      .map((county, index) => {
        const point = countyCentroids[county];
        if (!point) return null;
        return {
          county,
          x: point.x,
          y: point.y,
          tier: county === selectedCounty ? "primary" : "secondary",
          delay: `${index * 0.55}s`,
        };
      })
      .filter(Boolean);
  }, [countyCentroids, selectedCounty]);

  const regionalSignalNodes = useMemo(() => {
    if (!regionalMode || !selectedCounty) return [];

    const base = countyCentroids[selectedCounty];
    if (!base) return [];

    const contextNodes = activeCluster
      .map((county, index) => {
        const point = countyCentroids[county];
        if (!point) return null;
        return {
          county,
          x: point.x,
          y: point.y,
          tier: county === selectedCounty ? "primary" : "context",
          delay: `${index * 0.38}s`,
        };
      })
      .filter(Boolean);

    const offsetNodes = [
      { x: base.x + 22, y: base.y - 18, tier: "micro", delay: "0.12s" },
      { x: base.x - 20, y: base.y + 16, tier: "micro", delay: "0.36s" },
      { x: base.x + 34, y: base.y + 26, tier: "micro", delay: "0.58s" },
    ];

    return [...contextNodes, ...offsetNodes];
  }, [regionalMode, selectedCounty, activeCluster, countyCentroids]);

  const handleCountyClick = (countyNameRaw) => {
    const countyName = normalizeCountyName(countyNameRaw);
    if (!countyName) {
      console.warn("Blocked invalid county click value:", countyNameRaw);
      showStatus("Invalid county identifier received. Staying in statewide view.", 2200);
      return;
    }
    setSelectedCounty(countyName);
    dispatchSHFMapCountyContext(countyName, "statewide_county_click");
    setHoveredCounty(null);
    setIsDrilldownOpen(true);
    showStatus(`County selection received · ${countyName} · opening regional drilldown…`, 1800);
  };

  return (
    <div className="shf-impact-map-root">
      <div className="shf-impact-map-grid" />

      <div className={`shf-system-status ${statusVisible ? "is-visible" : ""}`}>
        <span className="shf-system-status__dot" />
        <span className="shf-system-status__text">{statusMessage}</span>
      </div>

      <div className="shf-impact-map-toolbar">
        <button
          type="button"
          onClick={() => {
            setSelectedCounty("Franklin");
            dispatchSHFMapCountyContext("Franklin", "reset_view");
            setHoveredCounty(null);
            setIsDrilldownOpen(false);
            setIsCountyDrawerOpen(false);
            showStatus("Statewide command surface restored.", 1400);
          }}
        >
          Reset View
        </button>
        <button type="button" className="is-active">
          {regionalMode ? `${selectedCounty} Region` : "County View"}
        </button>
      </div>

      {regionalMode ? (
        <div className="shf-command-strip">
          <div className="shf-command-strip__label">Operational Command Layer</div>
          <div className="shf-command-strip__chips">
            <div className="shf-command-chip">
              <span>Selected</span>
              <strong>{commandState.countyLabel}</strong>
            </div>
            <div className="shf-command-chip">
              <span>Mode</span>
              <strong>{commandState.mode}</strong>
            </div>
            <div className="shf-command-chip">
              <span>Risk</span>
              <strong>{commandState.risk}</strong>
            </div>
            <div className="shf-command-chip">
              <span>Funding</span>
              <strong>{commandState.funding}</strong>
            </div>
            <div className="shf-command-chip">
              <span>Next</span>
              <strong>{commandState.next}</strong>
            </div>
            <div className="shf-command-chip shf-command-chip--confidence">
              <span>Confidence</span>
              <strong>{commandState.confidence}</strong>
            </div>
          </div>

          <div className="shf-command-strip__legend">
            <div className="shf-command-legend-item">
              <span className="shf-command-legend-swatch shf-command-legend-swatch--selected" />
              <span>Selected</span>
            </div>
            <div className="shf-command-legend-item">
              <span className="shf-command-legend-swatch shf-command-legend-swatch--context" />
              <span>Context</span>
            </div>
            <div className="shf-command-legend-item">
              <span className="shf-command-legend-swatch shf-command-legend-swatch--watch" />
              <span>Watch</span>
            </div>
            <div className="shf-command-legend-item">
              <span className="shf-command-legend-swatch shf-command-legend-swatch--funding" />
              <span>Funding</span>
            </div>
          </div>
        </div>
      ) : null}

      <div className={`shf-impact-map-stage ${regionalMode ? "is-regional" : "is-statewide"} ${regionalMode ? "is-animating-regional" : "is-animating-statewide"}`}>
        {!regionalMode ? (
          <div className="shf-impact-map-surface">
            <div className="shf-impact-map-ohio-body-slot" aria-hidden="true">
              <OhioCountyOfficialMapV2
                activeCounty={selectedCounty}
                selectedCounty={selectedCounty}
                hoveredCounty={hoveredCounty}
                onReady={setCountyCentroids}
                className="shf-impact-map-ohio-body"
              />
            </div>

            <div className="shf-impact-map-focus-halo" aria-hidden="true" />

            <div className="shf-impact-map-geo-slot" aria-hidden="true">
              <OhioCountyOfficialMapV2
                activeCounty={hoveredCounty || selectedCounty}
                selectedCounty={selectedCounty}
                hoveredCounty={hoveredCounty}
                onReady={setCountyCentroids}
                onCountyClick={handleCountyClick}
                onCountyHover={(countyName) => {
                  const normalized = countyName ? normalizeCountyName(countyName) : null;
                  setHoveredCounty(normalized);
                  if (normalized) showStatus(`Reading county surface · ${normalized}…`, 900);
                }}
                className="shf-impact-map-geo"
              />
            </div>

            <div className="shf-impact-map-processing-layer" aria-hidden="true">
              {[...PROCESSING_COUNTIES].map((county) => (
                <div key={county} className="shf-processing-beacon" data-county={county} />
              ))}
            </div>

            <svg className="shf-signal-layer shf-signal-layer--statewide" viewBox="0 0 900 620" aria-hidden="true">
              {statewideSignalNodes.map((node) => (
                <g
                  key={`statewide-${node.county}`}
                  className={`shf-signal-node shf-signal-node--${node.tier}`}
                  style={{ animationDelay: node.delay }}
                  transform={`translate(${node.x} ${node.y})`}
                >
                  <circle className="shf-signal-node__ring" r="22" />
                  <circle className="shf-signal-node__pulse" r="10" />
                  <circle className="shf-signal-node__core" r="4.5" />
                </g>
              ))}
            </svg>
          </div>
        ) : (
          <>
            <SHFRegionalCountyCluster
              selectedCounty={selectedCounty}
              hoveredCounty={hoveredCounty}
              onCountyHover={(countyName) => {
                const normalized = countyName ? normalizeCountyName(countyName) : null;
                setHoveredCounty(normalized);
                if (normalized) showStatus(`Regional county focus · ${normalized}…`, 900);
              }}
              onCountyClick={(countyName) => {
                const normalized = countyName ? normalizeCountyName(countyName) : null;
                if (!normalized) return;
                setSelectedCounty(normalized);
                dispatchSHFMapCountyContext(normalized, "regional_county_click");
                showStatus(`Regional selection updated · ${normalized}…`, 1200);
              }}
            />

            <svg className="shf-signal-layer shf-signal-layer--regional" viewBox="0 0 900 620" aria-hidden="true">
              {regionalSignalNodes.map((node, index) => (
                <g
                  key={`regional-${node.county || index}-${index}`}
                  className={`shf-signal-node shf-signal-node--${node.tier}`}
                  style={{ animationDelay: node.delay }}
                  transform={`translate(${node.x} ${node.y})`}
                >
                  {node.tier === "primary" ? <circle className="shf-signal-node__ring" r="30" /> : null}
                  <circle className="shf-signal-node__pulse" r={node.tier === "primary" ? 13 : node.tier === "context" ? 8 : 5} />
                  <circle className="shf-signal-node__core" r={node.tier === "primary" ? 6 : node.tier === "context" ? 4 : 2.8} />
                </g>
              ))}
            </svg>
          </>
        )}
      </div>

      <div className={`shf-impact-map-tooltip ${activeCounty && !regionalMode ? "is-visible" : ""}`}>
        {activeCounty && shown ? (
          <>
            <strong>{activeCounty} County</strong>
            <div>Programs Active: {shown.programs}</div>
            <div>People Served: {shown.people}</div>
            <div>Funding Deployed: {shown.funding}</div>
            <div>Top Outcome: {shown.outcome}</div>
            <div>Program Condition: {shown.condition}</div>
          </>
        ) : null}
      </div>

      {regionalMode && shown ? (
        <div className="shf-regional-detail-panel">
          <div className="shf-regional-detail-panel__eyebrow">Ohio Tactical County View</div>
          <strong>{activeCounty || selectedCounty} County</strong>

          <div className="shf-regional-detail-grid">
            <div className="shf-regional-detail-item">
              <span>Risk Status</span>
              <strong>{shown.riskStatus}</strong>
            </div>
            <div className="shf-regional-detail-item">
              <span>Interventions</span>
              <strong>{shown.interventionStatus}</strong>
            </div>
            <div className="shf-regional-detail-item">
              <span>Funding</span>
              <strong>{shown.fundingState}</strong>
            </div>
            <div className="shf-regional-detail-item">
              <span>Priority</span>
              <strong>{shown.priority}</strong>
            </div>
          </div>

          <div className="shf-regional-detail-stats">
            <div><span>Programs Active</span><strong>{shown.programs}</strong></div>
            <div><span>People Served</span><strong>{shown.people}</strong></div>
            <div><span>Funding Deployed</span><strong>{shown.funding}</strong></div>
            <div><span>Top Outcome</span><strong>{shown.outcome}</strong></div>
          </div>

          <button
            type="button"
            className="shf-regional-detail-panel__action"
            onClick={() => {
              setIsCountyDrawerOpen(true);
              showStatus(`Opening county detail · ${activeCounty || selectedCounty}…`, 1400);
            }}
          >
            Open County Detail
          </button>
        </div>
      ) : null}

      {isCountyDrawerOpen && shown ? (
        <div className="shf-county-drawer-backdrop" onClick={() => setIsCountyDrawerOpen(false)}>
          <aside
            className="shf-county-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shf-county-drawer__header">
              <div>
                <div className="shf-county-drawer__eyebrow">County Detail Surface</div>
                <h2>{activeCounty || selectedCounty} County</h2>
              </div>

              <button
                type="button"
                className="shf-county-drawer__close"
                onClick={() => setIsCountyDrawerOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="shf-county-drawer__grid">
              <div className="shf-county-drawer__card">
                <span>Risk Status</span>
                <strong>{shown.riskStatus}</strong>
              </div>
              <div className="shf-county-drawer__card">
                <span>Interventions</span>
                <strong>{shown.interventionStatus}</strong>
              </div>
              <div className="shf-county-drawer__card">
                <span>Funding State</span>
                <strong>{shown.fundingState}</strong>
              </div>
              <div className="shf-county-drawer__card">
                <span>Priority</span>
                <strong>{shown.priority}</strong>
              </div>
            </div>

            <div className="shf-county-drawer__section">
              <div className="shf-county-drawer__section-title">Operational Summary</div>
              <div className="shf-county-drawer__stats">
                <div><span>Programs Active</span><strong>{shown.programs}</strong></div>
                <div><span>People Served</span><strong>{shown.people}</strong></div>
                <div><span>Funding Deployed</span><strong>{shown.funding}</strong></div>
                <div><span>Top Outcome</span><strong>{shown.outcome}</strong></div>
              </div>
            </div>

            <div className="shf-county-drawer__section">
              <div className="shf-county-drawer__section-title">Next Layer</div>
              <ul className="shf-county-drawer__list">
                <li>Outcome timeline</li>
                <li>Intervention history</li>
                <li>Funding movement</li>
                <li>Operator notes</li>
                <li>Recommended action queue</li>
              </ul>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
