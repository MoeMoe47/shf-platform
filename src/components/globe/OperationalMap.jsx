import React, { useEffect, useRef } from "react";

let operationalMaplibreModulePromise = null;

async function loadOperationalMaplibre() {
  if (!operationalMaplibreModulePromise) {
    operationalMaplibreModulePromise = Promise.all([
      import("maplibre-gl"),
      import("maplibre-gl/dist/maplibre-gl.css"),
    ]).then(([mod]) => mod?.default || mod);
  }

  return operationalMaplibreModulePromise;
}
const FLOW_NODES = [
  {
    id: "franklin",
    name: "Franklin County",
    lng: -82.9988,
    lat: 39.9612,
    color: "#ffb15c",
    kind: "origin"
  },
  {
    id: "harris",
    name: "Harris County",
    lng: -95.3698,
    lat: 29.7604,
    color: "#74d7ff",
    kind: "destination"
  },
  {
    id: "miami",
    name: "Miami-Dade",
    lng: -80.1918,
    lat: 25.7617,
    color: "#74d7ff",
    kind: "destination"
  },
  {
    id: "kings",
    name: "Kings County",
    lng: -73.9442,
    lat: 40.6782,
    color: "#74d7ff",
    kind: "destination"
  }
];

const FLOW_LINES = [
  {
    id: "flow-franklin-harris",
    from: [-82.9988, 39.9612],
    to: [-95.3698, 29.7604]
  },
  {
    id: "flow-franklin-miami",
    from: [-82.9988, 39.9612],
    to: [-80.1918, 25.7617]
  },
  {
    id: "flow-franklin-kings",
    from: [-82.9988, 39.9612],
    to: [-73.9442, 40.6782]
  }
];

function buildArcCoordinates(from, to, steps = 48, lift = 6) {
  const [lng1, lat1] = from;
  const [lng2, lat2] = to;
  const midLng = (lng1 + lng2) / 2;
  const midLat = (lat1 + lat2) / 2 + lift;

  const coords = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const lng =
      (1 - t) * (1 - t) * lng1 +
      2 * (1 - t) * t * midLng +
      t * t * lng2;
    const lat =
      (1 - t) * (1 - t) * lat1 +
      2 * (1 - t) * t * midLat +
      t * t * lat2;
    coords.push([lng, lat]);
  }
  return coords;
}

