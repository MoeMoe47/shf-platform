import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createImportJob,
  executeImportJob,
  getImportPreview,
  listImportJobs,
  listImportSources,
  updateImportCandidate,
  listSourceAssets,
  listSourceVersions,
  uploadSourceDocument,
  processSourceDocument,
  createRawDocumentImportJob,
} from "@/lib/curriculumImport/api.js";

const STATUS_COPY = {
  NEW: ["NEW", "Will be added"],
  UNCHANGED: ["UNCHANGED", "No change"],
  MODIFIED: ["MODIFIED", "Source content changed"],
  MISSING_FROM_SOURCE: ["MISSING FROM SOURCE", "Exists in curriculum but not in the latest source"],
  CONFLICT: ["CONFLICT", "Needs manual review before import"],
};

function formatDate(value) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? String(value) : date.toLocaleString();
}

function statusFor(candidate) {
  const key = candidate?.diffStatus || (candidate?.validationStatus === "INVALID" ? "CONFLICT" : "NEW");
  return STATUS_COPY[key] || [key, "Review server-provided status"];
}

function countCandidates(candidates = []) {
  return candidates.reduce((counts, candidate) => {
    const status = candidate.diffStatus || "NEW";
    counts.total += 1;
    if (candidate.candidateType === "UNIT") counts.units += 1;
    if (candidate.candidateType === "LESSON") counts.lessons += 1;
    if (candidate.candidateType === "RESOURCE") counts.resources += 1;
    if (candidate.candidateType === "ARCADE_LINK") counts.arcadeLinks += 1;
    if (candidate.candidateType === "ARCADE_LINK" && candidate.payload?.matchStatus === "UNRESOLVED") counts.arcadeUnresolved += 1;
    if (status === "NEW") counts.new += 1;
    if (status === "MODIFIED") counts.modified += 1;
    if (status === "UNCHANGED") counts.unchanged += 1;
    if (status === "MISSING_FROM_SOURCE") counts.missing += 1;
    if (status === "CONFLICT" || candidate.validationStatus === "INVALID") counts.conflicts += 1;
    return counts;
  }, { total: 0, units: 0, lessons: 0, resources: 0, arcadeLinks: 0, arcadeUnresolved: 0, new: 0, modified: 0, unchanged: 0, missing: 0, conflicts: 0 });
}

function StatusBadge({ candidate }) {
  const [label, description] = statusFor(candidate);
  return <span className="cim-status" data-status={candidate.diffStatus || "NEW"} title={description}>{label}</span>;
}

function CandidateTree({ nodes, selectedId, onSelect }) {
  return (
    <div className="cim-tree" aria-label="Course candidate hierarchy">
      {nodes.map((node) => (
        <div className="cim-treeNode" key={node.importCandidateId}>
          <button
            type="button"
            className={`cim-treeItem${selectedId === node.importCandidateId ? " is-selected" : ""}`}
            onClick={() => onSelect(node)}
            aria-pressed={selectedId === node.importCandidateId}
          >
            <span className="cim-treeType">{node.candidateType}</span>
            <span className="cim-treeTitle">{node.title}</span>
            <StatusBadge candidate={node} />
          </button>
          {node.children?.length ? <div className="cim-treeChildren"><CandidateTree nodes={node.children} selectedId={selectedId} onSelect={onSelect} /></div> : null}
        </div>
      ))}
    </div>
  );
}

function EditControls({ candidate, onSave, canEdit }) {
  const [title, setTitle] = React.useState(candidate.title);
  const [saving, setSaving] = React.useState(false);
  React.useEffect(() => { setTitle(candidate.title); }, [candidate.importCandidateId, candidate.title]);
  if (!canEdit || candidate.diffStatus === "MISSING_FROM_SOURCE") return null;
  const dirty = title.trim() && title !== candidate.title;
  async function save(fields) {
    setSaving(true);
    try { await onSave(fields); } finally { setSaving(false); }
  }
  return (
    <div className="cim-editControls">
      <label htmlFor="cim-candidate-title" className="cim-muted">Correct title before import</label>
      <div className="cim-editRow">
        <input id="cim-candidate-title" type="text" value={title} onChange={(event) => setTitle(event.target.value)} disabled={saving} />
        <button type="button" className="cim-textButton" disabled={saving || !dirty} onClick={() => save({ title: title.trim() })}>Save title</button>
        <button type="button" className="cim-textButton" disabled={saving} onClick={() => save({ included: candidate.included === false })}>
          {candidate.included === false ? "Include" : "Exclude"}
        </button>
      </div>
      {candidate.included === false ? <p className="cim-muted">Excluded — will not be created on import.</p> : null}
    </div>
  );
}

