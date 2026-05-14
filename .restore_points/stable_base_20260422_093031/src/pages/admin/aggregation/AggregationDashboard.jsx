import React from "react";
import "./admin-aggregation.css";
import AggregationCommandBar from "./AggregationCommandBar.jsx";
import AggregationOverview from "./AggregationOverview.jsx";
import EntityResolutionQueue from "./EntityResolutionQueue.jsx";
import LineageExplorer from "./LineageExplorer.jsx";
import VerificationWorkbench from "./VerificationWorkbench.jsx";
import ReconciliationWorkbench from "./ReconciliationWorkbench.jsx";
import QualityCommandPanel from "./QualityCommandPanel.jsx";
import MappingRegistry from "./MappingRegistry.jsx";
import BridgeDemoPanel from "./BridgeDemoPanel.jsx";
import LiveBridgePanel from "./LiveBridgePanel.jsx";
import { getFocusedBridgeId } from "@/system/routing/hash-query";

export default function AggregationDashboard() {
  const focusedBridgeId = getFocusedBridgeId();

  return (
    <main className="admin-aggregation-dashboard">
      {focusedBridgeId ? (
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto 16px",
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid rgba(59, 130, 246, 0.34)",
            background: "rgba(59, 130, 246, 0.10)",
            color: "rgba(30, 41, 59, 0.98)",
            fontSize: 13,
            fontWeight: 600,
            lineHeight: 1.5,
            boxShadow: "0 8px 20px rgba(15, 23, 42, 0.06)",
          }}
        >
          Focused bridge: <strong>{focusedBridgeId}</strong>
        </div>
      ) : null}

      <AggregationCommandBar />
      <AggregationOverview />
      <EntityResolutionQueue />
      <LineageExplorer />
      <VerificationWorkbench />
      <ReconciliationWorkbench />
      <QualityCommandPanel />
      <MappingRegistry />

      <div
        style={
          focusedBridgeId
            ? {
                outline: "1px solid rgba(59, 130, 246, 0.24)",
                borderRadius: 20,
                padding: 6,
              }
            : undefined
        }
      >
        <BridgeDemoPanel />
        <LiveBridgePanel />
      </div>
    </main>
  );
}