export default function OperationalMap() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let maplibregl;

    async function initializeOperationalMap() {
      maplibregl = await loadOperationalMaplibre();

      if (cancelled) return;


    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [-85.5, 35.8],
      zoom: 3.15,
      minZoom: 2.7,
      maxZoom: 7.5,
      attributionControl: false
    });

    mapRef.current = map;

    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();

    map.on("load", () => {
      const lineFeatures = FLOW_LINES.map((line) => ({
        type: "Feature",
        properties: { id: line.id },
        geometry: {
          type: "LineString",
          coordinates: buildArcCoordinates(line.from, line.to)
        }
      }));

      const nodeFeatures = FLOW_NODES.map((node) => ({
        type: "Feature",
        properties: {
          id: node.id,
          name: node.name,
          color: node.color,
          kind: node.kind
        },
        geometry: {
          type: "Point",
          coordinates: [node.lng, node.lat]
        }
      }));

      const labelFeatures = FLOW_NODES.map((node) => ({
        type: "Feature",
        properties: {
          name: node.name,
          kind: node.kind
        },
        geometry: {
          type: "Point",
          coordinates: [node.lng, node.lat]
        }
      }));

      map.addSource("ops-lines", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: lineFeatures
        }
      });

      map.addSource("ops-nodes", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: nodeFeatures
        }
      });

      map.addSource("ops-labels", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: labelFeatures
        }
      });

      map.addLayer({
        id: "ops-lines-glow",
        type: "line",
        source: "ops-lines",
        layout: {
          "line-cap": "round",
          "line-join": "round"
        },
        paint: {
          "line-color": "rgba(255,177,92,0.20)",
          "line-width": 6.5,
          "line-blur": 3
        }
      });

      map.addLayer({
        id: "ops-lines-main",
        type: "line",
        source: "ops-lines",
        layout: {
          "line-cap": "round",
          "line-join": "round"
        },
        paint: {
          "line-color": "#f5c17a",
          "line-width": 3.0,
          "line-opacity": 0.95
        }
      });

      map.addLayer({
        id: "ops-nodes-outer",
        type: "circle",
        source: "ops-nodes",
        paint: {
          "circle-radius": [
            "case",
            ["==", ["get", "kind"], "origin"],
            18,
            13
          ],
          "circle-color": [
            "case",
            ["==", ["get", "kind"], "origin"],
            "rgba(255,177,92,0.14)",
            "rgba(116,215,255,0.12)"
          ],
          "circle-stroke-width": 1.4,
          "circle-stroke-color": [
            "case",
            ["==", ["get", "kind"], "origin"],
            "rgba(255,177,92,0.34)",
            "rgba(116,215,255,0.26)"
          ]
        }
      });

      map.addLayer({
        id: "ops-nodes-inner",
        type: "circle",
        source: "ops-nodes",
        paint: {
          "circle-radius": [
            "case",
            ["==", ["get", "kind"], "origin"],
            10,
            7
          ],
          "circle-color": ["get", "color"],
          "circle-stroke-width": 1.4,
          "circle-stroke-color": "#09111c"
        }
      });

      map.addLayer({
        id: "ops-labels",
        type: "symbol",
        source: "ops-labels",
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Open Sans Semibold"],
          "text-size": 15,
          "text-offset": [
            "case",
            ["==", ["get", "kind"], "origin"],
            ["literal", [0, -1.6]],
            ["literal", [0.9, -0.15]]
          ],
          "text-anchor": [
            "case",
            ["==", ["get", "kind"], "origin"],
            "center",
            "left"
          ],
          "text-allow-overlap": true
        },
        paint: {
          "text-color": "#dcecff",
          "text-halo-color": "rgba(3,9,19,0.95)",
          "text-halo-width": 1.4
        }
      });

      const bounds = new maplibregl.LngLatBounds();
      FLOW_NODES.forEach((node) => bounds.extend([node.lng, node.lat]));
      map.fitBounds(bounds, {
        padding: { top: 120, right: 165, bottom: 155, left: 165 },
        duration: 0,
        maxZoom: 3.7
      });
    });

    
    }

    initializeOperationalMap();

return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background:
          "radial-gradient(circle at 52% 42%, rgba(28,78,148,0.16) 0%, rgba(5,13,24,0.96) 50%, rgba(2,6,12,1) 100%)"
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "6% 4.5% 8% 4.5%",
          borderRadius: 26,
          border: "1px solid rgba(102,156,225,0.10)",
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,0.02), inset 0 0 80px rgba(57,118,212,0.06), 0 0 60px rgba(26,78,148,0.10)",
          pointerEvents: "none",
          zIndex: 2
        }}
      />

      <div
        ref={mapContainerRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%"
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 70,
          left: 0,
          right: 0,
          textAlign: "center",
          zIndex: 3,
          pointerEvents: "none",
          color: "rgba(156,188,225,0.50)",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.16em"
        }}
      >
        EASTERN U.S. OPERATIONS MAP
      </div>

      <div
        style={{
          position: "absolute",
          right: 22,
          bottom: 20,
          zIndex: 3,
          pointerEvents: "none",
          display: "flex",
          gap: 12,
          alignItems: "center",
          padding: "10px 12px",
          borderRadius: 14,
          background: "rgba(7,14,24,0.58)",
          border: "1px solid rgba(143,196,255,0.10)",
          color: "#a9bfd8",
          fontSize: 11,
          backdropFilter: "blur(10px)"
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: "#ffb15c",
              display: "inline-block"
            }}
          />
          Origin
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: "#74d7ff",
              display: "inline-block"
            }}
          />
          Connected jurisdiction
        </span>
      </div>
    </div>
  );
}
