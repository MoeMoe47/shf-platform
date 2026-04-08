import React from "react";
import BackgroundSystem from "./BackgroundSystem";
import ExecutiveOverlay from "./ExecutiveOverlay";

function getRecommendation(action) {
  switch (action) {
    case "execute":
      return {
        title: "Recommended Next Move",
        body: "Proceed to action queue for Franklin County anomaly. Confidence is elevated and the signal is ready for controlled execution.",
      };
    case "review":
      return {
        title: "Recommended Next Move",
        body: "Route this case to analyst review. The signal is meaningful, but it should be validated before release or escalation.",
      };
    case "hold":
      return {
        title: "Recommended Next Move",
        body: "Place a temporary hold and request verification. This is the safest path when confidence or proof coverage is incomplete.",
      };
    default:
      return {
        title: "Recommended Next Move",
        body: "Assign verifier to Franklin County anomaly and keep the dashboard focused on the decision path.",
      };
  }
}

export default function CommandCenterShell() {
  const [activeAction, setActiveAction] = React.useState("review");
  const [selectedPanel, setSelectedPanel] = React.useState("executive");

  const recommendation = React.useMemo(
    () => getRecommendation(activeAction),
    [activeAction]
  );

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        overflow: "hidden",
      }}
    >
      <BackgroundSystem />
      <div style={{ position: "relative", zIndex: 2 }}>
        <ExecutiveOverlay
          activeAction={activeAction}
          setActiveAction={setActiveAction}
          selectedPanel={selectedPanel}
          setSelectedPanel={setSelectedPanel}
          recommendation={recommendation}
        />
      </div>
    </div>
  );
}
