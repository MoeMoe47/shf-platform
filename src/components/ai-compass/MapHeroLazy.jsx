import React from "react";

const MapHero = React.lazy(() => import("./MapHero.jsx"));

export default function MapHeroLazy(props) {
  return (
    <React.Suspense
      fallback={
        <div
          style={{
            height:
              typeof props.height === "number"
                ? `${props.height}px`
                : String(props.height || 420),
            width: "100%",
            borderRadius: 18,
            overflow: "hidden",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        />
      }
    >
      <MapHero {...props} />
    </React.Suspense>
  );
}
