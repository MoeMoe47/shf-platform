import React, { useEffect, useMemo, useState } from "react";
import { geoPath, geoMercator, geoCentroid } from "d3-geo";

const VIEWBOX_WIDTH = 900;
const VIEWBOX_HEIGHT = 620;

function normalizeCountyName(name = "") {
  return String(name)
    .replace(/\s+County$/i, "")
    .trim();
}

export default function OhioCountyNeutralBase({
  className = "",
  activeCounty = null,
  selectedCounty = null,
  hoveredCounty = null,
  onCountyClick,
  onCountyHover,
  onReady,
  showLabels = false,
  renderOverlay = null,
}) {
  const [geojson, setGeojson] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let alive = true;

    fetch("/assets/maps/ohio-counties.geojson")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} while loading Ohio counties GeoJSON`);
        }
        return res.json();
      })
      .then((data) => {
        if (!alive) return;
        setGeojson(data);
        setLoadError("");
      })
      .catch((err) => {
        console.error("Failed to load /assets/maps/ohio-counties.geojson", err);
        if (!alive) return;
        setLoadError(err.message || "Failed to load Ohio county geometry");
      });

    return () => {
      alive = false;
    };
  }, []);

  const mapState = useMemo(() => {
    if (!geojson?.features?.length) {
      return {
        features: [],
        path: null,
        countyCentroids: {},
      };
    }

    const projection = geoMercator().fitSize(
      [VIEWBOX_WIDTH, VIEWBOX_HEIGHT],
      geojson
    );
    const path = geoPath(projection);
    const countyCentroids = {};

    for (const feature of geojson.features) {
      const rawName =
        feature?.properties?.NAME ||
        feature?.properties?.name ||
        feature?.properties?.county ||
        "";

      const countyName = normalizeCountyName(rawName);
      const [lon, lat] = geoCentroid(feature);
      const [x, y] = projection([lon, lat]);

      countyCentroids[countyName] = {
        x,
        y,
        lon,
        lat,
        rawName,
      };
    }

    return {
      features: geojson.features,
      path,
      countyCentroids,
    };
  }, [geojson]);

  useEffect(() => {
    if (!onReady) return;
    if (!Object.keys(mapState.countyCentroids).length) return;
    onReady(mapState.countyCentroids);
  }, [mapState.countyCentroids, onReady]);

  const activeName = normalizeCountyName(activeCounty || "");
  const selectedName = normalizeCountyName(selectedCounty || "");
  const hoveredName = normalizeCountyName(hoveredCounty || "");

  return (
    <div className={`ohio-neutral-base ohio-official-geometry ${className}`.trim()}>
      {loadError ? (
        <div className="ohio-geometry-error">
          Failed to load Ohio county geometry: {loadError}
        </div>
      ) : null}

      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        className="ohio-neutral-base__svg"
        role="img"
        aria-label="Ohio county map"
      >
        <g className="ohio-county-geometry-layer">
          {mapState.features.map((feature, idx) => {
            const rawName =
              feature?.properties?.NAME ||
              feature?.properties?.name ||
              feature?.properties?.county ||
              `County ${idx + 1}`;

            const countyName = normalizeCountyName(rawName);

            const isActive = countyName === activeName;
            const isSelected = countyName === selectedName;
            const isHovered = countyName === hoveredName;

            const classes = [
              "ohio-county-shape",
              isActive ? "is-active" : "",
              isSelected ? "is-selected" : "",
              isHovered ? "is-hovered" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <path
                key={countyName || idx}
                d={mapState.path ? mapState.path(feature) : ""}
                className={classes}
                data-county={countyName}
                onMouseEnter={() =>
                  onCountyHover?.(countyName, mapState.countyCentroids[countyName], feature)
                }
                onMouseLeave={() => onCountyHover?.(null, null, null)}
                onClick={() =>
                  onCountyClick?.(countyName, mapState.countyCentroids[countyName], feature)
                }
              />
            );
          })}
        </g>

        {showLabels ? (
          <g className="ohio-county-label-layer">
            {Object.entries(mapState.countyCentroids).map(([countyName, point]) => (
              <text
                key={countyName}
                x={point.x}
                y={point.y}
                className="ohio-county-label"
                textAnchor="middle"
              >
                {countyName}
              </text>
            ))}
          </g>
        ) : null}

        {typeof renderOverlay === "function"
          ? renderOverlay({
              countyCentroids: mapState.countyCentroids,
              width: VIEWBOX_WIDTH,
              height: VIEWBOX_HEIGHT,
            })
          : null}
      </svg>
    </div>
  );
}
