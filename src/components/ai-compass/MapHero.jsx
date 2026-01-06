// src/components/ai-compass/MapHero.jsx
import React from "react";
import maplibregl from "maplibre-gl";

/* ---------- Free raster fallback (used only if no MapTiler key) ---------- */
const RASTER_OSM_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
};

export default function MapHero({
  layers = { red: true, green: true, orange: true },
  onSelectMetro,
}) {
  const containerRef = React.useRef(null);
  const mapRef = React.useRef(null);

  // Choose basemap: MapTiler Dark Matter (vector) → fallback to OSM raster
  const styleSpec = React.useMemo(() => {
    const key = (import.meta.env.VITE_MAPTILER_KEY || "").trim();
    return key
      ? `https://api.maptiler.com/maps/darkmatter/style.json?key=${key}`
      : RASTER_OSM_STYLE;
  }, []);

  React.useEffect(() => {
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleSpec,
      center: [-95.7, 37.1],
      zoom: 3.4,
      maxZoom: 9,
      attributionControl: true,
    });
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), "top-right");

    const whenReady = (cb) => (map.isStyleLoaded() ? cb() : map.once("load", cb));

    whenReady(async () => {
      // fetch mock data for pulses
      const res = await fetch("/api/mock/pulses").then((r) => r.json()).catch(() => ({}));
      const { red = null, green = null, orange = null } = res || {};

      // add sources/layers (with glow)
      if (red) {
        map.addSource("S-red", { type: "geojson", data: red });
        map.addLayer({
          id: "L-red-glow",
          type: "circle",
          source: "S-red",
          paint: {
            "circle-radius": 20,
            "circle-color": "#ff4f00",
            "circle-blur": 0.8,
            "circle-opacity": 0.35,
          },
        });
        map.addLayer({
          id: "L-red",
          type: "circle",
          source: "S-red",
          paint: { "circle-radius": 4, "circle-color": "#ff4f00" },
        });
      }

      if (green) {
        map.addSource("S-green", { type: "geojson", data: green });
        map.addLayer({
          id: "L-green-glow",
          type: "circle",
          source: "S-green",
          paint: {
            "circle-radius": 20,
            "circle-color": "#1cff7a",
            "circle-blur": 0.8,
            "circle-opacity": 0.35,
          },
        });
        map.addLayer({
          id: "L-green",
          type: "circle",
          source: "S-green",
          paint: { "circle-radius": 4, "circle-color": "#1cff7a" },
        });
      }

      if (orange) {
        map.addSource("S-orange", { type: "geojson", data: orange });
        map.addLayer({
          id: "L-orange-glow",
          type: "circle",
          source: "S-orange",
          paint: {
            "circle-radius": 20,
            "circle-color": "#ff7a1c",
            "circle-blur": 0.8,
            "circle-opacity": 0.35,
          },
        });
        map.addLayer({
          id: "L-orange",
          type: "circle",
          source: "S-orange",
          paint: { "circle-radius": 4, "circle-color": "#ff7a1c" },
        });
      }

      // click → Drawer
      ["L-red", "L-green", "L-orange"].forEach((id) => {
        map.on("mouseenter", id, () => (map.getCanvas().style.cursor = "pointer"));
        map.on("mouseleave", id, () => (map.getCanvas().style.cursor = ""));
        map.on("click", id, (e) => {
          const f = e.features?.[0];
          onSelectMetro?.(f?.properties?.metro || "");
        });
      });

      // initial legend visibility
      const applyVis = () =>
        ["red", "green", "orange"].forEach((k) => {
          const v = layers[k] ? "visible" : "none";
          try {
            map.setLayoutProperty(`L-${k}`, "visibility", v);
            map.setLayoutProperty(`L-${k}-glow`, "visibility", v);
          } catch {}
        });
      applyVis();
    });

    return () => {
      try { map.remove(); } catch {}
    };
  }, [styleSpec, onSelectMetro]);

  // respond to legend toggles
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () =>
      ["red", "green", "orange"].forEach((k) => {
        const v = layers[k] ? "visible" : "none";
        try {
          map.setLayoutProperty(`L-${k}`, "visibility", v);
          map.setLayoutProperty(`L-${k}-glow`, "visibility", v);
        } catch {}
      });
    map.isStyleLoaded() ? apply() : map.once("idle", apply);
  }, [layers]);

  return (
    <div
      ref={containerRef}
      id="ai-map"
      className="ai-map"
      aria-label="USA job map"
      style={{ height: "360px" }}
    />
  );
}