function DetailPanel({ candidate, onSaveCandidate, jobStatus }) {
  if (!candidate) return <aside className="cim-detail cim-emptyDetail"><p>Select a Course, Unit, or Lesson to inspect its source details.</p></aside>;
  const payload = candidate.payload || {};
  const list = (value) => Array.isArray(value) ? value : [];
  const canEdit = ["DRAFT", "READY", "NEEDS_REVIEW", "FAILED"].includes(jobStatus) && ["UNIT", "LESSON", "RESOURCE", "ARCADE_LINK"].includes(candidate.candidateType);
  return (
    <aside className="cim-detail" aria-label="Candidate details">
      <div className="cim-detailHeader">
        <div><p className="cim-eyebrow">{candidate.candidateType} candidate</p><h2>{candidate.title}</h2></div>
        <StatusBadge candidate={candidate} />
      </div>
      <dl className="cim-metaGrid">
        <div><dt>Stable key</dt><dd><code>{candidate.stableKey}</code></dd></div>
        <div><dt>Source file</dt><dd>{candidate.sourceReference || "Not provided"}</dd></div>
        <div><dt>Source hash</dt><dd><code>{candidate.sourceHash || "Not provided"}</code></dd></div>
        <div><dt>Sequence</dt><dd>{candidate.sequence}</dd></div>
      </dl>
      {onSaveCandidate ? <EditControls candidate={candidate} canEdit={canEdit} onSave={(fields) => onSaveCandidate(candidate.importCandidateId, fields)} /> : null}
      {candidate.validationErrors?.length ? <div className="cim-alert cim-alertError"><strong>Validation requires review</strong><ul>{candidate.validationErrors.map((error) => <li key={error}>{error}</li>)}</ul></div> : null}
      {candidate.diffStatus === "MISSING_FROM_SOURCE" ? <div className="cim-alert cim-alertWarning">This item exists in the current curriculum but was not found in the latest source. It will not be deleted by this workflow.</div> : null}
      {candidate.diffStatus === "CONFLICT" ? <div className="cim-alert cim-alertError">This candidate cannot be executed until the backend conflict is resolved.</div> : null}
      {candidate.candidateType === "LESSON" ? (
        <div className="cim-contentFields">
          {payload.objectives ? <section><h3>Objectives</h3><ul>{list(payload.objectives).map((item) => <li key={String(item)}>{String(item)}</li>)}</ul></section> : null}
          {payload.vocab ? <section><h3>Vocabulary</h3><p>{list(payload.vocab).map((item) => typeof item === "object" ? `${item.term || "Term"}: ${item.def || ""}` : String(item)).join("; ")}</p></section> : null}
          {payload.sections ? <section><h3>Sections</h3><p>{list(payload.sections).map((item) => item?.heading || item?.title || "Section").join(" · ")}</p></section> : null}
          {payload.practice ? <section><h3>Practice</h3><p>Preserved in the lesson definition.</p></section> : null}
          {payload.reflectionPrompt ? <section><h3>Reflection</h3><p>{String(payload.reflectionPrompt)}</p></section> : null}
          {payload.quiz ? <section><h3>Quiz definition</h3><p>Preserved as curriculum content; no assessment result is created.</p></section> : null}
        </div>
      ) : candidate.candidateType === "RESOURCE" ? (
        <div className="cim-contentFields">
          <section><h3>Resource type</h3><p>{payload.resourceType || "MEDIA"}</p></section>
          {payload.description ? <section><h3>Caption / description</h3><p>{payload.description}</p></section> : null}
          {payload.externalUrl ? <section><h3>Source URL</h3><p style={{ wordBreak: "break-all" }}>{payload.externalUrl}</p></section> : null}
          {payload.accessibilityWarnings?.length ? (
            <div className="cim-alert cim-alertWarning">
              <strong>Accessibility metadata incomplete</strong>
              <ul>{payload.accessibilityWarnings.map((warning) => <li key={warning}>{warning === "MISSING_ALT_TEXT" ? "No alt text was provided in the source." : warning === "MISSING_CAPTION" ? "No caption was provided in the source." : warning}</li>)}</ul>
              <p className="cim-muted">Nothing is fabricated to fill this gap — it is reported for human review only.</p>
            </div>
          ) : <p className="cim-muted">Source-provided accessibility metadata (alt text, caption) is present.</p>}
        </div>
      ) : candidate.candidateType === "ARCADE_LINK" ? (
        <div className="cim-contentFields">
          <section><h3>Game reference</h3><p style={{ wordBreak: "break-all" }}><code>{payload.gameId}</code></p></section>
          {payload.matchStatus === "MATCHED" ? (
            <section><h3>Matched Arcade Activity</h3><p>{payload.matchedActivity?.title} (<code>{payload.matchedActivity?.slug}</code>)</p><p className="cim-muted">Definition link only — no learner attempt or result is implied or created.</p></section>
          ) : payload.matchStatus === "UNRESOLVED" ? (
            <div className="cim-alert cim-alertWarning"><strong>Unresolved</strong><p>No canonical Arcade Activity matches this game reference. Nothing is created automatically.</p></div>
          ) : payload.matchStatus === "CONFLICT" ? (
            <div className="cim-alert cim-alertError"><strong>Conflict</strong><p>More than one signal resolved this reference to different activities. Execution is blocked until resolved.</p></div>
          ) : null}
        </div>
      ) : <p className="cim-muted">This structural candidate has no lesson content fields.</p>}
    </aside>
  );
}

