import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SHS_REPORT_REGISTRY, getReportTypeDefinition } from "@/data/shsReports/shsReportRegistry";
import { buildDefaultReadiness, evaluateReportReadiness } from "@/data/shsReports/shsReportReadiness";
import { SHS_REPORT_VISIBILITY_MODES, displayVisibilityMode } from "@/data/shsReports/shsReportTypes";
import { getVisibilityWarnings } from "@/data/shsReports/shsReportVisibility";
import { createShsReportDraft } from "@/shared/reporting/shsReportDraftClient";
import ShsReportBrandingPanel from "./components/ShsReportBrandingPanel.jsx";
import ShsReportReadinessPanel from "./components/ShsReportReadinessPanel.jsx";
import "./shsReports.css";

const SUBJECT_TYPES = [
  ["shs-internal", "SHS Internal System"],
  ["clientops-client", "ClientOps Client"],
  ["production-project", "Production Project"],
  ["qa-delivery-record", "QA + Delivery Record"],
  ["sales-handoff", "Sales Handoff"],
  ["support-maintenance-record", "Support / Maintenance Record"],
];

export default function ShsCreateReportPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialType = new URLSearchParams(location.search).get("type") || "premium-os-report-book";
  const [subjectType, setSubjectType] = useState("clientops-client");
  const [subjectName, setSubjectName] = useState("Central Care Services");
  const [reportType, setReportType] = useState(initialType);
  const [brandMode, setBrandMode] = useState("shs-premium");
  const [visibility, setVisibility] = useState("internal-only");
  const [saveState, setSaveState] = useState("idle");
  const [saveError, setSaveError] = useState("");
  const definition = useMemo(() => getReportTypeDefinition(reportType), [reportType]);
  const draftReport = useMemo(
    () => ({
      reportType,
      brandMode,
      subjectType,
      subjectName,
      visibility,
      readiness: buildDefaultReadiness(reportType),
      exportMetadata: { exportFormat: "pdf", exportLocked: false },
    }),
    [reportType, brandMode, subjectType, subjectName, visibility]
  );
  const readiness = evaluateReportReadiness(draftReport);
  const visibilityWarnings = getVisibilityWarnings(draftReport);

  async function generateDraft() {
    setSaveState("saving");
    setSaveError("");
    try {
      const report = await createShsReportDraft({
        reportType,
        title: definition.displayName,
        brandMode,
        subjectType,
        subjectName,
        visibility,
        readiness: buildDefaultReadiness(reportType),
        exportMetadata: { exportFormat: "pdf", exportLocked: false },
      });
      setSaveState("saved");
      navigate(report.reportType === "premium-os-report-book" ? "/ops/reports/premium-preview" : "/ops/reports/history", { state: { reportId: report.reportId } });
    } catch (error) {
      setSaveState("error");
      setSaveError(error instanceof Error ? error.message : "SHS report draft could not be saved");
    }
  }

  return (
    <main className="shs-reports-command">
      <section className="shs-reports-hero">
        <div>
          <p>Reports Command</p>
          <h1>Create Report</h1>
          <span>Select a subject, report type, readiness posture, branding mode, and visibility before generating a draft.</span>
        </div>
        <button type="button" className="shs-report-primary-action" onClick={generateDraft} disabled={saveState === "saving"}>
          {saveState === "saving" ? "Saving Draft…" : "Generate Draft Report"}
        </button>
        {saveError ? <p className="shs-report-warning" role="alert">{saveError}</p> : null}
      </section>

      <section className="shs-create-flow">
        <article className="shs-report-panel">
          <div className="shs-report-panel__header">
            <p>Step 1</p>
            <h2>Select Report Subject</h2>
          </div>
          <div className="shs-report-choice-row">
            {SUBJECT_TYPES.map(([value, label]) => (
              <button key={value} type="button" className={subjectType === value ? "is-active" : ""} onClick={() => setSubjectType(value)}>
                <strong>{label}</strong>
                <span>{definition.allowedSubjectTypes.includes(value) ? "Allowed for selected report" : "May require different report type"}</span>
              </button>
            ))}
          </div>
          <label className="shs-report-field">
            Subject Name
            <input value={subjectName} onChange={(event) => setSubjectName(event.target.value)} />
          </label>
        </article>

        <article className="shs-report-panel">
          <div className="shs-report-panel__header">
            <p>Step 2</p>
            <h2>Select Report Type</h2>
          </div>
          <div className="shs-report-choice-row">
            {SHS_REPORT_REGISTRY.map((type) => (
              <button key={type.id} type="button" className={reportType === type.id ? "is-active" : ""} onClick={() => setReportType(type.id)}>
                <strong>{type.displayName}</strong>
                <span>{type.description}</span>
              </button>
            ))}
          </div>
        </article>

        <ShsReportReadinessPanel report={draftReport} />
        <ShsReportBrandingPanel brandMode={brandMode} onChange={setBrandMode} />

        <article className="shs-report-panel">
          <div className="shs-report-panel__header">
            <p>Step 5</p>
            <h2>Select Visibility</h2>
            <span>Visibility filtering prevents internal-only details from leaking into client-visible outputs.</span>
          </div>
          <div className="shs-report-choice-row">
            {SHS_REPORT_VISIBILITY_MODES.filter((mode) => mode !== "archived").map((mode) => (
              <button key={mode} type="button" className={visibility === mode ? "is-active" : ""} onClick={() => setVisibility(mode)}>
                <strong>{displayVisibilityMode(mode)}</strong>
                <span>{definition.blockedVisibilityModes.includes(mode) ? "Blocked for selected report" : "Allowed with filtering rules"}</span>
              </button>
            ))}
          </div>
          {visibilityWarnings.length ? <p className="shs-report-warning">{visibilityWarnings.join(" ")}</p> : null}
        </article>

        <article className="shs-report-panel">
          <div className="shs-report-panel__header">
            <p>Step 6</p>
            <h2>Generate Draft Report</h2>
            <span>{readiness.blocked ? "Missing required data will be marked visibly in the draft." : "Draft can be generated for review."}</span>
          </div>
          <button type="button" className="shs-report-primary-action" onClick={generateDraft} disabled={saveState === "saving"}>
            {saveState === "saving" ? "Saving Draft…" : "Generate Draft Report"}
          </button>
        </article>
      </section>
    </main>
  );
}
