import React, { useEffect, useRef } from "react";
import Globe from "globe.gl";
import { outcomeFlows } from "../../registry/outcomeFlows";

export default function OperationalGlobe() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    mount.innerHTML = "";

    const globe = Globe()(mount)
      .width(mount.clientWidth || 900)
      .height(mount.clientHeight || 700)
      .globeImageUrl("//unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
      .backgroundColor("#02060d")
      .showAtmosphere(true)
      .atmosphereColor("#8fc4ff")
      .atmosphereAltitude(0.18);

    const controls = globe.controls();
    controls.enableZoom = true;
    controls.autoRotate = false;

    globe.pointOfView({ lat: 37.5, lng: -86.5, altitude: 1.18 }, 0);

    const onResize = () => {
      const el = mountRef.current;
      if (!el) return;
      globe.width(el.clientWidth || 900).height(el.clientHeight || 700);
    };

    window.addEventListener("resize", onResize);

    async function loadOperationsLayers() {
      try {
        const [states, counties] = await Promise.all([
          fetch("/geo/us-states.geojson").then((r) => {
            if (!r.ok) throw new Error("Missing /geo/us-states.geojson");
            return r.json();
          }),
          fetch("/geo/us-counties.geojson").then((r) => {
            if (!r.ok) throw new Error("Missing /geo/us-counties.geojson");
            return r.json();
          })
        ]);

        const ohio = states.features?.find(
          (f) => f.properties?.name === "Ohio"
        );

        const franklin = counties.features?.find(
          (f) => String(f.id) === "39049"
        );

        const shapes = [];
        if (ohio) shapes.push({ ...ohio, type: "state" });
        if (franklin) shapes.push({ ...franklin, type: "county" });

        globe
          .polygonsData(shapes)
          .polygonCapColor((d) =>
            d.type === "state"
              ? "rgba(210,220,235,0.07)"
              : "rgba(255,140,60,0.42)"
          )
          .polygonStrokeColor((d) =>
            d.type === "state"
              ? "rgba(220,228,238,0.65)"
              : "rgba(255,172,92,0.95)"
          )
          .polygonAltitude((d) => (d.type === "state" ? 0.012 : 0.025));

        const flowPoints = [
          {
            lat: 39.9612,
            lng: -82.9988,
            size: 0.88,
            color: "#ffb15c",
            label: "Franklin County"
          },
          {
            lat: 29.7604,
            lng: -95.3698,
            size: 0.58,
            color: "#74d7ff",
            label: "Harris County"
          },
          {
            lat: 25.7617,
            lng: -80.1918,
            size: 0.58,
            color: "#74d7ff",
            label: "Miami-Dade"
          },
          {
            lat: 40.6782,
            lng: -73.9442,
            size: 0.58,
            color: "#74d7ff",
            label: "Kings County"
          }
        ];

        globe
          .pointsData(flowPoints)
          .pointColor((d) => d.color)
          .pointAltitude(0.034)
          .pointRadius((d) => d.size)
          .pointsMerge(false);

        globe
          .labelsData(flowPoints)
          .labelLat((d) => d.lat)
          .labelLng((d) => d.lng)
          .labelText((d) => d.label)
          .labelSize(() => 1.0)
          .labelDotRadius(() => 0)
          .labelColor(() => "#d8ecff")
          .labelResolution(2)
          .labelAltitude(0.07);

        globe
          .arcsData(outcomeFlows)
          .arcStartLat((d) => d.startLat)
          .arcStartLng((d) => d.startLng)
          .arcEndLat((d) => d.endLat)
          .arcEndLng((d) => d.endLng)
          .arcColor(() => [
            "rgba(255,173,84,0.96)",
            "rgba(255,230,190,0.30)"
          ])
          .arcAltitude(() => 0.30)
          .arcStroke(() => 1.2)
          .arcDashLength(() => 0.40)
          .arcDashGap(() => 0.65)
          .arcDashInitialGap((_, i) => i * 0.12)
          .arcDashAnimateTime(() => 2200);

        globe
          .ringsData([
            {
              lat: 39.9612,
              lng: -82.9988,
              color: "rgba(255,177,92,0.72)",
              maxR: 7.0,
              propagationSpeed: 1.3,
              repeatPeriod: 850
            }
          ])
          .ringLat((d) => d.lat)
          .ringLng((d) => d.lng)
          .ringColor((d) => () => d.color)
          .ringMaxRadius((d) => d.maxR)
          .ringPropagationSpeed((d) => d.propagationSpeed)
          .ringRepeatPeriod((d) => d.repeatPeriod);
      } catch (err) {
        console.error("OperationalGlobe load failed:", err);
      }
    }

    loadOperationsLayers();

    return () => {
      window.removeEventListener("resize", onResize);
      if (mountRef.current) {
        mountRef.current.innerHTML = "";
      }
    };
  }, []);

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
}
