// src/pages/resume-builder/ResumeEditor.jsx
// Resume Editor workspace: touch-friendly accordion sections used on every
// breakpoint (desktop column, tablet "Edit" workspace, mobile "Edit" tab).
import React, { useEffect, useId, useRef, useState } from "react";
import { deepClone, fkGrade, readabilityLabel } from "./store.js";

/* ===========================================================
   Accordion row shell
   =========================================================== */
function AccordionRow({
  icon,
  title,
  subtitle,
  expanded,
  onToggleExpand,
  hidden,
  onToggleHidden,
  panelId,
  headerId,
  children,
  titleEditable,
  editableTitle = false,
}) {
  // Editable-title rows (dynamic sections) render the <input> in a plain
  // div — an <input> nested inside a <button> is invalid HTML and breaks
  // click/focus behavior, so those rows expand only via the chevron button.
  return (
    <div className={`rb2-row ${hidden ? "rb2-row--hidden" : ""}`}>
      <div className="rb2-rowHead">
        <span className="rb2-drag" aria-hidden="true">⠿</span>
        <span className="rb2-rowIcon" aria-hidden="true">{icon}</span>
        {editableTitle ? (
          <div className="rb2-rowTitleBtn rb2-rowTitleBtn--static" id={headerId}>
            <span className="rb2-rowTitle">{titleEditable}</span>
            {!expanded && subtitle ? <span className="rb2-rowSubtitle">{subtitle}</span> : null}
          </div>
        ) : (
          <button
            type="button"
            className="rb2-rowTitleBtn"
            id={headerId}
            aria-expanded={expanded}
            aria-controls={panelId}
            aria-label={!expanded && subtitle ? `${title}: ${subtitle}` : title}
            onClick={onToggleExpand}
          >
            <span className="rb2-rowTitle" aria-hidden="true">{titleEditable}</span>
            {!expanded && subtitle ? <span className="rb2-rowSubtitle" aria-hidden="true">{subtitle}</span> : null}
          </button>
        )}
        <div className="rb2-rowActions">
          {onToggleHidden && (
            <button
              type="button"
              className="rb2-iconBtn"
              onClick={onToggleHidden}
              aria-pressed={!!hidden}
              aria-label={hidden ? `Show ${title} in preview` : `Hide ${title} from preview`}
              title={hidden ? "Hidden — click to show" : "Visible — click to hide"}
            >
              {hidden ? "🙈" : "👁️"}
            </button>
          )}
          <button
            type="button"
            className="rb2-iconBtn"
            onClick={onToggleExpand}
            aria-expanded={expanded}
            aria-controls={panelId}
            aria-label={expanded ? `Collapse ${title}` : `Expand ${title}`}
          >
            <span className={`rb2-chevron ${expanded ? "is-open" : ""}`} aria-hidden="true">⌄</span>
          </button>
        </div>
      </div>
      {expanded && (
        <div className="rb2-rowBody" id={panelId} role="region" aria-labelledby={headerId}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ===========================================================
   Tag editor (Skills)
   =========================================================== */
function TagEditor({ tags, onChange, placeholder }) {
  const [text, setText] = useState("");
  const add = () => {
    const v = text.trim();
    if (!v) return;
    onChange([...(tags || []), v]);
    setText("");
  };
  return (
    <div className="rb2-stack">
      <div className="rb2-chips">
        {(tags || []).length === 0 && <span className="rb2-emptyHint">No skills added yet.</span>}
        {(tags || []).map((t, i) => (
          <span key={i} className="rb2-chip">
            {t}
            <button
              type="button"
              className="rb2-chipX"
              onClick={() => onChange(tags.filter((_, j) => j !== i))}
              aria-label={`Remove skill ${t}`}
            >
              ✕
            </button>
          </span>
        ))}
      </div>
      <div className="rb2-inline">
        <input
          className="rb2-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          aria-label="Add a skill"
        />
        <button type="button" className="rb2-btn rb2-btn--secondary" onClick={add}>
          Add
        </button>
      </div>
    </div>
  );
}

/* ===========================================================
   Bullets editor + Bullet Coach
   =========================================================== */
function BulletsEditor({ value, onChange, label }) {
  const [text, setText] = useState((value || []).join("\n"));
  const [coachOpen, setCoachOpen] = useState(false);
  const coachTriggerRef = useRef(null);

  useEffect(() => {
    setText((value || []).join("\n"));
  }, [value]);

  const sync = (t) => {
    setText(t);
    onChange(t.split("\n").map((s) => s.trim()).filter(Boolean));
  };

  return (
    <div className="rb2-stack">
      <div className="rb2-bulletCoachRow">
        <button
          type="button"
          ref={coachTriggerRef}
          className="rb2-coachBtn"
          onClick={() => setCoachOpen(true)}
        >
          <span aria-hidden="true">✨</span> Bullet Coach
          <span className="rb2-coachHint">Get AI suggestions to make your bullets stronger.</span>
        </button>
      </div>
      <label className="rb2-label sh-srOnly" htmlFor={undefined}>{label || "Bullets"}</label>
      <textarea
        className="rb2-textarea"
        rows={5}
        value={text}
        onChange={(e) => sync(e.target.value)}
        placeholder="One bullet per line — start with a verb and quantify results…"
        aria-label={label || "Bullets, one per line"}
      />
      {coachOpen && (
        <BulletCoachModal
          onClose={() => {
            setCoachOpen(false);
            coachTriggerRef.current?.focus();
          }}
          onInsert={(b) => {
            const next = (text ? text + "\n" : "") + b;
            sync(next);
            setCoachOpen(false);
            coachTriggerRef.current?.focus();
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
  const dialogRef = useRef(null);
  const titleId = useId();

  const verbs = ["Led", "Built", "Launched", "Optimized", "Automated", "Reduced", "Increased", "Implemented", "Delivered", "Designed"];

  const generate = () => {
    const parts = [];
    parts.push(`${verb} ${what}`.trim());
    if (how) parts.push(`using ${how}`);
    if (result || metric) parts.push(`resulting in ${[result, metric].filter(Boolean).join(" ")}`);
    return parts.join(", ") + ".";
  };

  useEffect(() => {
    const prevFocus = document.activeElement;
    const node = dialogRef.current;
    const focusables = () =>
      Array.from(node.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])'));
    focusables()[0]?.focus();

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const items = focusables();
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    node.addEventListener("keydown", onKeyDown);
    return () => {
      node.removeEventListener("keydown", onKeyDown);
      prevFocus?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="rb2-modalScrim" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="rb2-modal" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={dialogRef}>
        <div className="rb2-modalHead">
          <strong id={titleId}>Bullet Coach</strong>
          <button type="button" className="rb2-iconBtn" onClick={onClose} aria-label="Close Bullet Coach">✕</button>
        </div>
        <div className="rb2-modalBody">
          <div className="rb2-grid2">
            <label className="rb2-label" htmlFor="coach-verb">Action verb</label>
            <select id="coach-verb" className="rb2-input" value={verb} onChange={(e) => setVerb(e.target.value)}>
              {verbs.map((v) => <option key={v}>{v}</option>)}
            </select>

            <label className="rb2-label" htmlFor="coach-what">What</label>
            <input id="coach-what" className="rb2-input" value={what} onChange={(e) => setWhat(e.target.value)} placeholder="e.g., a CRM onboarding flow" />

            <label className="rb2-label" htmlFor="coach-how">How / tools</label>
            <input id="coach-how" className="rb2-input" value={how} onChange={(e) => setHow(e.target.value)} placeholder="e.g., React, SQL, Zapier" />

            <label className="rb2-label" htmlFor="coach-result">Result</label>
            <input id="coach-result" className="rb2-input" value={result} onChange={(e) => setResult(e.target.value)} placeholder="e.g., faster onboarding" />
          </div>
          <div>
            <label className="rb2-label" htmlFor="coach-metric">Metric (number / % / time)</label>
            <input id="coach-metric" className="rb2-input" value={metric} onChange={(e) => setMetric(e.target.value)} placeholder="e.g., 34% or 2 hours/week" />
          </div>
          <div className="rb2-stack">
            <div className="rb2-label">Preview</div>
            <div className="rb2-previewBox">{generate()}</div>
          </div>
        </div>
        <div className="rb2-modalFoot">
          <button type="button" className="rb2-btn rb2-btn--secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="rb2-btn" onClick={() => onInsert(generate())}>Insert bullet</button>
        </div>
      </div>
    </div>
  );
}

/* ===========================================================
   Section item editors (per type)
   =========================================================== */
function SectionItems({ section, onChange }) {
  const items = section.items || [];

  const editItem = (i, patchObj) => {
    const next = deepClone(items);
    next[i] = { ...next[i], ...patchObj };
    onChange({ ...section, items: next });
  };
  const delItem = (i) => onChange({ ...section, items: items.filter((_, idx) => idx !== i) });
  const addItem = () => {
    const base =
      section.type === "experience"
        ? { role: "", company: "", location: "", dates: "", bullets: [] }
        : section.type === "projects"
        ? { name: "", link: "", bullets: [] }
        : section.type === "education"
        ? { school: "", degree: "", dates: "", details: "" }
        : section.type === "certs"
        ? { name: "", issuer: "", year: "" }
        : { title: "", bullets: [] };
    onChange({ ...section, items: [...items, base] });
  };

  return (
    <div className="rb2-stack">
      {items.map((it, i) => (
        <div key={i} className="rb2-item">
          {section.type === "experience" && (
            <>
              <div className="rb2-grid2">
                <input className="rb2-input" value={it.role || ""} onChange={(e) => editItem(i, { role: e.target.value })} placeholder="Role (e.g. Marketing Specialist)" aria-label="Role" />
                <input className="rb2-input" value={it.company || ""} onChange={(e) => editItem(i, { company: e.target.value })} placeholder="Company" aria-label="Company" />
              </div>
              <div className="rb2-grid2">
                <input className="rb2-input" value={it.location || ""} onChange={(e) => editItem(i, { location: e.target.value })} placeholder="Location" aria-label="Location" />
                <input className="rb2-input" value={it.dates || ""} onChange={(e) => editItem(i, { dates: e.target.value })} placeholder="Dates (e.g. Jan 2021 – Present)" aria-label="Dates" />
              </div>
              <BulletsEditor label={`Bullets for ${it.role || "this role"}`} value={it.bullets || []} onChange={(bullets) => editItem(i, { bullets })} />
            </>
          )}
          {section.type === "projects" && (
            <>
              <input className="rb2-input" value={it.name || ""} onChange={(e) => editItem(i, { name: e.target.value })} placeholder="Project name" aria-label="Project name" />
              <input className="rb2-input" value={it.link || ""} onChange={(e) => editItem(i, { link: e.target.value })} placeholder="Link (optional)" aria-label="Project link" />
              <BulletsEditor label={`Bullets for ${it.name || "this project"}`} value={it.bullets || []} onChange={(bullets) => editItem(i, { bullets })} />
            </>
          )}
          {section.type === "education" && (
            <>
              <input className="rb2-input" value={it.school || ""} onChange={(e) => editItem(i, { school: e.target.value })} placeholder="School" aria-label="School" />
              <input className="rb2-input" value={it.degree || ""} onChange={(e) => editItem(i, { degree: e.target.value })} placeholder="Degree / Certificate" aria-label="Degree or certificate" />
              <input className="rb2-input" value={it.dates || ""} onChange={(e) => editItem(i, { dates: e.target.value })} placeholder="Year(s)" aria-label="Years attended" />
              <input className="rb2-input" value={it.details || ""} onChange={(e) => editItem(i, { details: e.target.value })} placeholder="Details (optional)" aria-label="Education details" />
            </>
          )}
          {section.type === "certs" && (
            <div className="rb2-grid3">
              <input className="rb2-input" value={it.name || ""} onChange={(e) => editItem(i, { name: e.target.value })} placeholder="Certification" aria-label="Certification name" />
              <input className="rb2-input" value={it.issuer || ""} onChange={(e) => editItem(i, { issuer: e.target.value })} placeholder="Issuer" aria-label="Issuer" />
              <input className="rb2-input" value={it.year || ""} onChange={(e) => editItem(i, { year: e.target.value })} placeholder="Year" aria-label="Year" />
            </div>
          )}
          {section.type === "custom" && (
            <>
              <input className="rb2-input" value={it.title || ""} onChange={(e) => editItem(i, { title: e.target.value })} placeholder="Item title" aria-label="Item title" />
              <BulletsEditor label={`Bullets for ${it.title || "this item"}`} value={it.bullets || []} onChange={(bullets) => editItem(i, { bullets })} />
            </>
          )}
          <button type="button" className="rb2-btn rb2-btn--secondary rb2-btn--tiny" onClick={() => delItem(i)}>
            Delete item
          </button>
        </div>
      ))}
      <button type="button" className="rb2-btn rb2-btn--secondary rb2-btn--tiny" onClick={addItem}>
        ＋ Add item
      </button>
    </div>
  );
}

const SECTION_ICON = { experience: "💼", projects: "🧩", education: "🎓", certs: "📜", custom: "✨" };

function DynamicSectionRow({ section, index, total, expanded, onToggleExpand, onChange, onMoveUp, onMoveDown, onDelete, onToggleHidden }) {
  const uid = useId();
  const title = section.title || section.type;
  const itemCount = (section.items || []).length;

  return (
    <AccordionRow
      icon={SECTION_ICON[section.type] || "📄"}
      title={title}
      subtitle={itemCount ? `${itemCount} ${itemCount === 1 ? "entry" : "entries"}` : "No entries yet"}
      expanded={expanded}
      onToggleExpand={onToggleExpand}
      hidden={section.hidden}
      onToggleHidden={onToggleHidden}
      panelId={`rb2-panel-${uid}`}
      headerId={`rb2-header-${uid}`}
      editableTitle
      titleEditable={
        <input
          className="rb2-titleInput"
          value={section.title || ""}
          onChange={(e) => onChange({ ...section, title: e.target.value })}
          placeholder={section.type[0].toUpperCase() + section.type.slice(1)}
          aria-label="Section title"
        />
      }
    >
      <SectionItems section={section} onChange={onChange} />
      <div className="rb2-rowFooter">
        <button type="button" className="rb2-btn rb2-btn--secondary rb2-btn--tiny" onClick={onMoveUp} disabled={index === 0} aria-label={`Move ${title} section up`}>
          ↑ Move up
        </button>
        <button type="button" className="rb2-btn rb2-btn--secondary rb2-btn--tiny" onClick={onMoveDown} disabled={index === total - 1} aria-label={`Move ${title} section down`}>
          ↓ Move down
        </button>
        <button type="button" className="rb2-btn rb2-btn--secondary rb2-btn--tiny rb2-btn--danger" onClick={onDelete} aria-label={`Delete ${title} section`}>
          Delete section
        </button>
      </div>
      {section.hidden && <div className="rb2-hint">Hidden from preview and export.</div>}
    </AccordionRow>
  );
}

/* ===========================================================
   Main Editor
   =========================================================== */
export default function ResumeEditor({ data, onChange, strength }) {
  const [openKey, setOpenKey] = useState("summary");
  const contactId = useId();
  const summaryId = useId();
  const skillsId = useId();

  const patch = (k, v) => onChange({ ...data, [k]: v });
  const patchContact = (k, v) => onChange({ ...data, contact: { ...data.contact, [k]: v } });

  const toggle = (key) => setOpenKey((cur) => (cur === key ? null : key));

  const addLink = () => {
    const next = [...(data.contact?.links || []), { label: "", url: "" }];
    onChange({ ...data, contact: { ...data.contact, links: next } });
  };
  const editLink = (i, patchObj) => {
    const next = deepClone(data.contact?.links || []);
    next[i] = { ...next[i], ...patchObj };
    onChange({ ...data, contact: { ...data.contact, links: next } });
  };
  const delLink = (i) => {
    const next = (data.contact?.links || []).filter((_, idx) => idx !== i);
    onChange({ ...data, contact: { ...data.contact, links: next } });
  };

  const sections = data.sections || [];
  const moveSection = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= sections.length) return;
    const next = deepClone(sections);
    [next[i], next[j]] = [next[j], next[i]];
    onChange({ ...data, sections: next });
  };
  const delSection = (i) => {
    if (!window.confirm("Delete this section? This can't be undone.")) return;
    onChange({ ...data, sections: sections.filter((_, idx) => idx !== i) });
  };
  const toggleHidden = (i) => {
    const next = deepClone(sections);
    next[i].hidden = !next[i].hidden;
    onChange({ ...data, sections: next });
  };
  const changeSection = (i, section) => {
    const next = deepClone(sections);
    next[i] = section;
    onChange({ ...data, sections: next });
  };
  const addSection = (type) => {
    const title = type[0].toUpperCase() + type.slice(1);
    onChange({ ...data, sections: [...sections, { type, title, items: [], hidden: false }] });
    setOpenKey(`section-${sections.length}`);
  };

  const grade = fkGrade(data.summary || "");
  const contactSubtitle = [data.contact?.email, data.contact?.phone].filter(Boolean).join(" · ") || "Add your name, email, phone, location";
  const summarySubtitle = data.summary ? `${data.summary.slice(0, 60)}${data.summary.length > 60 ? "…" : ""}` : "Write a brief summary of your experience";
  const skillsSubtitle = (data.skills || []).length ? `${data.skills.length} skills` : "Add your key skills and competencies";

  return (
    <section className="rb2-editor" aria-label="Resume Editor">
      <div className="rb2-editorHead">
        <h2 className="rb2-h2">Resume Editor</h2>
        <div className="rb2-strength">
          <span className="rb2-strengthLabel">Strength</span>
          <span className="rb2-strengthValue">{strength}%</span>
        </div>
      </div>
      <div className="rb2-strengthBar" role="progressbar" aria-label="Resume strength" aria-valuenow={strength} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${strength}%` }} />
      </div>

      {/* The Autosaved / Portfolio-evidence / Career-readiness status chips
          that used to live here moved out to match the approved mock, which
          has no status row in the editor panel: Autosaved + Portfolio
          evidence now live in the bottom info bar (ResumeBuilder.jsx), and
          Career-readiness now lives in the sidebar milestone widget
          (CareerSidebar.jsx) — same underlying `strength`/`saveStatus`
          data, no capability removed, just relocated to match the mock's
          layout. */}

      <div className="rb2-accordion">
        <AccordionRow
          icon="👤"
          title="Contact Information"
          subtitle={contactSubtitle}
          expanded={openKey === "contact"}
          onToggleExpand={() => toggle("contact")}
          panelId={`rb2-panel-${contactId}`}
          headerId={`rb2-header-${contactId}`}
          titleEditable="Contact Information"
        >
          <div className="rb2-stack">
            <input className="rb2-input" value={data.name || ""} onChange={(e) => patch("name", e.target.value)} placeholder="Full name" aria-label="Full name" />
            <input className="rb2-input" value={data.title || ""} onChange={(e) => patch("title", e.target.value)} placeholder="Target title (e.g. Marketing Specialist)" aria-label="Target title" />
            <div className="rb2-grid2">
              <input className="rb2-input" value={data.contact?.email || ""} onChange={(e) => patchContact("email", e.target.value)} placeholder="Email" aria-label="Email" type="email" />
              <input className="rb2-input" value={data.contact?.phone || ""} onChange={(e) => patchContact("phone", e.target.value)} placeholder="Phone" aria-label="Phone" type="tel" />
            </div>
            <input className="rb2-input" value={data.contact?.location || ""} onChange={(e) => patchContact("location", e.target.value)} placeholder="Location (city, state)" aria-label="Location" />
            <div className="rb2-stack">
              {(data.contact?.links || []).map((l, i) => (
                <div key={i} className="rb2-linkRow">
                  <input className="rb2-input" value={l.label || ""} onChange={(e) => editLink(i, { label: e.target.value })} placeholder="Label (e.g. LinkedIn)" aria-label={`Link ${i + 1} label`} />
                  <input className="rb2-input" value={l.url || ""} onChange={(e) => editLink(i, { url: e.target.value })} placeholder="https://…" aria-label={`Link ${i + 1} URL`} />
                  <button type="button" className="rb2-iconBtn" onClick={() => delLink(i)} aria-label={`Remove link ${l.label || i + 1}`}>✕</button>
                </div>
              ))}
              <button type="button" className="rb2-btn rb2-btn--secondary rb2-btn--tiny" onClick={addLink}>＋ Add link</button>
            </div>
          </div>
        </AccordionRow>

        <AccordionRow
          icon="≡"
          title="Professional Summary"
          subtitle={summarySubtitle}
          expanded={openKey === "summary"}
          onToggleExpand={() => toggle("summary")}
          panelId={`rb2-panel-${summaryId}`}
          headerId={`rb2-header-${summaryId}`}
          titleEditable="Professional Summary"
        >
          <div className="rb2-bulletCoachRow">
            <span className="rb2-coachStatic"><span aria-hidden="true">✨</span> Bullet Coach — write a concise, metric-driven summary</span>
          </div>
          <textarea
            className="rb2-textarea"
            rows={5}
            maxLength={1200}
            value={data.summary || ""}
            onChange={(e) => patch("summary", e.target.value)}
            placeholder="Write a concise summary of your background, skills, and value you bring to employers…"
            aria-label="Professional summary"
          />
          <div className="rb2-summaryFoot">
            <span className="rb2-hint">Readability grade: <b>{grade}</b> — {readabilityLabel(grade)}</span>
            <span className="rb2-charCount">{(data.summary || "").length} / 1200</span>
          </div>
        </AccordionRow>

        <AccordionRow
          icon="</>"
          title="Skills"
          subtitle={skillsSubtitle}
          expanded={openKey === "skills"}
          onToggleExpand={() => toggle("skills")}
          panelId={`rb2-panel-${skillsId}`}
          headerId={`rb2-header-${skillsId}`}
          titleEditable="Skills"
        >
          <TagEditor tags={data.skills || []} onChange={(skills) => patch("skills", skills)} placeholder="Add a skill and press Enter" />
        </AccordionRow>

        {sections.map((s, i) => (
          <DynamicSectionRow
            key={i}
            section={s}
            index={i}
            total={sections.length}
            expanded={openKey === `section-${i}`}
            onToggleExpand={() => toggle(`section-${i}`)}
            onChange={(section) => changeSection(i, section)}
            onMoveUp={() => moveSection(i, -1)}
            onMoveDown={() => moveSection(i, +1)}
            onDelete={() => delSection(i)}
            onToggleHidden={() => toggleHidden(i)}
          />
        ))}
      </div>

      <div className="rb2-addSectionRow">
        <button type="button" className="rb2-addSectionBtn" onClick={() => addSection("experience")}>
          <span aria-hidden="true">＋</span> Add Section
        </button>
        <div className="rb2-addSectionMenu">
          <button type="button" className="rb2-btn rb2-btn--secondary rb2-btn--tiny" onClick={() => addSection("experience")}>Experience</button>
          <button type="button" className="rb2-btn rb2-btn--secondary rb2-btn--tiny" onClick={() => addSection("projects")}>Projects</button>
          <button type="button" className="rb2-btn rb2-btn--secondary rb2-btn--tiny" onClick={() => addSection("education")}>Education</button>
          <button type="button" className="rb2-btn rb2-btn--secondary rb2-btn--tiny" onClick={() => addSection("certs")}>Certifications</button>
          <button type="button" className="rb2-btn rb2-btn--secondary rb2-btn--tiny" onClick={() => addSection("custom")}>Custom</button>
        </div>
      </div>
    </section>
  );
}
