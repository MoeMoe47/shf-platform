import React, { useMemo, useState } from "react";
import "./hub-files-imports.css";
import HubBusinessTourProvider from "./shared/HubBusinessTourProvider.jsx";

const LOGO_SRC = "/assets/hub/shs-hub-logo.png";
const SHS_HOME_URL = "/";


function openShsHome() {
  if (typeof window === "undefined") return;
  window.location.href = SHS_HOME_URL;
}

function go(path) {
  if (!path || typeof window === "undefined") return;
  window.location.hash = String(path).startsWith("/") ? path : `/${path}`;
}

function Sparkline({ tone = "blue" }) {
  return (
    <svg className={`hfi-spark hfi-spark--${tone}`} viewBox="0 0 100 36" aria-hidden="true">
      <polyline points="3,30 14,28 24,29 35,22 45,24 56,17 67,20 78,12 88,15 97,7" />
    </svg>
  );
}

function KpiCard({ icon, label, value, change, note, tone = "blue" }) {
  return (
    <article className="hfi-kpi">
      <div className={`hfi-kpiIcon hfi-tone--${tone}`}>{icon}</div>
      <div>
        <h3>{label}</h3>
        <strong>{value}</strong>
        <span className={`hfi-chip hfi-chip--${tone}`}>▲ {change}</span>
        <p>{note}</p>
      </div>
      <Sparkline tone={tone} />
    </article>
  );
}

function LaneTile({ icon, title, text, tone = "blue", active = false }) {
  return (
    <button className={`hfi-laneTile hfi-laneTile--${tone} ${active ? "is-active" : ""}`} type="button">
      <span>{icon}</span>
      <div>
        <strong>{title}</strong>
        <small>{text}</small>
      </div>
    </button>
  );
}

function GuidanceRow({ icon, title, text, tone = "blue" }) {
  return (
    <div className="hfi-guidanceRow">
      <div className={`hfi-guideIcon hfi-tone--${tone}`}>{icon}</div>
      <div>
        <strong>{title}</strong>
        <span>{text}</span>
      </div>
      <b>›</b>
    </div>
  );
}

function StatusBadge({ children, tone = "green" }) {
  return <span className={`hfi-status hfi-status--${tone}`}>{children}</span>;
}

