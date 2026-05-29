import React, { useMemo } from "react";
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
    </main>
  );
}
