import React, { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "";

const US_COUNTY_GEOJSON_URL =
  "https://raw.githubusercontent.com/plotly/datasets/master/geojson-counties-fips.json";

const LAYER_STEPS = [
  {
    id: "state",
    label: "State",
    title: "Ohio State View",
    description:
      "Statewide view showing county boundaries, operating signals, readiness, risk, and verification pressure.",
    center: [-82.75, 40.18],
    zoom: 6.45,
    pitch: 8,
    bearing: 0,
  },
  {
    id: "region",
    label: "Region",
    title: "Central Ohio Regional View",
    description:
      "Regional cluster view showing multi-county pressure, partner activity, and cross-county operating context.",
    center: [-82.88, 39.98],
    zoom: 8.15,
    pitch: 36,
    bearing: -10,
  },
  {
    id: "county",
    label: "County",
    title: "Franklin County View",
    description:
      "County command view showing selected-county focus, Oracle readiness, contradictions, and verification state.",
    center: [-82.98, 39.965],
    zoom: 9.55,
    pitch: 34,
    bearing: -10,
  },
  {
    id: "community",
    label: "Community",
    title: "Columbus Community View",
    description:
      "Community layer showing local service zones, neighborhoods, provider clusters, and need signals.",
    center: [-82.995, 39.962],
    zoom: 11.45,
    pitch: 38,
    bearing: -12,
  },
  {
    id: "location",
    label: "Location",
    title: "Exact Location View",
    description:
      "Point-level view showing providers, evidence sites, review zones, Oracle signals, and operational locations.",
    center: [-82.991, 39.965],
    zoom: 13.25,
    pitch: 44,
    bearing: -14,
  },
];

const CENTRAL_OHIO_COUNTIES = new Set([
  "Franklin",
  "Delaware",
  "Union",
  "Madison",
  "Pickaway",
  "Fairfield",
  "Licking",
  "Morrow",
]);

const OPERATIONAL_POINTS = [
  {
    id: "partner-001",
    name: "Franklin Workforce Partner",
    type: "Provider",
    lngLat: [-83.003, 39.965],
    tone: "cyan",
    status: "Verified",
  },
  {
    id: "evidence-001",
    name: "Outcome Evidence Site",
    type: "Evidence",
    lngLat: [-82.985, 39.958],
    tone: "green",
    status: "Audit-ready",
  },
  {
    id: "risk-001",
    name: "Contradiction Review Zone",
    type: "Risk",
    lngLat: [-83.025, 39.951],
    tone: "orange",
    status: "Review",
  },
  {
    id: "oracle-001",
    name: "Oracle Truth Signal",
    type: "Oracle",
    lngLat: [-82.975, 39.972],
    tone: "violet",
    status: "91%",
  },
];


const COUNTY_COMMAND_CONTEXT = {
  Franklin: {
    county: "Franklin",
    oracleScore: 91,
    contradictions: 3,
    auditIntegrity: 98,
    sourceCoverage: 92,
    verificationStatus: "Verified",
    readiness: "High",
    priority: "High",
    nextMove: "Review Oracle truth package and contradiction state.",
  },
  Cuyahoga: {
    county: "Cuyahoga",
    oracleScore: 88,
    contradictions: 2,
    auditIntegrity: 94,
    sourceCoverage: 89,
    verificationStatus: "Review",
    readiness: "Medium",
    priority: "Medium",
    nextMove: "Compare county proof strength against statewide baseline.",
  },
  Hamilton: {
    county: "Hamilton",
    oracleScore: 84,
    contradictions: 4,
    auditIntegrity: 91,
    sourceCoverage: 86,
    verificationStatus: "Watch",
    readiness: "Medium",
    priority: "Medium",
    nextMove: "Inspect funding and reporting readiness before export.",
  },
  Montgomery: {
    county: "Montgomery",
    oracleScore: 79,
    contradictions: 5,
    auditIntegrity: 88,
    sourceCoverage: 81,
    verificationStatus: "Risk Review",
    readiness: "Watch",
    priority: "High",
    nextMove: "Escalate contradiction review and request updated evidence.",
  },
  Delaware: {
    county: "Delaware",
    oracleScore: 87,
    contradictions: 1,
    auditIntegrity: 96,
    sourceCoverage: 90,
    verificationStatus: "Ready",
    readiness: "High",
    priority: "Low",
    nextMove: "Use as regional comparison county.",
  },
  Licking: {
    county: "Licking",
    oracleScore: 82,
    contradictions: 2,
    auditIntegrity: 90,
    sourceCoverage: 84,
    verificationStatus: "Watch",
    readiness: "Medium",
    priority: "Medium",
    nextMove: "Review regional service coverage and partner capacity.",
  },
};

function getCountyCommandContext(countyName) {
  return COUNTY_COMMAND_CONTEXT[countyName] || {
    county: countyName || "Unknown",
    oracleScore: 0,
    contradictions: 0,
    auditIntegrity: 0,
    sourceCoverage: 0,
    verificationStatus: "Unknown",
    readiness: "Unknown",
    priority: "Unknown",
    nextMove: "Select a county or signal to load command context.",
  };
}

function publishMapContext(payload) {
  const context = {
    source: "shs-operational-map",
    timestamp: new Date().toISOString(),
    ...payload,
  };

  try {
    window.localStorage.setItem("shs_operational_map_context", JSON.stringify(context));
    window.dispatchEvent(new CustomEvent("shs:map-context-change", { detail: context }));
  } catch (error) {
    console.warn("[SHS Mapbox] Could not publish map context", error);
  }

  return context;
}


const SHS_LAYER_PAINT_PROFILES = {
  state: {
    canvasFilter: "brightness(1.12) contrast(1.22) saturate(0.74)",
    countyFill: "#f8fbff",
    countyFillOpacity: 0.68,
    countyLine: "rgba(69, 103, 148, 0.82)",
    countyLineWidth: 1.35,
    selectedFill: "#ff6a1a",
    selectedLine: "rgba(125, 211, 252, 0.95)",
    selectedLineWidth: 2.2,
    regionFill: "#2563eb",
    regionLine: "rgba(96, 165, 250, 0.45)",
    regionLineWidth: 1.6,
  },
  region: {
    canvasFilter: "brightness(0.72) contrast(1.42) saturate(1.18)",
    countyFill: "#f8fbff",
    countyFillOpacity: 0.72,
    countyLine: "rgba(96, 165, 250, 0.62)",
    countyLineWidth: 1.2,
    selectedFill: "#ff6a1a",
    selectedLine: "rgba(147, 197, 253, 1)",
    selectedLineWidth: 3.2,
    regionFill: "#2563eb",
    regionLine: "rgba(96, 165, 250, 1)",
    regionLineWidth: 3.6,
  },
  county: {
    canvasFilter: "brightness(0.86) contrast(1.32) saturate(1.04)",
    countyFill: "#f8fbff",
    countyFillOpacity: 0.62,
    countyLine: "rgba(96, 165, 250, 0.5)",
    countyLineWidth: 1.05,
    selectedFill: "#ff6a1a",
    selectedLine: "rgba(255, 120, 34, 1)",
    selectedLineWidth: 4.2,
    regionFill: "#2563eb",
    regionLine: "rgba(96, 165, 250, 0.42)",
    regionLineWidth: 1.4,
  },
  community: {
    canvasFilter: "brightness(1.03) contrast(1.16) saturate(1.05)",
    countyFill: "#f8fbff",
    countyFillOpacity: 0.52,
    countyLine: "rgba(100, 116, 139, 0.42)",
    countyLineWidth: 0.85,
    selectedFill: "#ff6a1a",
    selectedLine: "rgba(255, 120, 34, 0.9)",
    selectedLineWidth: 2.3,
    regionFill: "#2563eb",
    regionLine: "rgba(16, 185, 129, 0.82)",
    regionLineWidth: 2.3,
  },
  location: {
    canvasFilter: "brightness(0.98) contrast(1.18) saturate(1.08)",
    countyFill: "#f8fbff",
    countyFillOpacity: 0.42,
    countyLine: "rgba(100, 116, 139, 0.34)",
    countyLineWidth: 0.75,
    selectedFill: "#ff6a1a",
    selectedLine: "rgba(167, 139, 250, 0.96)",
    selectedLineWidth: 2.7,
    regionFill: "#2563eb",
    regionLine: "rgba(167, 139, 250, 0.78)",
    regionLineWidth: 2.1,
  },
};

function safeSetPaint(map, layerIds, prop, value) {
  if (!map || !layerIds?.length) return;
  layerIds.forEach((layerId) => {
    try {
      if (map.getLayer(layerId)) {
        map.setPaintProperty(layerId, prop, value);
      }
    } catch (error) {
      console.warn(`[SHS Mapbox] Paint skipped for ${layerId}.${prop}`, error);
    }
  });
}

function safeSetLayout(map, layerIds, prop, value) {
  if (!map || !layerIds?.length) return;
  layerIds.forEach((layerId) => {
    try {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, prop, value);
      }
    } catch (error) {
      console.warn(`[SHS Mapbox] Layout skipped for ${layerId}.${prop}`, error);
    }
  });
}


function safeSetSinglePaint(map, layerId, prop, value) {
  try {
    if (!map || !map.getLayer(layerId)) return;
    map.setPaintProperty(layerId, prop, value);
  } catch {
    // Ignore Mapbox style layers that do not support the paint prop.
  }
}

