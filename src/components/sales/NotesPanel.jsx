// src/components /sales/NotesPanel.jsx
import React from "react";
import { download } from "@/utils/downloads.js";

/**
 * NotesPanel
 * - Keeps your existing per-section textarea (autosaves to localStorage)
 * - Adds a per-lesson notes array with tags (📌 ❓ 💡) at civic:lesson:${lessonId}:notes
 * - Adds "Export" (JSON) for the per-lesson notes array
 * - Still supports "Save to Portfolio" for the current textarea value
 */
export default function NotesPanel({
  lessonId = "civic-current",
  section = "content",
  initial = [],
}) {
  // Keys
  const TEXT_KEY = `civic:lesson:${lessonId}:notes:${section}`;
  const LIST_KEY = `civic:lesson:${lessonId}:notes`;

  // Per-section textarea value (keeps your original behavior)
  const [val, setVal] = React.useState(() => {
    try { return localStorage.getItem(TEXT_KEY) || ""; } catch { return ""; }
  });

  React.useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem(TEXT_KEY, val); } catch {}
    }, 250);
    return () => clearTimeout(t);
  }, [TEXT_KEY, val]);

  // Per-lesson notes array with tags
  const [notes, setNotes] = React.useState(() => {
    try {
      const raw = localStorage.getItem(LIST_KEY);
      if (raw) return JSON.parse(raw);
      // seed with `initial` if provided
      return Array.isArray(initial) ? initial : [];
    } catch {
      return Array.isArray(initial) ? initial : [];
    }
  });

  React.useEffect(() => {
    try { localStorage.setItem(LIST_KEY, JSON.stringify(notes)); } catch {}
  }, [LIST_KEY, notes]);

  // Add a tagged note to the per-lesson array
  function addTagged(secId, text, tag = "note") {
    setNotes((arr) => [
      { id: `n-${Date.now()}`, secId, text, tag, ts: Date.now() },
      ...(Array.isArray(arr) ? arr : []),
    ]);
  }

  // Export the per-lesson notes as JSON
  function exportNotes() {
    try {
      const fname = `civic-notes-${lessonId}.json`;
      download(fname, JSON.stringify(notes, null, 2), "application/json");
    } catch {
      // tiny fallback if download util is absent
      const blob = new Blob([JSON.stringify(notes, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `civic-notes-${lessonId}.json`; a.click();
      URL.revokeObjectURL(url);
    }
  }

  // Keep your Save to Portfolio for current textarea
  function addToPortfolio() {
    try {
      const store = "portfolio:items";
      const items = JSON.parse(localStorage.getItem(store) || "[]");
      items.unshift({
        id: `note-${lessonId}-${section}-${Date.now()}`,
        kind: "note",
        lessonId,
        section,
        createdAt: Date.now(),
        title: `Notes: ${section}`,
        body: val.slice(0, 2000),
        tags: ["civic", "notes"],
        pathwayId: null,
      });
      localStorage.setItem(store, JSON.stringify(items));
      window.dispatchEvent(new CustomEvent("portfolio:update"));
    } catch {}
  }

  return (
    <aside className="notes-panel">
      <header className="panel-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <h3 style={{ margin: 0 }}>Notes</h3>
        <div className="panel-actions" style={{ display: "flex", gap: 6 }}>
          <button className="sh-btn is-ghost" onClick={exportNotes}>Export</button>
        </div>
      </header>

      {/* Quick tag buttons → push a tagged entry into the per-lesson array */}
      <div className="note-tags" style={{ display: "flex", gap: 8, margin: "8px 0" }}>
        <button className="sh-btn is-ghost" onClick={() => addTagged("__general__", "", "📌")}>📌 Pin</button>
        <button className="sh-btn is-ghost" onClick={() => addTagged("__general__", "", "❓")}>❓ Question</button>
        <button className="sh-btn is-ghost" onClick={() => addTagged("__general__", "", "💡")}>💡 Idea</button>
      </div>

      {/* Your existing composer (per-section, autosave) */}
      <div className="sh-callout sh-callout--tip" style={{ marginTop: 6 }}>
        <div className="sh-calloutHead"><strong>Section Notes</strong></div>
        <div className="sh-calloutBody">
          <textarea
            value={val}
            onChange={(e) => setVal(e.target.value)}
            rows={4}
            className="sh-inputText"
            style={{ width: "100%" }}
            placeholder="Write notes or paste highlights…"
          />
          <div className="sh-actionsRow" style={{ marginTop: 8 }}>
            <button className="sh-btn sh-btn--secondary" onClick={addToPortfolio}>Save to Portfolio</button>
            <span className="sh-hint">{val.length} chars</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
