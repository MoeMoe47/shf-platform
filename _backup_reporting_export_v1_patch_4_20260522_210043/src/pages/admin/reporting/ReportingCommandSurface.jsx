import useAuth from "../../../auth/useAuth";
import React, { useEffect, useMemo, useState } from "react";
import { useSelectedEntity } from "@/system/context/SelectedEntityContext";
import "./reporting-command.css";
import BriefingExportPanel from "./BriefingExportPanel.jsx";
import ActionLogExportPanel from "./ActionLogExportPanel.jsx";
import AnalystMemoExportPanel from "./AnalystMemoExportPanel.jsx";
import AuditPackPanel from "./AuditPackPanel.jsx";
import { evaluateReportingExportReadiness } from "./reporting-readiness";
import { buildOracleReportingGate } from "./oracle-reporting-guard";
import { buildReportingCommandModel, reportingCommandStatusClass } from "./reporting-command-model";
import { SHS_SECURITY_PERMISSIONS } from "@/system/security/security-permissions";
import { getFocusedArtifactId } from "@/system/routing/hash-query";
import {
  deriveBridgeWorkflowReadiness,
  getBridgeWorkflowState,
} from "./bridge-workflow-store";
import {
  generateBriefingExport,
  generateActionLogExport,
  generateAnalystMemoExport,
  generateAuditPackExport,
} from "./reporting-actions";
import { fetchOracleTruth } from "./oracle-backend-adapter";
import { saveExport, fetchExports } from "./export-history-adapter";
import { buildAnalystContext } from "./analyst/analyst-context-builder";
import ComparePanel from "@/components/system/ComparePanel";
import { fetchOracleCompare } from "./oracle-compare-adapter";
import PriorityQueuePanel from "@/components/system/PriorityQueuePanel";
import { fetchOraclePriority } from "./oracle-priority-adapter";

function StatusBadge({ status }) {
  const normalized = String(status || "").toLowerCase();
  const cls =
    normalized === "ready" ||
    normalized === "generated" ||
    normalized === "opened" ||
    normalized === "downloaded" ||
    normalized === "resolved" ||
    normalized === "certified" ||
    normalized === "success" ||
    normalized === "verified"
      ? "reporting-command__badge reporting-command__badge--ready"
      : "reporting-command__badge reporting-command__badge--pending";

  return <span className={cls}>{String(status).toUpperCase()}</span>;
}