function applySHSBaseMapTone(map, activeLayer) {
  if (!map || !map.getStyle) return;

  const style = map.getStyle();
  const layers = Array.isArray(style?.layers) ? style.layers : [];

  const profiles = {
    state: {
      background: "#020817",
      land: "#071426",
      water: "#061c33",
      road: "rgba(59, 130, 246, 0.10)",
      roadOpacity: 0.10,
      label: "#17345f",
      labelHalo: "#ffffff",
      labelOpacity: 0.72,
      fillOpacity: 1,
    },
    region: {
      background: "#020817",
      land: "#071426",
      water: "#061c33",
      road: "rgba(96, 165, 250, 0.28)",
      roadOpacity: 0.34,
      label: "#93c5fd",
      labelHalo: "#020817",
      labelOpacity: 0.60,
      fillOpacity: 0.78,
    },
    county: {
      background: "#020817",
      land: "#071426",
      water: "#061c33",
      road: "rgba(251, 146, 60, 0.28)",
      roadOpacity: 0.34,
      label: "#fed7aa",
      labelHalo: "#020817",
      labelOpacity: 0.62,
      fillOpacity: 0.78,
    },
    community: {
      background: "#dbeafe",
      land: "#dbeafe",
      water: "#bfdbfe",
      road: "rgba(20, 184, 166, 0.24)",
      roadOpacity: 0.34,
      label: "#475569",
      labelHalo: "#eff6ff",
      labelOpacity: 0.50,
      fillOpacity: 0.24,
    },
    location: {
      background: "#e0f2fe",
      land: "#e0f2fe",
      water: "#bae6fd",
      road: "rgba(124, 58, 237, 0.22)",
      roadOpacity: 0.38,
      label: "#475569",
      labelHalo: "#f8fafc",
      labelOpacity: 0.54,
      fillOpacity: 0.24,
    },
  };

  const tone = profiles[activeLayer] || profiles.state;

  layers.forEach((layer) => {
    const id = layer?.id || "";
    if (!id || id.startsWith("shs-")) return;

    if (layer.type === "background") {
      safeSetSinglePaint(map, id, "background-color", tone.background);
      safeSetSinglePaint(map, id, "background-opacity", 1);
      return;
    }

    if (layer.type === "fill") {
      const lower = id.toLowerCase();
      const isWater = lower.includes("water");
      const isPark = lower.includes("park") || lower.includes("landuse") || lower.includes("land-use");

      safeSetSinglePaint(map, id, "fill-color", isWater ? tone.water : isPark ? tone.land : tone.land);
      safeSetSinglePaint(map, id, "fill-opacity", tone.fillOpacity);
      return;
    }

    if (layer.type === "line") {
      const lower = id.toLowerCase();
      const isRoad = lower.includes("road") || lower.includes("street") || lower.includes("bridge");
      const isBoundary = lower.includes("boundary") || lower.includes("admin");

      safeSetSinglePaint(map, id, "line-color", isBoundary ? "rgba(191, 219, 254, 0.32)" : tone.road);
      safeSetSinglePaint(map, id, "line-opacity", isRoad ? tone.roadOpacity : 0.28);
      return;
    }

    if (layer.type === "symbol") {
      safeSetSinglePaint(map, id, "text-color", tone.label);
      safeSetSinglePaint(map, id, "text-halo-color", tone.labelHalo);
      safeSetSinglePaint(map, id, "text-halo-width", 1.2);
      safeSetSinglePaint(map, id, "text-opacity", tone.labelOpacity);
      return;
    }
  });
}



function applySHSCommunityLocationVisualOverrides(map, activeLayer) {
  if (!map) return;

  const selectedCountyFillLayers = [
    "shs-selected-county-fill",
    "selected-county-fill",
    "shs-active-county-fill",
    "active-county-fill",
  ];

  const selectedCountyLineLayers = [
    "shs-selected-county-line",
    "selected-county-line",
    "shs-active-county-line",
    "active-county-line",
  ];

  const selectedCountyPulseLayers = [
    "shs-selected-county-pulse",
    "selected-county-pulse",
    "shs-active-county-pulse",
    "active-county-pulse",
  ];

  const communityFillLayers = [
    "shs-community-fill",
    "community-fill",
    "shs-community-zones-fill",
  ];

  const communityLineLayers = [
    "shs-community-line",
    "community-line",
    "shs-community-zones-line",
  ];

  const connectionLineLayers = [
    "shs-connection-line",
    "connection-line",
    "shs-evidence-route-line",
    "evidence-route-line",
  ];

  if (activeLayer === "community") {
    /*
      Community should feel like service-zone intelligence.
      Kill the big county flood and let service zones carry the layer.
    */
    safeSetPaint(map, selectedCountyFillLayers, "fill-opacity", 0.015);
    safeSetPaint(map, selectedCountyLineLayers, "line-opacity", 0.24);
    safeSetPaint(map, selectedCountyLineLayers, "line-width", 1.15);
    safeSetPaint(map, selectedCountyPulseLayers, "line-opacity", 0.0);

    safeSetPaint(map, communityFillLayers, "fill-opacity", 0.105);
    safeSetPaint(map, communityLineLayers, "line-opacity", 0.86);
    safeSetPaint(map, communityLineLayers, "line-width", 2.15);

    safeSetPaint(map, connectionLineLayers, "line-opacity", 0.30);
    safeSetPaint(map, connectionLineLayers, "line-width", 2.0);
  }

  if (activeLayer === "location") {
    /*
      Location should feel like exact proof intelligence.
      No county wash. Keep street map readable and let proof route/site markers lead.
    */
    safeSetPaint(map, selectedCountyFillLayers, "fill-opacity", 0.0);
    safeSetPaint(map, selectedCountyLineLayers, "line-opacity", 0.08);
    safeSetPaint(map, selectedCountyLineLayers, "line-width", 0.75);
    safeSetPaint(map, selectedCountyPulseLayers, "line-opacity", 0.0);

    safeSetPaint(map, communityFillLayers, "fill-opacity", 0.075);
    safeSetPaint(map, communityLineLayers, "line-opacity", 0.62);
    safeSetPaint(map, communityLineLayers, "line-width", 1.8);

    safeSetPaint(map, connectionLineLayers, "line-opacity", 0.88);
    safeSetPaint(map, connectionLineLayers, "line-width", 2.75);
  }
}


function applySHSHardLayerPaint(map, activeLayer) {
  if (!map) return;

  const profile = SHS_LAYER_PAINT_PROFILES[activeLayer] || SHS_LAYER_PAINT_PROFILES.state;

  applySHSBaseMapTone(map, activeLayer);

  const countyFillLayers = [
    "shs-ohio-county-fill",
    "shs-county-fill",
    "ohio-county-fill",
    "county-fill",
  ];

  const countyLineLayers = [
    "shs-ohio-county-line",
    "shs-county-line",
    "ohio-county-line",
    "county-line",
  ];

  const selectedCountyFillLayers = [
    "shs-selected-county-fill",
    "selected-county-fill",
    "shs-active-county-fill",
    "active-county-fill",
  ];

  const selectedCountyLineLayers = [
    "shs-selected-county-line",
    "selected-county-line",
    "shs-active-county-line",
    "active-county-line",
  ];

  const regionFillLayers = [
    "shs-region-cluster-fill",
    "shs-central-ohio-region-fill",
    "region-cluster-fill",
    "active-region-fill",
  ];

  const regionLineLayers = [
    "shs-region-cluster-line",
    "shs-central-ohio-region-line",
    "region-cluster-line",
    "active-region-line",
  ];

  safeSetPaint(map, countyFillLayers, "fill-color", profile.countyFill);
  safeSetPaint(map, countyFillLayers, "fill-opacity", activeLayer === "state" ? 0.86 : 0.42);

  safeSetPaint(map, countyLineLayers, "line-color", profile.countyLine);
  safeSetPaint(map, countyLineLayers, "line-width", profile.countyLineWidth);
  safeSetPaint(map, countyLineLayers, "line-opacity", activeLayer === "region" ? 0.7 : 0.9);

  safeSetPaint(map, selectedCountyFillLayers, "fill-color", profile.selectedFill);
  safeSetPaint(map, selectedCountyFillLayers, "fill-opacity", activeLayer === "county" ? 0.62 : activeLayer === "state" ? 0.08 : 0.42);

  safeSetPaint(map, selectedCountyLineLayers, "line-color", profile.selectedLine);
  safeSetPaint(map, selectedCountyLineLayers, "line-width", profile.selectedLineWidth);
  safeSetPaint(map, selectedCountyLineLayers, "line-opacity", 1);

  safeSetPaint(map, regionFillLayers, "fill-color", profile.regionFill);
  safeSetPaint(map, regionFillLayers, "fill-opacity", activeLayer === "region" ? 0.72 : 0.22);

  safeSetPaint(map, regionLineLayers, "line-color", profile.regionLine);
  safeSetPaint(map, regionLineLayers, "line-width", profile.regionLineWidth);
  safeSetPaint(map, regionLineLayers, "line-opacity", activeLayer === "region" ? 1 : 0.62);

  if (activeLayer === "state") {
    safeSetLayout(map, regionFillLayers, "visibility", "none");
    safeSetLayout(map, regionLineLayers, "visibility", "none");
    safeSetLayout(map, selectedCountyFillLayers, "visibility", "visible");
    safeSetLayout(map, selectedCountyLineLayers, "visibility", "visible");
  }

  if (activeLayer === "region") {
    safeSetLayout(map, regionFillLayers, "visibility", "visible");
    safeSetLayout(map, regionLineLayers, "visibility", "visible");
    safeSetLayout(map, selectedCountyFillLayers, "visibility", "visible");
    safeSetLayout(map, selectedCountyLineLayers, "visibility", "visible");
  }

  applySHSCommunityLocationVisualOverrides(map, activeLayer);
  moveSHSMapIntelligenceBelowLabels(map);
  boostMapboxRoadAndLabelReadability(map, activeLayer);
  applyRoadReadability(map, activeLayer);

  if (activeLayer === "county") {
    safeSetLayout(map, regionFillLayers, "visibility", "visible");
    safeSetLayout(map, regionLineLayers, "visibility", "visible");
    safeSetLayout(map, selectedCountyFillLayers, "visibility", "visible");
    safeSetLayout(map, selectedCountyLineLayers, "visibility", "visible");
  }

  const canvasWrap = map.getContainer()?.closest(".shs-mapbox-stage")?.querySelector(".shs-mapbox-canvas");
  if (canvasWrap) {
    canvasWrap.style.filter = profile.canvasFilter;
  }
}

