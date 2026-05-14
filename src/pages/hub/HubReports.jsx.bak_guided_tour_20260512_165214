import React from "react";
import "./hub-reports.css";

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

function ReportCard({ icon, title, format, audience, readiness, updated, tone = "blue" }) {
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
        <button className="is-primary" type="button">Generate →</button>
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
  return (
    <main className="hbr-shell">
      <aside className="hbr-rail">
        <button className="hbr-logo" type="button" onClick={openShsHome}>
          <img src={LOGO_SRC} alt="Silicon Heartland Hub" />
        </button>

        <nav className="hbr-nav">
          <button type="button" onClick={openShsHome}><span>⌂</span><small>Overview</small></button>
          <button type="button" onClick={() => go("/hub/network")}><span>👥</span><small>Partners</small></button>
          <button type="button" onClick={() => go("/hub/lifecycle")}><span>↗</span><small>Referral Tracker</small></button>
          <button type="button" onClick={() => go("/hub/intake")}><span>▤</span><small>Intake</small></button>
          <button type="button" onClick={() => go("/hub/queue")}><span>☑</span><small>Action Queue</small><b>12</b></button>
          <button type="button" onClick={() => go("/hub/imports")}><span>▰</span><small>Files & Imports</small></button>
          <button className="is-active" type="button"><span>▥</span><small>Reports</small></button>
        </nav>

        <section className="hbr-readiness">
          <strong>REPORTING READINESS</strong>
          <div>87%</div>
          <span>On track</span>
          <small>FY24 Q2<br />Report<br />Due in 18 days</small>
        </section>
      </aside>

      <section className="hbr-page">
        <header className="hbr-header">
          <div>
            <p>SHS HUB COLLABORATION LAYER</p>
            <h1>Hub Reports</h1>
            <span>
              Turn Hub activity, imports, referrals, partner capacity, unmet needs,
              and verified outcomes into leadership-ready reports.
            </span>
          </div>

          <div className="hbr-actions">
            <button type="button" onClick={openShsHome}>← Back to Hub</button>
            <button type="button" onClick={() => go("/hub/reports")}>Open Full Reporting Surface</button>
            <button className="is-primary" type="button">Generate Report →</button>
          </div>
        </header>

        <section className="hbr-kpiStrip">
          <KpiCard icon="◷" label="Report Readiness" value="87%" chip="On Track" note="FY24 Q2 report due in 18 days" tone="blue" />
          <KpiCard icon="✓" label="Reports Ready" value="6" chip="Ready" note="Leadership-ready outputs" tone="green" />
          <KpiCard icon="Ⅱ" label="Pending Reports" value="2" chip="Pending" note="Awaiting verification or review" tone="gold" />
          <KpiCard icon="◆" label="Verified Outcomes" value="142" chip="Verified" note="Included in reporting scope" tone="green" />
          <KpiCard icon="♡" label="Unmet Needs Included" value="11" chip="Included" note="Active unmet-need signals" tone="cyan" />
          <KpiCard icon="🛡" label="Audit Trace Coverage" value="94%" chip="Trace Active" note="Source-to-report trace coverage" tone="violet" />
        </section>

        <section className="hbr-workGrid">
          <section className="hbr-mainColumn">
            <article className="hbr-panel">
              <div className="hbr-panelHead">
                <div>
                  <h2>▥ Reports Workspace</h2>
                  <p>Generate simple Hub reports without opening the full institutional reporting command surface.</p>
                </div>
                <button type="button" onClick={() => go("/hub/reports")}>Full Reporting Surface →</button>
              </div>

              <div className="hbr-reportGrid">
                <ReportCard icon="📘" title="Monthly Hub Summary" format="PDF" audience="Leadership / Board" readiness="Ready" updated="Today" tone="green" />
                <ReportCard icon="↗" title="Referral Activity Report" format="PDF / CSV" audience="Operations" readiness="Ready" updated="10:42 AM" tone="blue" />
                <ReportCard icon="👥" title="Partner Network Report" format="PDF" audience="Hub Leadership" readiness="Ready" updated="Yesterday" tone="green" />
                <ReportCard icon="♡" title="Unmet Needs Report" format="PDF / CSV" audience="Program Leads" readiness="Needs Review" updated="Yesterday" tone="gold" />
                <ReportCard icon="▰" title="Import Quality Report" format="CSV / PDF" audience="Data / Audit" readiness="Ready" updated="May 12" tone="cyan" />
                <ReportCard icon="◆" title="Outcome Snapshot" format="PDF" audience="Funder / Public-Safe" readiness="Pending" updated="May 10" tone="violet" />
              </div>
            </article>

            <article className="hbr-panel">
              <div className="hbr-panelHead">
                <div>
                  <h2>🛡 Audit / Trace Status</h2>
                  <p>Source-to-report confidence for Hub reporting outputs.</p>
                </div>
                <span className="hbr-chip hbr-chip--green">94% COVERAGE</span>
              </div>

              <div className="hbr-traceGrid">
                <div><strong>Partner Network</strong><span>Trace active</span><b className="good">Ready</b></div>
                <div><strong>Referral Queue</strong><span>Trace active</span><b className="good">Ready</b></div>
                <div><strong>Lifecycle Tracker</strong><span>Trace active</span><b className="good">Ready</b></div>
                <div><strong>Unmet Needs</strong><span>Needs verification</span><b className="warn">Review</b></div>
                <div><strong>Files & Imports</strong><span>Mapping confidence attached</span><b className="good">Ready</b></div>
                <div><strong>Outcome Snapshot</strong><span>Pending final review</span><b className="hold">Pending</b></div>
              </div>
            </article>

            <article className="hbr-panel">
              <div className="hbr-panelHead">
                <div>
                  <h2>◷ Export History</h2>
                  <p>Recent Hub report exports and operator activity.</p>
                </div>
                <button type="button">View all exports →</button>
              </div>

              <div className="hbr-exportTable">
                <div className="hbr-tableHead">
                  <span>Report</span><span>Format</span><span>Status</span><span>Audience</span><span>Generated</span>
                </div>
                {[
                  ["Monthly Hub Summary", "PDF", "Ready", "Leadership", "Today 10:42 AM"],
                  ["Referral Activity Report", "CSV", "Ready", "Operations", "Today 9:18 AM"],
                  ["Import Quality Report", "PDF", "Ready", "Data / Audit", "Yesterday"],
                  ["Unmet Needs Report", "PDF", "Needs Review", "Program Leads", "Yesterday"],
                ].map(([report, format, status, audience, generated]) => (
                  <div className="hbr-tableRow" key={report}>
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

          <aside className="hbr-sideColumn">
            <article className="hbr-panel">
              <h2>💡 Reporting Guidance</h2>
              <p>What the operator should do next.</p>

              <GuidanceRow icon="✓" title="Best Next Step" text="Generate Monthly Hub Summary for leadership review." tone="green" />
              <GuidanceRow icon="⚠" title="Verification Note" text="Unmet Needs Report needs one final verification pass." tone="gold" />
              <GuidanceRow icon="🛡" title="Audit Signal" text="Audit trace coverage is strong at 94%." tone="blue" />
              <GuidanceRow icon="↗" title="Advanced Surface" text="Open full Reporting Command Surface for Oracle and audit exports." tone="violet" />
            </article>

            <article className="hbr-panel">
              <div className="hbr-panelHead">
                <div>
                  <h2>▣ Recent Reports</h2>
                  <p>Latest leadership-ready outputs.</p>
                </div>
              </div>

              <div className="hbr-recentList hbr-recentList--polished">
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

            <article className="hbr-panel hbr-commandLink">
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
    </main>
  );
}