function scrollToSurface(surfaceId) {
  const el = document.getElementById(surfaceId);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function normalizeOracleReadinessStatus(status) {
  const value = String(status || "").toLowerCase();
  if (
    value === "internally_ready" ||
    value === "leadership_ready" ||
    value === "funder_ready" ||
    value === "public_ready"
  ) {
    return "ready";
  }
  return "pending";
}

function buildOracleGate(oracleTruth, publicationMode = "internal") {
  const gate = buildOracleReportingGate(oracleTruth, { publicationMode });
  const readiness = String(oracleTruth?.readinessStatus || "").toLowerCase();
  const confidenceScore = Number(oracleTruth?.confidenceScore || 0);

  const warning =
    gate.allowed &&
    (confidenceScore < 90 ||
      readiness === "leadership_ready" ||
      readiness === "internally_ready");

  return {
    allowExport: gate.allowed,
    warning,
    reasons: gate.reasons || [],
    label: gate.label,
  };
}

function applyOracleInfluence(readiness, oracleTruth, publicationMode = "internal") {
  if (!oracleTruth) return readiness;

  const gate = buildOracleGate(oracleTruth, publicationMode);
  const reasons = Array.from(
    new Set([...(readiness.reasons || []), ...(gate.reasons || [])])
  );

  const allowedActions = {
    ...(readiness.allowedActions || {}),
    preview: Boolean(readiness.allowedActions?.preview ?? true),
    generate: Boolean(readiness.allowedActions?.generate && gate.allowExport),
  };

  const ready = Boolean(readiness.ready && gate.allowExport);

  return {
    ...readiness,
    ready,
    status: ready ? "ready" : "pending",
    reasons,
    allowedActions,
    oracleGate: gate,
  };
}


function ReportingCommandModelStrip({ model }) {
  if (!model) return null;

  const rows = [
    ["Ready", model.readyCount],
    ["Review", model.reviewCount],
    ["Blocked", model.blockedCount],
    ["Total", model.totalCount],
  ];

  return (
    <section
      className={[
        "reporting-command-model",
        reportingCommandStatusClass(model.commandStatus),
      ].join(" ")}
      aria-label="Reporting readiness command model"
    >
      <div className="reporting-command-model__header">
        <div>
          <p className="reporting-command-model__eyebrow">Reporting Command Model</p>
          <h2>{model.commandLabel}</h2>
          <p>{model.commandMeaning}</p>
        </div>

        <div className="reporting-command-model__score">
          <span>Readiness</span>
          <strong>{model.readinessPercent}%</strong>
        </div>
      </div>

      <div className="reporting-command-model__grid">
        {rows.map(([label, value]) => (
          <article key={label} className="reporting-command-model__stat">
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}

        <article className="reporting-command-model__stat">
          <span>Oracle</span>
          <strong>{model.oracle.truthStatus}</strong>
        </article>

        <article className="reporting-command-model__stat">
          <span>Trace</span>
          <strong>{model.bridge.traceCoverageComplete ? "complete" : "missing"}</strong>
        </article>

        <article className="reporting-command-model__stat">
          <span>Trust Envelope</span>
          <strong>{model.oracle.trustEnvelopePresent ? "present" : "missing"}</strong>
        </article>

        <article className="reporting-command-model__stat">
          <span>Permission</span>
          <strong>{model.security.canExportReports ? "allowed" : "blocked"}</strong>
        </article>
      </div>

      <div className="reporting-command-model__next">
        <strong>Next recommended action</strong>
        <p>{model.recommendedNextAction}</p>
      </div>

      {model.allReasons.length ? (
        <div className="reporting-command-model__reasons">
          <strong>Active blockers / reasons</strong>
          <p>{model.allReasons.join(", ")}</p>
        </div>
      ) : null}
    </section>
  );
}


export default function ReportingCommandSurface() {
  const auth = useAuth();
  const { selectedEntityId } = useSelectedEntity();

  const focusedArtifactId = getFocusedArtifactId();
  const [refreshKey, setRefreshKey] = useState(0);
  const [flash, setFlash] = useState("");

  const [exportStatus, setExportStatus] = useState("idle");
  const [recentExports, setRecentExports] = useState([]);
  const [oracleTruth, setOracleTruth] = useState(null);
  const [oracleCompare, setOracleCompare] = useState(null);
  const [oracleCompareError, setOracleCompareError] = useState("");
  const [oracleCompareLoading, setOracleCompareLoading] = useState(false);
  const [oraclePriority, setOraclePriority] = useState(null);
  const [priorityData, setPriorityData] = useState(null);
  const [oraclePriorityError, setOraclePriorityError] = useState("");
  const [oraclePriorityLoading, setOraclePriorityLoading] = useState(false);
  const [oracleError, setOracleError] = useState("");

  const bridgeState = useMemo(() => getBridgeWorkflowState(), [refreshKey]);
  const bridgeReadiness = useMemo(
    () => deriveBridgeWorkflowReadiness(bridgeState),
    [bridgeState]
  );

  useEffect(() => {
    fetchExports().then(setRecentExports).catch(() => {});
  }, [refreshKey]);

  useEffect(() => {
    let isActive = true;
    const entityId = bridgeState.caseId || "test_case_001";

    setOracleError("");

    fetchOracleTruth(entityId)
      .then((data) => {
        if (!isActive) return;
        setOracleTruth(data);
      })
      .catch((err) => {
        if (!isActive) return;
        setOracleTruth(null);
        setOracleError(err instanceof Error ? err.message : "Oracle unavailable");
      });

    return () => {
      isActive = false;
    };
  }, [bridgeState.caseId, refreshKey]);

  useEffect(() => {
    let isActive = true;
    const entityIds = [bridgeState.caseId || "test_case_001", "test_case_002"];

    setOracleCompareLoading(true);
    setOracleCompareError("");

    fetchOracleCompare(entityIds)
      .then((data) => {
        if (!isActive) return;
        setOracleCompare(data);
        setOracleCompareLoading(false);
      })
      .catch((err) => {
        if (!isActive) return;
        setOracleCompare(null);
        setOracleCompareError(err instanceof Error ? err.message : "Oracle compare unavailable");
        setOracleCompareLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [bridgeState.caseId, refreshKey]);

  useEffect(() => {
    const ids = ["test_case_001", "test_case_002", "test_case_003"];

    fetchOraclePriority(ids).then((data) => {
      if (data) setPriorityData(data);
    });
  }, []);

  const canExportReports = auth.hasPermission(SHS_SECURITY_PERMISSIONS.REPORTS_EXPORT);

  const oracleGate = useMemo(() => buildOracleGate(oracleTruth), [oracleTruth]);

  const analystContext = useMemo(() => {
    return buildAnalystContext(oracleTruth);
  }, [oracleTruth]);

  const cards = useMemo(() => {
    const baseCards = [
      {
        exportKind: "briefing_export",
        title: "Briefing Export",
        format: "PDF",
        audience: "Executive / Leadership",
        summary:
          "Decision-ready export for leadership review with key metrics, trust state, and recommended next steps.",
        artifactId: "rep_hub_case_demo_001",
        surfaceId: "briefing-export-surface",
      },
      {
        exportKind: "action_log_export",
        title: "Action Log Export",
        format: "CSV",
        audience: "Operations / Audit",
        summary:
          "Structured export of actions, timestamps, statuses, and operational trace details for downstream review.",
        artifactId: "rep_action_log_demo_001",
        surfaceId: "action-log-export-surface",
      },
      {
        exportKind: "analyst_memo_export",
        title: "Analyst Memo Export",
        format: "PDF / JSON",
        audience: "Analyst / Internal",
        summary:
          "Narrative memo surface for institutional interpretation, bridge findings, and readiness-based recommendations.",
        artifactId: "rep_analyst_memo_demo_001",
        surfaceId: "analyst-memo-export-surface",
      },
      {
        exportKind: "audit_pack_export",
        title: "Audit Pack",
        format: "PDF",
        audience: "Audit / Institutional",
        summary:
          "Consolidated audit-pack surface for evidence review, verification coverage, bridge status, and trace-aware publication flows.",
        artifactId: "rep_audit_pack_demo_001",
        surfaceId: "audit-pack-export-surface",
      },
    ];

    return baseCards.map((card) => {
      const baseReadiness = evaluateReportingExportReadiness({
        exportKind: card.exportKind,
        bridgeReadiness,
        verificationState: bridgeState.verificationState,
        sourceToReportTraceCoverage: bridgeState.sourceToReportTraceCoverage,
        publicationMode: bridgeState.publicationMode || "admin_internal",
        trustEnvelopePresent: true,
      });

      const adjusted = applyOracleInfluence(baseReadiness, oracleTruth);

      return {
        ...card,
        readiness: adjusted,
      };
    });
  }, [bridgeReadiness, bridgeState, oracleTruth]);

  const readyCount = cards.filter((item) => (oracleTruth?.readinessStatus === "funder_ready" || item.readiness.ready)).length;
  const pendingCount = cards.length - readyCount;

  const reportingCommandModel = useMemo(() => {
    return buildReportingCommandModel({
      cards,
      bridgeState,
      bridgeReadiness,
      oracleTruth,
      oracleGate,
      canExportReports,
      recentExports,
    });
  }, [
    cards,
    bridgeState,
    bridgeReadiness,
    oracleTruth,
    oracleGate,
    canExportReports,
    recentExports,
  ]);

  const systemSummary = useMemo(() => {
    const ready = readyCount || 0;
    const pending = pendingCount || 0;
    const trust = bridgeState?.publicationMode || "admin_internal";

    const state =
      pending === 0
        ? "System Ready for Export Operations"
        : "Pending Exports Require Attention";

    const confidence = oracleTruth?.confidenceBand || "unknown";
    const contradiction =
      oracleTruth?.contradictionStatus === "none"
        ? "No Contradictions"
        : `Contradiction: ${oracleTruth?.contradictionStatus || "unknown"}`;

    return `${ready} Exports Ready | ${pending} Pending | ${confidence} Confidence | ${contradiction} | ${state}`;
  }, [readyCount, pendingCount, bridgeState]);

  function pushRecentExport(result, label) {
    setRecentExports((prev) => [
      {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        label,
        exportKind: result.exportKind || "unknown_export",
        artifactId: result.reportArtifactId || "unknown_artifact",
        status: result.status || "generated",
        requestedBy: result.requestedBy || "user_admin_001",
        createdAt: result.createdAt || new Date().toISOString(),
      },
      ...prev,
    ].slice(0, 8));
  }

  function handleRefresh() {
    setRefreshKey((value) => value + 1);
    setExportStatus("idle");
    setFlash("Reporting surface refreshed from shared workflow state and Oracle truth.");
  }

  async function handleCardGenerate(card) {
    if (!card.readiness.allowedActions.generate || !oracleGate.allowExport || !canExportReports) return;

    const payload = {
      publicationMode: bridgeState.publicationMode || "admin_internal",
      relatedEntityIds: [
        bridgeState.caseId || "hub_case_demo_001",
        card.artifactId,
      ],
      requestedBy: "user_admin_001",
      reportArtifactId: card.artifactId,
    };

    try {
      setExportStatus("running");
      setFlash(`Starting ${card.title}...`);

      let result;

      switch (card.exportKind) {
        case "briefing_export":
          result = await generateBriefingExport(payload);
          break;
        case "action_log_export":
          result = await generateActionLogExport(payload);
          break;
        case "analyst_memo_export":
          result = await generateAnalystMemoExport(payload);
          break;
        case "audit_pack_export":
          result = await generateAuditPackExport(payload);
          break;
        default:
          return;
      }

      setExportStatus("success");
      setFlash(result.message || `${card.title} export completed.`);
      pushRecentExport(result, card.title);
      saveExport({
        exportKind: card.exportKind,
        artifactId: card.artifactId,
        status: result.status || "generated",
        requestedBy: "user_admin_001",
      }).catch(() => {});
    } catch (error) {
      setExportStatus("failed");
      setFlash(
        `${card.title} failed: ${
          error instanceof Error ? error.message : "Unknown export error"
        }`
      );
    }
  }

  async function handleGenerateMasterBrief() {
    const briefingCard = cards.find((card) => card.exportKind === "briefing_export");
    if (
      !briefingCard ||
      !briefingCard.readiness.allowedActions.generate ||
      !oracleGate.allowExport ||
      !canExportReports
    ) {
      return;
    }

    try {
      setExportStatus("running");
      setFlash("Starting Master Brief...");

      const result = await generateBriefingExport({
        publicationMode: bridgeState.publicationMode || "admin_internal",
        relatedEntityIds: [
          bridgeState.caseId || "hub_case_demo_001",
          briefingCard.artifactId,
        ],
        requestedBy: "user_admin_001",
        reportArtifactId: briefingCard.artifactId,
      });

      setExportStatus("success");
      setFlash(result.message || "Master Brief opened.");
      pushRecentExport(result, "Master Brief");
      saveExport({
        exportKind: "briefing_export",
        artifactId: "rep_hub_case_demo_001",
        status: result.status || "generated",
        requestedBy: "user_admin_001",
      }).catch(() => {});
    } catch (error) {
      setExportStatus("failed");
      setFlash(
        `Master Brief failed: ${
          error instanceof Error ? error.message : "Unknown export error"
        }`
      );
    }
  }

  const flashStyles =
    exportStatus === "failed"
      ? {
          border: "1px solid rgba(239, 68, 68, 0.45)",
          background:
            "linear-gradient(180deg, rgba(38, 10, 14, 0.96), rgba(28, 8, 12, 0.98))",
          color: "rgba(252, 165, 165, 0.98)",
        }
      : exportStatus === "running"
      ? {
          border: "1px solid rgba(59, 130, 246, 0.45)",
          background:
            "linear-gradient(180deg, rgba(9, 18, 36, 0.96), rgba(8, 15, 30, 0.98))",
          color: "rgba(191, 219, 254, 0.98)",
        }
      : {
          border: "1px solid rgba(34, 197, 94, 0.52)",
          background:
            "linear-gradient(180deg, rgba(9, 18, 36, 0.96), rgba(8, 15, 30, 0.98))",
          color: "rgba(134, 239, 172, 0.98)",
        };

  const trustEnvelope = oracleTruth?.trustEnvelope || null;

  return (
    <main className="reporting-command">
      {focusedArtifactId ? (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid rgba(56, 189, 248, 0.40)",
            background:
              "linear-gradient(180deg, rgba(9, 18, 36, 0.96), rgba(8, 15, 30, 0.98))",
            color: "rgba(125, 211, 252, 0.98)",
            fontSize: 14,
            fontWeight: 700,
            lineHeight: 1.5,
            boxShadow:
              "0 14px 34px rgba(2, 6, 23, 0.28), inset 0 0 0 1px rgba(56, 189, 248, 0.06)",
          }}
        >
          Focused artifact: <strong>{focusedArtifactId}</strong>
        </div>
      ) : null}

      {flash ? (
        <div
          style={{
            marginTop: 12,
            padding: "12px 14px",
            borderRadius: 14,
            fontSize: 13,
            lineHeight: 1.5,
            ...flashStyles,
          }}
        >
          {flash}
        </div>
      ) : null}

            <ReportingCommandModelStrip model={reportingCommandModel} />

<section className="reporting-command__hero">
        <div>
          <p className="reporting-command__eyebrow">Institutional Reporting Layer</p>
          <h1 className="reporting-command__title">Reporting Command Surface</h1>
          <p className="reporting-command__subtitle">
            Central export surface for leadership briefings, action logs, analyst memos,
            and trust-aware publication flows.
          </p>
        </div>

        <div className="reporting-command__hero-actions">
          <button type="button" onClick={handleRefresh}>
            Refresh Export State
          </button>
          <button
            type="button"
            onClick={handleGenerateMasterBrief}
            disabled={!oracleGate.allowExport || !canExportReports}
            style={
              (!oracleGate.allowExport || !canExportReports)
                ? { opacity: 0.45, cursor: "not-allowed" }
                : undefined
            }
          >
            Generate Master Brief
          </button>
        </div>
      </section>

      <section
        className="reporting-command__grid"
        style={{ gap: 20, gridTemplateColumns: "1.2fr 0.8fr", marginBottom: 18 }}
      >
        <article
          className="reporting-command__card"
          style={{
            border: "1px solid rgba(59,130,246,0.35)",
            background: "rgba(10,15,35,0.85)",
            color: "#dbeafe",
          }}
        >
          <div className="reporting-command__card-top">
            <div>
              <p className="reporting-command__card-kicker">Certified Truth</p>
              <h2 className="reporting-command__card-title">Oracle Truth Package</h2>
            </div>
            <StatusBadge status={oracleTruth?.truthStatus || "pending"} />
          </div>

          {oracleError ? (
            <div style={{ color: "#fca5a5" }}>{oracleError}</div>
          ) : oracleTruth ? (
            <div style={{ display: "grid", gap: 10, fontSize: 13, lineHeight: 1.5 }}>
              <div>Entity: <strong>{oracleTruth.entityId}</strong></div>
              <div>Truth Status: <strong>{oracleTruth.truthStatus}</strong></div>
              <div>
                Confidence: <strong>{oracleTruth.confidenceScore}</strong>{" "}
                <strong>({oracleTruth.confidenceBand})</strong>
              </div>
              <div>Verification: <strong>{oracleTruth.verificationStatus}</strong></div>
              <div>Contradictions: <strong>{oracleTruth.contradictionStatus}</strong></div>
              <div>Readiness: <strong>{oracleTruth.readinessStatus}</strong></div>
              <div>Trace ID: <strong>{oracleTruth.traceId}</strong></div>
              <div>Sources: <strong>{(oracleTruth.sourceSummary || []).join(", ")}</strong></div>
              <div>
                Recommended Next Action:{" "}
                <strong>{oracleTruth.recommendedNextAction || "—"}</strong>
              </div>
            </div>
          ) : (
            <div>Loading Oracle...</div>
          )}

          {!canExportReports ? (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(248, 113, 113, 0.24)",
                background: "rgba(127, 29, 29, 0.16)",
                color: "rgba(254, 202, 202, 0.96)",
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              Missing permission: reports.export
            </div>
          ) : null}

          {oracleGate.reasons.length ? (
            <div
              style={{
                marginTop: 12,
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(245, 158, 11, 0.22)",
                background: "rgba(120, 53, 15, 0.16)",
                color: "rgba(253, 230, 138, 0.96)",
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              Oracle gating active: {oracleGate.reasons.join(", ")}
            </div>
          ) : oracleGate.warning ? (
            <div
              style={{
                marginTop: 12,
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(245, 158, 11, 0.22)",
                background: "rgba(120, 53, 15, 0.16)",
                color: "rgba(253, 230, 138, 0.96)",
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              Oracle warning: confidence is below preferred top-tier threshold.
            </div>
          ) : null}

          <div
            style={{
              marginTop: 16,
              padding: 14,
              borderRadius: 14,
              border: "1px solid rgba(59,130,246,0.2)",
              background: "rgba(2,6,23,0.85)",
              color: "#e2e8f0"
            }}
          >
            <p style={{ fontSize: 12, opacity: 0.7 }}>AI Analyst Summary</p>

            <h3 style={{ marginTop: 4 }}>
              {analystContext.summary}
            </h3>

            <p style={{ marginTop: 8 }}>
              <strong>Risk Level:</strong> {analystContext.riskLevel}
            </p>

            <p style={{ marginTop: 4 }}>
              <strong>Recommendation:</strong> {analystContext.recommendation}
            </p>
          </div>
        </article>

        <article
          className="reporting-command__card"
          style={{
            border: "1px solid rgba(34,197,94,0.28)",
            background: "rgba(10,15,35,0.85)",
            color: "#dcfce7",
          }}
        >
          <div className="reporting-command__card-top">
            <div>
              <p className="reporting-command__card-kicker">Trust Envelope</p>
              <h2 className="reporting-command__card-title">Publication Trust Summary</h2>
            </div>
            <StatusBadge status={normalizeOracleReadinessStatus(oracleTruth?.readinessStatus)} />
          </div>

          {trustEnvelope ? (
            <div style={{ display: "grid", gap: 10, fontSize: 13, lineHeight: 1.5 }}>
              <div>Truth Status: <strong>{trustEnvelope.truthStatus}</strong></div>
              <div>Confidence: <strong>{trustEnvelope.confidenceScore}</strong> <strong>({trustEnvelope.confidenceBand})</strong></div>
              <div>Verification: <strong>{trustEnvelope.verificationStatus}</strong></div>
              <div>Contradiction: <strong>{trustEnvelope.contradictionStatus}</strong></div>
              <div>Readiness: <strong>{trustEnvelope.readinessStatus}</strong></div>
              <div>Publication Mode: <strong>{trustEnvelope.publicationMode}</strong></div>
              <div>Trace ID: <strong>{trustEnvelope.traceId}</strong></div>
              <div>Last Refresh: <strong>{trustEnvelope.lastUpdatedAt}</strong></div>
              <div>Unresolved Items: <strong>{trustEnvelope.unresolvedItemsCount}</strong></div>
              <div>
                Warnings:{" "}
                <strong>
                  {(trustEnvelope.warnings || []).length
                    ? trustEnvelope.warnings.join(", ")
                    : "none"}
                </strong>
              </div>
            </div>
          ) : (
            <div>Trust envelope unavailable.</div>
          )}
        </article>
      </section>

      
<PriorityQueuePanel priorityData={priorityData} />

      <ComparePanel
        data={oracleCompare}
        loading={oracleCompareLoading}
        error={oracleCompareError}
      />

      <section className="reporting-command__stats">
        <article className="reporting-command__stat">
          <span className="reporting-command__stat-label">Export Families</span>
          <strong className="reporting-command__stat-value">{cards.length}</strong>
        </article>
        <article className="reporting-command__stat">
          <span className="reporting-command__stat-label">Ready Exports</span>
          <strong className="reporting-command__stat-value">{readyCount}</strong>
        </article>
        <article className="reporting-command__stat">
          <span className="reporting-command__stat-label">Pending Exports</span>
          <strong className="reporting-command__stat-value">{pendingCount}</strong>
        </article>
        <article className="reporting-command__stat">
          <span className="reporting-command__stat-label">Oracle Readiness</span>
          <strong className="reporting-command__stat-value">
            {oracleTruth?.readinessStatus || "loading"}
          </strong>
        </article>
      </section>

      <section className="reporting-command__card" style={{ gap: 16 }}>
        <div className="reporting-command__card-top">
          <div>
            <p className="reporting-command__card-kicker">Operator Visibility</p>
            <h2 className="reporting-command__card-title">Recent Export Activity</h2>
          </div>
          <StatusBadge status={recentExports.length ? "ready" : "pending"} />
        </div>

        {recentExports.length ? (
          <div className="reporting-command__table-wrap">
            <table className="reporting-command__table">
              <thead>
                <tr>
                  <th>Label</th>
                  <th>Artifact</th>
                  <th>Status</th>
                  <th>Requested By</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {recentExports.map((item) => (
                  <tr key={item.id}>
                    <td>{item.label}</td>
                    <td>{item.artifactId}</td>
                    <td>
                      <StatusBadge
                        status={
                          item.status === "failed" ? "pending" : item.status || "ready"
                        }
                      />
                    </td>
                    <td>{item.requestedBy}</td>
                    <td>{item.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="reporting-command__summary">
            No exports recorded in this session yet.
          </p>
        )}
      </section>

      <section className="reporting-command__grid" style={{ gap: 20 }}>
        {cards.map((card) => {
          const isFocused = focusedArtifactId && card.artifactId === focusedArtifactId;
          const exportDisabled =
            !card.readiness.allowedActions.generate || !oracleGate.allowExport;

          return (
            <article
              key={card.title}
              className="reporting-command__card"
              style={
                isFocused
                  ? {
                      outline: "1px solid rgba(59, 130, 246, 0.24)",
                      boxShadow:
                        "0 20px 44px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(59, 130, 246, 0.18)",
                    }
                  : undefined
              }
            >
              <div className="reporting-command__card-top">
                <div>
                  <p className="reporting-command__card-kicker">{card.format}</p>
                  <h2 className="reporting-command__card-title">{card.title}</h2>
                </div>
                <StatusBadge status={card.readiness.status} />
              </div>

              <div className="reporting-command__meta">
                <div>
                  <span>Audience</span>
                  <strong>{card.audience}</strong>
                </div>
              </div>

              <p className="reporting-command__summary">{card.summary}</p>

              {isFocused ? (
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(59, 130, 246, 0.22)",
                    background: "rgba(30, 64, 175, 0.12)",
                    color: "rgba(191, 219, 254, 0.98)",
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  This card matches the focused artifact.
                </div>
              ) : null}

              {card.readiness.reasons.length ? (
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(245, 158, 11, 0.22)",
                    background: "rgba(120, 53, 15, 0.16)",
                    color: "rgba(253, 230, 138, 0.96)",
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  Blocked by: {card.readiness.reasons.join(", ")}
                  {card.readiness.missingFields.length
                    ? ` | Missing: ${card.readiness.missingFields.join(", ")}`
                    : ""}
                </div>
              ) : null}

              <div className="reporting-command__actions">
                <button type="button" onClick={() => scrollToSurface(card.surfaceId)}>
                  Open Surface
                </button>
                <button
                  type="button"
                  onClick={() => handleCardGenerate(card)}
                  disabled={exportDisabled}
                  style={
                    exportDisabled
                      ? { opacity: 0.45, cursor: "not-allowed" }
                      : undefined
                  }
                >
                  Generate Export
                </button>
              </div>
            </article>
          );
        })}
      </section>

      <div id="briefing-export-surface">
        <BriefingExportPanel />
      </div>

      <div id="action-log-export-surface">
        <ActionLogExportPanel />
      </div>

      <div id="analyst-memo-export-surface">
        <AnalystMemoExportPanel />
      </div>

      <div id="audit-pack-export-surface">
        <AuditPackPanel />
      </div>
    </main>
  );
}
