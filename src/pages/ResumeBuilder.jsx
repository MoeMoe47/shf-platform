// src/pages/ResumeBuilder.jsx
import React, { lazy, useEffect, useMemo, useState } from "react";

import { emptyResume, validateResume, migrateResume } from "../utils/resumeSchema.js";
import { downloadText } from "../utils/downloads.js";
import { track } from "@/utils/analytics.js";

const Confetti = lazy(() => import("@/components/ui/Confetti.jsx")); // optional; safe if unused

/* ===========================================================
   Helpers
   =========================================================== */
const deepClone = (x) => JSON.parse(JSON.stringify(x));
const safeNumber = (v, f = 100) => (Number.isFinite(+v) ? +v : f);
const escapeHtml = (s = "") =>
  s.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]));

/* ---------- Readability (Flesch–Kincaid grade) ---------- */
function countWords(t = "") {
  return (t.trim().match(/\b[\w’'-]+\b/g) || []).length;
}
function countSentences(t = "") {
  return (t.trim().match(/[.!?]+/g) || []).length || (t.trim() ? 1 : 0);
}
function countSyllablesWord(w = "") {
  const x = w.toLowerCase().replace(/[^a-z]/g, "");
  if (!x) return 0;
  let syl = (x.match(/[aeiouy]+/g) || []).length;
  if (x.endsWith("e")) syl--;
  return Math.max(1, syl);
}
function countSyllables(t = "") {
  const words = t.match(/\b[\w’'-]+\b/g) || [];
  return words.reduce((s, w) => s + countSyllablesWord(w), 0);
}
function fkGrade(t = "") {
  const W = countWords(t), S = countSentences(t), Y = countSyllables(t);
  if (!W || !S) return 0;
  return Math.max(0, +(0.39 * (W / S) + 11.8 * (Y / W) - 15.59).toFixed(1));
}

/* ===========================================================
   Constants / LocalStorage
   =========================================================== */
const LS_KEY = "sh_resume_doc_v1";
const LEGACY_KEYS = ["sh_resume_doc", "resume_doc", "resume"]; // add any old keys here

function pickFirstExistingKey() {
  const current = localStorage.getItem(LS_KEY);
  if (current) return LS_KEY;
  for (const k of LEGACY_KEYS) {
    if (localStorage.getItem(k)) return k;
  }
  return LS_KEY;
}

const TEMPLATES = [
  { id: "clean",   name: "Clean (A4)",   desc: "Single column, high ATS match" },
  { id: "modern",  name: "Modern (A4)",  desc: "Two-tone headings, subtle accents" },
  { id: "compact", name: "Compact (A4)", desc: "Space-efficient, for 10+ bullets" },
];

/* ensure every section has a `hidden` boolean (default false) */
function withVisibility(doc) {
  const next = { ...doc };
  next.sections = (doc.sections || []).map((s) => ({ hidden: false, ...s }));
  return next;
}

/* Keep a module-level note of any load error so we can show it once in the UI */
let LAST_LOAD_ERROR = null;

/* ---------- Schema-aware load/save (forgiving) ---------- */
function loadResume() {
  LAST_LOAD_ERROR = null;
  try {
    const key = pickFirstExistingKey();
    const raw = localStorage.getItem(key);
    if (!raw) return withVisibility(emptyResume());
    const parsed = migrateResume(JSON.parse(raw));
    const v = validateResume(parsed);
    if (key !== LS_KEY && v.ok) {
      localStorage.setItem(LS_KEY, JSON.stringify(parsed));
    }
    if (!v.ok) {
      LAST_LOAD_ERROR = `Saved resume didn’t match the current schema: ${v.errors.join(", ")}`;
      return withVisibility(parsed);
    }
    return withVisibility(parsed);
  } catch (e) {
    LAST_LOAD_ERROR = `Resume load error: ${e?.message || e}`;
    return withVisibility(emptyResume());
  }
}

function saveResume(doc) {
  try {
    const json = JSON.stringify(doc);
    localStorage.setItem(LS_KEY, json);
    // rolling backup for safety
    localStorage.setItem(`${LS_KEY}__backup_${Date.now()}`, json);
  } catch {}
}

/* ===========================================================
   ATS keyword utils (simple + fast, no network)
   =========================================================== */
const STOP = new Set([
  "and","or","the","a","an","of","for","to","with","in","on","at","by","from","as","into","over","via",
  "is","are","was","were","be","being","been","that","this","these","those","it","its","you","your",
  "we","our","they","their","i","me","my","us","them",
]);

function tokenize(str = "") {
  return (str || "")
    .toLowerCase()
    .replace(/[^a-z0-9+.#/ ]/g, " ") // keep tech tokens like c++, c#, node.js-ish
    .split(/\s+/)
    .filter(Boolean);
}
function isGoodToken(tok) {
  if (STOP.has(tok)) return false;
  if (tok.length < 3 && !["c", "go", "js", "ai"].includes(tok)) return false;
  return true;
}
function keywordSetFromJD(jd = "") {
  const tokens = tokenize(jd).filter(isGoodToken);
  return Array.from(new Set(tokens)); // unique
}
function textOfResume(doc) {
  const bits = [];
  if (doc.name) bits.push(doc.name);
  if (doc.title) bits.push(doc.title);
  if (doc.summary) bits.push(doc.summary);
  (doc.skills || []).forEach((s) => bits.push(s));
  (doc.sections || []).forEach((s) => {
    (s.items || []).forEach((it) => {
      Object.values(it || {}).forEach((v) => {
        if (Array.isArray(v)) v.forEach((x) => bits.push(x));
        else if (typeof v === "string") bits.push(v);
      });
    });
  });
  return bits.join(" ").toLowerCase();
}
function analyzeMatch(doc, jd) {
  const keywords = keywordSetFromJD(jd);
  const resumeText = textOfResume(doc);
  const used = [];
  const missing = [];
  keywords.forEach((kw) => {
    const safe = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(^|[^a-z0-9])${safe}([^a-z0-9]|$)`, "i");
    if (re.test(resumeText)) used.push(kw);
    else missing.push(kw);
  });
  const coverage = keywords.length ? Math.round((used.length / keywords.length) * 100) : 0;
  const hardList = [
    "excel","sql","python","javascript","react","node","aws","azure","gcp","docker","kubernetes",
    "git","figma","photoshop","crm","salesforce","quickbooks","tableau","powerbi","writing","ai","ml",
    "c++","c#","java","html","css",
  ];
  const isHard = (w) => hardList.includes(w);
  const hardUsed = used.filter(isHard);
  const softUsed = used.filter((w) => !isHard(w));
  return {
    coveragePct: coverage,
    totalKeywords: keywords.length,
    used,
    missing,
    hardUsed,
    softUsed,
    highlightTerms: used.slice(0, 60), // cap highlights to keep DOM light
  };
}

/* ===========================================================
   Main Component
   =========================================================== */
export default function ResumeBuilder() {
  const [data, setData] = useState(() => {
    const d = loadResume();
    return {
      settings: { template: "clean", accent: "#111827", compact: false, ...(d.settings || {}) },
      contact: { links: [], ...(d.contact || {}) },
      skills: d.skills || [],
      sections: Array.isArray(d.sections) ? d.sections.map((s) => ({ hidden: false, ...s })) : [],
      summary: d.summary || "",
      name: d.contact?.name || d.name || "",
      title: d.title || "",
      jobDesc: d.jobDesc || "", // job description storage
      ...d,
      template: undefined, // normalize older saves
    };
  });
  const [loadError] = useState(LAST_LOAD_ERROR); // show once
  const [tab, setTab] = useState("editor"); // editor | preview
  const [zoom, setZoom] = useState(100);
  const [status, setStatus] = useState("Saved");

  useEffect(() => {
    try {
      track("resume_builder_viewed", {}, { silent: true });
    } catch {}
  }, []);

  // autosave + status
  useEffect(() => {
    setStatus("Saving…");
    const id = setTimeout(() => {
      saveResume(data);
      setStatus("Saved");
    }, 800);
    return () => clearTimeout(id);
  }, [data]);

  const v = validateResume(data);

  const update = (patch) => setData((d) => ({ ...d, ...patch }));

  const reset = () => {
    if (!confirm("Reset resume to a fresh template?")) return;
    const fresh = withVisibility(emptyResume());
    saveResume(fresh);
    setData({
      ...fresh,
      settings: { template: "clean", accent: "#111827", compact: false, ...(fresh.settings || {}) },
      contact: { links: [], ...(fresh.contact || {}) },
      sections: Array.isArray(fresh.sections) ? fresh.sections.map((s) => ({ hidden: false, ...s })) : [],
      jobDesc: "",
    });
    track("resume_reset");
  };

  const exportJSON = () => {
    downloadText(JSON.stringify(data, null, 2), "resume.json", "application/json");
    track("resume_export_json");
  };

  const importJSON = async (file) => {
    if (!file) return;
    try {
      const text = await file.text();
      const obj = JSON.parse(text);
      const migrated = withVisibility(migrateResume(obj));
      const check = validateResume(migrated);
      if (!check.ok) throw new Error(check.errors.join(", "));
      setData({ jobDesc: "", ...migrated });
      setTab("preview");
      track?.("resume_import_json", { ok: true });
    } catch (e) {
      alert("Invalid JSON file.\n" + (e?.message || ""));
      track?.("resume_import_json", { ok: false });
    }
  };

  const exportHTML = () => {
    const html = renderPrintableHTML(data);
    downloadText(html, "resume.html", "text/html");
    track("resume_export_html");
  };

  const printPDF = () => {
    window.print();
    track("resume_print_pdf");
  };

  // quick visibility actions
  const hideAll = () =>
    setData((d) => ({ ...d, sections: (d.sections || []).map((s) => ({ ...s, hidden: true })) }));
  const showAll = () =>
    setData((d) => ({ ...d, sections: (d.sections || []).map((s) => ({ ...s, hidden: false })) }));

  const hiddenCount = (data.sections || []).filter((s) => s.hidden).length;

  // ATS analysis (memoized)
  const match = useMemo(() => analyzeMatch(data, data.jobDesc || ""), [data, data.jobDesc]);

  /* -------------- Render -------------- */
  return (
    <div className="stack" style={{ display: "grid", gap: 12 }}>
      <header className="card card--pad" style={{ display: "grid", gap: 8 }}>
        <div className="sh-row" style={{ alignItems: "center" }}>
          <h1 className="h2" style={{ margin: 0 }}>Resume Builder</h1>
          <div style={{ flex: 1 }} />
          <span className="sh-muted" aria-live="polite" style={{ fontSize: 12 }}>
            {status}
          </span>
        </div>

        {!v.ok && (
          <div className="sh-callout" style={{ marginTop: 0, borderColor: "#b91c1c" }}>
            <strong>Schema error:</strong> {v.errors.join(", ")}
          </div>
        )}

        {loadError && (
          <div
            className="sh-callout"
            style={{ marginTop: 0, borderColor: "#d97706", background: "#fff7ed" }}
          >
            <strong>Loaded with warnings:</strong> {loadError}
          </div>
        )}

        <div className="sh-row" style={{ gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {/* Zoom */}
          <label className="sh-chip" title="Zoom preview">
            Zoom&nbsp;
            <input
              type="range"
              min="70"
              max="140"
              step="5"
              value={zoom}
              onChange={(e) => setZoom(safeNumber(e.target.value, 100))}
            />
            &nbsp;{zoom}%
          </label>

          {/* Shrink to 1-page */}
          <label
            className="sh-chip"
            title="Tighten layout to fit one page"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <input
              type="checkbox"
              checked={!!data.settings?.compact}
              onChange={(e) => update({ settings: { ...(data.settings || {}), compact: e.target.checked } })}
            />
            Shrink to 1-page
          </label>

          {/* Tabs */}
          <button
            className={`sh-btn ${tab === "editor" ? "" : "sh-btn--secondary"}`}
            onClick={() => setTab("editor")}
          >
            ✏️ Edit
          </button>
          <button
            className={`sh-btn ${tab === "preview" ? "" : "sh-btn--secondary"}`}
            onClick={() => setTab("preview")}
          >
            👀 Preview
          </button>

          {/* Visibility quick actions */}
          <span className="sh-chip" title="Hidden sections count">
            🙈 Hidden: {hiddenCount}
          </span>
          <button className="sh-btn sh-btn--secondary" onClick={hideAll}>
            Hide all
          </button>
          <button className="sh-btn sh-btn--secondary" onClick={showAll}>
            Show all
          </button>

          {/* Export / Import */}
          <button className="sh-btn" onClick={printPDF}>
            🖨️ Export PDF
          </button>
          <button className="sh-btn sh-btn--secondary" onClick={exportHTML}>
            ⬇️ Export HTML
          </button>
          <button className="sh-btn sh-btn--secondary" onClick={exportJSON}>
            ⬇️ Export JSON
          </button>
          <label className="sh-btn sh-btn--secondary" role="button" aria-label="Import JSON">
            ⬆️ Import JSON
            <input
              type="file"
              accept="application/json"
              onChange={(e) => importJSON(e.target.files?.[0])}
              style={{ display: "none" }}
            />
          </label>

          <button className="sh-btn sh-btn--soft" onClick={reset}>
            ↺ Reset
          </button>
        </div>
      </header>

      <div className="card card--pad" style={{ display: "grid", gap: 12 }}>
        {/* Template picker */}
        <TemplatePicker
          value={data.settings?.template || "clean"}
          onChange={(template) => update({ settings: { ...(data.settings || {}), template } })}
        />

        {/* Three-column editor shell (collapses in Preview tab) */}
        <div
          className="rb-grid"
          style={{
            display: "grid",
            gridTemplateColumns:
              tab === "editor" ? "minmax(280px, 420px) 1fr minmax(260px, 380px)" : "1fr",
            gap: 12,
          }}
        >
          {tab === "editor" && <EditorPanel data={data} onChange={setData} />}

          <PreviewPanel data={data} zoom={zoom} highlightTerms={match.highlightTerms} />

          {tab === "editor" && (
            <JobMatchPanel
              data={data}
              onChange={setData}
              match={match}
              addSkill={(kw) =>
                setData((d) => ({ ...d, skills: Array.from(new Set([...(d.skills || []), kw])) }))
              }
            />
          )}
        </div>
      </div>

      {/* PRINT STYLES */}
      <style>{printStyles}</style>
      {/* Visual polish for editor */}
      <style>{scopedStyles}</style>
    </div>
  );
}

/* ===========================================================
   Job Match Panel
   =========================================================== */
function JobMatchPanel({ data, onChange, match, addSkill }) {
  const [expanded, setExpanded] = useState(true);
  const missingTop = match.missing.slice(0, 24);

  return (
    <aside className="rb-ats">
      <div
        className="rb-ats-head"
        onClick={() => setExpanded((e) => !e)}
        role="button"
        aria-expanded={expanded}
      >
        <strong>Job Match</strong>
        <span className="rb-ats-score" title="Keyword coverage">
          {match.coveragePct}%
        </span>
      </div>

      {expanded && (
        <div className="rb-ats-body">
          <label className="rb-ats-label">Paste Job Description</label>
          <textarea
            className="rb-textarea"
            rows={10}
            value={data.jobDesc || ""}
            placeholder="Paste the job description here to analyze keywords…"
            onChange={(e) => onChange({ ...data, jobDesc: e.target.value })}
          />

          <div className="rb-ats-metrics">
            <div><b>{match.used.length}</b> matched</div>
            <div><b>{match.missing.length}</b> missing</div>
            <div><b>{match.hardUsed.length}</b> hard skills</div>
            <div><b>{match.softUsed.length}</b> soft signals</div>
          </div>

          {!!missingTop.length && (
            <>
              <div className="rb-ats-sub">Missing (top):</div>
              <div className="rb-kw-chips">
                {missingTop.map((kw, i) => (
                  <button
                    key={i}
                    className="rb-chip rb-chip--ghost"
                    title="Add to Skills"
                    onClick={() => addSkill(kw)}
                  >
                    + {kw}
                  </button>
                ))}
              </div>
            </>
          )}

          {!!match.used.length && (
            <>
              <div className="rb-ats-sub" style={{ marginTop: 8 }}>Matched:</div>
              <div className="rb-kw-list">
                {match.used.slice(0, 60).map((kw, i) => (
                  <span key={i}>{kw}</span>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </aside>
  );
}

/* ===========================================================
   Editor Panel (left column)
   =========================================================== */
function EditorPanel({ data, onChange }) {
  const patch = (k, v) => onChange({ ...data, [k]: v });
  const patchContact = (k, v) => onChange({ ...data, contact: { ...data.contact, [k]: v } });

  const addLink = () => {
    const next = [...(data.contact.links || []), { label: "Website", url: "https://example.com" }];
    onChange({ ...data, contact: { ...data.contact, links: next } });
  };
  const delLink = (i) => {
    const next = (data.contact.links || []).filter((_, idx) => idx !== i);
    onChange({ ...data, contact: { ...data.contact, links: next } });
  };

  const addSection = (type = "custom") => {
    const title = type === "custom" ? "Section" : type[0].toUpperCase() + type.slice(1);
    const s = { type, title, items: [], hidden: false };
    onChange({ ...data, sections: [...(data.sections || []), s] });
  };

  const moveSection = (i, dir) => {
    const j = i + dir;
    const arr = data.sections || [];
    if (j < 0 || j >= arr.length) return;
    const next = deepClone(arr);
    [next[i], next[j]] = [next[j], next[i]];
    onChange({ ...data, sections: next });
  };

  const delSection = (i) => {
    if (!confirm("Delete this section?")) return;
    const next = (data.sections || []).filter((_, idx) => idx !== i);
    onChange({ ...data, sections: next });
  };

  const toggleHidden = (i) => {
    const next = deepClone(data.sections || []);
    next[i].hidden = !next[i].hidden;
    onChange({ ...data, sections: next });
  };

  // Summary readability
  const grade = fkGrade(data.summary || "");
  const gradeLabel =
    grade <= 6 ? "Very easy" : grade <= 9 ? "Easy" : grade <= 12 ? "OK" : "Hard (simplify)";

  return (
    <aside style={{ display: "grid", gap: 10 }}>
      <fieldset className="rb-fieldset">
        <legend>Header</legend>
        <input
          className="rb-input"
          value={data.name || ""}
          onChange={(e) => patch("name", e.target.value)}
          placeholder="Full Name"
        />
        <input
          className="rb-input"
          value={data.title || ""}
          onChange={(e) => patch("title", e.target.value)}
          placeholder="Target Title"
        />
        <div className="rb-grid2">
          <input
            className="rb-input"
            value={data.contact?.email || ""}
            onChange={(e) => patchContact("email", e.target.value)}
            placeholder="Email"
          />
          <input
            className="rb-input"
            value={data.contact?.phone || ""}
            onChange={(e) => patchContact("phone", e.target.value)}
            placeholder="Phone"
          />
        </div>
        <input
          className="rb-input"
          value={data.contact?.location || ""}
          onChange={(e) => patchContact("location", e.target.value)}
          placeholder="Location"
        />

        {/* Links */}
        <div style={{ display: "grid", gap: 6 }}>
          {(data.contact?.links || []).map((l, i) => (
            <div key={i} className="rb-grid2" style={{ gridTemplateColumns: "1fr auto" }}>
              <input
                className="rb-input"
                value={l.label}
                onChange={(e) => {
                  const next = deepClone(data.contact.links || []);
                  next[i].label = e.target.value;
                  onChange({ ...data, contact: { ...data.contact, links: next } });
                }}
                placeholder="Label (LinkedIn)"
              />
              <input
                className="rb-input"
                value={l.url}
                onChange={(e) => {
                  const next = deepClone(data.contact.links || []);
                  next[i].url = e.target.value;
                  onChange({ ...data, contact: { ...data.contact, links: next } });
                }}
                placeholder="URL"
              />
              <button className="sh-btn sh-btn--tiny" onClick={() => delLink(i)} aria-label="Remove link">
                ✕
              </button>
            </div>
          ))}
          <button className="sh-btn sh-btn--secondary sh-btn--tiny" onClick={addLink}>
            ＋ Add link
          </button>
        </div>
      </fieldset>

      <fieldset className="rb-fieldset">
        <legend>Summary</legend>
        <textarea
          className="rb-textarea"
          rows={4}
          value={data.summary || ""}
          onChange={(e) => patch("summary", e.target.value)}
          placeholder="Brief summary…"
        />
        <div className="subtle" style={{ fontSize: 12 }}>
          Readability grade: <b>{grade}</b> — <span>{gradeLabel}</span>
        </div>
      </fieldset>

      <fieldset className="rb-fieldset">
        <legend>Skills</legend>
        <TagEditor
          tags={data.skills || []}
          onChange={(skills) => patch("skills", skills)}
          placeholder="Add a skill and press Enter"
        />
      </fieldset>

      <fieldset className="rb-fieldset">
        <legend>Sections</legend>
        <div style={{ display: "grid", gap: 8 }}>
          {(data.sections || []).map((s, i) => (
            <SectionEditor
              key={i}
              data={s}
              onChange={(section) => {
                const next = deepClone(data.sections || []);
                next[i] = section;
                onChange({ ...data, sections: next });
              }}
              onMoveUp={() => moveSection(i, -1)}
              onMoveDown={() => moveSection(i, +1)}
              onDelete={() => delSection(i)}
              onToggleHidden={() => toggleHidden(i)}
            />
          ))}
        </div>
        <div className="sh-row" style={{ gap: 6, flexWrap: "wrap" }}>
          <button className="sh-btn sh-btn--secondary sh-btn--tiny" onClick={() => addSection("experience")}>
            ＋ Experience
          </button>
          <button className="sh-btn sh-btn--secondary sh-btn--tiny" onClick={() => addSection("projects")}>
            ＋ Projects
          </button>
          <button className="sh-btn sh-btn--secondary sh-btn--tiny" onClick={() => addSection("education")}>
            ＋ Education
          </button>
          <button className="sh-btn sh-btn--secondary sh-btn--tiny" onClick={() => addSection("certs")}>
            ＋ Certifications
          </button>
          <button className="sh-btn sh-btn--secondary sh-btn--tiny" onClick={() => addSection("custom")}>
            ＋ Custom
          </button>
        </div>
      </fieldset>
    </aside>
  );
}

/* ===========================================================
   Template Picker
   =========================================================== */
function TemplatePicker({ value, onChange }) {
  return (
    <div>
      <div className="sh-row" style={{ alignItems: "center", marginBottom: 6, gap: 8 }}>
        <strong>Template</strong>
        <span className="subtle">Choose a style optimized for ATS & readability</span>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap: 8 }}>
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            className="tmpl-card"
            aria-pressed={value === t.id ? "true" : "false"}
            onClick={() => onChange(t.id)}
          >
            <div className="tmpl-title">{t.name}</div>
            <div className="tmpl-desc">{t.desc}</div>
            {value === t.id && <span className="tmpl-badge">Selected</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ===========================================================
   Tag Editor
   =========================================================== */
function TagEditor({ tags, onChange, placeholder }) {
  const [text, setText] = useState("");

  const add = () => {
    const v = text.trim();
    if (!v) return;
    onChange([...(tags || []), v]);
    setText("");
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      add();
    }
  };

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div className="rb-chips">
        {(tags || []).map((t, i) => (
          <span key={i} className="rb-chip">
            {t}
            <button
              className="rb-chip-x"
              onClick={() => onChange(tags.filter((_, j) => j !== i))}
              aria-label="Remove"
            >
              ✕
            </button>
          </span>
        ))}
      </div>
      <div className="rb-grid2" style={{ gridTemplateColumns: "1fr auto" }}>
        <input
          className="rb-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
        />
        <button className="sh-btn sh-btn--secondary sh-btn--tiny" onClick={add}>
          Add
        </button>
      </div>
    </div>
  );
}

/* ===========================================================
   Section Editor
   =========================================================== */
function SectionEditor({ data, onChange, onMoveUp, onMoveDown, onDelete, onToggleHidden }) {
  const addItem = () => {
    const base =
      data.type === "experience"
        ? { role: "Role", company: "Company", location: "", dates: "Year — Year", bullets: ["Impact bullet"] }
        : data.type === "projects"
        ? { name: "Project", link: "", bullets: ["What you built / impact"] }
        : data.type === "education"
        ? { school: "School", degree: "Degree/Certificate", dates: "Year", details: "" }
        : data.type === "certs"
        ? { name: "Certification", issuer: "Issuer", year: "Year" }
        : { title: "Item Title", bullets: ["Detail"] };
    onChange({ ...data, items: [...(data.items || []), base] });
  };

  const editItem = (i, patchObj) => {
    const next = deepClone(data.items || []);
    next[i] = { ...next[i], ...patchObj };
    onChange({ ...data, items: next });
  };

  const delItem = (i) => {
    const next = (data.items || []).filter((_, idx) => idx !== i);
    onChange({ ...data, items: next });
  };

  const eye = data.hidden ? "🙈" : "👁️";

  return (
    <div className={`rb-section ${data.hidden ? "rb-section--hidden" : ""}`}>
      <div className="sh-row" style={{ alignItems: "center", gap: 8 }}>
        <input
          className="rb-input"
          value={data.title}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          placeholder="Section title"
        />
        <span className="subtle" style={{ fontSize: 12 }}>{data.type}</span>
        <div style={{ flex: 1 }} />
        <button className="sh-btn sh-btn--tiny" onClick={onToggleHidden} title={data.hidden ? "Show section" : "Hide section"}>
          {eye}
        </button>
        <button className="sh-btn sh-btn--tiny" onClick={onMoveUp} title="Move up">↑</button>
        <button className="sh-btn sh-btn--tiny" onClick={onMoveDown} title="Move down">↓</button>
        <button className="sh-btn sh-btn--tiny" onClick={onDelete} title="Delete">✕</button>
      </div>

      <div style={{ display: "grid", gap: 8, opacity: data.hidden ? 0.6 : 1 }}>
        {(data.items || []).map((it, i) => (
          <div key={i} className="rb-item">
            {data.type === "experience" && (
              <>
                <div className="rb-grid2">
                  <input className="rb-input" value={it.role} onChange={(e) => editItem(i, { role: e.target.value })} placeholder="Role" />
                  <input className="rb-input" value={it.company} onChange={(e) => editItem(i, { company: e.target.value })} placeholder="Company" />
                </div>
                <div className="rb-grid2">
                  <input className="rb-input" value={it.location || ""} onChange={(e) => editItem(i, { location: e.target.value })} placeholder="Location" />
                  <input className="rb-input" value={it.dates} onChange={(e) => editItem(i, { dates: e.target.value })} placeholder="Dates" />
                </div>
                <BulletsEditor value={it.bullets || []} onChange={(bullets) => editItem(i, { bullets })} />
              </>
            )}

            {data.type === "projects" && (
              <>
                <input className="rb-input" value={it.name} onChange={(e) => editItem(i, { name: e.target.value })} placeholder="Project name" />
                <input className="rb-input" value={it.link || ""} onChange={(e) => editItem(i, { link: e.target.value })} placeholder="Link (optional)" />
                <BulletsEditor value={it.bullets || []} onChange={(bullets) => editItem(i, { bullets })} />
              </>
            )}

            {data.type === "education" && (
              <>
                <input className="rb-input" value={it.school} onChange={(e) => editItem(i, { school: e.target.value })} placeholder="School" />
                <input className="rb-input" value={it.degree} onChange={(e) => editItem(i, { degree: e.target.value })} placeholder="Degree/Cert" />
                <input className="rb-input" value={it.dates} onChange={(e) => editItem(i, { dates: e.target.value })} placeholder="Year(s)" />
                <input className="rb-input" value={it.details || ""} onChange={(e) => editItem(i, { details: e.target.value })} placeholder="Details (optional)" />
              </>
            )}

            {data.type === "certs" && (
              <div className="rb-grid2" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <input className="rb-input" value={it.name} onChange={(e) => editItem(i, { name: e.target.value })} placeholder="Certification" />
                <input className="rb-input" value={it.issuer || ""} onChange={(e) => editItem(i, { issuer: e.target.value })} placeholder="Issuer" />
                <input className="rb-input" value={it.year || ""} onChange={(e) => editItem(i, { year: e.target.value })} placeholder="Year" />
              </div>
            )}

            {data.type === "custom" && (
              <>
                <input className="rb-input" value={it.title || ""} onChange={(e) => editItem(i, { title: e.target.value })} placeholder="Item title" />
                <BulletsEditor value={it.bullets || []} onChange={(bullets) => editItem(i, { bullets })} />
              </>
            )}

            <div>
              <button className="sh-btn sh-btn--secondary sh-btn--tiny" onClick={() => delItem(i)}>
                Delete item
              </button>
            </div>
          </div>
        ))}

        <button className="sh-btn sh-btn--secondary sh-btn--tiny" onClick={addItem}>＋ Add item</button>
      </div>

      {data.hidden && <div className="subtle" style={{ fontSize: 12 }}>Section hidden from preview/export</div>}
    </div>
  );
}

/* ===========================================================
   Bullets Editor + Coach
   =========================================================== */
function BulletsEditor({ value, onChange }) {
  const [text, setText] = useState((value || []).join("\n"));
  const [coachOpen, setCoachOpen] = useState(false);

  useEffect(() => {
    setText((value || []).join("\n"));
  }, [value]);

  const sync = (t) => {
    setText(t);
    const bullets = t.split("\n").map((s) => s.trim()).filter(Boolean);
    onChange(bullets);
  };

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div className="sh-row" style={{ justifyContent: "space-between" }}>
        <span className="subtle" style={{ fontSize: 12 }}>One bullet per line. Start with a strong verb and quantify results.</span>
        <button className="sh-btn sh-btn--tiny" onClick={() => setCoachOpen(true)}>🧠 Bullet Coach</button>
      </div>
      <textarea
        className="rb-textarea"
        rows={5}
        value={text}
        onChange={(e) => sync(e.target.value)}
        placeholder="One bullet per line, start with a verb and quantify results."
      />
      {coachOpen && (
        <BulletCoachModal
          onClose={() => setCoachOpen(false)}
          onInsert={(b) => {
            const next = (text ? text + "\n" : "") + b;
            sync(next);
            setCoachOpen(false);
          }}
        />
      )}
    </div>
  );
}

function BulletCoachModal({ onClose, onInsert }) {
  const [verb, setVerb] = useState("Led");
  const [what, setWhat] = useState("");
  const [how, setHow] = useState("");
  const [result, setResult] = useState("");
  const [metric, setMetric] = useState("");

  const verbs = ["Led", "Built", "Launched", "Optimized", "Automated", "Reduced", "Increased", "Implemented", "Delivered", "Designed"];

  const generate = () => {
    const parts = [];
    parts.push(`${verb} ${what}`.trim());
    if (how) parts.push(`using ${how}`);
    if (result || metric) {
      const res = [result, metric].filter(Boolean).join(" ");
      parts.push(`resulting in ${res}`);
    }
    return parts.join(", ") + ".";
  };

  return (
    <div className="rb-modal" role="dialog" aria-modal="true" aria-label="Bullet Coach">
      <div className="rb-modal-card">
        <div className="rb-modal-head">
          <strong>Bullet Coach</strong>
          <button className="rb-x" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="rb-modal-body">
          <div className="rb-grid2">
            <label className="rb-label">Action Verb</label>
            <select className="rb-input" value={verb} onChange={(e) => setVerb(e.target.value)}>
              {verbs.map((v) => <option key={v}>{v}</option>)}
            </select>

            <label className="rb-label">What</label>
            <input className="rb-input" value={what} onChange={(e) => setWhat(e.target.value)} placeholder="e.g., a CRM onboarding flow" />

            <label className="rb-label">How / Tools</label>
            <input className="rb-input" value={how} onChange={(e) => setHow(e.target.value)} placeholder="e.g., React, SQL, Zapier" />

            <label className="rb-label">Result</label>
            <input className="rb-input" value={result} onChange={(e) => setResult(e.target.value)} placeholder="e.g., faster onboarding" />
          </div>

          <div>
            <label className="rb-label">Metric (number/%/time)</label>
            <input className="rb-input" value={metric} onChange={(e) => setMetric(e.target.value)} placeholder="e.g., 34% or 2 hours/week" />
          </div>

          <div className="rb-preview">
            <div className="rb-label">Preview</div>
            <div className="rb-preview-box">{generate()}</div>
          </div>
        </div>
        <div className="rb-modal-foot">
          <button className="sh-btn sh-btn--secondary" onClick={onClose}>Cancel</button>
          <button className="sh-btn" onClick={() => onInsert(generate())}>Insert Bullet</button>
        </div>
      </div>
    </div>
  );
}

/* ===========================================================
   Preview Panel + Highlighting
   =========================================================== */
function PreviewPanel({ data, zoom, highlightTerms }) {
  const template = data.settings?.template || "clean";
  const visibleSections = (data.sections || []).filter((s) => !s.hidden);
  const dataForPreview = { ...data, sections: visibleSections };

  return (
    <div style={{ overflow: "auto" }}>
      <div
        className={`resume theme-${template}`}
        style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top left" }}
      >
        <ResumeDocument data={dataForPreview} highlightTerms={highlightTerms} />
      </div>
    </div>
  );
}

// highlight helper
function renderWithHighlights(text, terms = []) {
  if (!terms || !terms.length || !text) return text;
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(${escaped.join("|")})`, "ig");
  const html = String(text).replace(re, '<mark class="kw">$1</mark>');
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

/* ===========================================================
   Resume Document (Preview)
   =========================================================== */
function ResumeDocument({ data, highlightTerms }) {
  const c = data.contact || {};
  const accent = data.settings?.accent || "#111827";
  const template = data.settings?.template || "clean";

  return (
    <article className="resume-a4" data-template={template} style={{ "--accent": accent }}>
      {/* Header */}
      <header className="r-header">
        <h1 className="r-name">{data.name || "Your Name"}</h1>
        {!!data.title && <div className="r-title">{renderWithHighlights(data.title, highlightTerms)}</div>}
        <div className="r-contact">
          {c.email && <span>{c.email}</span>}
          {c.phone && <span>{c.phone}</span>}
          {c.location && <span>{c.location}</span>}
          {(c.links || []).map((l, i) => (
            <span key={i}>
              {l.label}
              {l.url ? ` · ${l.url}` : ""}
            </span>
          ))}
        </div>
      </header>

      {/* Summary */}
      {data.summary && (
        <section className="r-sec">
          <h2 className="r-h2">Summary</h2>
          <p className="r-p">{renderWithHighlights(data.summary, highlightTerms)}</p>
        </section>
      )}

      {/* Skills */}
      {(data.skills || []).length > 0 && (
        <section className="r-sec">
          <h2 className="r-h2">Skills</h2>
          <ul className="r-tags">
            {data.skills.map((s, i) => (
              <li key={i}>{renderWithHighlights(s, highlightTerms)}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Dynamic sections */}
      {(data.sections || []).map((s, si) => (
        <section className="r-sec" key={si}>
          <h2 className="r-h2">{s.title || (s.type?.[0]?.toUpperCase() + s.type?.slice(1)) || "Section"}</h2>

          {s.type === "experience" &&
            (s.items || []).map((it, i) => (
              <div className="r-block" key={i}>
                <div className="r-block-top">
                  <div className="r-strong">{renderWithHighlights(it.role || "", highlightTerms)}</div>
                  <div className="r-meta">
                    {renderWithHighlights([it.company, it.location].filter(Boolean).join(" · "), highlightTerms)}
                  </div>
                  <div className="r-dates">{it.dates}</div>
                </div>
                {(it.bullets || []).length > 0 && (
                  <ul className="r-ul">
                    {(it.bullets || []).map((b, bi) => (
                      <li key={bi}>{renderWithHighlights(b, highlightTerms)}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

          {s.type === "projects" &&
            (s.items || []).map((it, i) => (
              <div className="r-block" key={i}>
                <div className="r-strong">{renderWithHighlights(it.name || "", highlightTerms)}</div>
                <div className="r-meta">{renderWithHighlights(it.link || "", highlightTerms)}</div>
              </div>
            ))}

          {s.type === "education" &&
            (s.items || []).map((it, i) => (
              <div className="r-block" key={i}>
                <div className="r-strong">{renderWithHighlights(it.school || "", highlightTerms)}</div>
                <div className="r-meta">{renderWithHighlights(it.degree || "", highlightTerms)}</div>
                {it.details && <p className="r-p">{renderWithHighlights(it.details, highlightTerms)}</p>}
              </div>
            ))}

          {s.type === "certs" && (
            <ul className="r-ul flat">
              {(s.items || []).map((it, i) => (
                <li key={i}>
                  {renderWithHighlights([it.name, it.issuer, it.year].filter(Boolean).join(" — "), highlightTerms)}
                </li>
              ))}
            </ul>
          )}

          {s.type === "custom" &&
            (s.items || []).map((it, i) => (
              <div className="r-block" key={i}>
                {it.title && <div className="r-strong">{renderWithHighlights(it.title, highlightTerms)}</div>}
                {(it.bullets || []).length > 0 && (
                  <ul className="r-ul">
                    {(it.bullets || []).map((b, bi) => (
                      <li key={bi}>{renderWithHighlights(b, highlightTerms)}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
        </section>
      ))}
    </article>
  );
}

/* ===========================================================
   Printable HTML Export (skips hidden sections)
   =========================================================== */
function renderPrintableHTML(data) {
  const visible = (data.sections || []).filter((s) => !s.hidden);
  const c = data.contact || {};
  const template = data.settings?.template || "clean";
  const accent = data.settings?.accent || "#111827";

  const lines = [];
  const push = (s) => lines.push(s);

  push(
    `<article class="resume-a4" data-template="${escapeHtml(template)}" style="--accent:${escapeHtml(accent)}">`
  );
  push(`<header class="r-header">`);
  push(`<h1 class="r-name">${escapeHtml(data.name || "Your Name")}</h1>`);
  if (data.title) push(`<div class="r-title">${escapeHtml(data.title)}</div>`);
  const contactBits = [
    c.email && escapeHtml(c.email),
    c.phone && escapeHtml(c.phone),
    c.location && escapeHtml(c.location),
    ...(c.links || []).map((l) => escapeHtml(l.label + (l.url ? ` · ${l.url}` : ""))),
  ].filter(Boolean);
  push(`<div class="r-contact">${contactBits.map((x) => `<span>${x}</span>`).join("")}</div>`);
  push(`</header>`);

  if (data.summary) {
    push(
      `<section class="r-sec"><h2 class="r-h2">Summary</h2><p class="r-p">${escapeHtml(data.summary)}</p></section>`
    );
  }

  if ((data.skills || []).length) {
    push(
      `<section class="r-sec"><h2 class="r-h2">Skills</h2><ul class="r-tags">${data.skills
        .map((s) => `<li>${escapeHtml(s)}</li>`)
        .join("")}</ul></section>`
    );
  }

  visible.forEach((s) => {
    const title = s.title || (s.type?.[0]?.toUpperCase() + s.type?.slice(1)) || "Section";
    push(`<section class="r-sec"><h2 class="r-h2">${escapeHtml(title)}</h2>`);
    if (s.type === "experience") {
      (s.items || []).forEach((it) => {
        push(
          `<div class="r-block"><div class="r-block-top">` +
            `<div class="r-strong">${escapeHtml(it.role || "")}</div>` +
            `<div class="r-meta">${escapeHtml([it.company, it.location].filter(Boolean).join(" · "))}</div>` +
            `<div class="r-dates">${escapeHtml(it.dates || "")}</div>` +
            `</div>`
        );
        if ((it.bullets || []).length) {
          push(`<ul class="r-ul">${it.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>`);
        }
        push(`</div>`);
      });
    } else if (s.type === "projects") {
      (s.items || []).forEach((it) => {
        push(
          `<div class="r-block">` +
            `<div class="r-strong">${escapeHtml(it.name || "")}</div>` +
            `<div class="r-meta">${escapeHtml(it.link || "")}</div>` +
          `</div>`
        );
      });
    } else if (s.type === "education") {
      (s.items || []).forEach((it) => {
        push(
          `<div class="r-block">` +
            `<div class="r-strong">${escapeHtml(it.school || "")}</div>` +
            `<div class="r-meta">${escapeHtml(it.degree || "")}</div>` +
          `</div>`
        );
        if (it.details) push(`<p class="r-p">${escapeHtml(it.details)}</p>`);
      });
    } else if (s.type === "certs") {
      push(
        `<ul class="r-ul flat">${(s.items || [])
          .map((it) => `<li>${escapeHtml([it.name, it.issuer, it.year].filter(Boolean).join(" — "))}</li>`)
          .join("")}</ul>`
      );
    } else {
      (s.items || []).forEach((it) => {
        push(`<div class="r-block">`);
        if (it.title) push(`<div class="r-strong">${escapeHtml(it.title)}</div>`);
        if ((it.bullets || []).length)
          push(`<ul class="r-ul">${it.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>`);
        push(`</div>`);
      });
    }
    push(`</section>`);
  });

  push(`</article>`);

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escapeHtml(data.name || "Resume")} – Resume</title>
<style>${printStyles}</style>
<style>${scopedStyles}</style>
</head>
<body class="export">
  <div class="resume theme-${escapeHtml(template)}">
    ${lines.join("\n")}
  </div>
</body>
</html>`;
}

/* ===========================================================
   Styles (print + editor)
   =========================================================== */
const printStyles = `
@media print {
  @page { size: A4; margin: 16mm; }
  body { background: #fff !important; }
  header.card, .sh-row button, .sh-row input, .sh-row label, .rb-fieldset, .tmpl-card, .rb-chips, .rb-grid, .rb-grid2 { display: none !important; }
  .resume { transform: none !important; }
}
.resume { width: 210mm; }
.resume-a4 { width: 210mm; min-height: 297mm; background: #fff; color: #111; padding: 16mm 14mm; border: 1px solid var(--ring,#eee); border-radius: 8px; }
.r-header { text-align: left; margin-bottom: 10px; }
.r-name { font-size: 28px; line-height: 1; margin: 0; font-weight: 800; letter-spacing: 0.2px; }
.r-title { font-size: 14px; color: #444; margin-top: 4px; }
.r-contact { font-size: 12px; color: #555; display: flex; gap: 10px; flex-wrap: wrap; margin-top: 6px; }
.r-sec { margin-top: 14px; }
.r-h2 { font-size: 13px; letter-spacing: .6px; text-transform: uppercase; color: #222; margin: 0 0 6px; border-bottom: 1px solid #eee; padding-bottom: 3px; }
.r-p { font-size: 12.5px; margin: 0; color: #222; }
.r-tags { list-style: none; padding: 0; margin: 0; display: flex; gap: 6px; flex-wrap: wrap; }
.r-tags li { font-size: 12px; border: 1px solid #e5e7eb; padding: 3px 8px; border-radius: 999px; }
.r-block { margin-top: 8px; }
.r-block-top { display: grid; grid-template-columns: 1fr auto; gap: 6px; align-items: baseline; }
.r-strong { font-weight: 700; font-size: 12.8px; }
.r-meta { color: #555; font-size: 12px; }
.r-dates { font-size: 12px; color: #333; }
.r-ul { margin: 4px 0 0 16px; }
.r-ul li { font-size: 12.5px; margin-bottom: 4px; }
.r-ul.flat { margin-left: 16px; }
/* theme tweaks */
.theme-modern .r-h2 { border-bottom-color: #ff4f00; }
.theme-modern .r-name { color: #ff4f00; }
.theme-compact .r-tags li, .theme-compact .r-h2 { border-color: #ccc; }
/* highlight marks used by Job Match */
.kw { background: rgba(255,79,0,.15); padding: 0 .12em; border-radius: 4px; }
`;

const scopedStyles = `
.rb-fieldset{border:1px solid var(--ring,#e5e7eb);border-radius:10px;padding:10px;display:grid;gap:8px}
.rb-input,.rb-textarea,select{border:1px solid var(--ring,#e5e7eb);border-radius:10px;padding:8px;background:var(--card,#fff);font-size:14px}
.rb-grid2{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.rb-section{border:1px dashed var(--ring,#e5e7eb);border-radius:10px;padding:8px;display:grid;gap:6px;background:var(--card,#fff)}
.rb-section--hidden{background:linear-gradient(0deg, rgba(255,79,0,0.06), rgba(255,79,0,0.06)) , var(--card,#fff); border-style:solid}
.rb-item{border:1px solid var(--ring,#e5e7eb);border-radius:10px;padding:8px;display:grid;gap:6px}
.rb-chips{display:flex;flex-wrap:wrap;gap:6px}
.rb-chip{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--ring);border-radius:999px;padding:4px 8px}
.rb-chip-x{border:none;background:transparent;cursor:pointer}
.tmpl-card{position:relative;border:1px solid var(--ring,#e5e7eb);border-radius:10px;padding:10px;background:#fff;text-align:left;cursor:pointer}
.tmpl-card[aria-pressed="true"]{outline:2px solid #111; outline-offset:-2px}
.tmpl-title{font-weight:700}
.tmpl-desc{font-size:12px;color:#555}
.tmpl-badge{position:absolute;right:8px;top:8px;font-size:11px;background:#111;color:#fff;border-radius:8px;padding:2px 6px}
.resume{background:transparent}
/* Job Match Panel */
.rb-ats{border:1px solid var(--ring,#e5e7eb);border-radius:10px;padding:10px;display:grid;gap:8px;background:var(--card,#fff);align-self:start}
.rb-ats-head{display:flex;align-items:center;justify-content:space-between;cursor:pointer}
.rb-ats-score{font-weight:800;border:1px solid var(--ring);border-radius:999px;padding:2px 8px}
.rb-ats-label{font-size:12px;color:#444}
.rb-ats-body{display:grid;gap:8px}
.rb-ats-metrics{display:flex;gap:10px;flex-wrap:wrap;font-size:13px}
.rb-ats-sub{font-size:12px;color:#444}
.rb-kw-chips{display:flex;flex-wrap:wrap;gap:6px}
.rb-chip--ghost{background:#fff;border-style:dashed}
.rb-kw-list{display:flex;flex-wrap:wrap;gap:8px;font-size:12px;color:#333}
/* Bullet Coach modal */
.rb-modal{position:fixed;inset:0;background:rgba(15,23,42,.45);display:flex;align-items:center;justify-content:center;z-index:50}
.rb-modal-card{width:min(720px,94vw);background:#fff;border-radius:14px;box-shadow:0 20px 60px rgba(2,6,23,.4);display:grid}
.rb-modal-head{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border-bottom:1px solid var(--ring,#e5e7eb)}
.rb-modal-body{display:grid;gap:10px;padding:12px 14px}
.rb-modal-foot{display:flex;justify-content:flex-end;gap:8px;padding:10px 14px;border-top:1px solid var(--ring,#e5e7eb)}
.rb-label{display:block;font-size:12px;color:#555;margin-bottom:4px}
.rb-x{border:none;background:transparent;font-size:16px;cursor:pointer}
.rb-preview{display:grid;gap:6px}
.rb-preview-box{border:1px dashed var(--ring);border-radius:10px;padding:10px;background:#fafafa;font-size:14px}
`;

/* ===========================================================
   Award hook: auto-award on Export PDF clicks (safe IIFE)
   =========================================================== */
if (typeof window !== "undefined") {
  (function SHF_ResumeExportAwardHook() {
    if (window.__shfResumeExportHooked) return;
    window.__shfResumeExportHooked = true;

    function awardResumeExport(meta = {}) {
      try {
        const payload = {
          action: "resume.export",
          rewards: { heart: 1 },
          scoreDelta: 5,
          meta: { surface: "ResumeBuilder", via: "auto-hook", ...meta },
        };
        if (window.shfCredit?.earn) {
          window.shfCredit.earn(payload);
        } else {
          window.dispatchEvent(new CustomEvent("shf-credit-earn", { detail: payload }));
        }
        window.shToast?.("✅ Exported: +1 ❤️ · +5 score");
      } catch {}
    }

    // basic text/label matcher
    function isExportPdfElement(el) {
      if (!el) return false;
      const txt = (el.textContent || "").toLowerCase();
      const aria = (el.getAttribute?.("aria-label") || "").toLowerCase();
      const title = (el.getAttribute?.("title") || "").toLowerCase();
      const blob = `${txt} ${aria} ${title}`;
      return blob.includes("export") && blob.includes("pdf");
    }

    let lastAwardTs = 0;
    function onClickOnce() {
      const now = Date.now();
      if (now - lastAwardTs < 1500) return; // throttle quick double clicks
      lastAwardTs = now;
      awardResumeExport();
    }

    function scanAndHook(root = document) {
      const candidates = Array.from(
        root.querySelectorAll('button, a, [role="button"], [data-action], [data-test]')
      );
      for (const el of candidates) {
        if (el.__shfHooked) continue;
        if (!isExportPdfElement(el)) continue;
        el.addEventListener("click", onClickOnce, { passive: true });
        el.__shfHooked = true;
      }
    }

    // initial scan + observe future changes
    scanAndHook(document);
    const mo = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === "childList") {
          m.addedNodes?.forEach((n) => {
            if (n.nodeType === 1) scanAndHook(n);
          });
        }
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener("beforeunload", () => mo.disconnect());
  })();
}
