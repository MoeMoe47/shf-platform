// src/pages/civic/Notes.jsx
import React from "react";
import { useToasts } from "@/context/Toasts.jsx";
import { StorageSoftReset, useStorageGuard, bumpKPI } from "@/shared/storage/guard.jsx";
import { logWallet } from "@/shared/rewards/history.js";
import RewardsChip from "@/components/rewards/RewardsChip.jsx";

/* ---------- Storage keys & KPI ---------- */
const KEY_NOTES   = "civic:notes";                 // JSON[ {id, title, body, createdAt, updatedAt, tags:[] } ]
const KPI_ADD     = "civic:kpi:notesAdded";
const KPI_DELETE  = "civic:kpi:notesDeleted";

/* ---------- helpers ---------- */
const read  = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(d)); } catch { return d; } };
const write = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
    window.dispatchEvent(new StorageEvent("storage", { key:k, newValue:"updated" }));
  } catch {}
};
const uid = (p="note") => `${p}_` + Date.now().toString(36) + Math.random().toString(36).slice(2,6);

export default function CivicNotes() {
  const { toast } = useToasts();

  // protect keys
  useStorageGuard([KEY_NOTES], { toast });

  const [items, setItems] = React.useState(() => read(KEY_NOTES, []));
  const [title, setTitle] = React.useState("");
  const [body, setBody]   = React.useState("");
  const [tagsText, setTagsText] = React.useState("");
  const undoRef = React.useRef(null); // {type:"delete"|"clearAll", payload, timerId}

  React.useEffect(() => {
    const onStorage = (e) => {
      if (!e || e.key == null || e.key === KEY_NOTES) setItems(read(KEY_NOTES, []));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function addNote() {
    if (!title.trim() && !body.trim()) return;
    const entry = {
      id: uid(),
      title: title.trim() || "Untitled",
      body: body.trim(),
      tags: tagsText.split(",").map(s=>s.trim()).filter(Boolean),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const next = [entry, ...read(KEY_NOTES, [])];
    write(KEY_NOTES, next);
    setItems(next);
    setTitle(""); setBody(""); setTagsText("");

    bumpKPI(KPI_ADD, +1);
    logWallet({ note: "Civic note added", delta: +2 });
    toast?.("🗒️ Note saved (+2 pts)", { type: "success" });
  }

  function updateNote(id, patch) {
    const all = read(KEY_NOTES, []);
    const idx = all.findIndex(n => n.id === id);
    if (idx < 0) return;
    all[idx] = { ...all[idx], ...patch, updatedAt: Date.now() };
    write(KEY_NOTES, all);
    setItems(all);
  }

  function deleteNote(id) {
    const all = read(KEY_NOTES, []);
    const found = all.find(n => n.id === id);
    const next = all.filter(n => n.id !== id);
    write(KEY_NOTES, next);
    setItems(next);

    bumpKPI(KPI_DELETE, +1);
    logWallet({ note: "Civic note deleted", delta: 0 });

    if (undoRef.current?.timerId) clearTimeout(undoRef.current.timerId);
    const timerId = setTimeout(() => { undoRef.current = null; }, 7000);
    undoRef.current = { type: "delete", payload: found, timerId };

    toast?.("Note deleted.", {
      type: "info",
      duration: 7000,
      action: {
        label: "Undo",
        onClick: () => {
          const u = undoRef.current;
          if (u?.type === "delete" && u.payload) {
            const restored = [u.payload, ...read(KEY_NOTES, [])];
            write(KEY_NOTES, restored);
            setItems(restored);
            logWallet({ note: "Undo civic note delete", delta: 0 });
            clearTimeout(u.timerId);
            undoRef.current = null;
          }
        },
      },
    });
  }

  function clearAll() {
    const prev = read(KEY_NOTES, []);
    write(KEY_NOTES, []);
    setItems([]);

    logWallet({ note: "Cleared all civic notes", delta: 0 });

    if (undoRef.current?.timerId) clearTimeout(undoRef.current.timerId);
    const timerId = setTimeout(() => { undoRef.current = null; }, 7000);
    undoRef.current = { type: "clearAll", payload: prev, timerId };

    toast?.("All notes cleared.", {
      type: "info",
      duration: 7000,
      action: {
        label: "Undo",
        onClick: () => {
          const u = undoRef.current;
          if (u?.type === "clearAll" && Array.isArray(u.payload)) {
            write(KEY_NOTES, u.payload);
            setItems(u.payload);
            logWallet({ note: "Undo civic notes clear", delta: 0 });
            clearTimeout(u.timerId);
            undoRef.current = null;
          }
        },
      },
    });
  }

  return (
    <section className="crb-main" aria-labelledby="cvn-title">
      <header className="db-head">
        <div>
          <h1 id="cvn-title" className="db-title">Civic Notes</h1>
          <p className="db-subtitle">Capture research, debate points, and proposal drafts.</p>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <button className="sh-btn is-ghost" onClick={clearAll}>Clear All</button>
          <StorageSoftReset
            keys={[KEY_NOTES]}
            label="Fix storage"
            onDone={() => {/* toast set by guard */}}
          />
          <RewardsChip />
        </div>
      </header>

      {/* Editor */}
      <section className="card card--pad" aria-label="Add note">
        <strong style={{ fontSize:16 }}>Add Note</strong>
        <div style={{ display:"grid", gap:8, marginTop:8 }}>
          <input
            className="sh-input"
            placeholder="Title (optional)"
            value={title}
            onChange={(e)=>setTitle(e.target.value)}
          />
          <textarea
            className="sh-input"
            rows={4}
            placeholder="Write your note…"
            value={body}
            onChange={(e)=>setBody(e.target.value)}
            style={{ resize:"vertical" }}
          />
          <input
            className="sh-input"
            placeholder="tags, comma, separated"
            value={tagsText}
            onChange={(e)=>setTagsText(e.target.value)}
          />
          <div>
            <button className="sh-btn" onClick={addNote} disabled={!title.trim() && !body.trim()}>
              Save Note
            </button>
          </div>
        </div>
      </section>

      {/* List */}
      <section className="card card--pad" style={{ marginTop:12 }} aria-label="Notes">
        <strong style={{ fontSize:16 }}>Notes</strong>
        {!items.length ? (
          <div style={{ marginTop:8, padding:"12px 10px", border:"1px dashed var(--ring,#e5e7eb)", borderRadius:10, background:"#fafafa" }}>
            No notes yet — add one above.
          </div>
        ) : (
          <ul style={{ listStyle:"none", padding:0, margin:"10px 0 0", display:"grid", gap:10 }}>
            {items.map(n => (
              <li key={n.id} className="card" style={{ padding:"10px 12px", display:"grid", gap:8 }}>
                <input
                  className="sh-input"
                  value={n.title}
                  onChange={(e)=>updateNote(n.id, { title: e.target.value })}
                />
                <textarea
                  className="sh-input"
                  rows={3}
                  value={n.body}
                  onChange={(e)=>updateNote(n.id, { body: e.target.value })}
                  style={{ resize:"vertical" }}
                />
                <input
                  className="sh-input"
                  value={(n.tags || []).join(", ")}
                  onChange={(e)=>updateNote(n.id, { tags: e.target.value.split(",").map(s=>s.trim()).filter(Boolean) })}
                />
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <span className="sh-badge is-ghost">
                    {new Date(n.updatedAt || n.createdAt).toLocaleString()}
                  </span>
                  <button className="sh-btn is-ghost" onClick={() => deleteNote(n.id)} style={{ marginLeft:"auto" }}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