const EXTRACTION_STATUS_COPY = {
  NOT_STARTED: "Not started",
  PENDING: "Processing…",
  SUCCEEDED: "Extracted",
  FAILED: "Extraction failed",
  UNAVAILABLE: "Unavailable",
  OCR_REQUIRED: "OCR required (scanned document)",
};

function RawDocumentPanel({ onJobCreated }) {
  const [assets, setAssets] = React.useState([]);
  const [versionsByAsset, setVersionsByAsset] = React.useState({});
  const [busyVersionId, setBusyVersionId] = React.useState("");
  const [error, setError] = React.useState("");
  const [uploading, setUploading] = React.useState(false);

  const loadAssets = React.useCallback(async () => {
    const result = await listSourceAssets();
    const items = result?.items || [];
    setAssets(items);
    const versionLists = await Promise.all(items.map((asset) => listSourceVersions(asset.source_asset_id).catch(() => ({ items: [] }))));
    const map = {};
    items.forEach((asset, index) => { map[asset.source_asset_id] = versionLists[index]?.items || []; });
    setVersionsByAsset(map);
  }, []);

  React.useEffect(() => { loadAssets().catch((err) => setError(err.message)); }, [loadAssets]);

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true); setError("");
    try { await uploadSourceDocument(file); await loadAssets(); }
    catch (err) { setError(err.message); }
    finally { setUploading(false); }
  }

  async function handleProcess(versionId) {
    setBusyVersionId(versionId); setError("");
    try { await processSourceDocument(versionId); await loadAssets(); }
    catch (err) { setError(err.message); }
    finally { setBusyVersionId(""); }
  }

  async function handleCreateJob(versionId) {
    setBusyVersionId(versionId); setError("");
    try { const result = await createRawDocumentImportJob(versionId); onJobCreated(result.job.importJobId); }
    catch (err) { setError(err.message); }
    finally { setBusyVersionId(""); }
  }

  return (
    <section className="cim-card cim-rawDocument" aria-labelledby="raw-document-title">
      <div><h2 id="raw-document-title">Raw document upload</h2><p className="cim-muted">Upload a PDF, DOCX, Markdown, or TXT source. Extraction and structure detection run server-side; nothing is published automatically.</p></div>
      {error ? <div className="cim-alert cim-alertError" role="alert">{error}</div> : null}
      <div className="cim-uploadRow">
        <label className="cim-fileLabel" htmlFor="cim-raw-upload">{uploading ? "Uploading…" : "Choose a file to upload"}
          <input id="cim-raw-upload" type="file" accept=".pdf,.docx,.md,.markdown,.txt" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>
      {assets.length ? (
        <div className="cim-history" role="table" aria-label="Uploaded source documents">
          <div className="cim-docRow cim-historyHead" role="row"><span>File</span><span>Version</span><span>Extraction</span><span>Action</span></div>
          {assets.flatMap((asset) => (versionsByAsset[asset.source_asset_id] || []).map((version) => (
            <div className="cim-docRow" role="row" key={version.source_document_version_id}>
              <span>{asset.original_filename}</span>
              <span>v{version.version_number}</span>
              <span>{EXTRACTION_STATUS_COPY[version.extraction_status] || version.extraction_status}</span>
              <span>
                {version.extraction_status === "SUCCEEDED" ? (
                  <button type="button" className="cim-textButton" onClick={() => handleCreateJob(version.source_document_version_id)} disabled={busyVersionId === version.source_document_version_id}>Create import job</button>
                ) : (
                  <button type="button" className="cim-textButton" onClick={() => handleProcess(version.source_document_version_id)} disabled={busyVersionId === version.source_document_version_id || version.extraction_status === "OCR_REQUIRED"}>
                    {busyVersionId === version.source_document_version_id ? "Processing…" : version.extraction_status === "OCR_REQUIRED" ? "OCR required" : "Process"}
                  </button>
                )}
              </span>
            </div>
          )))}
        </div>
      ) : <p className="cim-emptyState">No source documents uploaded yet.</p>}
    </section>
  );
}