const LAYER_INTELLIGENCE = {
  state: {
    type: "Statewide",
    status: "County Boundary Layer",
    title: "Ohio Operating Picture",
    body:
      "State view shows county boundaries across Ohio so operators can see where verification, risk, funding, and readiness signals are beginning to cluster.",
    action: "Review statewide signal pressure →",
  },
  region: {
    type: "Regional Cluster",
    status: "Central Ohio Active",
    title: "Central Ohio Cluster",
    body:
      "Region view isolates the counties around Franklin so the system can compare county pressure, referrals, partner coverage, and cross-county gaps.",
    action: "Open regional comparison →",
  },
  county: {
    type: "County Focus",
    status: "Franklin Selected",
    title: "Franklin County Command View",
    body:
      "County view makes Franklin the active focus. This is where Oracle truth, contradiction pressure, funding readiness, and analyst recommendations should synchronize.",
    action: "Open county command file →",
  },
  community: {
    type: "Community Zones",
    status: "Columbus Active",
    title: "Columbus Service Zones",
    body:
      "Community view shows neighborhood and service-zone intelligence so operators can see where impact is happening and where unmet needs are forming.",
    action: "Review community gaps →",
  },
  location: {
    type: "Exact Location",
    status: "Site-Level Proof",
    title: "Location Intelligence",
    body:
      "Location view connects real sites, providers, evidence, risks, and Oracle signals to the SHS truth pipeline for audit-ready operating proof.",
    action: "Open Location Dossier →",
  },
};

const COMMUNITY_ZONES = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Linden", signal: "watch" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-83.006, 40.03],
          [-82.955, 40.03],
          [-82.955, 40.005],
          [-83.006, 40.005],
          [-83.006, 40.03],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Hilltop", signal: "risk" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-83.095, 39.965],
          [-83.045, 39.965],
          [-83.045, 39.93],
          [-83.095, 39.93],
          [-83.095, 39.965],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Franklinton", signal: "verified" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-83.03, 39.965],
          [-82.995, 39.965],
          [-82.995, 39.948],
          [-83.03, 39.948],
          [-83.03, 39.965],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Near East Side", signal: "oracle" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-82.982, 39.975],
          [-82.935, 39.975],
          [-82.935, 39.945],
          [-82.982, 39.945],
          [-82.982, 39.975],
        ]],
      },
    },
  ],
};


const COUNTY_SIGNAL_POINTS = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        name: "Franklin",
        signal: "oracle",
        score: 91,
        label: "Oracle 91%",
      },
      geometry: { type: "Point", coordinates: [-83.0007, 39.9612] },
    },
    {
      type: "Feature",
      properties: {
        name: "Cuyahoga",
        signal: "verified",
        score: 88,
        label: "Verified",
      },
      geometry: { type: "Point", coordinates: [-81.6944, 41.4993] },
    },
    {
      type: "Feature",
      properties: {
        name: "Hamilton",
        signal: "watch",
        score: 76,
        label: "Watch",
      },
      geometry: { type: "Point", coordinates: [-84.512, 39.1031] },
    },
    {
      type: "Feature",
      properties: {
        name: "Montgomery",
        signal: "risk",
        score: 69,
        label: "Review",
      },
      geometry: { type: "Point", coordinates: [-84.1916, 39.7589] },
    },
    {
      type: "Feature",
      properties: {
        name: "Delaware",
        signal: "verified",
        score: 84,
        label: "Ready",
      },
      geometry: { type: "Point", coordinates: [-83.0679, 40.2987] },
    },
    {
      type: "Feature",
      properties: {
        name: "Licking",
        signal: "watch",
        score: 73,
        label: "Watch",
      },
      geometry: { type: "Point", coordinates: [-82.4846, 40.0912] },
    },
  ],
};

const CONNECTION_LINES = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Provider → Evidence" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-83.003, 39.965],
          [-82.985, 39.958],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Risk → Oracle" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-83.025, 39.951],
          [-82.975, 39.972],
        ],
      },
    },
  ],
};

const EMPTY_COLLECTION = {
  type: "FeatureCollection",
  features: [],
};

function createPointElement(point) {
  const node = document.createElement("button");
  node.type = "button";
  node.className = `shs-mapbox-node shs-mapbox-node--${point.tone}`;
  node.setAttribute("aria-label", point.name);
  node.innerHTML = `<span></span>`;
  return node;
}

function getCountyName(feature) {
  return feature?.properties?.NAME || feature?.properties?.name || "";
}

function filterOhioCounties(allCounties) {
  const features = allCounties?.features || [];

  return {
    type: "FeatureCollection",
    features: features.filter((feature) => {
      const id = String(feature.id || "");
      const state = String(feature.properties?.STATE || "");
      return id.startsWith("39") || state === "39";
    }),
  };
}

function buildRegionFeatureCollection(ohioCounties) {
  return {
    type: "FeatureCollection",
    features: (ohioCounties?.features || []).filter((feature) =>
      CENTRAL_OHIO_COUNTIES.has(getCountyName(feature))
    ),
  };
}

function buildSelectedCountyFeatureCollection(ohioCounties, countyName) {
  return {
    type: "FeatureCollection",
    features: (ohioCounties?.features || []).filter(
      (feature) => getCountyName(feature) === countyName
    ),
  };
}

function setLayerVisibility(map, layerIds, visible) {
  layerIds.forEach((layerId) => {
    if (!map.getLayer(layerId)) return;
    map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
  });
}

function addSourceIfMissing(map, id, source) {
  if (!map.getSource(id)) {
    map.addSource(id, source);
  }
}


function getFirstMapboxLabelLayerId(map) {
  if (!map || !map.getStyle) return undefined;

  const layers = map.getStyle()?.layers || [];

  const preferred = [
    "road-label",
    "road-number-shield",
    "settlement-major-label",
    "settlement-minor-label",
    "place-label",
    "poi-label",
  ];

  for (const id of preferred) {
    if (layers.some((layer) => layer.id === id)) return id;
  }

  const firstSymbol = layers.find((layer) => layer.type === "symbol");
  return firstSymbol?.id;
}


function boostMapboxRoadAndLabelReadability(map, activeLayer) {
  if (!map || !map.getStyle) return;

  const layers = map.getStyle()?.layers || [];

  const isCommunity = activeLayer === "community";
  const isLocation = activeLayer === "location";

  if (!isCommunity && !isLocation) return;

  layers.forEach((layer) => {
    const id = layer.id || "";
    const type = layer.type || "";

    const isRoadLine =
      type === "line" &&
      (
        id.includes("road") ||
        id.includes("street") ||
        id.includes("bridge") ||
        id.includes("tunnel")
      );

    const isLabel =
      type === "symbol" &&
      (
        id.includes("label") ||
        id.includes("road-number") ||
        id.includes("settlement") ||
        id.includes("place") ||
        id.includes("poi")
      );

    try {
      if (isRoadLine) {
        map.setPaintProperty(id, "line-color", isLocation ? "#2563eb" : "#0891b2");
        map.setPaintProperty(id, "line-opacity", isLocation ? 0.62 : 0.54);

        if (id.includes("road") || id.includes("street")) {
          map.setPaintProperty(id, "line-width", [
            "interpolate",
            ["linear"],
            ["zoom"],
            8, 0.45,
            10, 0.85,
            12, 1.35,
            14, 2.1
          ]);
        }
      }

      if (isLabel) {
        map.setPaintProperty(id, "text-color", "#0f172a");
        map.setPaintProperty(id, "text-halo-color", "#f8fafc");
        map.setPaintProperty(id, "text-halo-width", 1.65);
        map.setPaintProperty(id, "text-halo-blur", 0.35);
        map.setPaintProperty(id, "text-opacity", isLocation ? 0.82 : 0.76);
      }
    } catch {
      // Some Mapbox layers do not support every paint property.
    }
  });
}


function moveSHSMapIntelligenceBelowLabels(map) {
  if (!map || !map.getStyle || !map.moveLayer) return;

  const beforeId = getFirstMapboxLabelLayerId(map);
  if (!beforeId) return;

  const shsLayerIds = [
    "shs-selected-county-fill",
    "selected-county-fill",
    "shs-active-county-fill",
    "active-county-fill",

    "shs-region-fill",
    "region-fill",
    "shs-region-cluster-fill",

    "shs-community-fill",
    "community-fill",
    "shs-community-zones-fill",

    "shs-location-fill",
    "location-fill",
    "shs-proof-zone-fill",
    "proof-zone-fill",
  ];

  shsLayerIds.forEach((layerId) => {
    try {
      if (map.getLayer(layerId)) {
        map.moveLayer(layerId, beforeId);
      }
    } catch {
      // Do nothing. Some layer styles may not exist in every state.
    }
  });
}



function applyRoadReadability(map, activeLayer) {
  if (!map?.getStyle) return;

  const detailedView = activeLayer === "community" || activeLayer === "location";
  if (!detailedView) return;

  const layers = map.getStyle()?.layers || [];

  const roadLineLayerIds = layers
    .filter(
      (layer) =>
        layer.type === "line" &&
        /(road|street|bridge|tunnel|motorway|highway)/i.test(layer.id || "")
    )
    .map((layer) => layer.id);

  const roadLabelLayerIds = layers
    .filter(
      (layer) =>
        layer.type === "symbol" &&
        /(road|street|motorway|highway|label)/i.test(layer.id || "")
    )
    .map((layer) => layer.id);

  const roadLineColor = activeLayer === "location" ? "#3f78bf" : "#4b86ca";
  const roadCasingColor = activeLayer === "location" ? "#2f5fa3" : "#396faf";
  const roadLabelColor = activeLayer === "location" ? "#3c72b5" : "#457fbe";
  const roadHaloColor = "rgba(245, 250, 255, 0.96)";

  roadLineLayerIds.forEach((id) => {
    const isCasing = /(case|casing)/i.test(id);

    safeSetSinglePaint(
      map,
      id,
      "line-color",
      isCasing ? roadCasingColor : roadLineColor
    );

    safeSetSinglePaint(map, id, "line-opacity", activeLayer === "location" ? 0.98 : 0.94);

    try {
      map.setPaintProperty(id, "line-width", [
        "interpolate",
        ["linear"],
        ["zoom"],
        8, 0.8,
        10, 1.25,
        12, 1.9,
        14, 2.9
      ]);
    } catch {
      // Some layers may not accept width overrides.
    }
  });

  roadLabelLayerIds.forEach((id) => {
    safeSetSinglePaint(map, id, "text-color", roadLabelColor);
    safeSetSinglePaint(map, id, "text-halo-color", roadHaloColor);
    safeSetSinglePaint(map, id, "text-halo-width", activeLayer === "location" ? 1.55 : 1.35);
    safeSetSinglePaint(map, id, "text-halo-blur", 0.18);
    safeSetSinglePaint(map, id, "text-opacity", activeLayer === "location" ? 1 : 0.97);
  });
}


