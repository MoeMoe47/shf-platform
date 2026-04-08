import React from "react";
import Globe from "react-globe.gl";

export default function OutcomeGlobe() {

  const arcs = [
    { startLat:40.0,startLng:-83.0,endLat:41.5,endLng:-81.7,color:["#6ee7ff","#6ee7ff"] },
    { startLat:40.0,startLng:-83.0,endLat:39.1,endLng:-84.5,color:["#ff9f43","#ff9f43"] },
    { startLat:40.0,startLng:-83.0,endLat:42.0,endLng:-82.9,color:["#6ee7ff","#6ee7ff"] },
    { startLat:40.0,startLng:-83.0,endLat:39.7,endLng:-82.5,color:["#ff9f43","#ff9f43"] },
    { startLat:40.0,startLng:-83.0,endLat:41.8,endLng:-84.1,color:["#6ee7ff","#6ee7ff"] },
    { startLat:40.0,startLng:-83.0,endLat:38.9,endLng:-85.0,color:["#ff9f43","#ff9f43"] },
    { startLat:40.0,startLng:-83.0,endLat:42.2,endLng:-81.9,color:["#6ee7ff","#6ee7ff"] },
    { startLat:40.0,startLng:-83.0,endLat:41.1,endLng:-84.9,color:["#ff9f43","#ff9f43"] }
  ];

  return (
    <div
      style={{
        position:"absolute",
        top:-40,
        left:-60,
        width:"120%",
        height:"100%",
        pointerEvents:"none",
        zIndex:0
      }}
    >

      {/* glow halo behind planet */}
      <div
        style={{
          position:"absolute",
          top:"45%",
          left:"50%",
          transform:"translate(-50%,-50%)",
          width:900,
          height:900,
          borderRadius:"50%",
          background:"radial-gradient(circle, rgba(120,200,255,0.25) 0%, rgba(120,200,255,0.08) 40%, rgba(0,0,0,0) 70%)",
          filter:"blur(40px)"
        }}
      />

      <Globe
        width={1500}
        height={900}
        backgroundColor="rgba(0,0,0,0)"

        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"

        atmosphereColor="#7fd4ff"
        atmosphereAltitude={0.32}

        arcsData={arcs}
        arcColor={"color"}
        arcAltitude={0.18}
        arcStroke={0.5}

        arcDashLength={0.4}
        arcDashGap={1.2}
        arcDashAnimateTime={4000}

        enablePointerInteraction={false}
      />

    </div>
  );
}
