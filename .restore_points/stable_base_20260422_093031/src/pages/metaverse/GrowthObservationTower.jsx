import React from "react";

const TOWER_SRC = `${import.meta.env.BASE_URL}assets/hero/growth-observatory-art.png`;

export default function GrowthObservationTower() {
  return (
    <div style={styles.scene}>
      <div
        style={{
          ...styles.bg,
          backgroundImage: `url(${TOWER_SRC})`,
        }}
        aria-hidden="true"
      />

      <div style={styles.ui}>
        <div style={styles.glassPanel}>
          <h1 style={{ fontSize: "42px", marginBottom: "10px" }}>
            Growth Observation Tower
          </h1>
          <p style={{ opacity: 0.8 }}>
            Metaverse node for growth signals backed by Watchtower truth.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  scene: {
    position: "relative",
    minHeight: "100vh",
    overflow: "hidden",
  },
  bg: {
    position: "fixed",
    inset: 0,
    zIndex: 0,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  },
  ui: {
    position: "relative",
    zIndex: 2,
    padding: "60px 40px",
  },
  glassPanel: {
    background: "rgba(8,14,28,0.65)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: "30px",
    borderRadius: "20px",
    color: "white",
    maxWidth: "800px",
  },
};
