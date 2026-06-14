import React, {useEffect, useMemo, useState} from "react";
import OhioCountyOfficialMapV2 from "@/pages/iep-command-v2/OhioCountyOfficialMapV2.jsx";
import SHFRegionalCountyCluster from "./SHFRegionalCountyCluster.jsx";
import {
  getImpactTotals,
  getMapDataStatusSummary,
  getProgramLaneById,
  getPublicApprovedCounties,
  getPublicApprovedCountyByName,
} from "@/data/shfImpactData.js";
import "./shf-impact-ohio-map.css";

const PUBLIC_IMPACT_COUNTIES = getPublicApprovedCounties();
const PUBLIC_IMPACT_COUNTY_NAMES = PUBLIC_IMPACT_COUNTIES.map((county) => county.countyName);
const PUBLIC_IMPACT_TOTALS = getImpactTotals();
const MAP_DATA_STATUS = getMapDataStatusSummary();
const DEFAULT_PUBLIC_COUNTY = PUBLIC_IMPACT_COUNTY_NAMES.includes("Licking")
  ? "Licking"
  : PUBLIC_IMPACT_COUNTY_NAMES[0] || "Ohio";
const PROCESSING_COUNTIES = new Set(PUBLIC_IMPACT_COUNTY_NAMES.slice(0, 3));

const COUNTY_CLUSTERS = {
  Franklin: ["Franklin", "Delaware", "Licking", "Fairfield", "Pickaway"],
  Cuyahoga: ["Cuyahoga", "Lake", "Geauga", "Summit", "Lorain"],
  Hamilton: ["Hamilton", "Butler", "Warren", "Clermont", "Montgomery"],
  Carroll: ["Carroll", "Stark", "Tuscarawas", "Harrison", "Columbiana"],
  Coshocton: ["Coshocton", "Holmes", "Knox", "Licking", "Muskingum"],
  Holmes: ["Holmes", "Coshocton", "Knox", "Wayne", "Tuscarawas"],
  Knox: ["Knox", "Licking", "Coshocton", "Holmes", "Wayne"],
  Muskingum: ["Muskingum", "Licking", "Perry", "Coshocton", "Tuscarawas"],
  Perry: ["Perry", "Muskingum", "Licking", "Coshocton", "Knox"],
  Tuscarawas: ["Tuscarawas", "Holmes", "Coshocton", "Wayne", "Muskingum"],
  Wayne: ["Wayne", "Holmes", "Knox", "Tuscarawas", "Coshocton"],
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

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function formatProgramNames(programLaneIds = []) {
  return programLaneIds
    .map((id) => getProgramLaneById(id)?.title)
    .filter(Boolean)
    .join(", ");
}

function getShownData(activeCounty) {
  if (!activeCounty) return null;

  const county = getPublicApprovedCountyByName(activeCounty);

  if (!county) {
    return {
      hasPublicData: false,
      programs: "Not public-approved",
      people: "Not public-approved",
      funding: "Not public-approved",
      outcome: "Public approval pending",
      condition: "Pending",
      communitiesReached: "Not public-approved",
      studentsServed: "Not public-approved",
      workforceParticipants: "Not public-approved",
      partners: "Not public-approved",
      dataStatus: "Pending",
      mapIntensity: "—",
      publicMessage: "No public impact data available yet",
      riskStatus: "Pending Public Approval",
      interventionStatus: "Hidden",
      fundingState: "Hidden",
      priority: "Not Public",
    };
  }

  const peopleServed = county.studentsServed + county.adultsAndFamiliesReached;
  const programNames = formatProgramNames(county.primaryProgramLaneIds);
  const base = {
    hasPublicData: true,
    programs: programNames || "SHF mission programs",
    people: formatNumber(peopleServed),
    funding: county.dataStatus,
    outcome: `${Math.round(county.mapIntensity * 100)}% map intensity`,
    condition: county.dataStatus,
    communitiesReached: formatNumber(county.communitiesReached),
    studentsServed: formatNumber(county.studentsServed),
    workforceParticipants: formatNumber(county.workforceParticipants),
    partners: formatNumber(county.partners),
    dataStatus: county.dataStatus,
    mapIntensity: `${Math.round(county.mapIntensity * 100)}%`,
  };

  const riskStatus =
    county.dataStatus === "Verified" ? "Verified" :
    county.dataStatus === "Pending Verification" ? "Needs Verification" :
    "Sample Data";

  const interventionStatus = county.primaryProgramLaneIds.length > 1 ? "Multi-lane" : "Single-lane";

  const fundingState = `${county.partners} partners`;

  const priority =
    county.mapIntensity >= 0.8 ? "High Reach" :
    county.mapIntensity >= 0.6 ? "Active Reach" :
    "Emerging Reach";

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
  const risk = shown?.condition || "Sample";
  const funding = shown?.dataStatus || "Sample";
  const next =
    regionalMode
      ? "Review public data"
      : "Select county";
  const confidence =
    shown?.hasPublicData ? shown.mapIntensity : "Pending";

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


function dispatchSHFDrawerContext(countyName, source = "drawer_event", open = true) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("shf:drawer-context", {
      detail: {
        drawer: "county_detail",
        open,
        county: countyName || null,
        source,
        surface: "impact_command_center",
        page: "shf_impact_map",
        active_tab: "county_detail",
        timestamp: new Date().toISOString(),
      },
    })
  );
}

