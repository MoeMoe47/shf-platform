import React from "react";

export default function MapHero({
  height = 420,
  center = [-82.9988, 39.9612], // Columbus-ish default
  zoom = 9,
  styleUrl = "https://demotiles.maplibre.org/style.json",
}) {
  const elRef = React.useRef(null);

  React.useEffect(() => {
    let cancelled = false;
    let map = null;

    async function boot() {
      if (!elRef.current) return;

      // Load MapLibre CSS only when this component mounts
      await import("maplibre-gl/dist/maplibre-gl.css");

      // Load MapLibre JS only when needed (keeps vendor-map out of base load)
      const mod = await import("maplibre-gl");
      const maplibregl = mod?.default || mod;

      if (cancelled) return;

      map = new maplibregl.Map({
        container: elRef.current,
        style: styleUrl,
        center,
        zoom,
        attributionControl: false,
      });

      map.addControl(
        new maplibregl.NavigationControl({ visualizePitch: false }),
        "top-right"
      );

      map.on("load", () => {
        // no-op hook point for future layers (pins, overlays, etc.)
      });
    }

    boot().catch((err) => {
      if (process.env.NODE_ENV !== "production") {
        console.error("[MapHero] failed to load maplibre:", err);
      }
    });

    return () => {
      cancelled = true;
      try {
        if (map) map.remove();
      } catch {}
    };
  }, [center, zoom, styleUrl]);

  return (
    <div
      ref={elRef}
      style={{
        height: typeof height === "number" ? `${height}px` : String(height),
        width: "100%",
        borderRadius: 18,
        overflow: "hidden",
      }}
    />
  );
}
