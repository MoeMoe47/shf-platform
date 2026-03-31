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
}) {
  const [geojson, setGeojson] = React.useState(null);
  const [error, setError] = React.useState("");
  const [cameraCounty, setCameraCounty] = React.useState(null);

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
                onClick={() => handleCountyClick(name)}
                style={{ cursor: "pointer" }}
              />
            );
          })}
        </g>

        {selectedFeature ? (
          <>
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
