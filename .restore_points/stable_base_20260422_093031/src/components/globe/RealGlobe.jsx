import React, { useEffect, useRef } from "react";
import Globe from "globe.gl";
import * as d3 from "d3-geo";

export default function RealGlobe() {
  const globeRef = useRef();

  useEffect(() => {
    const globe = Globe()(globeRef.current)
      .globeImageUrl("//unpkg.com/three-globe/example/img/earth-night.jpg")
      .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
      .backgroundColor("#02060d");

    fetch("https://raw.githubusercontent.com/plotly/datasets/master/geojson-counties-fips.json")
      .then(res => res.json())
      .then(counties => {

        const franklin = counties.features.find(
          f => f.properties.NAME === "Franklin"
          && f.properties.STATE === "39"
        );

        globe
          .polygonsData([franklin])
          .polygonAltitude(0.01)
          .polygonCapColor(() => "rgba(255,140,60,0.7)")
          .polygonSideColor(() => "rgba(255,140,60,0.25)")
          .polygonStrokeColor(() => "#ffaa55")
          .polygonLabel(d => `Franklin County<br/>Participants Active`);

      });

    globe.pointOfView({ lat: 40.3, lng: -83, altitude: 2 });

  }, []);

  return (
    <div
      ref={globeRef}
      style={{ width: "100%", height: "640px" }}
    />
  );
}
