import React, { useEffect, useMemo, useRef, useState } from "react";
import { cleanWorkspaceReports, createWorkspaceReport, readWorkspaceReports } from "../dashboardUtils";

const starterReports = [
  {
    id: "starter-report-1",
    title: "Operational Summary – May 2025",
    reportType: "Operational Summary",
    audience: "Executive",
    format: "PDF",
    status: "Ready",
    notes: "Monthly operational summary for leadership review.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "starter-report-2",
    title: "Provider Verification Trend Report",
    reportType: "Verification Trend",
    audience: "Operations",
    format: "PDF",
    status: "Ready",
    notes: "Trend report for provider verification performance.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "starter-report-3",
    title: "Contradictions Analysis – Q2",
    reportType: "Contradictions Analysis",
    audience: "Analyst",
    format: "XLSX",
    status: "Review",
    notes: "Q2 contradiction analysis export.",
    createdAt: new Date().toISOString(),
  },
];

function formatCreatedAt(iso) {
  try {
    return new Date(iso).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "Just now";
  }
}

export default function ReportsPanel() {
  const saveLockRef = useRef(false);
  const [reports, setReports] = useState(() => {
    const stored = cleanWorkspaceReports();
    return stored.length ? stored : starterReports;
  });

  const [draft, setDraft] = useState({
    title: "",
    reportType: "Operational Summary",
    audience: "Executive",
    format: "PDF",
    status: "Draft",
    notes: "",
  });

  useEffect(() => {
    function handleReportsUpdate(event) {
      if (Array.isArray(event.detail)) setReports(event.detail);
    }

    window.addEventListener("shsDash:reportsUpdated", handleReportsUpdate);
    return () => window.removeEventListener("shsDash:reportsUpdated", handleReportsUpdate);
  }, []);

  const recentReports = useMemo(() => reports.slice(0, 8), [reports]);

  function updateDraft(field, value) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSave() {
    if (saveLockRef.current) return;
    if (!draft.title.trim()) return;

    saveLockRef.current = true;

    const savedReport = createWorkspaceReport({
      ...draft,
      title: draft.title.trim(),
      notes: draft.notes.trim(),
    });

    const cleanedReports = cleanWorkspaceReports();
    setReports(cleanedReports.length ? cleanedReports : [savedReport]);

    setDraft({
      title: "",
      reportType: "Operational Summary",
      audience: "Executive",
      format: "PDF",
      status: "Draft",
      notes: "",
    });

    window.setTimeout(() => {
      saveLockRef.current = false;
    }, 350);
  }


  return (
    <section className="shsDash-card shsDash-reportsPanel">
      <div className="shsDash-workspaceHead">
        <div>
          <h2>Reports</h2>
          <p>Create and manage workspace report records before connecting them to the live SHS reporting engine.</p>
        </div>
      </div>

      <div className="shsDash-reportsGrid">
        <article className="shsDash-reportComposer">
          <div className="shsDash-sectionHead">
            <h2>▤ Create Report Record</h2>
            <button type="button" onClick={handleSave}>Save Report</button>
          </div>

          <label>
            <span>Report Title</span>
            <input
              value={draft.title}
              onChange={(event) => updateDraft("title", event.target.value)}
              placeholder="Example: Franklin Operational Brief"
            />
          </label>

          <div className="shsDash-reportFields">
            <label>
              <span>Report Type</span>
              <select
                value={draft.reportType}
                onChange={(event) => updateDraft("reportType", event.target.value)}
              >
                <option value="Operational Summary">Operational Summary</option>
                <option value="Institutional Report">Institutional Report</option>
                <option value="Technical Appendix">Technical Appendix</option>
                <option value="Grant Narrative">Grant Narrative</option>
                <option value="Verification Trend">Verification Trend</option>
                <option value="Contradictions Analysis">Contradictions Analysis</option>
              </select>
            </label>

            <label>
              <span>Audience</span>
              <select
                value={draft.audience}
                onChange={(event) => updateDraft("audience", event.target.value)}
              >
                <option value="Executive">Executive</option>
                <option value="Operations">Operations</option>
                <option value="Analyst">Analyst</option>
                <option value="Funder">Funder</option>
                <option value="Public">Public</option>
                <option value="Audit">Audit</option>
              </select>
            </label>
          </div>

          <div className="shsDash-reportFields">
            <label>
              <span>Format</span>
              <select
                value={draft.format}
                onChange={(event) => updateDraft("format", event.target.value)}
              >
                <option value="PDF">PDF</option>
                <option value="DOCX">DOCX</option>
                <option value="XLSX">XLSX</option>
                <option value="CSV">CSV</option>
                <option value="JSON">JSON</option>
              </select>
            </label>

            <label>
              <span>Status</span>
              <select
                value={draft.status}
                onChange={(event) => updateDraft("status", event.target.value)}
              >
                <option value="Draft">Draft</option>
                <option value="Review">Review</option>
                <option value="Ready">Ready</option>
                <option value="Published">Published</option>
                <option value="Blocked">Blocked</option>
              </select>
            </label>
          </div>

          <label>
            <span>Notes</span>
            <textarea
              value={draft.notes}
              onChange={(event) => updateDraft("notes", event.target.value)}
              placeholder="Add report purpose, data source notes, audience notes, or export instructions..."
            />
          </label>

          <section className="shsDash-reportRule">
            <strong>Reports Rule</strong>
            <p>
              Workspace reports are planning records until connected to verified truth packages,
              audit trails, reporting readiness, or the live SHS report generator.
            </p>
          </section>
        </article>

        <article className="shsDash-reportList">
          <div className="shsDash-sectionHead">
            <h2>Recent Workspace Reports</h2>
            <button type="button">View All →</button>
          </div>

          {recentReports.map((report) => (
            <div className="shsDash-reportItem" key={report.id}>
              <span>▤</span>
              <div>
                <strong>{report.title}</strong>
                <p>{report.reportType} · {report.audience} · {report.status}</p>
                <small>{report.notes || "No notes added."} · {formatCreatedAt(report.createdAt)}</small>
              </div>
              <b>{report.format}</b>
            </div>
          ))}
        </article>
      </div>
    </section>
  );
}
