import "./tactical-map-stage.css";

export default function TacticalMapStage() {
  return (
    <div
      className="tactical-map-stage"
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "16 / 8.2",
        background: "#020814",
        outline: "4px solid rgba(255,0,0,0.7)",
        zIndex: 999
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          zIndex: 1000,
          background: "red",
          color: "white",
          fontWeight: 900,
          fontSize: 24,
          padding: "8px 12px"
        }}
      >
        TACTICAL MAP STAGE LIVE
      </div>

      <img
        src="/assets/maps/usa-base.svg"
        alt="usa base"
        style={{
          position: "absolute",
          inset: "8% 4% 10% 4%",
          width: "92%",
          height: "82%",
          objectFit: "contain",
          objectPosition: "center",
          zIndex: 10,
          opacity: 1,
          border: "2px solid rgba(0,255,255,0.35)"
        }}
      />

      <img
        src="/assets/maps/usa-state-lines.svg"
        alt="usa state lines"
        style={{
          position: "absolute",
          inset: "8% 4% 10% 4%",
          width: "92%",
          height: "82%",
          objectFit: "contain",
          objectPosition: "center",
          zIndex: 11,
          opacity: 0.85,
          border: "2px solid rgba(255,255,0,0.25)"
        }}
      />
    </div>
  );
}
