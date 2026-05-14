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
      className={"sh-badge" + (active ? "" : " is-ghost")}
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      {children}
    </button>
  );
}

export default function ConstitutionJournal() {
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
    <section className="app-main" aria-label="Constitution Journal">
      <header className="app-header">
        <div>
          <h1>Constitution Journal</h1>
          <p className="app-subtitle">
            A shared journal record you can tag by funding stream and use later as proof in Admin reporting.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span className="sh-badge">
            Entries: <strong>{stats.count || 0}</strong>
          </span>
          <span className="sh-badge is-ghost">
            Status: <strong>{saving ? "Saving…" : "Ready"}</strong>
          </span>
          <button className="sh-btn" type="button" onClick={handleNew}>
            New entry
          </button>
          <button className="sh-btn is-ghost" type="button" onClick={exportAllJSON}>
            Export JSON
          </button>
          <button className="sh-btn is-ghost" type="button" onClick={exportAllMD}>
            Export Markdown
          </button>
        </div>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(280px, 360px) 1fr",
          gap: 12,
          alignItems: "start",
        }}
      >
        <aside className="card card--pad" aria-label="Journal list">
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span className="sh-badge is-ghost">App: <strong>{appId}</strong></span>
              <span className="sh-badge is-ghost">Site:</span>
              <select
                className="sh-input"
                value={siteId}
                onChange={(e) => applySite(e.target.value)}
                style={{ height: 32 }}
              >
                {siteOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span className="sh-badge is-ghost">Funding:</span>
              <select
                className="sh-input"
                value={funding}
                onChange={(e) => applyFunding(e.target.value)}
                style={{ height: 32 }}
              >
                {FUNDING.map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>

              <span className="sh-badge is-ghost">Tag:</span>
              <select
                className="sh-input"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                style={{ height: 32 }}
              >
                {tagOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <input
              className="sh-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title/body/tags…"
              aria-label="Search journal entries"
            />

            <div style={{ fontSize: 12, opacity: 0.75 }}>
              Click an entry to edit. Everything autosaves.
            </div>
          </div>

          <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
            {items.length === 0 ? (
              <div style={{ fontSize: 13, opacity: 0.7 }}>
                No entries yet for these filters.
              </div>
            ) : (
              items.map((e) => {
                const active = e.id === activeId;
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setActiveId(e.id)}
                    className={"card card--pad" + (active ? " is-active" : "")}
                    style={{
                      textAlign: "left",
                      padding: 10,
                      cursor: "pointer",
                      border: active ? "1px solid var(--brand,#22c55e)" : "1px solid var(--line,#e5e7eb)",
                      background: active ? "rgba(34,197,94,0.06)" : "var(--card,#fff)",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>
                      {e.title || "Untitled"}
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.75 }}>
                      {e.updatedAt ? new Date(e.updatedAt).toLocaleString() : ""}
                    </div>
                    <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {(e.fundingStreams || []).slice(0, 3).map((f) => (
                        <span key={f} className="sh-badge is-ghost" style={{ fontSize: 10 }}>
                          {f}
                        </span>
                      ))}
                      {(e.tags || []).slice(0, 2).map((t) => (
                        <span key={t} className="sh-badge is-ghost" style={{ fontSize: 10 }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <main className="card card--pad" aria-label="Journal editor">
          {!activeId ? (
            <div style={{ opacity: 0.75 }}>
              Select an entry on the left, or click <strong>New entry</strong>.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span className="sh-badge is-ghost">Entry: <strong>{activeId}</strong></span>
                  <span className="sh-badge is-ghost">Site: <strong>{siteId}</strong></span>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button className="sh-btn is-ghost" type="button" onClick={handleDelete}>
                    Delete
                  </button>
                </div>
              </div>

              <input
                className="sh-input"
                value={draft.title}
                onChange={(e) => {
                  const next = { ...draft, title: e.target.value };
                  setDraft(next);
                  scheduleAutosave(next);
                }}
                placeholder="Entry title"
              />

              <textarea
                className="sh-inputText"
                value={draft.body}
                onChange={(e) => {
                  const next = { ...draft, body: e.target.value };
                  setDraft(next);
                  scheduleAutosave(next);
                }}
                placeholder="Write your reflection, reasoning, and proposal notes here…"
                style={{ minHeight: 260 }}
              />

              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Funding streams (click to tag)</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
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

              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Tags (comma-separated)</div>
                <input
                  className="sh-input"
                  value={draft.tagsText}
                  onChange={(e) => {
                    const next = { ...draft, tagsText: e.target.value };
                    setDraft(next);
                    scheduleAutosave(next);
                  }}
                  placeholder="journal, constitution, proposal, evidence"
                />
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Outcome (what changed because of this work?)</div>
                <input
                  className="sh-input"
                  value={draft.outcome}
                  onChange={(e) => {
                    const next = { ...draft, outcome: e.target.value };
                    setDraft(next);
                    scheduleAutosave(next);
                  }}
                  placeholder="Example: Drafted a 3-point amendment proposal and identified 2 budget trade-offs."
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </section>
  );
}
