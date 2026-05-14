import React from "react";
import { geoIdentity, geoPath } from "d3-geo";
import "./OhioMap.css";

const STATE_VIEWBOX = "0 0 1000 720";

function getCountyName(feature) {
  const p = feature?.properties || {};
  return p.COUNTY || p.NAME || p.name || p.NAMELSAD || p.County || "";
}

const countyState = {
  Franklin: { status: "active", risk: "high" },
  Cuyahoga: { status: "monitor", risk: "low" },
  Hamilton: { status: "idle", risk: "none" },
};

function normalizeCountyName(value) {
  return String(value || "").trim().toLowerCase();
}

export default function OhioCountyNeutralBase({
  activeCounty = "Franklin",
  onCountyClick,
  onCentroidsChange,
}) {
  const [geojson, setGeojson] = React.useState(null);
  const [error, setError] = React.useState("");
  const [cameraCounty, setCameraCounty] = React.useState(null);
  const [hoveredCounty, setHoveredCounty] = React.useState(null);

  React.useEffect(() => {
    let alive = true;

    fetch("/geo/ohio-counties.geojson")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (alive) setGeojson(data);
      })
      .catch((err) => {
        console.error("Failed to load Ohio counties:", err);
        if (alive) setError(String(err?.message || err));
      });

    return () => {
      alive = false;
    };
  }, []);

  const projection = React.useMemo(() => {
    if (!geojson) return null;
    return geoIdentity()
      .reflectY(true)
      .fitExtent(
        [
          [42, 18],
          [958, 700],
        ],
        geojson
      );
  }, [geojson]);

  const path = React.useMemo(() => {
    if (!projection) return null;
    return geoPath(projection);
  }, [projection]);

  const normalizedActiveCounty = React.useMemo(
    () => normalizeCountyName(activeCounty),
    [activeCounty]
  );

  const selectedFeature = React.useMemo(() => {
    if (!geojson) return null;

    return (
      geojson.features.find((feature) => {
        const normalizedName = normalizeCountyName(getCountyName(feature));
        return (
          normalizedName === normalizedActiveCounty ||
          normalizedName.includes(normalizedActiveCounty) ||
          normalizedActiveCounty.includes(normalizedName)
        );
      }) || null
    );
  }, [geojson, normalizedActiveCounty]);


  const cameraFeature = React.useMemo(() => {
    if (!geojson || !cameraCounty) return null;
    return (
      geojson.features.find(
        (feature) => normalizeCountyName(getCountyName(feature)) === cameraCounty
      ) || null
    );
  }, [geojson, cameraCounty]);

  const currentViewBox = React.useMemo(() => {
    if (!cameraFeature || !path) return STATE_VIEWBOX;

    const bounds = path.bounds(cameraFeature);
    const [[x0, y0], [x1, y1]] = bounds;

    const countyW = Math.max(1, x1 - x0);
    const countyH = Math.max(1, y1 - y0);

    const padX = Math.max(55, countyW * 1.15);
    const padY = Math.max(42, countyH * 1.15);

    const minX = Math.max(0, x0 - padX);
    const minY = Math.max(0, y0 - padY);
    const maxX = Math.min(1000, x1 + padX);
    const maxY = Math.min(720, y1 + padY);

    return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
  }, [cameraFeature, path]);

  const cameraMode = cameraCounty ? "regional" : "state";

  const hotspotCenter = React.useMemo(() => {
    if (!selectedFeature || !path) return null;
    const [cx, cy] = path.centroid(selectedFeature);
    return {
      x: cx - 10,
      y: cy - 8,
    };
  }, [selectedFeature, path]);

  React.useEffect(() => {
    if (!geojson || !path || !onCentroidsChange) return;

    const [vx, vy, vw, vh] = currentViewBox.split(" ").map(Number);
    if (![vx, vy, vw, vh].every((n) => Number.isFinite(n))) return;

    const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

    const centroids = {};
    geojson.features.forEach((feature) => {
      const countyName = getCountyName(feature);
      const normalized = normalizeCountyName(countyName);
      const [cx, cy] = path.centroid(feature);

      if (!Number.isFinite(cx) || !Number.isFinite(cy)) return;

      const leftPct = clamp(((cx - vx) / vw) * 100, 2, 98);
      const topPct = clamp(((cy - vy) / vh) * 100, 2, 98);

      centroids[normalized] = {
        left: `${leftPct}%`,
        top: `${topPct}%`,
        county: countyName,
      };
    });

    onCentroidsChange(centroids);
  }, [geojson, path, currentViewBox, onCentroidsChange]);


  const franklinMockRing1 = React.useMemo(
    () => new Set(["delaware", "licking", "fairfield", "pickaway", "madison", "union"]),
    []
  );

  const franklinMockRing2 = React.useMemo(
    () => new Set(["marion", "morrow", "knox", "perry", "hocking", "ross", "fayette", "clark", "champaign"]),
    []
  );

  const getMockClusterClass = React.useCallback(
    (normalizedName) => {
      if (cameraMode !== "regional" || normalizedActiveCounty !== "franklin") return "";
      if (franklinMockRing1.has(normalizedName)) return "mock-ring-1";
      if (franklinMockRing2.has(normalizedName)) return "mock-ring-2";
      return "";
    },
    [cameraMode, normalizedActiveCounty, franklinMockRing1, franklinMockRing2]
  );


  const handleCountyClick = React.useCallback(
    (name) => {
      const normalized = normalizeCountyName(name);
      console.log("COUNTY CLICK", name, normalized);
      setCameraCounty(normalized);
      onCountyClick?.(name);
    },
    [onCountyClick]
  );

  const handleResetView = React.useCallback(() => {
    setCameraCounty(null);
  }, []);

  if (error) {
    return (
      <div className="ohio-map-root ohio-map-message">
        Failed to load county geometry: {error}
      </div>
    );
  }

  if (!geojson || !path) {
    return (
      <div className="ohio-map-root ohio-map-message">
        Loading Ohio county geometry...
      </div>
    );
  }

  const signalCentroids = {};
  geojson.features.forEach((feature) => {
    const name = getCountyName(feature);
    const normalizedName = normalizeCountyName(name);
    const signalSet = new Set(["franklin", "cuyahoga", "hamilton", "lucas", "summit"]);
    if (!signalSet.has(normalizedName)) return;

    const [cx, cy] = path.centroid(feature);
    if (!Number.isFinite(cx) || !Number.isFinite(cy)) return;

    signalCentroids[normalizedName] = { x: cx, y: cy, name };
  });

  return (
    <div className={`ohio-map-root ${cameraMode}`}>
      <button
        type="button"
        className={`ohio-map-reset ${cameraCounty ? "is-visible" : ""}`}
        onClick={handleResetView}
      >
        Back to State View
      </button>

      <svg
        viewBox={currentViewBox}
        className={`ohio-map-svg ${cameraMode}`}
        preserveAspectRatio="xMidYMid meet"
        aria-label="Ohio county neutral map"
      >
        <defs>
          <clipPath id="ohio-state-clip">
            <path d={path(geojson) || ""} />
          </clipPath>

          {selectedFeature ? (
            <clipPath id="selected-county-clip">
              <path d={path(selectedFeature) || ""} />
            </clipPath>
          ) : null}

          <radialGradient id="countyHeatGradient" cx="50%" cy="47%" r="62%">
            <stop offset="0%" stopColor="#FFB060" stopOpacity="0.92" />
            <stop offset="14%" stopColor="#F09040" stopOpacity="0.94" />
            <stop offset="34%" stopColor="#F08030" stopOpacity="0.96" />
            <stop offset="58%" stopColor="#E07030" stopOpacity="0.95" />
            <stop offset="78%" stopColor="#D05020" stopOpacity="0.93" />
            <stop offset="100%" stopColor="#B04020" stopOpacity="0.88" />
          </radialGradient>
        </defs>

        <image
          href="/textures/ohio-base-state.png"
          x="0"
          y="0"
          width="1000"
          height="720"
          preserveAspectRatio="xMidYMid slice"
          clipPath="url(#ohio-state-clip)"
          opacity="0.95"
        />

        <path d={path(geojson) || ""} className="ohio-state-skin" />


        <g className="ohio-county-borders">
          {geojson.features.map((feature, i) => {
            const name = getCountyName(feature);
            const state = countyState[name] || { status: "idle", risk: "none" };
            const normalizedName = normalizeCountyName(name);
            const mockClusterClass = getMockClusterClass(normalizedName);

            const isSelected =
              normalizedName === normalizedActiveCounty ||
              normalizedName.includes(normalizedActiveCounty) ||
              normalizedActiveCounty.includes(normalizedName);

            return (
              <path
                key={`${name}-${i}`}
                d={path(feature) || ""}
                className={[
                  "ohio-county-path",
                  state.status === "active" ? "active" : "",
                  state.status === "monitor" ? "monitor" : "",
                  mockClusterClass,
                  isSelected ? "selected" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                data-county={name}
                onMouseEnter={() => setHoveredCounty(normalizedName)}
              onMouseLeave={() => setHoveredCounty(null)}
              onClick={() => handleCountyClick(name)}
                style={{ cursor: "pointer" }}
              />
            );
          })}
        </g>

        {/* ===== SVG NETWORK LINES ===== */}
        {(() => {
          const connections = [
            ["franklin", "cuyahoga"],
            ["franklin", "hamilton"],
            ["franklin", "lucas"],
            ["franklin", "summit"],
          ];

          return connections.map(([a, b]) => {
            const from = signalCentroids[a];
            const to = signalCentroids[b];
            if (!from || !to) return null;

            const isHot =
              normalizedActiveCounty === a ||
              normalizedActiveCounty === b;

            return (
              <line
                key={`link-${a}-${b}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={isHot ? "rgba(255,160,90,0.34)" : "rgba(130,160,210,0.16)"}
                strokeWidth={isHot ? 2.2 : 1.2}
                strokeDasharray={isHot ? "0" : "4 6"}
                pointerEvents="none"
              />
            );
          });
        })()}

        {/* ===== SVG SIGNAL NODES ===== */}
        {geojson.features.map((feature) => {
          const name = getCountyName(feature);
          const normalizedName = normalizeCountyName(name);

          const signalSet = new Set([
            "franklin",
            "cuyahoga",
            "hamilton",
            "lucas",
            "summit",
          ]);

          if (!signalSet.has(normalizedName)) return null;

          const [cx, cy] = path.centroid(feature);
          if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null;

          const isActive =
            normalizedName === normalizedActiveCounty ||
            normalizedName.includes(normalizedActiveCounty) ||
            normalizedActiveCounty.includes(normalizedName);

          const riskMap = {
            franklin: "high",
            cuyahoga: "verified",
            hamilton: "high",
            lucas: "attention",
            summit: "stable",
          };

          const riskLevel = riskMap[normalizedName] || "stable";
          const showLabel = hoveredCounty === normalizedName || isActive;

          const fill =
            riskLevel === "high" ? "#ff4d4d" :
            riskLevel === "attention" ? "#f3b14f" :
            riskLevel === "verified" ? "#7aa6ff" :
            "#7fe0a1";

          const haloR = isActive ? 36 : 22;
          const coreR = isActive ? 11 : 7;
          const haloOpacity = isActive ? 0.38 : 0.18;

          return (
            <g
              key={`signal-${normalizedName}`}
              className={`ohio-signal-node ${isActive ? "is-active" : ""}`}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHoveredCounty(normalizedName)}
              onMouseLeave={() => setHoveredCounty(null)}
              onMouseEnter={() => setHoveredCounty(normalizedName)}
              onMouseLeave={() => setHoveredCounty(null)}
              onClick={() => handleCountyClick(name)}
            >
              <circle
                className={isActive ? "ohio-signal-halo is-active" : "ohio-signal-halo"}
                cx={cx}
                cy={cy}
                r={haloR}
                fill={fill}
                opacity={haloOpacity}
              />
              <circle
                className={isActive ? "ohio-signal-core is-active" : "ohio-signal-core"}
                cx={cx}
                cy={cy}
                r={coreR}
                fill={fill}
                stroke="rgba(255,255,255,0.96)"
                strokeWidth={isActive ? 1.5 : 1}
              />

              {(hoveredCounty === normalizedName || isActive) && (
                <g pointerEvents="none">
                  <rect
                    x={cx - 54}
                    y={cy - 46}
                    width={108}
                    height={28}
                    rx={5}
                    fill="rgba(5,10,18,0.94)"
                    stroke="rgba(255,160,90,0.18)"
                    strokeWidth="1"
                  />
                  <text
                    x={cx}
                    y={cy - 29}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="900"
                    letterSpacing="0.08em"
                    fill="rgba(245,248,255,0.98)"
                  >
                    {name.toUpperCase()}
                  </text>
                  <text
                    x={cx}
                    y={cy - 17}
                    textAnchor="middle"
                    fontSize="7.5"
                    fontWeight="800"
                    letterSpacing="0.14em"
                    fill="rgba(255,190,130,0.78)"
                  >
                    {riskLevel.toUpperCase()}
                  </text>
                </g>
              )}

              {showLabel ? (
                <g className="ohio-signal-label" pointerEvents="none">
                  <rect
                    x={cx - 42}
                    y={cy - 36}
                    rx={6}
                    ry={6}
                    width={84}
                    height={20}
                    fill="rgba(8,14,24,0.92)"
                    stroke="rgba(160,190,230,0.24)"
                    strokeWidth="1"
                  />
                  <text
                    x={cx}
                    y={cy - 22}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="800"
                    fill="rgba(235,242,255,0.96)"
                    letterSpacing="0.04em"
                  >
                    {name.toUpperCase()}
                  </text>
                  <text
                    x={cx}
                    y={cy - 10}
                    textAnchor="middle"
                    fontSize="8"
                    fontWeight="700"
                    fill="rgba(190,205,228,0.78)"
                    letterSpacing="0.08em"
                  >
                    {riskLevel.toUpperCase()}
                  </text>
                </g>
              ) : null}
            </g>
          );
        })}

        {selectedFeature ? (
          <>
            {(() => {
              const [cx, cy] = path.centroid(selectedFeature) || [];
              if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null;

              return (
                <ellipse
                  cx={cx}
                  cy={cy}
                  rx="150"
                  ry="110"
                  fill="rgba(255,138,68,0.08)"
                  pointerEvents="none"
                >
                  <animate
                    attributeName="opacity"
                    values="0.05;0.11;0.05"
                    dur="3.2s"
                    repeatCount="indefinite"
                  />
                </ellipse>
              );
            })()}
            {(() => {
              const [cx, cy] = path.centroid(selectedFeature) || [];
              if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null;

              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r="10"
                  fill="none"
                  stroke="rgba(255,138,68,0.32)"
                  strokeWidth="2"
                  pointerEvents="none"
                >
                  <animate
                    attributeName="r"
                    values="10;120"
                    dur="1.8s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.55;0"
                    dur="1.8s"
                    repeatCount="indefinite"
                  />
                </circle>
              );
            })()}
            <path
              d={path(selectedFeature) || ""}
              className="selected-county-halo-svg"
            >
              <animate
                attributeName="stroke-width"
                values="6;14;6"
                dur="1.65s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.12;0.42;0.12"
                dur="1.65s"
                repeatCount="indefinite"
              />
            </path>

            <path
              d={path(selectedFeature) || ""}
              className="selected-county-fill"
            >
              <animate
                attributeName="opacity"
                values="0.88;1;0.88"
                dur="1.65s"
                repeatCount="indefinite"
              />
            </path>

            {cameraMode === "regional" && hotspotCenter ? (
              <>
                <ellipse
                  cx={hotspotCenter.x}
                  cy={hotspotCenter.y}
                  rx="8"
                  ry="6"
                  className="cluster-hotspot-bloom"
                >
                  <animate
                    attributeName="rx"
                    values="6;10;6"
                    dur="1.8s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="ry"
                    values="4.5;7;4.5"
                    dur="1.8s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.03;0.08;0.03"
                    dur="1.8s"
                    repeatCount="indefinite"
                  />
                </ellipse>

                <circle
                  cx={hotspotCenter.x}
                  cy={hotspotCenter.y}
                  r="2.2"
                  className="cluster-hotspot-core"
                >
                  <animate
                    attributeName="r"
                    values="1.8;3;1.8"
                    dur="1.8s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.18;0.34;0.18"
                    dur="1.8s"
                    repeatCount="indefinite"
                  />
                </circle>
              </>
            ) : null}

            <image
              href="/textures/ohio-base-state.png"
              x="0"
              y="0"
              width="1000"
              height="720"
              preserveAspectRatio="xMidYMid slice"
              clipPath="url(#selected-county-clip)"
              className="selected-county-texture-dark"
            >
              <animate
                attributeName="opacity"
                values="0.14;0.24;0.14"
                dur="1.65s"
                repeatCount="indefinite"
              />
            </image>

            <image
              href="/textures/ohio-base-state.png"
              x="0"
              y="0"
              width="1000"
              height="720"
              preserveAspectRatio="xMidYMid slice"
              clipPath="url(#selected-county-clip)"
              className="selected-county-texture-light"
            >
              <animate
                attributeName="opacity"
                values="0.05;0.14;0.05"
                dur="1.65s"
                repeatCount="indefinite"
              />
            </image>

            <path
              d={path(selectedFeature) || ""}
              className="selected-county-rim-base"
            >
              <animate
                attributeName="stroke-width"
                values="2.8;4.3;2.8"
                dur="1.65s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.86;1;0.86"
                dur="1.65s"
                repeatCount="indefinite"
              />
            </path>
          </>
        ) : null}

        <path d={path(geojson) || ""} className="ohio-state-outline" />

        <g className="ohio-county-hit-layer">
          {geojson.features.map((feature, i) => {
            const name = getCountyName(feature);
            return (
              <path
                key={`hit-${name}-${i}`}
                d={path(feature) || ""}
                className="ohio-county-hit-path"
                data-county={name}
                onMouseEnter={() => setHoveredCounty(normalizedName)}
              onMouseLeave={() => setHoveredCounty(null)}
              onClick={() => handleCountyClick(name)}
              />
            );
          })}
        </g>
      </svg>

      <div className="ohio-map-glow" />
    </div>
  );
}
