// src/pages/civic/ConstitutionJournal.jsx
// Redesigned per the approved Constitution Journal mocks (light + dark,
// supplied directly). Shell/theme/shared design tokens are inherited
// unchanged from the Civic Lab Dashboard/Elections/Proposals/Grant Story/
// Debt Clock/Treasury Simulator redesigns — see src/styles/civic-dashboard.css
// and src/styles/civic-journal.css (this page's own additions only).
//
// Data model / logic (Phase 1 forensic discovery — zero changes):
//   - Storage: src/shared/journal/journalStore.js, localStorage["shf.journal.v1"].
//   - Entry schema (unchanged): {id, createdAt, updatedAt, appId, siteId,
//     userId, promptId, title, body, tags[], fundingStreams[], evidence[],
//     outcome, visibility}. Body is PLAIN TEXT — exportMarkdown embeds it
//     verbatim, so a toolbar that inserts literal Markdown characters into
//     the plain textarea is safe and changes nothing about the stored
//     shape (see applyFormatting below — no rich-text/HTML data format
//     introduced, per the brief's explicit instruction).
//   - App is fixed to "civic" (never selectable) — Site is the real,
//     existing selectable field, synced to the URL (?site=). Funding is a
//     real filter over the fixed FUNDING taxonomy already in this file;
//     Tag options are derived dynamically from the current entries, not
//     hardcoded (unchanged, including the pre-existing quirk that tag
//     options are computed from `items`, which is itself already filtered
//     by the active tag — preserved as-is, not "fixed").
//   - Autosave: 350ms debounce in scheduleAutosave, unchanged.
//   - Delete and the per-entry Funding-stream chips + Outcome field are
//     real, existing capabilities not shown in the approved mock's editor
//     panel — preserved here (see Editor panel), not removed, per the
//     brief's non-negotiable capability list.
import React from "react";
import {
  createEntry,
  updateEntry,
  deleteEntry,
  listEntries,
  getStats,
  exportJSON,
  exportMarkdown,
  downloadText,
} from "@/shared/journal/journalStore.js";
import { useCompanion } from "@/hooks/useCompanion.js";
import CompanionFace from "@/components/companion/CompanionFace.jsx";

const FUNDING = [
  { id: "all", label: "All" },
  { id: "perkins", label: "Perkins V" },
  { id: "wioa", label: "WIOA" },
  { id: "essa", label: "ESSA Title IV" },
  { id: "medicaid", label: "Medicaid" },
  { id: "idea", label: "IDEA" },
  { id: "workforce", label: "Workforce" },
  { id: "philanthropy", label: "Philanthropy" },
  { id: "civics", label: "Civics / Democracy" },
];