export default function HubFilesImports() {
  const [importType, setImportType] = useState("Partner Roster");
  const [lane, setLane] = useState("Upload File");

  const mappingRows = useMemo(
    () => [
      ["client_name", "person_display_name", "Mapped", "95%", "Maria Sanchez", "green"],
      ["org", "organization_name", "Mapped", "92%", "Silicon Heartland Foundation", "green"],
      ["service_type", "need_category", "Needs Review", "72%", "Workforce Training", "gold"],
      ["consent_flag", "consent_status", "Missing", "—", "—", "red"],
      ["referral_date", "referral_submitted_at", "Mapped", "98%", "4/15/2026 10:35 AM", "green"],
    ],
    []
  );

  return (
    <HubBusinessTourProvider pageKey="imports">
      <main className="hfi-shell" data-tour="hub-imports-shell">
      <aside className="hfi-rail" data-tour="hub-imports-rail">
        <button className="hfi-logo" type="button" onClick={openShsHome}>
          <img src={LOGO_SRC} alt="Silicon Heartland Hub" />
        </button>

        <nav className="hfi-nav" data-tour="hub-imports-nav">
          <button type="button" onClick={openShsHome}>
            <span>⌂</span>
            <small>Overview</small>
          </button>
          <button type="button" onClick={() => go("/hub/network")}>
            <span>👥</span>
            <small>Partners</small>
          </button>
          <button type="button" onClick={() => go("/hub/lifecycle")}>
            <span>↗</span>
            <small>Referral Tracker</small>
          </button>
          <button type="button" onClick={() => go("/hub/intake")}>
            <span>▤</span>
            <small>Intake</small>
          </button>
          <button type="button" onClick={() => go("/hub/queue")}>
            <span>☑</span>
            <small>Action Queue</small>
            <b>12</b>
          </button>
          <button className="is-active" type="button">
            <span>▰</span>
            <small>Files & Imports</small>
          </button>
          <button type="button" onClick={() => go("/hub/reports")}>
            <span>▥</span>
            <small>Reports</small>
          </button>
        </nav>

        <section className="hfi-readiness" data-tour="hub-imports-readiness">
          <strong>REPORTING READINESS</strong>
          <div>87%</div>
          <span>On track</span>
          <small>
            FY24 Q2
            <br />
            Report
            <br />
            Due in 18 days
          </small>
        </section>
      </aside>

      <section className="hfi-page">
        <header className="hfi-header" data-tour="hub-imports-header">
          <div>
            <p>SHS HUB COLLABORATION LAYER</p>
            <h1>Files & Imports</h1>
            <span>
              Bring clean data into the Hub through uploads, templates, field mapping, validation,
              and integration-ready import lanes.
            </span>
          </div>

          <div className="hfi-actions" data-tour="hub-imports-actions">
            <button type="button" onClick={openShsHome}>← Back to Hub</button>
            <button type="button">⇩ Download Template</button>
            <button className="is-primary" type="button">Start Import →</button>
          </div>
        </header>

        <section className="hfi-kpiStrip" data-tour="hub-imports-kpis">
          <KpiCard icon="☁" label="Total Imports" value="124" change="18%" note="vs last 30 days" tone="blue" />
          <KpiCard icon="✓" label="Ready to Import" value="36" change="24%" note="vs last 30 days" tone="green" />
          <KpiCard icon="▦" label="Needs Mapping" value="14" change="7%" note="vs last 30 days" tone="gold" />
          <KpiCard icon="⚠" label="Validation Issues" value="9" change="13%" note="vs last 30 days" tone="red" />
          <KpiCard icon="↔" label="API Ready" value="8" change="33%" note="vs last 30 days" tone="cyan" />
          <KpiCard icon="◷" label="Recent Imports" value="11" change="10%" note="completed" tone="violet" />
        </section>

        <section className="hfi-workGrid" data-tour="hub-imports-workgrid">
          <section className="hfi-mainColumn" data-tour="hub-imports-main">
            <article className="hfi-panel" data-tour="hub-imports-lane-panel">
              <div className="hfi-panelHead">
                <div>
                  <h2>✣ Import Lane</h2>
                  <p>Choose how you want to bring data into the Hub.</p>
                </div>
              </div>

              <div className="hfi-laneGrid" data-tour="hub-imports-lanes">
                <LaneTile
                  icon="☁"
                  title="Upload File"
                  text="Upload a file from your device to import data manually."
                  tone="blue"
                  active={lane === "Upload File"}
                  onClick={() => setLane("Upload File")}
                />
                <LaneTile
                  icon="▤"
                  title="Use SHS Template"
                  text="Download a template pre-mapped to SHS standards."
                  tone="green"
                  active={lane === "Use SHS Template"}
                  onClick={() => setLane("Use SHS Template")}
                />
                <LaneTile
                  icon="◉"
                  title="Connect Source"
                  text="Connect to your system or tool for automated imports."
                  tone="violet"
                  active={lane === "Connect Source"}
                  onClick={() => setLane("Connect Source")}
                />
                <LaneTile
                  icon="▦"
                  title="Batch Import"
                  text="Import multiple files with consistent mapping rules."
                  tone="gold"
                  active={lane === "Batch Import"}
                  onClick={() => setLane("Batch Import")}
                />
              </div>
            </article>

            <article className="hfi-panel hfi-uploadPanel" data-tour="hub-imports-upload">
              <div className="hfi-panelHead">
                <div>
                  <h2>▣ Upload & Import Setup</h2>
                  <p>Upload your file and define what you are importing.</p>
                </div>
                <button type="button">View import history →</button>
              </div>

              <div className="hfi-uploadGrid" data-tour="hub-imports-upload-grid">
                <div>
                  <label className="hfi-dropZone" data-tour="hub-imports-dropzone">
                    <input type="file" />
                    <span>☁</span>
                    <strong>Drag & drop your file here</strong>
                    <small>or click to browse</small>
                    <em>Max file size: 250MB</em>
                  </label>

                  <div className="hfi-formatRow" data-tour="hub-imports-formats">
                    <small>Supported formats:</small>
                    {["CSV", "XLSX", "JSON", "PDF", "DOCX", "PNG/JPG", "ZIP"].map((format) => (
                      <span key={format}>{format}</span>
                    ))}
                  </div>
                </div>

                <div className="hfi-typePanel" data-tour="hub-imports-type-panel">
                  <h3>Import Type</h3>
                  <p>Select the type of data you are importing.</p>

                  <div className="hfi-typeGrid" data-tour="hub-imports-types">
                    {[
                      "Partner Roster",
                      "Referral Batch",
                      "Evidence Packet",
                      "Consent Records",
                      "Capacity Update",
                      "Outcome Records",
                    ].map((type) => (
                      <button
                        key={type}
                        className={importType === type ? "is-active" : ""}
                        type="button"
                        onClick={() => setImportType(type)}
                      >
                        {type}
                        {importType === type ? <span>✓</span> : null}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </article>

            <article className="hfi-panel hfi-mappingPanel" data-tour="hub-imports-mapping">
              <div className="hfi-panelHead">
                <div>
                  <h2>▤ Mapping & Validation</h2>
                  <p>Map your fields to SHS standards and review validation results.</p>
                </div>
                <button type="button">Auto-map settings ⚙</button>
              </div>

              <div className="hfi-mapTable" data-tour="hub-imports-map-table">
                <div className="hfi-mapHead">
                  <span>Uploaded Field</span>
                  <span>SHS Field</span>
                  <span>Status</span>
                  <span>Confidence</span>
                  <span>Sample Data</span>
                </div>

                {mappingRows.map(([uploaded, shs, status, confidence, sample, tone]) => (
                  <div className="hfi-mapRow" key={uploaded}>
                    <span>{uploaded}</span>
                    <span>→ {shs}</span>
                    <span><StatusBadge tone={tone}>{status}</StatusBadge></span>
                    <span>
                      {confidence}
                      {confidence !== "—" ? <i style={{ "--pct": confidence }} /> : <i className="is-empty" />}
                    </span>
                    <span>{sample}</span>
                  </div>
                ))}
              </div>

              <div className="hfi-validationCards" data-tour="hub-imports-validation">
                <div><strong>1,248</strong><span>Ready Records</span></div>
                <div><strong>36</strong><span>Blocked Records</span></div>
                <div><strong>18</strong><span>Potential Duplicates</span></div>
                <div><strong>92%</strong><span>Consent Check</span></div>
              </div>
            </article>
          </section>

          <aside className="hfi-sideColumn" data-tour="hub-imports-side">
            <article className="hfi-panel" data-tour="hub-imports-guidance">
              <h2>💡 Import Guidance</h2>
              <p>Insights to help you import clean, trusted data.</p>

              <GuidanceRow icon="✓" title="Best Next Step" text="Map 3 fields to enable a preview of your data." tone="green" />
              <GuidanceRow icon="⚠" title="Validation Risk" text="9 records have issues that may block import." tone="red" />
              <GuidanceRow icon="★" title="Mapping Suggestion" text="We found 6 high-confidence field matches." tone="violet" />
              <GuidanceRow icon="↔" title="Integration Note" text="Your API lane is ready for automated imports." tone="cyan" />
            </article>

            <article className="hfi-panel" data-tour="hub-imports-recent-panel">
              <div className="hfi-panelHead">
                <div>
                  <h2>▣ Recent Imports</h2>
                  <p>Latest files brought into the Hub.</p>
                </div>
                <button type="button">View all →</button>
              </div>

              <div className="hfi-importList" data-tour="hub-imports-recent">
                {[
                  ["partner_roster_2026-05-14.csv", "SH Foundation", "Completed", "1,248", "10:42 AM", "green"],
                  ["referrals_batch_0513.xlsx", "Franklin County WFP", "Needs Review", "642", "Yesterday", "gold"],
                  ["evidence_packet_may.pdf", "HopeWorks", "Blocked", "124", "May 12", "red"],
                  ["capacity_update_q2.xlsx", "BridgePoint Services", "Completed", "87", "May 10", "green"],
                  ["outcomes_april.json", "Youth Services", "Completed", "326", "May 9", "green"],
                ].map(([file, source, status, records, updated, tone]) => (
                  <div className="hfi-importRow" key={file}>
                    <span>▤</span>
                    <strong>{file}</strong>
                    <small>{source}</small>
                    <StatusBadge tone={tone}>{status}</StatusBadge>
                    <b>{records}</b>
                    <time>{updated}</time>
                  </div>
                ))}
              </div>
            </article>

            <article className="hfi-panel" data-tour="hub-imports-integration-panel">
              <div className="hfi-panelHead">
                <div>
                  <h2>⛓ Integration Readiness</h2>
                  <p>Common integration lanes for partner systems.</p>
                </div>
                <button type="button">View details →</button>
              </div>

              <div className="hfi-readinessList" data-tour="hub-imports-integration">
                {[
                  ["CSV / Excel Ingestion", "File-based imports via manual or scheduled uploads.", "Ready", "green"],
                  ["API Sync", "System-to-system imports via secure API.", "Active", "blue"],
                  ["Webhook Listener", "Real-time event ingestion for referrals and updates.", "Planned", "violet"],
                  ["Warehouse Sync", "Nightly sync to data warehouse for reporting.", "Ready", "green"],
                  ["Audit Trace", "All imports are logged and traceable.", "Active", "blue"],
                ].map(([title, text, status, tone]) => (
                  <div className="hfi-readyRow" key={title}>
                    <span>↔</span>
                    <div>
                      <strong>{title}</strong>
                      <small>{text}</small>
                    </div>
                    <StatusBadge tone={tone}>{status}</StatusBadge>
                  </div>
                ))}
              </div>
            </article>
          </aside>
        </section>
      </section>
      </main>
    </HubBusinessTourProvider>
  );
}
