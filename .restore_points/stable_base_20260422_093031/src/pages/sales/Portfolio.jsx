// src/pages /sales/Portfolio.jsx
import React from "react";
import { useToasts } from "@/context/Toasts.jsx";
import { StorageSoftReset, useStorageGuard, bumpKPI } from "@/shared/storage/guard.jsx";
import { logWallet } from "@/shared/rewards/history.js";
import RewardsChip from "@/components/rewards/RewardsChip.jsx";
import { enqueue } from "@/shared/offline/queue.js"; // ⬅️ NEW

/* Keys (Civic-scoped) */
const KEY_ARTIFACTS = "civic:portfolio:artifacts";
const KPI_ADDED    = "civic:kpi:portfolioAdded";
const KPI_EDITED   = "civic:kpi:portfolioEdited";
const KPI_DELETED  = "civic:kpi:portfolioDeleted";
const KPI_EXPORTED = "civic:kpi:portfolioExported";

/* helpers */
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(d)); } catch { return d; } };
const write = (k, v) => { try {
  localStorage.setItem(k, JSON.stringify(v));
  window.dispatchEvent(new StorageEvent("storage", { key:k, newValue:"updated" }));
} catch {} };
const uid = (p="art") => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2,6)}`;

export default function CivicPortfolio() {
  const { toast } = useToasts();

  useStorageGuard([KEY_ARTIFACTS], { toast });

  const [items, setItems] = React.useState(() => read(KEY_ARTIFACTS, []));
  const [title, setTitle]   = React.useState("");
  const [desc, setDesc]     = React.useState("");
  const [tags, setTags]     = React.useState("");
  const [kind, setKind]     = React.useState("document");
  const [url, setUrl]       = React.useState("");

  const undoRef = React.useRef(null); // {type,payload,timerId}

  React.useEffect(() => {
    const onStorage = (e) => { if (!e || e.key == null || e.key === KEY_ARTIFACTS) setItems(read(KEY_ARTIFACTS, [])); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function addArtifact() {
    if (!title.trim() && !desc.trim() && !url.trim()) return;
    const entry = {
      id: uid(),
      title: title.trim() || "Untitled",
      desc: desc.trim(),
      tags: tags.split(",").map(s=>s.trim()).filter(Boolean),
      kind, url: url.trim(),
      createdAt: Date.now(), updatedAt: Date.now(),
    };
    const next = [entry, ...read(KEY_ARTIFACTS, [])];
    write(KEY_ARTIFACTS, next); setItems(next);
    setTitle(""); setDesc(""); setTags(""); setKind("document"); setUrl("");

    // KPIs + wallet + toast
    bumpKPI(KPI_ADDED, +1);
    logWallet({ note: "Civic portfolio artifact added", delta: +3 });
    toast?.("🗂️ Artifact saved (+3 pts)", { type: "success" });

    // ⬇️ NEW: queue for background sync (generic portfolio payload)
    try {
      enqueue("portfolio", {
        artifactId: entry.id,
        title: entry.title,
        tags: entry.tags?.length ? entry.tags : ["civic","portfolio"],
        kind: entry.kind,
        url: entry.url || "",
        createdAt: entry.createdAt,
      });
    } catch {}
  }

  function updateArtifact(id, patch, quiet=false) {
    const all = read(KEY_ARTIFACTS, []);
    const i = all.findIndex(a => a.id === id);
    if (i < 0) return;
    all[i] = { ...all[i], ...patch, updatedAt: Date.now() };
    write(KEY_ARTIFACTS, all); setItems(all);
    if (!quiet) { bumpKPI(KPI_EDITED, +1); toast?.("Artifact updated.", { type: "info" }); }
  }

  function deleteArtifact(id) {
    const all = read(KEY_ARTIFACTS, []);
    const found = all.find(a => a.id === id);
    const next = all.filter(a => a.id !== id);
    write(KEY_ARTIFACTS, next); setItems(next);

    bumpKPI(KPI_DELETED, +1);
    logWallet({ note: "Civic portfolio artifact deleted", delta: 0 });

    if (undoRef.current?.timerId) clearTimeout(undoRef.current.timerId);
    const timerId = setTimeout(() => { undoRef.current = null; }, 7000);
    undoRef.current = { type:"delete", payload: found, timerId };

    toast?.("Artifact deleted.", {
      type: "info", duration: 7000,
      action: { label: "Undo", onClick: () => {
        const u = undoRef.current;
        if (u?.type === "delete" && u.payload) {
          const restored = [u.payload, ...read(KEY_ARTIFACTS, [])];
          write(KEY_ARTIFACTS, restored); setItems(restored);
          logWallet({ note: "Undo civic portfolio delete", delta: 0 });
          clearTimeout(u.timerId); undoRef.current = null;
        }
      } }
    });
  }

  function clearAll() {
    const prev = read(KEY_ARTIFACTS, []);
    write(KEY_ARTIFACTS, []); setItems([]);
    logWallet({ note: "Cleared all civic portfolio artifacts", delta: 0 });

    if (undoRef.current?.timerId) clearTimeout(undoRef.current.timerId);
    const timerId = setTimeout(() => { undoRef.current = null; }, 7000);
    undoRef.current = { type:"clearAll", payload: prev, timerId };

    toast?.("All artifacts cleared.", {
      type: "info", duration: 7000,
      action: { label: "Undo", onClick: () => {
        const u = undoRef.current;
        if (u?.type === "clearAll" && Array.isArray(u.payload)) {
          write(KEY_ARTIFACTS, u.payload); setItems(u.payload);
          logWallet({ note: "Undo civic portfolio clear", delta: 0 });
          clearTimeout(u.timerId); undoRef.current = null;
        }
      } }
    });
  }

  function exportJSON() {
    try {
      const data = read(KEY_ARTIFACTS, []);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = href;
      a.download = `civic-portfolio-${new Date().toISOString().slice(0,10)}.json`;
      a.click(); URL.revokeObjectURL(href);

      bumpKPI(KPI_EXPORTED, +1);
      logWallet({ note: "Civic portfolio exported", delta: 0 });
    } catch { /* no-op */ }
  }

  return (
    <section className="crb-main" aria-labelledby="cvp-title">
      <header className="db-head">
        <div>
          <h1 id="cvp-title" className="db-title">Civic Portfolio</h1>
          <p className="db-subtitle">Store proposals, research, media, and credentials.</p>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <button className="sh-btn is-ghost" onClick={exportJSON}>Export JSON</button>
          <button className="sh-btn is-ghost" onClick={clearAll}>Clear All</button>
          <StorageSoftReset keys={[KEY_ARTIFACTS]} label="Fix storage" />
          <RewardsChip />
        </div>
      </header>

      {/* Editor */}
      <section className="card card--pad" aria-label="Add artifact">
        <strong style={{ fontSize:16 }}>Add Artifact</strong>
        <div style={{ display:"grid", gap:8, marginTop:8 }}>
          <input className="sh-input" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
          <textarea className="sh-input" rows={4} placeholder="Short description" value={desc} onChange={e=>setDesc(e.target.value)} style={{ resize:"vertical" }} />
          <div style={{ display:"grid", gap:8, gridTemplateColumns:"1fr 1fr" }}>
            <select className="sh-input" value={kind} onChange={e=>setKind(e.target.value)}>
              <option value="document">Document</option><option value="link">Link</option>
              <option value="media">Media</option><option value="cert">Certificate</option>
              <option value="code">Code</option>
            </select>
            <input className="sh-input" placeholder="URL (optional)" value={url} onChange={e=>setUrl(e.target.value)} />
          </div>
          <input className="sh-input" placeholder="tags, comma, separated" value={tags} onChange={e=>setTags(e.target.value)} />
          <div><button className="sh-btn" onClick={addArtifact} disabled={!title.trim() && !desc.trim() && !url.trim()}>Save Artifact</button></div>
        </div>
      </section>

      {/* List */}
      <section className="card card--pad" style={{ marginTop:12 }} aria-label="Artifacts">
        <strong style={{ fontSize:16 }}>Artifacts</strong>
        {!items.length ? (
          <div style={{ marginTop:8, padding:"12px 10px", border:"1px dashed var(--ring,#e5e7eb)", borderRadius:10, background:"#fafafa" }}>
            No artifacts yet — add one above.
          </div>
        ) : (
          <ul style={{ listStyle:"none", padding:0, margin:"10px 0 0", display:"grid", gap:10 }}>
            {items.map(a => (
              <li key={a.id} className="card" style={{ padding:"10px 12px", display:"grid", gap:8 }}>
                <input className="sh-input" value={a.title} onChange={e=>updateArtifact(a.id, { title: e.target.value })} />
                <textarea className="sh-input" rows={3} value={a.desc} onChange={e=>updateArtifact(a.id, { desc: e.target.value })} style={{ resize:"vertical" }} />
                <div style={{ display:"grid", gap:8, gridTemplateColumns:"1fr 1fr" }}>
                  <select className="sh-input" value={a.kind || "document"} onChange={e=>updateArtifact(a.id, { kind: e.target.value })}>
                    <option value="document">Document</option><option value="link">Link</option>
                    <option value="media">Media</option><option value="cert">Certificate</option>
                    <option value="code">Code</option>
                  </select>
                  <input className="sh-input" placeholder="URL (optional)" value={a.url || ""} onChange={e=>updateArtifact(a.id, { url: e.target.value })} />
                </div>
                <input className="sh-input" value={(a.tags || []).join(", ")} onChange={e=>updateArtifact(a.id, { tags: e.target.value.split(",").map(s=>s.trim()).filter(Boolean) })} />
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <span className="sh-badge is-ghost">{new Date(a.updatedAt || a.createdAt).toLocaleString()}</span>
                  {a.url ? <a className="sh-btn is-ghost" href={a.url} target="_blank" rel="noreferrer">Open</a> : null}
                  <button className="sh-btn is-ghost" onClick={() => deleteArtifact(a.id)} style={{ marginLeft:"auto" }}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
