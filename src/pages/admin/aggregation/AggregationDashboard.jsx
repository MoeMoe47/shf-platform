import React, { useEffect, useMemo, useState } from "react";
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
import {
  getAggregationOverviewStats,
  getEntityResolutionItems,
  getVerificationItems,
  getReconciliationItems,
  getLineageItems,
} from "./adapters";
import {
  aggregationOrganizations,
  aggregationReferrals,
  aggregationOutcomes,
  aggregationReports,
  aggregationSignals,
  aggregationVerificationRecords,
} from "./mockData";
import {
  buildAggregationReadinessSnapshot,
  readinessStepClass,
} from "./aggregation-readiness-model";


function buildLineageDrawerRecord(lineageId) {
  const cleanId = String(lineageId || "").trim();

  if (!cleanId) {
    return {
      lineageId: "missing",
      status: "missing",
      sourceCount: 0,
      freshness: "unknown",
      operatorMeaning: "No lineage trace is attached to this row yet.",
      nextAction: "Review the upstream source mapping before Oracle or reporting use.",
    };
  }

  const lower = cleanId.toLowerCase();
  const isDemo = lower.includes("demo") || lower.includes("test");
  const isVerified = lower.includes("verified") || lower.includes("certified");
  const isBridge = lower.includes("bridge");
  const isReport = lower.includes("report") || lower.includes("artifact");

  let status = "available";
  let sourceCount = 1;
  let freshness = "current";
  let operatorMeaning = "This row has a traceable lineage ID attached.";
  let nextAction = "Open the source record and confirm the trace path before downstream use.";

  if (isVerified || isReport) {
    status = "strong";
    sourceCount = 3;
    operatorMeaning = "This trace appears connected to a verification or reporting object.";
    nextAction = "Confirm trace coverage, then continue toward Oracle or reporting review.";
  }

  if (isBridge) {
    status = "bridge-linked";
    sourceCount = 2;
    operatorMeaning = "This trace appears connected to a source-to-report bridge.";
    nextAction = "Review bridge coverage and confirm the record connects to the expected report artifact.";
  }

  if (isDemo) {
    freshness = "demo";
    operatorMeaning = "This is a demo/test trace. It is useful for UI validation, not production proof.";
    nextAction = "Replace demo lineage with real source evidence before external reporting.";
  }

  return {
    lineageId: cleanId,
    status,
    sourceCount,
    freshness,
    operatorMeaning,
    nextAction,
  };
}

function AggregationLineageTraceDrawer({ drawerState, onClose }) {
  if (!drawerState?.open) return null;

  const record = buildLineageDrawerRecord(drawerState.lineageId);

  const rows = [
    ["Lineage ID", record.lineageId],
    ["Trace Status", record.status],
    ["Source Count", record.sourceCount],
    ["Freshness", record.freshness],
    ["Requested From", drawerState.source || "aggregation_ui"],
    ["Requested At", drawerState.timestamp || "—"],
  ];

  return (
    <div
      className="admin-aggregation-lineage-drawer__backdrop"
      role="presentation"
      onClick={onClose}
    >
      <aside
        className="admin-aggregation-lineage-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Lineage Trace Drawer"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="admin-aggregation-lineage-drawer__header">
          <div>
            <p className="admin-aggregation-lineage-drawer__eyebrow">Lineage Trace Drawer</p>
            <h2>Source-to-Truth Trace</h2>
            <p>
              This drawer explains what the selected lineage trace means before the row moves toward Oracle or reporting use.
            </p>
          </div>

          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="admin-aggregation-lineage-drawer__callout">
          <strong>Next recommended action</strong>
          <p>{record.nextAction}</p>
        </div>

        <div className="admin-aggregation-lineage-drawer__rows">
          {rows.map(([label, value]) => (
            <div key={label} className="admin-aggregation-lineage-drawer__row">
              <span>{label}</span>
              <strong>{String(value)}</strong>
            </div>
          ))}
        </div>

        <div className="admin-aggregation-lineage-drawer__meaning">
          <strong>Operator meaning</strong>
          <p>{record.operatorMeaning}</p>
        </div>
      </aside>
    </div>
  );
}


function buildMappingRowsForReadiness() {
  return [
    {
      source: "OrganizationEntity",
      count: aggregationOrganizations.length,
      status: "active",
    },
    {
      source: "ReferralEntity",
      count: aggregationReferrals.length,
      status: "active",
    },
    {
      source: "OutcomeEntity",
      count: aggregationOutcomes.length,
      status: "active",
    },
    {
      source: "VerificationRecordEntity",
      count: aggregationVerificationRecords.length,
      status: "active",
    },
    {
      source: "GeographySignalEntity",
      count: aggregationSignals.length,
      status: "active",
    },
    {
      source: "ReportArtifactEntity",
      count: aggregationReports.length,
      status: "active",
    },
  ];
}

function AggregationReadinessStrip() {
  const snapshot = useMemo(() => {
    return buildAggregationReadinessSnapshot({
      overviewStats: getAggregationOverviewStats(),
      entityItems: getEntityResolutionItems(),
      verificationItems: getVerificationItems(),
      reconciliationItems: getReconciliationItems(),
      lineageItems: getLineageItems(),
      mappingRows: buildMappingRowsForReadiness(),
      oracleTruth: null,
    });
  }, []);

  return (
    <section className="admin-aggregation-readiness" aria-label="Aggregation operator readiness">
      <div className="admin-aggregation-readiness__header">
        <div>
          <p className="admin-aggregation-readiness__eyebrow">Operator Readiness Chain</p>
          <h2 className="admin-aggregation-readiness__title">
            Source-to-Oracle Readiness
          </h2>
          <p className="admin-aggregation-readiness__subtitle">
            One shared view of whether the aggregation pipeline is ready for verification, Oracle truth, and reporting.
          </p>
        </div>

        <div className="admin-aggregation-readiness__score">
          <span>{snapshot.headlineStatus.replace(/_/g, " ")}</span>
          <strong>{snapshot.readinessPercent}%</strong>
        </div>
      </div>

      <div className="admin-aggregation-readiness__steps">
        {snapshot.steps.map((step, index) => (
          <article
            key={step.key}
            className={[
              "admin-aggregation-readiness__step",
              readinessStepClass(step.status),
            ].join(" ")}
          >
            <div className="admin-aggregation-readiness__step-top">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{step.label}</strong>
            </div>
            <p>{step.detail}</p>
          </article>
        ))}
      </div>

      <div className="admin-aggregation-readiness__summary">
        {snapshot.summary}
      </div>
    </section>
  );
}

export default function AggregationDashboard() {
  const focusedBridgeId = getFocusedBridgeId();
  const [lineageDrawer, setLineageDrawer] = useState({ open: false });

  useEffect(() => {
    function handleLineageTraceRequest(event) {
      const detail = event?.detail || {};

      setLineageDrawer({
        open: true,
        lineageId: detail.lineageId || "",
        source: detail.source || "aggregation_ui",
        timestamp: detail.timestamp || new Date().toISOString(),
      });
    }

    window.addEventListener("shs:lineage-trace-request", handleLineageTraceRequest);

    return () => {
      window.removeEventListener("shs:lineage-trace-request", handleLineageTraceRequest);
    };
  }, []);

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
      <AggregationReadinessStrip />
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

      <AggregationLineageTraceDrawer
        drawerState={lineageDrawer}
        onClose={() => setLineageDrawer({ open: false })}
      />
    </main>
  );
}