export default function CurriculumImport() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [sources, setSources] = React.useState([]);
  const [jobs, setJobs] = React.useState([]);
  const [preview, setPreview] = React.useState(null);
  const [selected, setSelected] = React.useState(null);
  const [sourceKey, setSourceKey] = React.useState("");
  const [filter, setFilter] = React.useState("ALL");
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  const loadHistory = React.useCallback(async () => {
    const result = await listImportJobs();
    setJobs(Array.isArray(result) ? result : []);
  }, []);

  const loadPreview = React.useCallback(async (id) => {
    setLoading(true); setError("");
    try {
      const result = await getImportPreview(id);
      setPreview(result);
      setSelected(result.candidateTree?.[0] || null);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }, []);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setError("");
      try {
        const [sourceResult] = await Promise.all([listImportSources(), loadHistory()]);
        if (alive) {
          setSources(sourceResult?.sourceKeys || []);
          if (!sourceKey) setSourceKey(sourceResult?.sourceKeys?.[0] || "");
        }
        if (jobId) await loadPreview(jobId);
      } catch (err) { if (alive) setError(err.message); } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [jobId, loadHistory, loadPreview]);

  async function startImport(event) {
    event.preventDefault();
    if (!sourceKey) return;
    setBusy(true); setError("");
    try {
      const result = await createImportJob(sourceKey);
      await loadHistory();
      navigate(`/curriculum/import/${result.job.importJobId}`);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  async function execute() {
    if (!preview?.job || preview.job.status !== "READY") return;
    setBusy(true); setError("");
    try { await executeImportJob(preview.job.importJobId); await loadPreview(preview.job.importJobId); await loadHistory(); }
    catch (err) { setError(err.message); await loadPreview(preview.job.importJobId); }
    finally { setBusy(false); }
  }

  async function saveCandidate(candidateId, fields) {
    if (!preview?.job) return;
    setError("");
    try {
      await updateImportCandidate(preview.job.importJobId, candidateId, fields);
      await loadPreview(preview.job.importJobId);
    } catch (err) { setError(err.message); }
  }

  const counts = countCandidates(preview?.candidates || []);
  const history = jobs.filter((job) => filter === "ALL" || job.status === filter);
  const executable = preview?.job && ["READY", "FAILED"].includes(preview.job.status) && counts.conflicts === 0;

  return (
    <div className="cim-page">
      <div className="cim-pageHeader"><div><p className="cim-eyebrow">Curriculum administration</p><h1>Structured curriculum import</h1><p className="cim-subtitle">Review source candidates before creating a governed DRAFT course.</p></div><Link className="cim-secondaryButton" to="/curriculum/admin">Curriculum management</Link></div>
      {error ? <div className="cim-alert cim-alertError" role="alert">{error}</div> : null}
      <section className="cim-card cim-newImport" aria-labelledby="new-import-title">
        <div><h2 id="new-import-title">New import</h2><p className="cim-muted">Structured sources below are pre-authored SHF content. To import a PDF, DOCX, Markdown, or TXT document instead, use Raw document upload further down — scanned/image-only PDFs and AI-assisted authoring are not yet supported.</p></div>
        <form onSubmit={startImport} className="cim-importForm"><label htmlFor="cim-source">Structured source</label><select id="cim-source" value={sourceKey} onChange={(event) => setSourceKey(event.target.value)} disabled={busy || !sources.length}><option value="">Select a source</option>{sources.map((source) => <option key={source} value={source}>{source}</option>)}</select><button type="submit" className="cim-primaryButton" disabled={busy || !sourceKey}>{busy ? "Working…" : "Create preview"}</button></form>
      </section>
      <RawDocumentPanel onJobCreated={(id) => navigate(`/curriculum/import/${id}`)} />
      {preview ? (
        <section className="cim-workspace" aria-labelledby="preview-title">
          <div className="cim-card cim-previewCard"><div className="cim-sectionHeader"><div><p className="cim-eyebrow">Import revision {preview.job.revision}</p><h2 id="preview-title">{preview.job.sourceKey}</h2></div><span className={`cim-jobStatus cim-jobStatus-${preview.job.status}`}>{preview.job.status}</span></div><p className="cim-muted">Created {formatDate(preview.job.createdAt)} · {preview.job.status === "COMPLETED" ? "Imported as DRAFT." : "Preview is read-only until execution."}</p>
            <div className="cim-countGrid">{[["Units", counts.units], ["Lessons", counts.lessons], ["Resources", counts.resources], ["Arcade links", counts.arcadeLinks], ["New", counts.new], ["Modified", counts.modified], ["Unchanged", counts.unchanged], ["Missing", counts.missing], ["Conflicts", counts.conflicts]].map(([label, value]) => <div key={label} className="cim-count"><strong>{value}</strong><span>{label}</span></div>)}</div>
            {counts.arcadeUnresolved ? <div className="cim-alert cim-alertWarning">{counts.arcadeUnresolved} game reference{counts.arcadeUnresolved === 1 ? "" : "s"} did not match any canonical Arcade Activity and will not be linked.</div> : null}
            {counts.conflicts ? <div className="cim-alert cim-alertError">Execution is blocked until all conflicts and validation errors are resolved by the canonical backend workflow.</div> : null}
            {counts.missing ? <div className="cim-alert cim-alertWarning">Missing-from-source items are preserved for review. This interface has no delete action.</div> : null}
            <CandidateTree nodes={preview.candidateTree || []} selectedId={selected?.importCandidateId} onSelect={setSelected} />
            <div className="cim-actionRow"><button type="button" className="cim-primaryButton" onClick={execute} disabled={!executable || busy}>{busy ? "Importing…" : preview.job.status === "COMPLETED" ? "Imported to Draft" : preview.job.status === "FAILED" ? "Retry import" : "Import to Draft"}</button>{preview.job.status === "COMPLETED" ? <Link className="cim-secondaryButton" to="/curriculum/admin">Open curriculum management</Link> : null}<span className="cim-actionNote">Import creates DRAFT curriculum only. It does not publish or assign learners.</span></div>
          </div>
          <DetailPanel candidate={selected} onSaveCandidate={saveCandidate} jobStatus={preview.job.status} />
        </section>
      ) : null}
      <section className="cim-card" aria-labelledby="history-title"><div className="cim-sectionHeader"><div><h2 id="history-title">Import history</h2><p className="cim-muted">Organization-scoped jobs from the canonical import service.</p></div><label className="cim-filter">Filter <select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="ALL">All statuses</option>{["READY", "NEEDS_REVIEW", "IMPORTING", "COMPLETED", "FAILED", "CANCELLED"].map((value) => <option key={value} value={value}>{value}</option>)}</select></label></div>{loading && !jobs.length ? <p role="status" className="cim-muted">Loading import history…</p> : history.length ? <div className="cim-history" role="table" aria-label="Import history"><div className="cim-historyRow cim-historyHead" role="row"><span>Source</span><span>Status</span><span>Revision</span><span>Created</span><span>Action</span></div>{history.map((job) => <div className="cim-historyRow" role="row" key={job.importJobId}><span>{job.sourceKey || "Unknown source"}</span><span><span className={`cim-jobStatus cim-jobStatus-${job.status}`}>{job.status}</span></span><span>{job.revision}</span><span>{formatDate(job.createdAt)}</span><span><Link to={`/curriculum/import/${job.importJobId}`} className="cim-textButton">Review</Link></span></div>)}</div> : <p className="cim-emptyState">No import jobs in this organization.</p>}</section>
    </div>
  );
}
