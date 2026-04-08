import React from "react";
import { SIMULATION_DEFAULTS } from "./simulation.constants";

const panel = {
  borderRadius: 12,
  border: "1px solid rgba(92,140,198,0.12)",
  background: "rgba(8,15,24,0.68)",
  padding: "12px 13px",
  display: "grid",
  gap: 10,
};

export default function SimulationPanel({
  simulation,
  title = SIMULATION_DEFAULTS.title,
}) {
  const safeSimulation = simulation || {};
  const hasSimulation = Boolean(safeSimulation?.hasSimulation);

  return (
    <div style={panel}>
      <div
        style={{
          color: "#7fd8ff",
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {title}
      </div>

      {!hasSimulation ? (
        <div style={{ color: "#9ab2c6", fontSize: 12, lineHeight: 1.4 }}>
          {SIMULATION_DEFAULTS.emptyLabel}
        </div>
      ) : (
        <>
          <div style={{ color: "#dbe8f4", fontSize: 13, lineHeight: 1.4 }}>
            {safeSimulation?.summary || "Simulation active."}
          </div>

          {!!safeSimulation?.action && (
            <div style={{ color: "#9ab2c6", fontSize: 12, lineHeight: 1.4 }}>
              Action: {safeSimulation.action}
            </div>
          )}

          {!!safeSimulation?.timelineStep && (
            <div style={{ color: "#9ab2c6", fontSize: 12, lineHeight: 1.4 }}>
              Timeline: {safeSimulation.timelineStep}
            </div>
          )}
        </>
      )}
    </div>
  );
}
