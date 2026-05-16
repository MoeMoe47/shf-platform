import React, { useEffect, useMemo, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";

const VIEWBOX_WIDTH = 900;
const VIEWBOX_HEIGHT = 620;

function normalizeCountyName(name = "") {
  return String(name).replace(/\s+County$/i, "").trim();
}

function countySlug(name = "") {
  return normalizeCountyName(name).toLowerCase().replace(/\s+/g, "-");
}

function getCountyName(feature) {
  const props = feature?.properties || {};
  const rawName =
    props.NAME ||
    props.name ||
    props.county ||
    props.COUNTY_NAME ||
    props.County ||
    props.county_name ||
    props.COUNTY ||
    "";

  return normalizeCountyName(rawName);
}

function toFeatureCollection(features) {
  return {
    type: "FeatureCollection",
    features,
  };
}

function buildFallbackCluster(fullOhioGeojson, selectedCounty) {
  const features = fullOhioGeojson?.features || [];
  const selectedName = normalizeCountyName(selectedCounty || "");

  if (!features.length || !selectedName) {
    return fullOhioGeojson;
  }

  const selectedFeature = features.find(
    (feature) => getCountyName(feature).toLowerCase() === selectedName.toLowerCase()
  );

  if (!selectedFeature) {
    return fullOhioGeojson;
  }

  // First projection is only used to estimate which counties are closest.
  const statewideProjection = geoMercator().fitExtent(
    [
      [70, 46],
      [VIEWBOX_WIDTH - 70, VIEWBOX_HEIGHT - 56],
    ],
    fullOhioGeojson
  );

  const statewidePath = geoPath(statewideProjection);
  const selectedCentroid = statewidePath.centroid(selectedFeature);

  const ranked = features
    .map((feature) => {
      const centroid = statewidePath.centroid(feature);
      const dx = centroid[0] - selectedCentroid[0];
      const dy = centroid[1] - selectedCentroid[1];
      return {
        feature,
        countyName: getCountyName(feature),
        distance: Math.sqrt(dx * dx + dy * dy),
      };
    })
    .sort((a, b) => a.distance - b.distance);

  // Selected county + nearest surrounding counties.
  const clusterFeatures = ranked.slice(0, 7).map((item) => item.feature);

  return toFeatureCollection(clusterFeatures);
}

async function loadRegionalGeojson(slug, selectedCounty) {
  const clusterPath = `/assets/maps/clusters/${slug}.geojson`;

  try {
    const clusterRes = await fetch(clusterPath, { cache: "no-store" });
    if (clusterRes.ok) {
      return {
        data: await clusterRes.json(),
        source: "custom_cluster",
        path: clusterPath,
      };
    }
  } catch {
    // Continue to fallback below.
  }

  const fallbackPath = "/assets/maps/ohio-counties.geojson";
  const fullRes = await fetch(fallbackPath, { cache: "no-store" });

  if (!fullRes.ok) {
    throw new Error(`HTTP ${fullRes.status} while loading ${fallbackPath}`);
  }

  const fullOhioGeojson = await fullRes.json();

  return {
    data: buildFallbackCluster(fullOhioGeojson, selectedCounty),
    source: "statewide_fallback_cluster",
    path: fallbackPath,
  };
}

export default function SHFRegionalCountyCluster({
  selectedCounty,
  hoveredCounty = null,
  onCountyHover,
  onCountyClick,
}) {
  const [geojson, setGeojson] = useState(null);
  const [sourceInfo, setSourceInfo] = useState(null);
  const [error, setError] = useState("");

  const slug = countySlug(selectedCounty);

  useEffect(() => {
    let alive = true;
    setGeojson(null);
    setSourceInfo(null);
    setError("");

    loadRegionalGeojson(slug, selectedCounty)
      .then((result) => {
        if (!alive) return;
        setGeojson(result.data);
        setSourceInfo(result);
      })
      .catch((err) => {
        if (!alive) return;
        setError(String(err.message || err));
      });

    return () => {
      alive = false;
    };
  }, [slug, selectedCounty]);

  const mapState = useMemo(() => {
    if (!geojson?.features?.length) {
      return { features: [], path: null };
    }

    const projection = geoMercator().fitExtent(
      [
        [70, 46],
        [VIEWBOX_WIDTH - 70, VIEWBOX_HEIGHT - 56],
      ],
      geojson
    );

    const path = geoPath(projection);
    return { features: geojson.features, path };
  }, [geojson]);

  const selectedName = normalizeCountyName(selectedCounty || "");
  const hoveredName = normalizeCountyName(hoveredCounty || "");

  if (error) {
    return <div className="shf-regional-cluster-loading">Failed to load regional county view: {error}</div>;
  }

  if (!geojson) {
    return <div className="shf-regional-cluster-loading">Loading regional county view…</div>;
  }

  return (
    <div className="shf-regional-cluster-surface">
      <div className="shf-regional-cluster-source">
        {sourceInfo?.source === "custom_cluster" ? "Custom regional cluster" : "Generated regional cluster"}
      </div>

      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        className="shf-regional-cluster-svg"
        role="img"
        aria-label={`${selectedCounty} regional county cluster`}
      >
        <defs>
          <linearGradient id="shfRegionalSelectedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff0c7">
              <animate attributeName="stop-color" values="#fff0c7;#ffd27e;#fff0c7" dur="1.8s" repeatCount="indefinite" />
            </stop>
            <stop offset="28%" stopColor="#ffb14a">
              <animate attributeName="stop-color" values="#ffb14a;#ff8427;#ffb14a" dur="1.8s" repeatCount="indefinite" />
            </stop>
            <stop offset="62%" stopColor="#ff641b">
              <animate attributeName="stop-color" values="#ff641b;#ff7d28;#ff641b" dur="1.8s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#6f240d">
              <animate attributeName="stop-color" values="#6f240d;#9a3614;#6f240d" dur="1.8s" repeatCount="indefinite" />
            </stop>
          </linearGradient>

          <filter id="shfRegionalGoldGlow" x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur1" />
            <feColorMatrix
              in="blur1"
              type="matrix"
              values="1 0 0 0 0
                      0 0.56 0 0 0
                      0 0 0.16 0 0
                      0 0 0 1 0"
              result="warmGlow"
            />
            <feGaussianBlur in="warmGlow" stdDeviation="16" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="warmGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g className="shf-regional-counties">
          {mapState.features.map((feature, idx) => {
            const countyName = getCountyName(feature);
            const isSelected =
              countyName.toLowerCase() === selectedName.toLowerCase();
            const isHovered =
              countyName.toLowerCase() === hoveredName.toLowerCase();

            return (
              <path
                key={countyName || idx}
                d={mapState.path ? mapState.path(feature) : ""}
                className={[
                  "shf-regional-county",
                  isSelected ? "is-selected" : "is-context",
                  isHovered ? "is-hovered" : "",
                ].filter(Boolean).join(" ")}
                fill={
                  isSelected
                    ? "url(#shfRegionalSelectedGradient)"
                    : isHovered
                    ? "rgba(255, 164, 72, 0.28)"
                    : "rgba(255, 143, 47, 0.14)"
                }
                stroke={
                  isSelected
                    ? "rgba(255, 228, 185, 0.98)"
                    : isHovered
                    ? "rgba(214, 128, 47, 0.96)"
                    : "rgba(122, 82, 47, 0.56)"
                }
                strokeWidth={isSelected ? 4.4 : isHovered ? 3 : 2.2}
                filter={
                  isSelected
                    ? "url(#shfRegionalGoldGlow)"
                    : isHovered
                    ? "drop-shadow(0 0 8px rgba(223,131,40,0.26))"
                    : undefined
                }
                style={{
                  opacity: isSelected ? 1 : isHovered ? 1 : 0.94,
                  transformBox: "fill-box",
                  transformOrigin: "center",
                  animation: isSelected ? "shfRegionalLavaPulse 1.8s ease-in-out infinite" : "none",
                }}
                data-county={countyName}
                onMouseEnter={() => onCountyHover?.(countyName)}
                onMouseLeave={() => onCountyHover?.(null)}
                onClick={() => onCountyClick?.(countyName)}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}