function useQuery() {
  const [q, setQ] = React.useState(() =>
    typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search)
  );

  React.useEffect(() => {
    function onPop() {
      setQ(new URLSearchParams(window.location.search));
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return q;
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      className={"cj-chip" + (active ? " is-active" : "")}
      onClick={onClick}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

// Lightweight Markdown-syntax toolbar — writes plain characters into the
// existing plain-text body, wrapping the current selection (or inserting a
// placeholder when nothing is selected). No rich-text/HTML format
// introduced; exportMarkdown/exportJSON both already carry body through
// verbatim, so this cannot break either export. See file header.
const TOOLBAR_ACTIONS = [
  { id: "bold", label: "Bold", glyph: "B", wrap: ["**", "**"], placeholder: "bold text" },
  { id: "italic", label: "Italic", glyph: "I", wrap: ["*", "*"], placeholder: "italic text" },
  { id: "bullet", label: "Bulleted list", glyph: "•", linePrefix: "- ", placeholder: "list item" },
  { id: "numbered", label: "Numbered list", glyph: "1.", linePrefix: "1. ", placeholder: "list item" },
  { id: "quote", label: "Quote", glyph: "“", linePrefix: "> ", placeholder: "quote" },
  { id: "link", label: "Link", glyph: "🔗", isLink: true, placeholder: "link text" },
];

export default function ConstitutionJournal() {
  const companion = useCompanion();
  const query = useQuery();

  const [appId] = React.useState("civic");
  const [siteId, setSiteId] = React.useState(query.get("site") || "default");
  const [funding, setFunding] = React.useState(query.get("funding") || "all");
  const [tag, setTag] = React.useState("all");
  const [search, setSearch] = React.useState("");

  const [items, setItems] = React.useState([]);
  const [stats, setStats] = React.useState({ count: 0, byFunding: {}, byApp: {}, bySite: {} });

  const [activeId, setActiveId] = React.useState(null);

  const [draft, setDraft] = React.useState({
    title: "",
    body: "",
    tagsText: "",
    fundingStreams: [],
    outcome: "",
  });

  const [saving, setSaving] = React.useState(false);
  const bodyRef = React.useRef(null);
  const editorRef = React.useRef(null);

  const filters = React.useMemo(
    () => ({
      appId,
      siteId: siteId || "default",
      funding,
      tag,
      q: search,
      limit: 500,
    }),
    [appId, siteId, funding, tag, search]
  );

  const refresh = React.useCallback(() => {
    const list = listEntries(filters);
    setItems(list);
    setStats(getStats(filters));
    if (activeId && !list.some((x) => x.id === activeId)) setActiveId(null);
  }, [filters, activeId]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  React.useEffect(() => {
    if (!activeId) return;
    const found = items.find((x) => x.id === activeId);
    if (!found) return;

    setDraft({
      title: found.title || "",
      body: found.body || "",
      tagsText: (found.tags || []).join(", "),
      fundingStreams: Array.isArray(found.fundingStreams) ? found.fundingStreams : [],
      outcome: found.outcome || "",
    });
  }, [activeId, items]);

  const debouncedRef = React.useRef(null);

  const scheduleAutosave = React.useCallback(
    (nextDraft) => {
      if (!activeId) return;
      if (debouncedRef.current) window.clearTimeout(debouncedRef.current);

      debouncedRef.current = window.setTimeout(() => {
        setSaving(true);
        const tags = String(nextDraft.tagsText || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 20);

        updateEntry(activeId, {
          title: nextDraft.title,
          body: nextDraft.body,
          tags,
          fundingStreams: nextDraft.fundingStreams || [],
          outcome: nextDraft.outcome || "",
          siteId: siteId || "default",
          appId,
        });

        setSaving(false);
        refresh();
      }, 350);
    },
    [activeId, refresh, siteId, appId]
  );

  function setUrlParams(next) {
    const u = new URL(window.location.href);
    if (next.site != null) u.searchParams.set("site", next.site);
    if (next.funding != null) u.searchParams.set("funding", next.funding);
    window.history.replaceState({}, "", u.toString());
  }

  function handleNew() {
    const created = createEntry({
      appId,
      siteId: siteId || "default",
      title: "New Journal Entry",
      body: "",
      tags: ["journal"],
      fundingStreams: funding === "all" ? [] : [funding],
      outcome: "",
    });
    refresh();
    setActiveId(created.id);
  }

  function handleDelete() {
    if (!activeId) return;
    const ok = window.confirm("Delete this entry? This cannot be undone.");
    if (!ok) return;
    deleteEntry(activeId);
    setActiveId(null);
    refresh();
  }

  function selectEntry(id) {
    setActiveId(id);
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767.98px)").matches) {
      requestAnimationFrame(() => {
        editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  function toggleFundingStream(id) {
    setDraft((prev) => {
      const has = (prev.fundingStreams || []).includes(id);
      const next = {
        ...prev,
        fundingStreams: has
          ? (prev.fundingStreams || []).filter((x) => x !== id)
          : [...(prev.fundingStreams || []), id],
      };
      scheduleAutosave(next);
      return next;
    });
  }

  function applySite(nextSite) {
    setSiteId(nextSite);
    setUrlParams({ site: nextSite, funding });
  }

  function applyFunding(nextFunding) {
    setFunding(nextFunding);
    setUrlParams({ site: siteId, funding: nextFunding });
  }

  function exportAllJSON() {
    const text = exportJSON(filters);
    downloadText(`shf-journal-${appId}-${siteId}.json`, text, "application/json;charset=utf-8;");
  }

  function exportAllMD() {
    const text = exportMarkdown(filters);
    downloadText(`shf-journal-${appId}-${siteId}.md`, text, "text/markdown;charset=utf-8;");
  }

  function applyFormatting(action) {
    const el = bodyRef.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e, value } = el;
    const selected = value.slice(s, e);
    let insertText;
    let caretStart;
    let caretEnd;

    if (action.isLink) {
      const url = window.prompt("Link URL", "https://");
      if (url == null) return;
      const label = selected || action.placeholder;
      insertText = `[${label}](${url})`;
      caretStart = s + 1;
      caretEnd = caretStart + label.length;
    } else if (action.wrap) {
      const [open, close] = action.wrap;
      const text = selected || action.placeholder;
      insertText = `${open}${text}${close}`;
      caretStart = s + open.length;
      caretEnd = caretStart + text.length;
    } else {
      const text = selected || action.placeholder;
      insertText = text
        .split("\n")
        .map((line, i) => (action.id === "numbered" ? `${i + 1}. ${line}` : `${action.linePrefix}${line}`))
        .join("\n");
      caretStart = s;
      caretEnd = s + insertText.length;
    }

    const newValue = value.slice(0, s) + insertText + value.slice(e);
    const next = { ...draft, body: newValue };
    setDraft(next);
    scheduleAutosave(next);

    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(caretStart, caretEnd);
    });
  }

  const siteOptions = React.useMemo(() => {
    const fromStats = Object.keys(stats.bySite || {}).sort();
    const base = ["default"];
    const all = Array.from(new Set([...base, ...fromStats]));
    return all;
  }, [stats]);

  const tagOptions = React.useMemo(() => {
    const allTags = new Set();
    for (const e of items) {
      for (const t of e.tags || []) allTags.add(String(t).trim());
    }
    return ["all", ...Array.from(allTags).filter(Boolean).sort((a, b) => a.localeCompare(b))];
  }, [items]);

  return (
    <div className="cj-page">
      <h1 className="cj-srOnly">Constitution Journal</h1>

      <header className="cj-header" aria-labelledby="cj-title">
        <div className="cj-header__titleBlock">
          <p className="cj-header__h1" id="cj-title">Constitution Journal</p>
          <p className="cj-header__sub">
            A shared journal record you can tag by funding stream and use later as proof in Admin reporting.
          </p>
        </div>

        <div className="cj-header__meta">
          <span className="cj-badge">
            Entries: <strong>{stats.count || 0}</strong>
          </span>
          <span className="cj-badge cj-badge--ghost">
            Status: <strong>{saving ? "Saving…" : "Ready"}</strong>
          </span>
        </div>

        <div className="cj-header__actions">
          <button className="cj-btn cj-btn--primary" type="button" onClick={handleNew}>
            New entry
          </button>
          <button className="cj-btn cj-btn--ghost" type="button" onClick={exportAllJSON}>
            Export JSON
          </button>
          <button className="cj-btn cj-btn--ghost" type="button" onClick={exportAllMD}>
            Export Markdown
          </button>
        </div>
      </header>

      <div className="cj-workspace">
        <aside className="cj-card cj-panel" aria-label="Journal filters and entry list">
          <div className="cj-filterRow">
            <span className="cj-fieldLabel">App: <strong>{appId}</strong></span>
            <label className="cj-selectWrap">
              <span className="cj-fieldLabel">Site:</span>
              <select className="cj-select" value={siteId} onChange={(e) => applySite(e.target.value)}>
                {siteOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="cj-filterRow cj-filterRow--2up">
            <label className="cj-selectWrap">
              <span className="cj-fieldLabel">Funding:</span>
              <select className="cj-select" value={funding} onChange={(e) => applyFunding(e.target.value)}>
                {FUNDING.map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
            </label>

            <label className="cj-selectWrap">
              <span className="cj-fieldLabel">Tag:</span>
              <select className="cj-select" value={tag} onChange={(e) => setTag(e.target.value)}>
                {tagOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="cj-searchWrap">
            <span className="cj-searchIcon" aria-hidden="true">🔍</span>
            <input
              className="cj-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title/body/tags..."
              aria-label="Search journal entries"
            />
          </div>

          <p className="cj-hint">Click an entry to edit. Everything autosaves.</p>

          <div className="cj-entryList" role="list">
            {items.length === 0 ? (
              <div className="cj-emptyList">No entries yet for these filters.</div>
            ) : (
              items.map((e) => {
                const active = e.id === activeId;
                return (
                  <button
                    key={e.id}
                    type="button"
                    role="listitem"
                    onClick={() => selectEntry(e.id)}
                    aria-current={active ? "true" : undefined}
                    className={"cj-entry" + (active ? " is-active" : "")}
                  >
                    <div className="cj-entry__title">{e.title || "Untitled"}</div>
                    <div className="cj-entry__time">
                      {e.updatedAt ? new Date(e.updatedAt).toLocaleString() : ""}
                    </div>
                    {((e.fundingStreams || []).length > 0 || (e.tags || []).length > 0) && (
                      <div className="cj-entry__tags">
                        {(e.fundingStreams || []).slice(0, 3).map((f) => (
                          <span key={f} className="cj-tag cj-tag--funding">{f}</span>
                        ))}
                        {(e.tags || []).slice(0, 2).map((t) => (
                          <span key={t} className="cj-tag">{t}</span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <main className="cj-card cj-editor" aria-label="Journal editor" ref={editorRef}>
          {!activeId ? (
            <div className="cj-editorEmpty" role="status">
              <span className="cj-editorEmpty__icon" aria-hidden="true">ℹ️</span>
              <span>
                Select an entry on the left, or click <strong>New entry</strong>.
              </span>
            </div>
          ) : (
            <div className="cj-editorBody">
              <div className="cj-editorMeta">
                <div className="cj-editorMeta__badges">
                  <span className="cj-badge cj-badge--ghost">Entry: <strong>{activeId}</strong></span>
                  <span className="cj-badge cj-badge--ghost">Site: <strong>{siteId}</strong></span>
                </div>
                <button className="cj-btn cj-btn--danger" type="button" onClick={handleDelete}>
                  Delete
                </button>
              </div>

              <label className="cj-field">
                <span className="cj-fieldLabel">Title</span>
                <input
                  className="cj-input"
                  value={draft.title}
                  onChange={(e) => {
                    const next = { ...draft, title: e.target.value };
                    setDraft(next);
                    scheduleAutosave(next);
                  }}
                  placeholder="Enter a title..."
                />
              </label>

              <label className="cj-field">
                <span className="cj-fieldLabel">Tags</span>
                <input
                  className="cj-input"
                  value={draft.tagsText}
                  onChange={(e) => {
                    const next = { ...draft, tagsText: e.target.value };
                    setDraft(next);
                    scheduleAutosave(next);
                  }}
                  placeholder="Add tags (comma separated)..."
                />
              </label>

              <div className="cj-field">
                <span className="cj-fieldLabel">Funding streams (click to tag)</span>
                <div className="cj-chipRow">
                  {FUNDING.filter((x) => x.id !== "all").map((f) => (
                    <Chip
                      key={f.id}
                      active={(draft.fundingStreams || []).includes(f.id)}
                      onClick={() => toggleFundingStream(f.id)}
                    >
                      {f.label}
                    </Chip>
                  ))}
                </div>
              </div>

              <div className="cj-field cj-field--body">
                <span className="cj-fieldLabel">Body</span>
                <div className="cj-editorFrame">
                  <div className="cj-toolbar" role="toolbar" aria-label="Formatting">
                    {TOOLBAR_ACTIONS.map((action) => (
                      <button
                        key={action.id}
                        type="button"
                        className="cj-toolbar__btn"
                        aria-label={action.label}
                        title={action.label}
                        onClick={() => applyFormatting(action)}
                      >
                        {action.glyph}
                      </button>
                    ))}
                  </div>
                  <textarea
                    ref={bodyRef}
                    className="cj-body"
                    value={draft.body}
                    onChange={(e) => {
                      const next = { ...draft, body: e.target.value };
                      setDraft(next);
                      scheduleAutosave(next);
                    }}
                    placeholder="Start writing your journal entry..."
                  />
                </div>
              </div>

              <label className="cj-field">
                <span className="cj-fieldLabel">Outcome (what changed because of this work?)</span>
                <input
                  className="cj-input"
                  value={draft.outcome}
                  onChange={(e) => {
                    const next = { ...draft, outcome: e.target.value };
                    setDraft(next);
                    scheduleAutosave(next);
                  }}
                  placeholder="Example: Drafted a 3-point amendment proposal and identified 2 budget trade-offs."
                />
              </label>
            </div>
          )}
        </main>
      </div>

      <div className="cj-coachRow">
        <div className="cj-card cj-coach">
          <span className="cj-coach__art" aria-hidden="true">
            <CompanionFace animation="idle" size={44} />
          </span>
          <div>
            <p className="cj-coach__title">Need help journaling?</p>
            <p className="cj-coach__desc">
              Ask Coach for reflection prompts, help organizing your evidence, or connecting your notes to civic learning.
            </p>
            <button
              type="button"
              className="cj-coach__link"
              onClick={() => companion.openCoach()}
            >
              Ask Coach!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
