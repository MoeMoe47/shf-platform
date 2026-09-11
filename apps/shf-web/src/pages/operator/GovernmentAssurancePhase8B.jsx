import React, { useEffect, useState } from "react";
import { askGovernmentAssuranceAssistant, fetchReportRenderedFile, generateGovernmentAssuranceReport, getAiDelegations, getReportArtifacts } from "../../services/government-assurance-client";

const REPORT_TYPES = [
  ["EXECUTIVE_ASSURANCE", "Executive Assurance Report"],
  ["PROGRAM_ASSURANCE", "Program Assurance Report"],
  ["PROVIDER_ASSURANCE", "Provider Assurance Report"],
  ["FUNDING_LINEAGE", "Funding Lineage Report"],
  ["AUDIT_PACKET", "Audit Packet"],
];

function JsonList({ value }) {
  if (!value || typeof value !== "object") return <span>{String(value ?? "—")}</span>;
  return <ul>{Object.entries(value).slice(0, 16).map(([key, item]) => <li key={key}><strong>{key.replaceAll("_", " ")}:</strong> {typeof item === "object" ? JSON.stringify(item) : String(item ?? "—")}</li>)}</ul>;
}

function References({ items = [] }) {
  if (!items.length) return <p>No canonical references were returned.</p>;
  return <ul aria-label="Canonical references">{items.map((item) => <li key={`${item.type}:${item.id}`}><a href={item.href}>{item.type}: {item.id}</a></li>)}</ul>;
}