export default function SHFImpactOhioMap() {
  const [hoveredCounty, setHoveredCounty] = useState(null);
  const [selectedCounty, setSelectedCounty] = useState(DEFAULT_PUBLIC_COUNTY);
  const [statusMessage, setStatusMessage] = useState(
    `Initializing public SHF impact map · ${PUBLIC_IMPACT_TOTALS.countiesServed} approved counties…`
  );
  const [statusVisible, setStatusVisible] = useState(true);
  const [isDrilldownOpen, setIsDrilldownOpen] = useState(false);
  const [countyCentroids, setCountyCentroids] = useState({});
  const [isCountyDrawerOpen, setIsCountyDrawerOpen] = useState(false);

  // Regional mode opens the zoom/glow layer after a county click.
  // The regional layer now supports all counties through GeoJSON fallback.
  const regionalMode = isDrilldownOpen && Boolean(selectedCounty);
  const countyFocusMode = regionalMode;
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
    return PUBLIC_IMPACT_COUNTY_NAMES.slice(0, 3)
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

  const returnToStatewideView = () => {
    setSelectedCounty(DEFAULT_PUBLIC_COUNTY);
    dispatchSHFMapCountyContext(DEFAULT_PUBLIC_COUNTY, "statewide_view");
    setHoveredCounty(null);
    setIsDrilldownOpen(false);
    setIsCountyDrawerOpen(false);
    dispatchSHFDrawerContext(DEFAULT_PUBLIC_COUNTY, "statewide_view_drawer_closed", false);
    showStatus("Statewide county view restored.", 1400);
  };



  useEffect(() => {
    function handleStaticStatewideButtonClick(event) {
      const button = event.target?.closest?.(".shf-mini-filter");
      if (!button) return;

      const label = String(button.textContent || "").trim().toUpperCase();
      if (label !== "STATEWIDE") return;

      event.preventDefault();
      event.stopPropagation();
      returnToStatewideView();
    }

    document.addEventListener("click", handleStaticStatewideButtonClick);

    return () => {
      document.removeEventListener("click", handleStaticStatewideButtonClick);
    };
  }, []);

  return (
    <div className="shf-impact-map-root">
      <div className="shf-impact-map-grid" />

      <div className={`shf-system-status ${statusVisible ? "is-visible" : ""}`}>
        <span className="shf-system-status__dot" />
        <span className="shf-system-status__text">{statusMessage}</span>
      </div>

      <aside className="shf-map-data-spine-status" aria-label="SHF Impact Data Spine status">
        <div className="shf-map-data-spine-status__head">
          <span>SHF Data Spine</span>
          <strong>{MAP_DATA_STATUS.dataStatus}</strong>
        </div>
        <dl>
          <div><dt>Data Source</dt><dd>{MAP_DATA_STATUS.dataSource}</dd></div>
          <div><dt>Public Approved Records</dt><dd>{MAP_DATA_STATUS.publicApprovedRecords}</dd></div>
          <div><dt>Trust Level</dt><dd>{MAP_DATA_STATUS.trustLevel}</dd></div>
          <div><dt>Last Updated</dt><dd>{MAP_DATA_STATUS.lastUpdated}</dd></div>
          <div><dt>Visibility Rule</dt><dd>{MAP_DATA_STATUS.visibilityRule}</dd></div>
        </dl>
        <p>This map displays SHF-approved public impact data only.</p>
      </aside>

      <div className="shf-impact-map-toolbar">
        <button
          type="button"
          onClick={returnToStatewideView}
          aria-label="Return to statewide Ohio county view"
        >
          {regionalMode || countyFocusMode ? "Statewide View" : "Reset View"}
        </button>
        <button type="button" className="is-active">
          {countyFocusMode ? `${selectedCounty} Focus` : "County View"}
        </button>
      </div>

      {countyFocusMode ? (
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
              <span>Data</span>
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
              <span>Public data</span>
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
              {[...PROCESSING_COUNTIES].map((county) => {
                const point = countyCentroids[county];
                return (
                  <div
                    key={county}
                    className="shf-processing-beacon"
                    data-county={county}
                    style={point ? { left: `${(point.x / 900) * 100}%`, top: `${(point.y / 620) * 100}%` } : undefined}
                  />
                );
              })}
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
            <div>Programs: {shown.programs}</div>
            <div>Students Served: {shown.studentsServed}</div>
            <div>Workforce Participants: {shown.workforceParticipants}</div>
            <div>Communities Reached: {shown.communitiesReached}</div>
            <div>Map Intensity: {shown.mapIntensity}</div>
            <div>Data Status: {shown.dataStatus}</div>
            {!shown.hasPublicData ? <div>{shown.publicMessage}</div> : null}
          </>
        ) : null}
      </div>

      {countyFocusMode && shown ? (
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
              <span>Partners</span>
              <strong>{shown.fundingState}</strong>
            </div>
            <div className="shf-regional-detail-item">
              <span>Priority</span>
              <strong>{shown.priority}</strong>
            </div>
          </div>

          <div className="shf-regional-detail-stats">
            <div><span>Programs</span><strong>{shown.programs}</strong></div>
            <div><span>Students</span><strong>{shown.studentsServed}</strong></div>
            <div><span>Workforce</span><strong>{shown.workforceParticipants}</strong></div>
            <div><span>Data Status</span><strong>{shown.dataStatus}</strong></div>
          </div>

          <button
            type="button"
            className="shf-regional-detail-panel__action"
            onClick={() => {
              const drawerCounty = activeCounty || selectedCounty;
              setIsCountyDrawerOpen(true);
              dispatchSHFDrawerContext(drawerCounty, "county_detail_open", true);
              showStatus(`Opening county detail · ${drawerCounty}…`, 1400);
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
                <span>Partners</span>
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
                <div><span>Programs</span><strong>{shown.programs}</strong></div>
                <div><span>Communities</span><strong>{shown.communitiesReached}</strong></div>
                <div><span>Students</span><strong>{shown.studentsServed}</strong></div>
                <div><span>Workforce</span><strong>{shown.workforceParticipants}</strong></div>
                <div><span>Data Status</span><strong>{shown.dataStatus}</strong></div>
                <div><span>Map Intensity</span><strong>{shown.mapIntensity}</strong></div>
              </div>
            </div>

            <div className="shf-county-drawer__section">
              <div className="shf-county-drawer__section-title">Next Layer</div>
              <ul className="shf-county-drawer__list">
                <li>Outcome timeline</li>
                <li>Intervention history</li>
                <li>Partner and program movement</li>
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