function addLayerIfMissing(map, layer, beforeId) {
  if (!map.getLayer(layer.id)) {
    if (beforeId && map.getLayer(beforeId)) {
      map.addLayer(layer, beforeId);
    } else {
      map.addLayer(layer);
    }
  }
}

function addOperationalLayers(map, ohioCountyData) {
  addSourceIfMissing(map, "shs-ohio-counties", {
    type: "geojson",
    data: ohioCountyData,
  });

  addSourceIfMissing(map, "shs-central-region", {
    type: "geojson",
    data: buildRegionFeatureCollection(ohioCountyData),
  });

  addSourceIfMissing(map, "shs-selected-county", {
    type: "geojson",
    data: buildSelectedCountyFeatureCollection(ohioCountyData, "Franklin"),
  });

  addSourceIfMissing(map, "shs-community-zones", {
    type: "geojson",
    data: COMMUNITY_ZONES,
  });

  addSourceIfMissing(map, "shs-connection-lines", {
    type: "geojson",
    data: CONNECTION_LINES,
  });

  addSourceIfMissing(map, "shs-county-signals", {
    type: "geojson",
    data: COUNTY_SIGNAL_POINTS,
  });

  addLayerIfMissing(map, {
    id: "shs-ohio-county-fill",
    type: "fill",
    source: "shs-ohio-counties",
    paint: {
      "fill-color": "#f8fbff",
      "fill-opacity": [
        "interpolate",
        ["linear"],
        ["zoom"],
        5,
        0.1,
        8,
        0.2,
        10,
        0.08,
      ],
    },
  });

  addLayerIfMissing(map, {
    id: "shs-ohio-county-line",
    type: "line",
    source: "shs-ohio-counties",
    paint: {
      "line-color": "#60a5fa",
      "line-width": [
        "interpolate",
        ["linear"],
        ["zoom"],
        5,
        0.55,
        8,
        1.1,
        10,
        1.4,
      ],
      "line-opacity": 0.48,
    },
  });

  addLayerIfMissing(map, {
    id: "shs-ohio-county-label",
    type: "symbol",
    source: "shs-ohio-counties",
    minzoom: 6,
    layout: {
      "text-field": ["get", "NAME"],
      "text-size": [
        "interpolate",
        ["linear"],
        ["zoom"],
        6,
        9,
        9,
        12,
      ],
      "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
      "text-allow-overlap": false,
      "text-ignore-placement": false,
    },
    paint: {
      "text-color": "#0f2a4d",
      "text-opacity": 0.48,
      "text-halo-color": "#ffffff",
      "text-halo-width": 1.2,
    },
  });

  addLayerIfMissing(map, {
    id: "shs-region-fill",
    type: "fill",
    source: "shs-central-region",
    paint: {
      "fill-color": "#2563eb",
      "fill-opacity": 0.42,
    },
  });

  addLayerIfMissing(map, {
    id: "shs-region-line",
    type: "line",
    source: "shs-central-region",
    paint: {
      "line-color": "#1d4ed8",
      "line-width": 2.4,
      "line-opacity": 0.72,
    },
  });

  addLayerIfMissing(map, {
    id: "shs-selected-county-glow",
    type: "line",
    source: "shs-selected-county",
    paint: {
      "line-color": "#f97316",
      "line-width": [
        "interpolate",
        ["linear"],
        ["zoom"],
        7,
        5,
        11,
        9,
      ],
      "line-opacity": 0.34,
      "line-blur": 7,
    },
  });

  addLayerIfMissing(map, {
    id: "shs-selected-county-fill",
    type: "fill",
    source: "shs-selected-county",
    paint: {
      "fill-color": "#ff6a1a",
      "fill-opacity": 0.18,
    },
  });

  addLayerIfMissing(map, {
    id: "shs-selected-county-line",
    type: "line",
    source: "shs-selected-county",
    paint: {
      "line-color": "#ea580c",
      "line-width": 3.2,
      "line-opacity": 0.95,
    },
  });

  addLayerIfMissing(map, {
    id: "shs-selected-county-label",
    type: "symbol",
    source: "shs-selected-county",
    layout: {
      "text-field": ["concat", ["get", "NAME"], " County"],
      "text-size": 18,
      "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
      "text-allow-overlap": true,
    },
    paint: {
      "text-color": "#7c2d12",
      "text-opacity": 0.82,
      "text-halo-color": "#fff7ed",
      "text-halo-width": 2.4,
    },
  });

  addLayerIfMissing(map, {
    id: "shs-community-fill",
    type: "fill",
    source: "shs-community-zones",
    paint: {
      "fill-color": [
        "match",
        ["get", "signal"],
        "verified",
        "#10b981",
        "watch",
        "#f59e0b",
        "risk",
        "#f97316",
        "oracle",
        "#8b5cf6",
        "#2563eb",
      ],
      "fill-opacity": 0.24,
    },
  });

  addLayerIfMissing(map, {
    id: "shs-community-line",
    type: "line",
    source: "shs-community-zones",
    paint: {
      "line-color": [
        "match",
        ["get", "signal"],
        "verified",
        "#059669",
        "watch",
        "#d97706",
        "risk",
        "#ea580c",
        "oracle",
        "#7c3aed",
        "#1d4ed8",
      ],
      "line-width": 2.2,
      "line-opacity": 0.85,
    },
  });

  addLayerIfMissing(map, {
    id: "shs-community-label",
    type: "symbol",
    source: "shs-community-zones",
    layout: {
      "text-field": ["get", "name"],
      "text-size": 13,
      "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
      "text-allow-overlap": true,
    },
    paint: {
      "text-color": "#0b1f44",
      "text-opacity": 0.72,
      "text-halo-color": "#ffffff",
      "text-halo-width": 1.8,
    },
  });

  addLayerIfMissing(map, {
    id: "shs-connection-line",
    type: "line",
    source: "shs-connection-lines",
    paint: {
      "line-color": "#0ea5e9",
      "line-width": 3,
      "line-opacity": 0.62,
      "line-dasharray": [1, 1.4],
    },
  });

  addLayerIfMissing(map, {
    id: "shs-selected-county-pulse",
    type: "line",
    source: "shs-selected-county",
    paint: {
      "line-color": "#fb923c",
      "line-width": [
        "interpolate",
        ["linear"],
        ["zoom"],
        7,
        8,
        11,
        14
      ],
      "line-opacity": 0.18,
      "line-blur": 14,
    },
  });

  addLayerIfMissing(map, {
    id: "shs-county-signal-halo",
    type: "circle",
    source: "shs-county-signals",
    paint: {
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["zoom"],
        5,
        13,
        8,
        20,
        11,
        28
      ],
      "circle-color": [
        "match",
        ["get", "signal"],
        "verified",
        "#10b981",
        "watch",
        "#f59e0b",
        "risk",
        "#f97316",
        "oracle",
        "#8b5cf6",
        "#2563eb"
      ],
      "circle-opacity": 0.16,
      "circle-blur": 0.45,
      "circle-stroke-width": 0
    },
  });

  addLayerIfMissing(map, {
    id: "shs-county-signal-core",
    type: "circle",
    source: "shs-county-signals",
    paint: {
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["zoom"],
        5,
        5,
        8,
        7,
        11,
        9
      ],
      "circle-color": [
        "match",
        ["get", "signal"],
        "verified",
        "#059669",
        "watch",
        "#d97706",
        "risk",
        "#ea580c",
        "oracle",
        "#7c3aed",
        "#1d4ed8"
      ],
      "circle-opacity": 0.92,
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 2
    },
  });

  addLayerIfMissing(map, {
    id: "shs-county-signal-label",
    type: "symbol",
    source: "shs-county-signals",
    minzoom: 7,
    layout: {
      "text-field": ["get", "label"],
      "text-size": 11,
      "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
      "text-offset": [0, 1.35],
      "text-anchor": "top",
      "text-allow-overlap": true
    },
    paint: {
      "text-color": "#0b1f44",
      "text-halo-color": "#ffffff",
      "text-halo-width": 1.5,
      "text-opacity": 0.82
    },
  });
}

function updateOperationalLayerVisibility(map, activeLayer) {
  const stateLayers = ["shs-ohio-county-fill", "shs-ohio-county-line", "shs-ohio-county-label"];
  const regionLayers = ["shs-region-fill", "shs-region-line"];
  const selectedCountyLayers = [
    "shs-selected-county-glow",
    "shs-selected-county-fill",
    "shs-selected-county-line",
    "shs-selected-county-label",
  ];
  const communityLayers = ["shs-community-fill", "shs-community-line", "shs-community-label"];
  const lineLayers = ["shs-connection-line"];
  const selectedPulseLayers = ["shs-selected-county-pulse"];
  const signalLayers = ["shs-county-signal-halo", "shs-county-signal-core", "shs-county-signal-label"];

  setLayerVisibility(map, stateLayers, true);
  setLayerVisibility(map, regionLayers, activeLayer !== "state");
  setLayerVisibility(map, selectedCountyLayers, ["county", "community", "location"].includes(activeLayer));
  setLayerVisibility(map, selectedPulseLayers, ["county", "community", "location"].includes(activeLayer));
  setLayerVisibility(map, communityLayers, ["community", "location"].includes(activeLayer));
  setLayerVisibility(map, lineLayers, activeLayer === "location");
  setLayerVisibility(map, signalLayers, ["state", "region", "county"].includes(activeLayer));
}

// SHS_CLEAN_WHITE_OHIO_STATE_PASS
// WHITE_OHIO_TARGETED_PASS