export default function GovernmentAssurancePhase8B({ dashboard = null }) {
  const [delegation, setDelegation] = useState(null);
  const [prompt, setPrompt] = useState("Explain the current Government Program Assurance status and what requires review next.");
  const [assistant, setAssistant] = useState(null);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [reportType, setReportType] = useState("EXECUTIVE_ASSURANCE");
  const [subjectReference, setSubjectReference] = useState("");
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportHistory, setReportHistory] = useState([]);
  const [previewHtml, setPreviewHtml] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getAiDelegations().then((result) => setDelegation((result.items || [])[0] || null)).catch(() => setDelegation(null));
    getReportArtifacts().then((result) => setReportHistory(result.items || [])).catch(() => setReportHistory([]));
  }, []);

  async function ask(event) {
    event.preventDefault();
    setError(""); setAssistant(null); setAssistantLoading(true);
    try { setAssistant(await askGovernmentAssuranceAssistant({ prompt, delegationId: delegation?.delegationId })); }
    catch (requestError) { setError(requestError.message); }
    finally { setAssistantLoading(false); }
  }

  async function generate(event) {
    event.preventDefault();
    setError(""); setReport(null); setReportLoading(true);
    try {
      const generated = await generateGovernmentAssuranceReport({ reportType, subjectReference: subjectReference || undefined });
      setReport(generated);
      setPreviewHtml("");
      getReportArtifacts().then((result) => setReportHistory(result.items || [])).catch(() => {});
    }
    catch (requestError) { setError(requestError.message); }
    finally { setReportLoading(false); }
  }

  function download(format = "JSON") {
    const file = (report?.renderedFiles || []).find((item) => item.format === format);
    if (!file) return;
    fetchReportRenderedFile(file.rendered_file_id).then(({ blob }) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a"); link.href = url; link.download = file.filename || `${report.report.reportType.toLowerCase()}-${report.artifact?.artifact_id || "report"}.${format.toLowerCase()}`; link.click(); URL.revokeObjectURL(url);
    }).catch((requestError) => setError(requestError.message));
  }

  function preview() {
    const file = (report?.renderedFiles || []).find((item) => item.format === "HTML");
    if (!file) return;
    fetchReportRenderedFile(file.rendered_file_id).then(async ({ blob }) => setPreviewHtml(await blob.text())).catch((requestError) => setError(requestError.message));
  }

  return <div className="gpa-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", alignItems: "start" }}>
    <section style={{ border: "1px solid #d9e2ec", padding: 16 }} aria-labelledby="gpa-assistant-heading">
      <h2 id="gpa-assistant-heading">CivicSure AI</h2>
      <p className="gpa-note">Responses are advisory. Canonical facts, analysis, and recommendations are separated, and every factual response must cite authorized GPA records.</p>
      <form onSubmit={ask} style={{ display: "grid", gap: 10 }}>
        <label htmlFor="gpa-assistant-prompt">Question</label>
        <textarea id="gpa-assistant-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={5} />
        <button type="submit" disabled={assistantLoading || !prompt.trim()}>{assistantLoading ? "Grounding…" : "Ask governed assistant"}</button>
      </form>
      <p role="status" aria-live="polite">{delegation ? `Delegation: ${delegation.agentIdentifier} (${delegation.status})` : "No active GPA assistant delegation is available in this scope."}</p>
      {assistant ? <div style={{ marginTop: 14 }}><h3>Assistant response</h3><p><strong>Status:</strong> {assistant.status}</p>{assistant.denialCode ? <p role="alert">Denied: {assistant.denialCode}</p> : null}{assistant.security ? <p>Security scan: {assistant.security.decision} ({assistant.security.scanId})</p> : null}{assistant.message ? <p>{assistant.message}</p> : null}{assistant.canonicalFacts ? <><h4>Canonical facts</h4><JsonList value={assistant.canonicalFacts} /></> : null}{assistant.analysis ? <><h4>Analysis / explanation</h4><p>{assistant.analysis}</p></> : null}{assistant.recommendation ? <><h4>Recommendation</h4><p>{assistant.recommendation}</p></> : null}{assistant.canonicalReferences ? <><h4>Inspectable references</h4><References items={assistant.canonicalReferences} /></> : null}</div> : null}
    </section>
    <section style={{ border: "1px solid #d9e2ec", padding: 16 }} aria-labelledby="gpa-reports-heading">
      <h2 id="gpa-reports-heading">Controlled Reports</h2>
      <p className="gpa-note">Reports consume canonical dashboard, Claim, Metric, Truth, funding, oversight, and audit authorities. Report metadata preserves classification and source references.</p>
      <form onSubmit={generate} style={{ display: "grid", gap: 10 }}>
        <label htmlFor="gpa-report-type">Report type</label>
        <select id="gpa-report-type" value={reportType} onChange={(event) => setReportType(event.target.value)}>{REPORT_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <label htmlFor="gpa-report-subject">Canonical subject reference where required</label>
        <input id="gpa-report-subject" value={subjectReference} onChange={(event) => setSubjectReference(event.target.value)} placeholder="Program, provider, funding, or audit reference" />
        <button type="submit" disabled={reportLoading}>{reportLoading ? "Generating…" : "Generate report"}</button>
      </form>
      {report ? <div style={{ marginTop: 14 }}><h3>Generated artifact</h3><dl><div><dt>Artifact</dt><dd>{report.artifact?.artifact_id}</dd></div><div><dt>Report version</dt><dd>{report.report?.reportVersion}</dd></div><div><dt>Classification</dt><dd>{report.report?.classification}</dd></div><div><dt>Generated</dt><dd>{report.report?.generatedAt}</dd></div><div><dt>Canonical references</dt><dd>{report.report?.canonicalReferences?.length || 0}</dd></div><div><dt>Rendered files</dt><dd>{report.renderedFiles?.length || 0}</dd></div></dl><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button type="button" onClick={preview}>Preview HTML</button>{(report.renderedFiles || []).some((item) => item.format === "PDF") ? <button type="button" onClick={() => download("PDF")}>Download Executive PDF</button> : null}<button type="button" onClick={() => download("JSON")}>Download bounded JSON report</button></div>{previewHtml ? <iframe title="CivicSure report HTML preview" sandbox="" srcDoc={previewHtml} style={{ width: "100%", minHeight: 560, marginTop: 12, border: "1px solid #d9e2ec" }} /> : null}</div> : null}
      {reportHistory.length ? <section style={{ marginTop: 14 }} aria-labelledby="gpa-report-history-heading"><h3 id="gpa-report-history-heading">Report history</h3><ul>{reportHistory.slice(0, 10).map((item) => <li key={item.artifact_id}>{item.composition_type} · {item.artifact_id} · {item.classification}</li>)}</ul></section> : null}
    </section>
    {dashboard ? <section style={{ gridColumn: "1 / -1", border: "1px solid #d9e2ec", padding: 16 }}><h2>Canonical report inputs</h2><JsonList value={dashboard.summary || dashboard} /></section> : null}
    {error ? <div role="alert" style={{ gridColumn: "1 / -1", padding: 12, background: "#fff4f2", color: "#8a1c13" }}>{error}</div> : null}
  </div>;
}
