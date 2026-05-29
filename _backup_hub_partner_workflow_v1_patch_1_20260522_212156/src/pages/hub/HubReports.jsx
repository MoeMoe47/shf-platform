import React from "react";
import {
  getTruthSpineRecords,
  getTruthSpineEvents,
  appendTruthSpineEvent,
  EVENT_TYPES,
  createReportingExport,
  getTruthSpineSnapshot,
} from "@/shared/truth-spine";
import "./hub-reports.css";
import HubBusinessTourProvider from "./shared/HubBusinessTourProvider.jsx";
import InstitutionalFooter from "@/components/shared/InstitutionalFooter.jsx";

const LOGO_SRC = "/assets/hub/shs-hub-logo.png";
const SHS_HOME_URL = "/";

const HUB_REPORT_EXPORT_KEY = "shs_hub_report_exports_v1";

function readJson(key, fallback = []) {
  if (typeof window === "undefined") return fallback;
  try {
    return JSON.parse(window.localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (typeof window === "undefined") return value;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // local storage may be blocked
  }
  return value;
}

function appendHubReportExport(record) {
  const next = [record, ...readJson(HUB_REPORT_EXPORT_KEY, [])].slice(0, 100);
  writeJson(HUB_REPORT_EXPORT_KEY, next);
  return next;
}


function openShsHome() {
  if (typeof window === "undefined") return;
  window.location.href = SHS_HOME_URL;
}

function go(path) {
  if (!path || typeof window === "undefined") return;
  window.location.hash = String(path).startsWith("/") ? path : `/${path}`;
}

function pct(numerator, denominator) {
  if (!denominator) return 0;
  return Math.round((Number(numerator || 0) / Number(denominator || 1)) * 100);
}

function getTruthSpineReportSummary(records = [], events = []) {
  const totalRecords = records.length;

  const reportReadyRecords = records.filter((record) => {
    const readiness = record?.oracle?.readinessStatus;
    return (
      record?.trustEnvelope?.reportingReady === true ||
      readiness === "report_ready" ||
      readiness === "leadership_ready" ||
      readiness === "funder_ready" ||
      readiness === "public_ready"
    );
  });

  const auditReadyRecords = records.filter((record) => {
    return Boolean(record?.trustEnvelope?.traceId) || record?.trustEnvelope?.auditReady === true;
  });

  const verifiedRecords = records.filter((record) => {
    const verification = record?.verification?.verificationStatus;
    const truth = record?.oracle?.truthStatus;
    return (
      verification === "verified" ||
      truth === "verified_true" ||
      truth === "certified"
    );
  });

  const pendingRecords = records.filter((record) => {
    const readiness = record?.oracle?.readinessStatus;
    const verification = record?.verification?.verificationStatus;
    return (
      readiness === "not_ready" ||
      readiness === "review_required" ||
      readiness === "blocked" ||
      verification === "pending" ||
      verification === "unreviewed" ||
      verification === "insufficient_evidence"
    );
  });

  const createdReferralEvents = events.filter((event) => event?.eventType === "hub.referral.created");
  const reportExportEvents = events.filter((event) => event?.eventType === "report.export.generated");

  const readinessPercent = pct(reportReadyRecords.length, totalRecords);
  const auditCoveragePercent = pct(auditReadyRecords.length, totalRecords);

  return {
    totalRecords,
    reportReadyCount: reportReadyRecords.length,
    pendingCount: pendingRecords.length,
    verifiedCount: verifiedRecords.length,
    auditReadyCount: auditReadyRecords.length,
    readinessPercent,
    auditCoveragePercent,
    createdReferralCount: createdReferralEvents.length,
    reportExportCount: reportExportEvents.length,
  };
}

function Sparkline({ tone = "blue" }) {
  return (
    <svg className={`hbr-spark hbr-spark--${tone}`} viewBox="0 0 100 36" aria-hidden="true">
      <polyline points="3,30 14,27 24,29 35,20 45,23 56,16 67,18 78,11 88,14 97,6" />
    </svg>
  );
}

function KpiCard({ icon, label, value, chip, note, tone = "blue" }) {
  return (
    <article className="hbr-kpi">
      <div className={`hbr-kpiIcon hbr-tone--${tone}`}>{icon}</div>
      <div>
        <h3>{label}</h3>
        <strong>{value}</strong>
        <span className={`hbr-chip hbr-chip--${tone}`}>{chip}</span>
        <p>{note}</p>
      </div>
      <Sparkline tone={tone} />
    </article>
  );
}

function ReportCard({ icon, title, format, audience, readiness, updated, tone = "blue", onGenerate }) {
  return (
    <article className="hbr-reportCard">
      <div className={`hbr-reportIcon hbr-tone--${tone}`}>{icon}</div>
      <div className="hbr-reportTop">
        <div>
          <h3>{title}</h3>
          <p>{audience}</p>
        </div>
        <span className={`hbr-chip hbr-chip--${tone}`}>{readiness}</span>
      </div>

      <dl>
        <dt>Format</dt>
        <dd>{format}</dd>
        <dt>Audience</dt>
        <dd>{audience}</dd>
        <dt>Last Updated</dt>
        <dd>{updated}</dd>
      </dl>

      <div className="hbr-reportActions">
        <button type="button">View</button>
        <button className="is-primary" type="button" onClick={() => onGenerate?.({ title, format, audience, readiness })}>Generate →</button>
      </div>
    </article>
  );
}

function GuidanceRow({ icon, title, text, tone = "blue" }) {
  return (
    <div className="hbr-guideRow">
      <div className={`hbr-guideIcon hbr-tone--${tone}`}>{icon}</div>
      <div>
        <strong>{title}</strong>
        <span>{text}</span>
      </div>
    </div>
  );
}

export default function HubReports() {
  const [truthSpineVersion, setTruthSpineVersion] = React.useState(0);
  const [truthEngineSnapshot, setTruthEngineSnapshot] = React.useState(null);
  const [truthEngineStatus, setTruthEngineStatus] = React.useState("loading");

  function refreshTruthEngineSnapshot() {
    setTruthSpineVersion((value) => value + 1);
  }

  // Hub Reports reads the Truth Spine Engine snapshot on mount and after local report actions.
  // We intentionally avoid listening to global Truth Spine events here because snapshot reads
  // can trigger record/event activity and cause a React maximum-update loop.
  React.useEffect(() => {
    let cancelled = false;

    async function loadTruthEngineSnapshot() {
      try {
        const snapshot = await getTruthSpineSnapshot();

        if (!cancelled) {
          setTruthEngineSnapshot(snapshot);
          setTruthEngineStatus("connected");
        }
      } catch (error) {
        console.warn("[Truth Spine Engine] Hub Reports snapshot failed", error);

        if (!cancelled) {
          setTruthEngineSnapshot(null);
          setTruthEngineStatus("fallback");
        }
      }
    }

    loadTruthEngineSnapshot();

    return () => {
      cancelled = true;
    };
  }, [truthSpineVersion]);

  const fallbackTruthSummary = React.useMemo(() => {
    truthSpineVersion;
    try {
      return getTruthSpineReportSummary(getTruthSpineRecords(), getTruthSpineEvents());
    } catch (error) {
      console.warn("[Truth Spine] Hub Reports fallback summary failed", error);
      return getTruthSpineReportSummary([], []);
    }
  }, [truthSpineVersion]);

  const truthSummary = truthEngineSnapshot?.summary || fallbackTruthSummary;

  const [exportNotice, setExportNotice] = React.useState("");
  const [localExports, setLocalExports] = React.useState(() => readJson(HUB_REPORT_EXPORT_KEY, []));

  async function handleGenerateReport(report) {
    const records = getTruthSpineRecords();
    const events = getTruthSpineEvents();
    const summary = truthEngineSnapshot?.summary || getTruthSpineReportSummary(records, events);

    const exportRecord = {
      id: `hub_report_export_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      exportKind: report?.title || "Hub Report",
      artifactId: `artifact_${String(report?.title || "hub_report").toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
      status: "generated",
      requestedBy: "demo-user-1",
      audience: report?.audience || "Hub Leadership",
      format: report?.format || "PDF",
      sourceSurface: "hub_reports",
      createdAt: new Date().toISOString(),
      truthSummary: summary,
      recordIds: records.map((record) => record.entityId),
      traceIds: records.map((record) => record.trustEnvelope?.traceId).filter(Boolean),
    };

    appendTruthSpineEvent({
      eventType: EVENT_TYPES.REPORT_EXPORT_GENERATED,
      entityId: exportRecord.artifactId,
      entityType: "report",
      sourceSurface: "hub_reports",
      traceId: exportRecord.traceIds[0] || exportRecord.id,
      actorId: "demo-user-1",
      actorRole: "hub_operator",
      organizationId: "shf-core",
      payload: exportRecord,
    });

    const nextExports = appendHubReportExport(exportRecord);
    setLocalExports(nextExports);
    setTruthSpineVersion((value) => value + 1);
    setExportNotice(`${exportRecord.exportKind} generated and attached to Truth Spine.`);

    try {
      await createReportingExport({
        exportKind: exportRecord.exportKind,
        artifactId: exportRecord.artifactId,
        status: exportRecord.status,
        requestedBy: exportRecord.requestedBy,
      });
    } catch (error) {
      console.warn("[Truth Spine] Backend reporting export failed; local export saved", error);
    }

    window.clearTimeout(window.__hbrExportNotice);
    window.__hbrExportNotice = window.setTimeout(() => setExportNotice(""), 2800);
  }

  return (
    <HubBusinessTourProvider pageKey="reports">
      <main className="hbr-shell" data-tour="hub-reports-shell">
      <aside className="hbr-rail" data-tour="hub-reports-rail">
        <button className="hbr-logo" type="button" onClick={openShsHome}>
          <img src={LOGO_SRC} alt="Silicon Heartland Hub" />
        </button>

        <nav className="hbr-nav" data-tour="hub-reports-nav">
          <button type="button" onClick={openShsHome}><span>⌂</span><small>Overview</small></button>
          <button type="button" onClick={() => go("/hub/network")}><span>👥</span><small>Partners</small></button>
          <button type="button" onClick={() => go("/hub/lifecycle")}><span>↗</span><small>Referral Tracker</small></button>
          <button type="button" onClick={() => go("/hub/intake")}><span>▤</span><small>Intake</small></button>
          <button type="button" onClick={() => go("/hub/queue")}><span>☑</span><small>Action Queue</small><b>12</b></button>
          <button type="button" onClick={() => go("/hub/imports")}><span>▰</span><small>Files & Imports</small></button>
          <button className="is-active" type="button"><span>▥</span><small>Reports</small></button>
        </nav>

        <section className="hbr-readiness" data-tour="hub-reports-readiness">
          <strong>REPORTING READINESS</strong>
          <div>87%</div>
          <span>On track</span>
          <small>FY24 Q2<br />Report<br />Due in 18 days</small>
        </section>
      </aside>

      <section className="hbr-page">
        <header className="hbr-header" data-tour="hub-reports-header">
          <div>
            <p>SHS HUB COLLABORATION LAYER</p>
            <h1>Hub Reports</h1>
            <span>
              Turn Hub activity, imports, referrals, partner capacity, unmet needs,
              and verified outcomes into leadership-ready reports.
            </span>
          </div>

          <div className="hbr-actions" data-tour="hub-reports-actions">
            <button type="button" onClick={openShsHome}>← Back to Hub</button>
            <button type="button" onClick={() => go("/hub/reports")}>Open Full Reporting Surface</button>
            <button className="is-primary" type="button" onClick={() => handleGenerateReport({ title: "Monthly Hub Summary", format: "PDF", audience: "Leadership / Board", readiness: "Ready" })}>Generate Report →</button>
          </div>
        </header>

        {exportNotice && (
          <div className="hbr-panel" style={{ marginBottom: 12 }}>
            <strong>✓ Report Export Generated</strong>
            <p>{exportNotice}</p>
          </div>
        )}

        <section className="hbr-kpiStrip" data-tour="hub-reports-kpis">
          <KpiCard
            icon="◷"
            label="Report Readiness"
            value={`${truthSummary.readinessPercent}%`}
            chip={truthSummary.readinessPercent >= 80 ? "On Track" : truthSummary.readinessPercent >= 50 ? "Review" : "Build Up"}
            note={`${truthSummary.reportReadyCount} of ${truthSummary.totalRecords} Truth Spine records report-ready`}
            tone={truthSummary.readinessPercent >= 80 ? "blue" : "gold"}
          />
          <KpiCard
            icon="✓"
            label="Reports Ready"
            value={String(truthSummary.reportReadyCount)}
            chip="Ready"
            note="Truth Spine records ready for leadership output"
            tone="green"
          />
          <KpiCard
            icon="Ⅱ"
            label="Pending Reports"
            value={String(truthSummary.pendingCount)}
            chip="Pending"
            note="Awaiting verification, evidence, or review"
            tone="gold"
          />
          <KpiCard
            icon="◆"
            label="Verified Outcomes"
            value={String(truthSummary.verifiedCount)}
            chip="Verified"
            note="Verified or certified truth records"
            tone="green"
          />
          <KpiCard
            icon="♡"
            label="Hub Referrals Created"
            value={String(truthSummary.createdReferralCount)}
            chip="Captured"
            note="Referral-created events in the Truth Spine"
            tone="cyan"
          />
          <KpiCard
            icon="🛡"
            label="Audit Trace Coverage"
            value={`${truthSummary.auditCoveragePercent}%`}
            chip="Trace Active"
            note={`${truthSummary.auditReadyCount} of ${truthSummary.totalRecords} records have trace coverage`}
            tone="violet"
          />
        </section>

        <section className="hbr-workGrid" data-tour="hub-reports-workgrid">
          <section className="hbr-mainColumn" data-tour="hub-reports-main">
            <article className="hbr-truthHealthPanel" data-tour="hub-reports-truth-health">
              <div className="hbr-truthHealthHeader">
                <div>
                  <span>TRUTH SPINE V1 HEALTH</span>
                  <h2>One-Source Truth Pipeline</h2>
                  <p>
                    Live engine snapshot across intake records, queue actions, verification,
                    audit proof, and report exports.
                  </p>
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <button
                    type="button"
                    className="hbr-truthHealthRefresh"
                    onClick={refreshTruthEngineSnapshot}
                  >
                    Refresh Snapshot
                  </button>
                  <div className={`hbr-truthHealthBadge hbr-truthHealthBadge--${truthEngineStatus}`}>
                    {truthEngineStatus}
                  </div>
                </div>
              </div>

              <div className="hbr-truthHealthGrid">
                <article>
                  <small>Truth Records</small>
                  <strong>{truthSummary.totalRecords}</strong>
                  <span>All normalized records</span>
                </article>

                <article>
                  <small>Pending</small>
                  <strong>{truthSummary.pendingCount}</strong>
                  <span>Need review or verification</span>
                </article>

                <article>
                  <small>Verified</small>
                  <strong>{truthSummary.verifiedCount}</strong>
                  <span>Approved for proof use</span>
                </article>

                <article>
                  <small>Report Ready</small>
                  <strong>{truthSummary.reportReadyCount}</strong>
                  <span>Ready for leadership output</span>
                </article>

                <article>
                  <small>Backend Audit</small>
                  <strong>{truthSummary.backendAuditCount || 0}</strong>
                  <span>Audit events connected</span>
                </article>

                <article>
                  <small>Backend Exports</small>
                  <strong>{truthSummary.backendExportCount || 0}</strong>
                  <span>Export records connected</span>
                </article>
              </div>

              <div className="hbr-truthHealthFooter">
                <span>
                  <b>Status:</b> {truthSummary.statusLabel || "Build Up"}
                </span>
                <span>
                  <b>Recommendation:</b> {truthSummary.recommendation || "Continue building verified proof."}
                </span>
                <span>
                  <b>Snapshot:</b> {truthEngineSnapshot?.generatedAt ? new Date(truthEngineSnapshot.generatedAt).toLocaleString() : "loading"}
                </span>
              </div>
            </article>

            <article className="hbr-panel" data-tour="hub-reports-workspace">
              <div className="hbr-panelHead">
                <div>
                  <h2>▥ Reports Workspace</h2>
                  <p>Generate simple Hub reports without opening the full institutional reporting command surface.</p>
                </div>
                <button type="button" onClick={() => go("/hub/reports")}>Full Reporting Surface →</button>
              </div>

              <div className="hbr-reportGrid" data-tour="hub-reports-cards">
                <ReportCard icon="📘" title="Monthly Hub Summary" format="PDF" audience="Leadership / Board" readiness="Ready" updated="Today" tone="green" onGenerate={handleGenerateReport} />
                <ReportCard icon="↗" title="Referral Activity Report" format="PDF / CSV" audience="Operations" readiness="Ready" updated="10:42 AM" tone="blue" onGenerate={handleGenerateReport} />
                <ReportCard icon="👥" title="Partner Network Report" format="PDF" audience="Hub Leadership" readiness="Ready" updated="Yesterday" tone="green" onGenerate={handleGenerateReport} />
                <ReportCard icon="♡" title="Unmet Needs Report" format="PDF / CSV" audience="Program Leads" readiness="Needs Review" updated="Yesterday" tone="gold" onGenerate={handleGenerateReport} />
                <ReportCard icon="▰" title="Import Quality Report" format="CSV / PDF" audience="Data / Audit" readiness="Ready" updated="May 12" tone="cyan" onGenerate={handleGenerateReport} />
                <ReportCard icon="◆" title="Outcome Snapshot" format="PDF" audience="Funder / Public-Safe" readiness="Pending" updated="May 10" tone="violet" onGenerate={handleGenerateReport} />
              </div>
            </article>

            <article className="hbr-panel" data-tour="hub-reports-audit">
              <div className="hbr-panelHead">
                <div>
                  <h2>🛡 Audit / Trace Status</h2>
                  <p>Source-to-report confidence for Hub reporting outputs.</p>
                </div>
                <span className="hbr-chip hbr-chip--green">94% COVERAGE</span>
              </div>

              <div className="hbr-traceGrid" data-tour="hub-reports-trace">
                <div><strong>Partner Network</strong><span>Trace active</span><b className="good">Ready</b></div>
                <div><strong>Referral Queue</strong><span>Trace active</span><b className="good">Ready</b></div>
                <div><strong>Lifecycle Tracker</strong><span>Trace active</span><b className="good">Ready</b></div>
                <div><strong>Unmet Needs</strong><span>Needs verification</span><b className="warn">Review</b></div>
                <div><strong>Files & Imports</strong><span>Mapping confidence attached</span><b className="good">Ready</b></div>
                <div><strong>Outcome Snapshot</strong><span>Pending final review</span><b className="hold">Pending</b></div>
              </div>
            </article>

            <article className="hbr-panel" data-tour="hub-reports-history">
              <div className="hbr-panelHead">
                <div>
                  <h2>◷ Export History</h2>
                  <p>Recent Hub report exports and operator activity.</p>
                </div>
                <button type="button">View all exports →</button>
              </div>

              <div className="hbr-exportTable" data-tour="hub-reports-export-history">
                <div className="hbr-tableHead">
                  <span>Report</span><span>Format</span><span>Status</span><span>Audience</span><span>Generated</span>
                </div>
                {(localExports.length
                  ? localExports.map((item) => [
                      item.exportKind,
                      item.format || "PDF",
                      item.status === "generated" ? "Ready" : item.status || "Ready",
                      item.audience || "Leadership",
                      new Date(item.createdAt).toLocaleString(),
                    ])
                  : [
                      ["Monthly Hub Summary", "PDF", "Ready", "Leadership", "Today 10:42 AM"],
                      ["Referral Activity Report", "CSV", "Ready", "Operations", "Today 9:18 AM"],
                      ["Import Quality Report", "PDF", "Ready", "Data / Audit", "Yesterday"],
                      ["Unmet Needs Report", "PDF", "Needs Review", "Program Leads", "Yesterday"],
                    ]
                ).map(([report, format, status, audience, generated]) => (
                  <div className="hbr-tableRow" key={`${report}_${generated}`}>
                    <strong>{report}</strong>
                    <span>{format}</span>
                    <span className={`hbr-status ${status === "Ready" ? "good" : "warn"}`}>{status}</span>
                    <span>{audience}</span>
                    <span>{generated}</span>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <aside className="hbr-sideColumn" data-tour="hub-reports-side">
            <article className="hbr-panel" data-tour="hub-reports-guidance">
              <h2>💡 Reporting Guidance</h2>
              <p>What the operator should do next.</p>

              <GuidanceRow icon="✓" title="Best Next Step" text="Generate Monthly Hub Summary for leadership review." tone="green" />
              <GuidanceRow icon="⚠" title="Verification Note" text="Unmet Needs Report needs one final verification pass." tone="gold" />
              <GuidanceRow icon="🛡" title="Audit Signal" text="Audit trace coverage is strong at 94%." tone="blue" />
              <GuidanceRow icon="↗" title="Advanced Surface" text="Open full Reporting Command Surface for Oracle and audit exports." tone="violet" />
            </article>

            <article className="hbr-panel" data-tour="hub-reports-recent-panel">
              <div className="hbr-panelHead">
                <div>
                  <h2>▣ Recent Reports</h2>
                  <p>Latest leadership-ready outputs.</p>
                </div>
              </div>

              <div className="hbr-recentList hbr-recentList--polished" data-tour="hub-reports-recent">
                {[
                  ["✓", "Monthly Hub Summary", "PDF", "Leadership", "Today", "good"],
                  ["✓", "Referral Activity Report", "CSV", "Operations", "Today", "good"],
                  ["Ⅱ", "Unmet Needs Report", "Needs Review", "Program Leads", "Yesterday", "warn"],
                  ["✓", "Import Quality Report", "PDF", "Audit", "Yesterday", "good"],
                ].map(([icon, title, format, audience, date, tone]) => (
                  <div className="hbr-recentReportItem" key={title}>
                    <b className={tone}>{icon}</b>
                    <div>
                      <strong>{title}</strong>
                      <small>
                        <span>{format}</span>
                        <i>•</i>
                        <span>{audience}</span>
                        <i>•</i>
                        <span>{date}</span>
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="hbr-panel hbr-commandLink" data-tour="hub-reports-command-link">
              <h2>Institutional Reporting</h2>
              <p>
                Use the full Reporting Command Surface for Oracle truth packages,
                trust envelopes, audit packs, analyst memos, and publication controls.
              </p>
              <button type="button" onClick={() => go("/hub/reports")}>
                Open Full Reporting Command Surface →
              </button>
            </article>
          </aside>
        </section>
      </section>
        
        <div className="hbr-institutionalFooter" data-tour="hub-reports-footer">
          <InstitutionalFooter
            subtitle="Truth Spine reporting infrastructure for referrals, queue actions, verification, audit trace, and export-ready institutional proof."
            version="Truth Spine V1"
            environment="Hub Reports"
            status="Proof-ready"
          />
        </div>


      </main>
    </HubBusinessTourProvider>
  );
}