const MAP_EVIDENCE_PINS = [
  {
    id: "pin-franklin-workforce-001",
    title: "Franklin Workforce Partner",
    type: "provider_site",
    status: "verified",
    screenPosition: { left: "49%", top: "51%" },
    layerScope: ["community", "location"],
    neighborhood: "Franklinton",
    address: "123 Community Way, Columbus, OH 43201",
    description:
      "Verified workforce provider site connected to active referrals, outcome evidence, and SHS Oracle readiness.",
    counts: { photos: 5, videos: 2, live: 1 },
    verification: {
      status: "Verified",
      trustScore: 92,
      oracleStatus: "Ready",
      auditStatus: "Trace linked",
    },
    media: {
      photos: [
        { id: "photo-001", title: "Front Entrance Verification", time: "09:14 AM", status: "Verified" },
        { id: "photo-002", title: "Service Desk Capture", time: "09:18 AM", status: "Pending review" },
      ],
      videos: [
        { id: "video-001", title: "Site Walkthrough", time: "09:21 AM", status: "Verified" },
      ],
      live: [
        { id: "stream-001", title: "Lobby Camera", status: "Live", streamType: "HLS" },
      ],
    },
  },
  {
    id: "pin-franklinton-need-002",
    title: "Franklinton Support Zone",
    type: "unmet_need",
    status: "watch",
    screenPosition: { left: "36%", top: "44%" },
    layerScope: ["community"],
    neighborhood: "Franklinton",
    address: "Franklinton, Columbus, OH",
    description:
      "Community support signal showing elevated demand for housing, employment navigation, and youth services.",
    counts: { photos: 2, videos: 0, live: 0 },
    verification: {
      status: "Pending Verification",
      trustScore: 71,
      oracleStatus: "Needs review",
      auditStatus: "Partial trace",
    },
    media: {
      photos: [
        { id: "photo-need-001", title: "Community Signal Capture", time: "10:04 AM", status: "Pending review" },
      ],
      videos: [],
      live: [],
    },
  },
  {
    id: "pin-live-stream-003",
    title: "Live Partner Check-In",
    type: "live_stream",
    status: "live",
    screenPosition: { left: "61%", top: "42%" },
    layerScope: ["location"],
    neighborhood: "Downtown Columbus",
    address: "Downtown Columbus, OH",
    description:
      "Live stream source available for operational check-in, site status, and time-sensitive evidence review.",
    counts: { photos: 1, videos: 1, live: 1 },
    verification: {
      status: "Live Source",
      trustScore: 84,
      oracleStatus: "Stream active",
      auditStatus: "Live audit available",
    },
    media: {
      photos: [
        { id: "photo-live-001", title: "Stream Snapshot", time: "Live", status: "Captured" },
      ],
      videos: [
        { id: "clip-live-001", title: "Recent Stream Clip", time: "3 min ago", status: "Available" },
      ],
      live: [
        { id: "stream-live-001", title: "Partner Live Feed", status: "Live", streamType: "HLS" },
      ],
    },
  },
];

export default function SHSOperationalMapboxMap() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const ohioCountyDataRef = useRef(EMPTY_COLLECTION);

  const [activeLayer, setActiveLayer] = useState("state");
  
  const [selectedEvidencePin, setSelectedEvidencePin] = useState(null);
  const [isMediaDrawerOpen, setIsMediaDrawerOpen] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState("photos");
  const [isPinPlacementMode, setIsPinPlacementMode] = useState(false);
  const [pinPlacementLayer, setPinPlacementLayer] = useState(null);
  const [draftEvidencePins, setDraftEvidencePins] = useState([]);

  const SHS_V8_DRAFT_PIN_STORAGE_KEY = "shs_v8_draft_evidence_pins";



  useEffect(() => {
    if (!isPinPlacementMode || !pinPlacementLayer) return;
    if (activeLayer === pinPlacementLayer) return;

    console.log("[SHS V10G] blocked layer jump during pin placement", {
      attemptedLayer: activeLayer,
      lockedLayer: pinPlacementLayer,
    });

    window.requestAnimationFrame(() => {
      setActiveLayer(pinPlacementLayer);
    });
  }, [activeLayer, isPinPlacementMode, pinPlacementLayer]);


  useEffect(() => {
    try {
      const savedDraftPins = window.localStorage.getItem(SHS_V8_DRAFT_PIN_STORAGE_KEY);
      if (savedDraftPins) {
        const parsedPins = JSON.parse(savedDraftPins);
        if (Array.isArray(parsedPins)) {
          setDraftEvidencePins(parsedPins);
        }
      }
    } catch (error) {
      console.warn("[SHS V8C] Could not load draft pins from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        SHS_V8_DRAFT_PIN_STORAGE_KEY,
        JSON.stringify(draftEvidencePins)
      );
    } catch (error) {
      console.warn("[SHS V8C] Could not save draft pins to localStorage", error);
    }
  }, [draftEvidencePins]);

  const updateSelectedEvidencePinDraft = (updates) => {
    setSelectedEvidencePin((currentPin) => {
      if (!currentPin) return currentPin;

      const updatedPin = {
        ...currentPin,
        ...updates,
        verification: {
          ...currentPin.verification,
          ...(updates.verification || {}),
        },
        counts: {
          ...currentPin.counts,
          ...(updates.counts || {}),
        },
        media: {
          ...currentPin.media,
          ...(updates.media || {}),
        },
      };

      if (String(updatedPin.id).startsWith("draft-pin")) {
        setDraftEvidencePins((currentPins) =>
          currentPins.map((pin) =>
            pin.id === updatedPin.id
              ? {
                  ...pin,
                  ...updatedPin,
                }
              : pin
          )
        );
      }

      return updatedPin;
    });
  };


  useEffect(() => {
    if (!selectedEvidencePin) return;

    if (String(selectedEvidencePin.id).startsWith("draft-pin")) {
      setIsMediaDrawerOpen(true);
      setActiveMediaTab((currentTab) => currentTab || "audit");
      console.log("[SHS V8D] forced drawer open for draft pin", selectedEvidencePin.id);
    }
  }, [selectedEvidencePin]);

  const submitSelectedEvidencePinForVerification = () => {
    if (!selectedEvidencePin) return;

    updateSelectedEvidencePinDraft({
      status: "pending_verification",
      verification: {
        status: "Pending Verification",
        trustScore: selectedEvidencePin.verification?.trustScore || 35,
        oracleStatus: "Awaiting Oracle review",
        auditStatus: "Draft trace created",
      },
    });

    setActiveMediaTab("audit");

    console.log("[SHS V8C] draft pin submitted for verification", selectedEvidencePin.id);
  };

const [selectedCountyName, setSelectedCountyName] = useState("Franklin");
  const [selectedPoint, setSelectedPoint] = useState(OPERATIONAL_POINTS[0]);
  const [selectedCommandContext, setSelectedCommandContext] = useState(getCountyCommandContext("Franklin"));
  const [isCountyLayerReady, setIsCountyLayerReady] = useState(false);

  const activeStep = useMemo(
    () => LAYER_STEPS.find((step) => step.id === activeLayer) || LAYER_STEPS[0],
    [activeLayer]
  );

  const layerIntel = LAYER_INTELLIGENCE[activeLayer] || LAYER_INTELLIGENCE.state;



  useEffect(() => {
    const context = getCountyCommandContext(selectedCountyName);
    setSelectedCommandContext(context);

    publishMapContext({
      activeLayer,
      selectedCounty: selectedCountyName,
      selectedPoint,
      commandContext: context,
      layerTitle: activeStep.title,
    });
  }, [activeLayer, selectedCountyName, selectedPoint, activeStep.title]);

  useEffect(() => {
    if (!MAPBOX_TOKEN || !mapContainerRef.current || mapRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    console.info("[SHS Mapbox] Clean white Ohio state view active");

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: LAYER_STEPS[0].center,
      zoom: LAYER_STEPS[0].zoom,
      pitch: LAYER_STEPS[0].pitch,
      bearing: LAYER_STEPS[0].bearing,
      attributionControl: false,
      interactive: true,
    });

    mapRef.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      "bottom-right"
    );

    mapRef.current.on("load", async () => {
      try {
        const response = await fetch(US_COUNTY_GEOJSON_URL);
        const allCountyData = await response.json();
        const ohioCountyData = filterOhioCounties(allCountyData);

        ohioCountyDataRef.current = ohioCountyData;
        addOperationalLayers(mapRef.current, ohioCountyData);
        updateOperationalLayerVisibility(mapRef.current, activeLayer);
        setIsCountyLayerReady(true);

        mapRef.current.on("click", "shs-ohio-county-fill", (event) => {
          const feature = event.features?.[0];
          const countyName = getCountyName(feature);

          if (!countyName) return;

          setSelectedCountyName(countyName);
          setSelectedCommandContext(getCountyCommandContext(countyName));
          setActiveLayer("county");

          publishMapContext({
            activeLayer: "county",
            selectedCounty: countyName,
            selectedPoint,
            commandContext: getCountyCommandContext(countyName),
            interaction: "county_click",
            layerTitle: `${countyName} County View`,
          });

          const selectedCountySource = mapRef.current.getSource("shs-selected-county");
          selectedCountySource?.setData(
            buildSelectedCountyFeatureCollection(ohioCountyDataRef.current, countyName)
          );
        });

        mapRef.current.on("mouseenter", "shs-ohio-county-fill", () => {
          mapRef.current.getCanvas().style.cursor = "pointer";
        });

        mapRef.current.on("mouseleave", "shs-ohio-county-fill", () => {
          mapRef.current.getCanvas().style.cursor = "";
        });

        mapRef.current.on("click", "shs-county-signal-core", (event) => {
          const feature = event.features?.[0];
          const countyName = feature?.properties?.name || "Franklin";

          setSelectedCountyName(countyName);
          setSelectedCommandContext(getCountyCommandContext(countyName));
          setActiveLayer("county");

          publishMapContext({
            activeLayer: "county",
            selectedCounty: countyName,
            selectedPoint,
            commandContext: getCountyCommandContext(countyName),
            interaction: "signal_click",
            signal: feature?.properties?.signal || "unknown",
            layerTitle: `${countyName} Signal Focus`,
          });
        });

        mapRef.current.on("mouseenter", "shs-county-signal-core", () => {
          mapRef.current.getCanvas().style.cursor = "pointer";
        });

        mapRef.current.on("mouseleave", "shs-county-signal-core", () => {
          mapRef.current.getCanvas().style.cursor = "";
        });
      } catch (error) {
        console.warn("[SHS Mapbox] Could not load Ohio county GeoJSON", error);
      }

      OPERATIONAL_POINTS.forEach((point) => {
        const marker = new mapboxgl.Marker({
          element: createPointElement(point),
          anchor: "center",
        })
          .setLngLat(point.lngLat)
          .addTo(mapRef.current);

        marker.getElement().addEventListener("click", () => {
          setSelectedPoint(point);
          setActiveLayer("location");

          publishMapContext({
            activeLayer: "location",
            selectedCounty: selectedCountyName,
            selectedPoint: point,
            commandContext: getCountyCommandContext(selectedCountyName),
            interaction: "location_marker_click",
            layerTitle: point.name,
          });

          mapRef.current.flyTo({
            center: point.lngLat,
            zoom: 13.4,
            pitch: 58,
            bearing: -22,
            duration: 900,
          });
        });

        markersRef.current.push({ marker, point });
      });
    });

    return () => {
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    mapRef.current.flyTo({
      center: activeStep.center,
      zoom: activeStep.zoom,
      pitch: activeStep.pitch,
      bearing: activeStep.bearing,
      duration: 900,
      essential: true,
    });

    updateOperationalLayerVisibility(mapRef.current, activeLayer);

    markersRef.current.forEach(({ marker }) => {
      const element = marker.getElement();
      element.style.display = ["community", "location"].includes(activeLayer)
        ? "grid"
        : "none";
    });
  }, [activeStep, activeLayer]);

  useEffect(() => {
    if (!mapRef.current || !isCountyLayerReady) return;

    const source = mapRef.current.getSource("shs-selected-county");
    source?.setData(
      buildSelectedCountyFeatureCollection(ohioCountyDataRef.current, selectedCountyName)
    );
  }, [selectedCountyName, isCountyLayerReady]);

  return (
    <main className={`utc-card utc-map shs-operational-mapbox shs-mapbox-mode--${activeLayer} shs-mapbox-cinematic shs-mapbox-cinematic--${activeLayer}`} data-tour="utc-map">
      <div className="utc-map__top shs-mapbox-top">
        <div>
          <h2>SHS Operational Map Intelligence Layer</h2>
          <p className="shs-mapbox-subtitle">
            Layered operational map: statewide signals, regional clusters, county focus,
            community intelligence, and exact partner locations.
          </p>
        </div>

        <div className="utc-map__tools shs-mapbox-tools">
          <button type="button">Layers⌄</button>
          <button type="button">↗</button>
        </div>
      </div>

      <div className="shs-mapbox-command-strip shs-mapbox-command-strip--v7">
        <div>
          <strong>{activeStep.title}</strong>
          <span>{activeStep.description}</span>
        </div>
        <aside>
          <b>COMMAND SYNC</b>
          <em>{selectedCommandContext.county}</em>
          <i>{selectedCommandContext.verificationStatus}</i>
        </aside>
      </div>

      <div className="shs-mapbox-layer-tabs" aria-label="Map drilldown layers">
        {LAYER_STEPS.map((step) => (
          <button
            key={step.id}
            type="button"
            className={activeLayer === step.id ? "is-active" : ""}
            onClick={() => setActiveLayer(step.id)}
          >
            {step.label}
          </button>
        ))}
      </div>

      <div className="shs-mapbox-stage">
        <div className="shs-mapbox-atmosphere" aria-hidden="true" />
        <div className="shs-mapbox-scanline" aria-hidden="true" />
        <div className="shs-mapbox-cinematic-vignette" aria-hidden="true" />

        <div className="shs-mapbox-mode-badge">
          <span>{activeStep.label} Mode</span>
          <strong>{activeStep.title}</strong>
        </div>

        {MAPBOX_TOKEN ? (
          <>
            <div className="shs-mapbox-v7d-lightgrid" aria-hidden="true" />
            <div className="shs-mapbox-v7d-state-glow" aria-hidden="true" />
            <div className="shs-mapbox-v7d-region-network" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
            <div className="shs-mapbox-v7d-county-core" aria-hidden="true" />
            <div ref={mapContainerRef} className="shs-mapbox-canvas" />
          </>
        ) : (
          <div className="shs-mapbox-token-missing">
            <strong>Mapbox token needed</strong>
            <span>Add VITE_MAPBOX_TOKEN to your .env file to activate the live Mapbox layer.</span>
          </div>
        )}

        <div className="shs-mapbox-hud">
          <div>
            <span>Active Layer</span>
            <strong>{activeStep.label}</strong>
          </div>
          <div>
            <span>County</span>
            <strong>{selectedCountyName}</strong>
          </div>
          <div>
            <span>Signal Mode</span>
            <strong>Verification + Risk</strong>
          </div>
          <div>
            <span>Oracle Sync</span>
            <strong>{isCountyLayerReady ? "Ready" : "Loading"}</strong>
          </div>
          <div>
            <span>Score</span>
            <strong>{selectedCommandContext.oracleScore}%</strong>
          </div>
          <div>
            <span>Priority</span>
            <strong>{selectedCommandContext.priority}</strong>
          </div>
        </div>

        {activeLayer === "location" && (
          <div className="shs-mapbox-proof-route-card">
            <span>Evidence Route</span>
            <strong>11 min • 2.4 mi</strong>
          </div>
        )}

        {activeLayer === "community" && (
          <div className="shs-mapbox-hotspot-card">
            <span>Unmet Need Hotspot</span>
            <strong>Rising</strong>
          </div>
        )}

        {(activeLayer === "state" || activeLayer === "region" || activeLayer === "county") && (
          <div className="shs-mapbox-v7d-command-metrics">
            <div>
              <span>{activeLayer === "state" ? "STATEWIDE" : activeLayer === "region" ? "CLUSTER" : "COUNTY"}</span>
              <strong>{activeLayer === "state" ? "Ohio Operating Picture" : activeLayer === "region" ? "Central Ohio Active" : "Franklin Selected"}</strong>
            </div>
            <div>
              <span>READINESS</span>
              <strong>91%</strong>
            </div>
            <div>
              <span>PRESSURE</span>
              <strong>{activeLayer === "state" ? "Moderate" : "High"}</strong>
            </div>
          </div>
        )}

        <div className="shs-mapbox-legend" aria-label="Map signal legend">
          <strong>Signal Legend</strong>
          <span><i className="is-verified" /> Verified</span>
          <span><i className="is-watch" /> Watch</span>
          <span><i className="is-risk" /> Risk</span>
          <span><i className="is-oracle" /> Oracle</span>
        </div>

        {activeLayer === "community" && (
          <div className="shs-mapbox-community-media shs-mapbox-community-media--v7c">
            <article className="shs-mapbox-media-card shs-mapbox-media-card--photo">
              <div className="shs-mapbox-media-thumb shs-mapbox-media-thumb--skyline" aria-hidden="true">
                <span>LIVE</span>
              </div>
              <div>
                <span>COMMUNITY PREVIEW</span>
                <strong>Franklinton</strong>
                <p>Verified outcomes, service demand, partner coverage, and unmet-need signal.</p>
              </div>
            </article>

            

            

            
          </div>
        )}

        {activeLayer === "location" && (
          <div className="shs-mapbox-site-preview shs-mapbox-site-preview--v7c">
            <div className="shs-mapbox-site-preview__image shs-mapbox-site-preview__image--v7c" aria-hidden="true">
              <span>03</span>
            </div>
            <div>
              <span>SITE PROOF PREVIEW</span>
              <strong>Verified Provider Site</strong>
              <p>Evidence packet, audit state, route context, and Oracle readiness connected.</p>
              <small>Street capture • 09:14 AM • 5 evidence items</small>



              

              
            </div>
          </div>
        )}

        
        {((pinPlacementLayer || activeLayer) === "community" || (pinPlacementLayer || activeLayer) === "location") && (
          <div
            className="shs-v10-pin-interaction-layer"
            aria-label="Map evidence pin interaction layer"
            onPointerDownCapture={(event) => {
              const addTarget = event.target.closest("[data-v8a-add-pin]");

              if (addTarget) {
                event.preventDefault();
                event.stopPropagation();

                const lockedLayer = activeLayer === "location" ? "location" : "community";

                console.log("[SHS V10G] placement mode started", {
                  activeLayer,
                  lockedLayer,
                });

                setPinPlacementLayer(lockedLayer);
                setActiveLayer(lockedLayer);
                setIsPinPlacementMode(true);
                setIsMediaDrawerOpen(false);
                setSelectedEvidencePin(null);
                return;
              }

              if (isPinPlacementMode) {
                event.preventDefault();
                event.stopPropagation();

                const placementFrame = event.currentTarget;
                const bounds = placementFrame.getBoundingClientRect();

                const rawLeft = ((event.clientX - bounds.left) / bounds.width) * 100;
                const rawTop = ((event.clientY - bounds.top) / bounds.height) * 100;

                const left = `${Math.max(1, Math.min(99, rawLeft))}%`;
                const top = `${Math.max(1, Math.min(99, rawTop))}%`;

                console.log("[SHS V10H] self-aligned placement", {
                  placementClass: placementFrame?.className,
                  clientX: event.clientX,
                  clientY: event.clientY,
                  boundsLeft: bounds.left,
                  boundsTop: bounds.top,
                  boundsWidth: bounds.width,
                  boundsHeight: bounds.height,
                  rawLeft,
                  rawTop,
                  left,
                  top,
                });

                const draftPin = {
                  id: `draft-pin-${Date.now()}`,
                  title: "Draft Evidence Pin",
                  type: "draft",
                  status: "draft",
                  screenPosition: { left, top },
                  layerScope: [pinPlacementLayer || activeLayer],
                  neighborhood: (pinPlacementLayer || activeLayer) === "location" ? "Selected site" : "Community layer",
                  address: "New map pin placement",
                  description:
                    "Draft evidence pin placed by the operator. Attach media, classify the pin, then submit for verification.",
                  counts: { photos: 0, videos: 0, live: 0 },
                  verification: {
                    status: "Draft",
                    trustScore: 0,
                    oracleStatus: "Not submitted",
                    auditStatus: "Not logged",
                  },
                  media: { photos: [], videos: [], live: [] },
                };

                console.log("[SHS V10B] draft pin placed", draftPin);

                setDraftEvidencePins((current) => [...current, draftPin]);
                setSelectedEvidencePin(draftPin);
                setIsMediaDrawerOpen(true);
                setActiveMediaTab("audit");
                setIsPinPlacementMode(false);
                setPinPlacementLayer(null);

                window.requestAnimationFrame(() => {
                  setSelectedEvidencePin(draftPin);
                  setIsMediaDrawerOpen(true);
                  setActiveMediaTab("audit");
                });
              }
            }}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 9999,
              pointerEvents: "auto",
              overflow: "visible",
            }}
          >
            {isPinPlacementMode && (
              <div className="shs-v8b-placement-banner">
                <strong>Placement Mode Active</strong>
                <span>Click anywhere on the map to place a new evidence pin.</span>
              </div>
            )}

            <button
              type="button"
              data-v8a-add-pin="true"
              className={`shs-v8a-add-pin-btn ${isPinPlacementMode ? "is-placement-active" : ""}`}
              style={{
                position: "absolute",
                left: "18px",
                top: "84px",
                zIndex: 10005,
                pointerEvents: "auto",
              }}
              onPointerUp={(event) => {
                event.preventDefault();
                event.stopPropagation();

                const lockedLayer = activeLayer === "location" ? "location" : "community";

                console.log("[SHS V11] add pin native placement mode", {
                  activeLayer,
                  lockedLayer,
                });

                setPinPlacementLayer(lockedLayer);
                setActiveLayer(lockedLayer);
                setIsPinPlacementMode(true);
                setIsMediaDrawerOpen(false);
                setSelectedEvidencePin(null);
              }}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
            >
              {isPinPlacementMode ? "Click Map To Place Pin" : "+ Add Pin"}
            </button>

            <div
              className="shs-v10-pin-layer"
              aria-label="Clean 3D evidence map pins"
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 10000,
                pointerEvents: "none",
              }}
            >
              {[...MAP_EVIDENCE_PINS, ...draftEvidencePins]
                .filter((pin) => pin.layerScope.includes(pinPlacementLayer || activeLayer))
                .map((pin) => {
                  const pinPalette =
                    pin.type === "provider_site" || pin.type === "evidence_site" || pin.type === "outcome_site"
                      ? {
                          top: "#67e8f9",
                          mid: "#06b6d4",
                          bottom: "#075985",
                          glow: "rgba(34, 211, 238, 0.58)",
                        }
                      : pin.type === "live_stream"
                      ? {
                          top: "#fb7185",
                          mid: "#e11d48",
                          bottom: "#881337",
                          glow: "rgba(244, 63, 94, 0.58)",
                        }
                      : pin.type === "unmet_need" || pin.type === "risk_location"
                      ? {
                          top: "#fdba74",
                          mid: "#f97316",
                          bottom: "#9a3412",
                          glow: "rgba(249, 115, 22, 0.58)",
                        }
                      : {
                          top: "#fca5a5",
                          mid: "#ef4444",
                          bottom: "#991b1b",
                          glow: "rgba(239, 68, 68, 0.58)",
                        };

                  return (
                    <button
                      key={pin.id}
                      type="button"
                      data-shs-v10-pin-id={pin.id}
                      className={`shs-v10-pin ${selectedEvidencePin?.id === pin.id ? "is-selected" : ""}`}
                      title={pin.title}
                      aria-label={`Open evidence pin ${pin.title}`}
                      style={{
                        position: "absolute",
                        left: pin.screenPosition.left,
                        top: pin.screenPosition.top,
                        zIndex: selectedEvidencePin?.id === pin.id ? 10004 : 10003,
                        width: "clamp(28px, 3.2vw, 42px)",
                        aspectRatio: "64 / 84",
                        padding: 0,
                        margin: 0,
                        border: 0,
                        outline: 0,
                        borderRadius: 0,
                        background: "transparent",
                        boxShadow: "none",
                        transform: "translate(-50%, -100%)",
                        display: "block",
                        overflow: "visible",
                        cursor: "pointer",
                        pointerEvents: "auto",
                        appearance: "none",
                        WebkitAppearance: "none",
                      }}
                      onPointerUp={(event) => {
                        event.preventDefault();
                        event.stopPropagation();

                        console.log("[SHS V10B] clean 3D pin clicked", pin.id);

                        setIsPinPlacementMode(false);
                        setPinPlacementLayer(null);
                        setSelectedEvidencePin(pin);
                        setIsMediaDrawerOpen(true);
                        setActiveMediaTab(String(pin.id).startsWith("draft-pin") ? "audit" : "photos");

                        window.requestAnimationFrame(() => {
                          setSelectedEvidencePin(pin);
                          setIsMediaDrawerOpen(true);
                        });
                      }}
                    >
                      <svg
                        viewBox="0 0 64 84"
                        aria-hidden="true"
                        focusable="false"
                        style={{
                          display: "block",
                          width: "100%",
                          height: "auto",
                          overflow: "visible",
                          filter: `drop-shadow(0 0 10px ${pinPalette.glow}) drop-shadow(0 14px 14px rgba(0,0,0,.46))`,
                          transformOrigin: "50% 100%",
                        }}
                      >
                        <defs>
                          <linearGradient id={`shsV10PinGradient-${pin.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={pinPalette.top} />
                            <stop offset="46%" stopColor={pinPalette.mid} />
                            <stop offset="100%" stopColor={pinPalette.bottom} />
                          </linearGradient>

                          <radialGradient id={`shsV10PinGloss-${pin.id}`} cx="32%" cy="22%" r="58%">
                            <stop offset="0%" stopColor="rgba(255,255,255,.86)" />
                            <stop offset="42%" stopColor="rgba(255,255,255,.22)" />
                            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                          </radialGradient>
                        </defs>

                        <ellipse cx="32" cy="78" rx="17" ry="5" fill="rgba(0,0,0,.34)" />

                        <path
                          d="M32 3C16.7 3 4.5 15.4 4.5 30.8C4.5 50.5 28.1 76.5 30.4 79C31.3 79.9 32.7 79.9 33.6 79C35.9 76.5 59.5 50.5 59.5 30.8C59.5 15.4 47.3 3 32 3Z"
                          fill={`url(#shsV10PinGradient-${pin.id})`}
                          stroke="rgba(255,255,255,.86)"
                          strokeWidth="3"
                        />

                        <path
                          d="M32 7C19.1 7 8.5 17.8 8.5 31.1C8.5 38.8 13.8 48.9 19.8 57.4C17.6 48.9 16.9 39.9 18.8 31.6C21.3 20.6 28.2 12.4 38.3 8.5C36.3 7.6 34.2 7 32 7Z"
                          fill={`url(#shsV10PinGloss-${pin.id})`}
                          opacity="0.75"
                        />

                        <circle
                          cx="32"
                          cy="31"
                          r="12"
                          fill="rgba(255,255,255,.96)"
                          stroke="rgba(2,8,23,.2)"
                          strokeWidth="2"
                        />

                        <circle
                          cx="28"
                          cy="26"
                          r="3.8"
                          fill="rgba(255,255,255,.7)"
                        />
                      </svg>
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {isMediaDrawerOpen && selectedEvidencePin && (
          <aside className="shs-v8a-clean-drawer" aria-label="Media evidence drawer">
            <button
              type="button"
              className="shs-v8a-clean-drawer__close"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setIsMediaDrawerOpen(false);
              }}
              aria-label="Close media evidence drawer"
            >
              ×
            </button>

            <div className="shs-v8a-clean-drawer__eyebrow">Media Evidence Pin</div>
            <h3>{selectedEvidencePin.title}</h3>
            <p className="shs-v8a-clean-drawer__address">{selectedEvidencePin.address}</p>

            <div className="shs-v8a-clean-drawer__chips">
              <span>{selectedEvidencePin.verification.status}</span>
              <span>Trust {selectedEvidencePin.verification.trustScore}%</span>
              <span>{selectedEvidencePin.verification.oracleStatus}</span>
              <span>{selectedEvidencePin.verification.auditStatus}</span>
            </div>

            <p className="shs-v8a-clean-drawer__copy">
              {selectedEvidencePin.description}
            </p>

            {String(selectedEvidencePin.id).startsWith("draft-pin") && (
              <section className="shs-v8c-pin-editor" aria-label="Draft pin editor">
                <div className="shs-v8c-pin-editor__head">
                  <span>Draft Pin Creator</span>
                  <strong>{selectedEvidencePin.status === "pending_verification" ? "Submitted" : "Draft"}</strong>
                </div>

                <label>
                  Pin Type
                  <select
                    value={selectedEvidencePin.type}
                    onChange={(event) =>
                      updateSelectedEvidencePinDraft({
                        type: event.target.value,
                      })
                    }
                  >
                    <option value="draft">Draft Map Pin</option>
                    <option value="provider_site">Provider Site</option>
                    <option value="evidence_site">Evidence Site</option>
                    <option value="unmet_need">Unmet Need Location</option>
                    <option value="live_stream">Live Stream Location</option>
                    <option value="risk_location">Risk Location</option>
                    <option value="outcome_site">Outcome Verification Site</option>
                  </select>
                </label>

                <label>
                  Pin Title
                  <input
                    value={selectedEvidencePin.title}
                    onChange={(event) =>
                      updateSelectedEvidencePinDraft({
                        title: event.target.value,
                      })
                    }
                    placeholder="Enter pin title"
                  />
                </label>

                <label>
                  Address / Area
                  <input
                    value={selectedEvidencePin.address}
                    onChange={(event) =>
                      updateSelectedEvidencePinDraft({
                        address: event.target.value,
                      })
                    }
                    placeholder="Enter address or area"
                  />
                </label>

                <label>
                  Evidence Notes
                  <textarea
                    value={selectedEvidencePin.description}
                    onChange={(event) =>
                      updateSelectedEvidencePinDraft({
                        description: event.target.value,
                      })
                    }
                    placeholder="Explain what this pin proves or why it matters"
                    rows={3}
                  />
                </label>

                <div className="shs-v8c-media-placeholders">
                  <button type="button" onClick={() => setActiveMediaTab("photos")}>
                    📸 Add Photo
                  </button>
                  <button type="button" onClick={() => setActiveMediaTab("videos")}>
                    🎥 Add Video
                  </button>
                  <button type="button" onClick={() => setActiveMediaTab("live")}>
                    🔴 Add Live URL
                  </button>
                </div>
              </section>
            )}

            <div className="shs-v8a-clean-drawer__tabs">
              {[
                ["photos", `Photos ${selectedEvidencePin.counts.photos}`],
                ["videos", `Video ${selectedEvidencePin.counts.videos}`],
                ["live", `Live ${selectedEvidencePin.counts.live}`],
                ["audit", "Audit"],
                ["oracle", "Oracle"],
              ].map(([tab, label]) => (
                <button
                  key={tab}
                  type="button"
                  className={activeMediaTab === tab ? "is-active" : ""}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setActiveMediaTab(tab);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="shs-v8a-clean-drawer__panel">
              {activeMediaTab === "photos" && (
                <div className="shs-v8a-clean-note">
                  <strong>Photos</strong>
                  <p>{selectedEvidencePin.counts.photos} photo evidence item(s) linked.</p>
                  <span>V8B will attach real image uploads and source metadata.</span>
                </div>
              )}

              {activeMediaTab === "videos" && (
                <div className="shs-v8a-clean-note">
                  <strong>Video</strong>
                  <p>{selectedEvidencePin.counts.videos} video evidence item(s) linked.</p>
                  <span>V8B will support video URLs and uploaded clips.</span>
                </div>
              )}

              {activeMediaTab === "live" && (
                <div className="shs-v8a-clean-note">
                  <strong>Live Stream</strong>
                  <p>{selectedEvidencePin.counts.live} live source(s) linked.</p>
                  <span>Future: HLS / RTSP / secure partner stream links.</span>
                </div>
              )}

              {activeMediaTab === "audit" && (
                <div className="shs-v8a-clean-note">
                  <strong>Audit Status</strong>
                  <p>{selectedEvidencePin.verification.auditStatus}</p>
                  <span>Next: create pin audit event, evidence attachment, and verification workflow.</span>
                </div>
              )}

              {activeMediaTab === "oracle" && (
                <div className="shs-v8a-clean-note">
                  <strong>Oracle Connection</strong>
                  <p>{selectedEvidencePin.verification.oracleStatus}</p>
                  <span>Next: link pin to Oracle Truth Package and trust envelope.</span>
                </div>
              )}
            </div>

            <div className="shs-v8a-clean-drawer__actions">
              <button type="button" onClick={() => setActiveMediaTab("photos")}>
                Attach Media
              </button>
              <button type="button" onClick={submitSelectedEvidencePinForVerification}>
                Submit for Verification
              </button>
            </div>
          </aside>
        )}

        {(activeLayer === "community" || activeLayer === "location") && (
          <>
            <div className="shs-mapbox-media-pin-layer" aria-label="Media evidence pins">
              <button className="shs-mapbox-media-pin shs-mapbox-media-pin--verified" type="button" style={{ left: "74%", top: "18%" }} title="Verified site">
                <span>🛡</span>
              </button>

              <button className="shs-mapbox-media-pin shs-mapbox-media-pin--photo" type="button" style={{ left: "33%", top: "22%" }} title="Photo evidence available">
                <span>📸</span>
              </button>

              <button className="shs-mapbox-media-pin shs-mapbox-media-pin--video" type="button" style={{ left: "22%", top: "64%" }} title="Video evidence available">
                <span>🎥</span>
              </button>

              <button className="shs-mapbox-media-pin shs-mapbox-media-pin--live" type="button" style={{ left: "53%", top: "43%" }} title="Live stream available">
                <i />
                <span>🔴</span>
              </button>

              <button className="shs-mapbox-media-pin shs-mapbox-media-pin--site is-selected" type="button" style={{ left: "47%", top: "51%" }} title="Franklin Workforce Partner">
                <i />
                <span>📍</span>
              </button>
            </div>

            <aside className="shs-mapbox-media-legend" aria-label="Media evidence legend">
              <strong>Legend</strong>
              <span><i className="media-dot media-dot--verified" /> Verified Site</span>
              <span><i className="media-dot media-dot--photo" /> Photo Available</span>
              <span><i className="media-dot media-dot--video" /> Video Available</span>
              <span><i className="media-dot media-dot--live" /> Live Stream</span>
            </aside>

            <section className="shs-mapbox-media-site-card" aria-label="Selected media evidence site">
              <div className="shs-mapbox-media-site-card__status">
                <span>● Verified Provider Site</span>
                <strong>Verified</strong>
              </div>

              <h3>Franklin Workforce Partner</h3>
              <p className="shs-mapbox-media-site-card__address">123 Community Way, Columbus, OH 43201</p>
              <p>
                Workforce development and job placement evidence site for Franklin County residents.
              </p>

              <div className="shs-mapbox-media-tags">
                <span>Workforce</span>
                <span>Provider</span>
                <span>Partner</span>
              </div>

              <div className="shs-mapbox-media-counts">
                <span>5 Photos</span>
                <span>2 Videos</span>
                <span>1 Live</span>
              </div>

              <div className="shs-mapbox-media-thumbs">
                <article>
                  <img src="/assets/evidence/franklin-site-front.svg" alt="Front entrance verification" />
                  <strong>Front Entrance</strong>
                  <small>9:14 AM</small>
                </article>
                <article>
                  <img src="/assets/evidence/franklin-site-walkthrough.svg" alt="Walkthrough video" />
                  <b>▶</b>
                  <strong>Walkthrough</strong>
                  <small>9:21 AM</small>
                </article>
                <article>
                  <img src="/assets/evidence/franklin-live-lobby.svg" alt="Live lobby camera stream" />
                  <em>LIVE</em>
                  <strong>Lobby Camera</strong>
                  <small>Live</small>
                </article>
              </div>

              <button className="shs-mapbox-media-dossier-btn" type="button">
                Open Media Dossier →
              </button>
            </section>
          </>
        )}

        <article
          className={`shs-mapbox-location-card shs-mapbox-layer-card shs-mapbox-layer-card--${activeLayer}`}
          style={
            activeLayer === "state"
              ? {
                  width: "220px",
                  minWidth: "220px",
                  maxWidth: "220px",
                  right: "8px",
                  bottom: "76px",
                  top: "auto",
                  maxHeight: "260px",
                  padding: "10px",
                  borderRadius: "18px",
                  overflowY: "auto",
                  overflowX: "hidden",
                }
              : activeLayer === "region"
                ? {
                    width: "250px",
                    minWidth: "250px",
                    maxWidth: "250px",
                    right: "8px",
                    bottom: "72px",
                    top: "auto",
                    maxHeight: "310px",
                    padding: "12px",
                    borderRadius: "18px",
                    overflowY: "auto",
                    overflowX: "hidden",
                  }
                : activeLayer === "county"
                  ? {
                      width: "250px",
                      minWidth: "250px",
                      maxWidth: "250px",
                      right: "8px",
                      bottom: "72px",
                      top: "auto",
                      maxHeight: "310px",
                      padding: "12px",
                      borderRadius: "18px",
                      overflowY: "auto",
                      overflowX: "hidden",
                    }
                  : activeLayer === "community"
                    ? {
                        width: "238px",
                        minWidth: "238px",
                        maxWidth: "238px",
                        right: "8px",
                        bottom: "70px",
                        top: "auto",
                        maxHeight: "318px",
                        padding: "12px",
                        borderRadius: "18px",
                        overflowY: "auto",
                        overflowX: "hidden",
                      }
                    : {
                        width: "228px",
                        minWidth: "228px",
                        maxWidth: "228px",
                        right: "8px",
                        bottom: "70px",
                        top: "auto",
                        maxHeight: "318px",
                        padding: "12px",
                        borderRadius: "18px",
                        overflowY: "auto",
                        overflowX: "hidden",
                      }
          }
        >
          <div className="shs-mapbox-location-card__top">
            <span>{activeLayer === "location" ? selectedPoint.type : layerIntel.type}</span>
            <strong>{activeLayer === "location" ? selectedPoint.status : layerIntel.status}</strong>
          </div>
          <h3>{activeLayer === "location" ? selectedPoint.name : layerIntel.title}</h3>
          <p>{layerIntel.body}</p>
          {(activeLayer === "state" || activeLayer === "region") && (
            <div className="shs-mapbox-signal-summary">
              <div>
                <span>{activeLayer === "state" ? "Verified" : "Cluster Score"}</span>
                <strong>{activeLayer === "state" ? "23" : "91%"}</strong>
              </div>
              <div>
                <span>{activeLayer === "state" ? "Watch" : "Counties"}</span>
                <strong>{activeLayer === "state" ? "19" : "9"}</strong>
              </div>
              <div>
                <span>{activeLayer === "state" ? "Risk" : "Links"}</span>
                <strong>{activeLayer === "state" ? "9" : "27"}</strong>
              </div>
              <div>
                <span>{activeLayer === "state" ? "Oracle" : "Pressure"}</span>
                <strong>{activeLayer === "state" ? "4" : "High"}</strong>
              </div>
            </div>
          )}

          <div className="shs-mapbox-next-move">
            <span>Next Move</span>
            <strong>{selectedCommandContext.nextMove}</strong>
          </div>
          <button type="button">{layerIntel.action}</button>
        </article>
      </div>
    </main>
  );
}
