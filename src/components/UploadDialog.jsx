// src/components/UploadDialog.jsx
import React from "react";

export default function UploadDialog() {
  const [open, setOpen] = React.useState(false);
  const [files, setFiles] = React.useState([]);

  React.useEffect(() => {
    function onOpen(){ setOpen(true); }
    window.addEventListener("ui:open-upload", onOpen);
    return () => window.removeEventListener("ui:open-upload", onOpen);
  }, []);

  React.useEffect(() => {
    function onEsc(e){ if (e.key === "Escape") setOpen(false); }
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  function add(list){
    const next = Array.from(list || []).map(f => ({
      id: crypto.randomUUID(),
      name: f.name,
      url: URL.createObjectURL(f),
      file: f
    }));
    setFiles(prev => [...prev, ...next]);
  }

  if (!open) return null;
  return (
    <div className="up-overlay" role="dialog" aria-modal="true" aria-label="Upload artifact">
      <div className="up-card">
        <header className="up-head">
          <strong>Upload Artifact</strong>
          <button className="up-close" aria-label="Close" onClick={()=>setOpen(false)}>✕</button>
        </header>

        <label className="up-choose">
          <input type="file" multiple hidden onChange={(e)=>add(e.target.files)} />
          <span>Choose files…</span>
        </label>

        <div
          className="up-drop"
          role="region"
          aria-label="Drag and drop files here"
          onDragOver={(e)=>e.preventDefault()}
          onDrop={(e)=>{ e.preventDefault(); add(e.dataTransfer.files); }}
        >
          Drag & drop files here
        </div>

        <div className="up-grid">
          {files.map(f => (
            <figure key={f.id} className="up-thumb">
              <img src={f.url} alt={f.name} onError={(e)=>{ e.currentTarget.replaceWith(document.createTextNode("File")); }} />
              <figcaption>{f.name}</figcaption>
            </figure>
          ))}
          {!files.length && <div className="up-empty">No files yet.</div>}
        </div>

        <footer className="up-foot">
          <button className="sh-btn" onClick={()=>{ setFiles([]); setOpen(false); }}>Cancel</button>
          <button className="sh-btn sh-btn--primary" onClick={()=>{ /* TODO: upload */ setOpen(false); }}>Save</button>
        </footer>
      </div>
    </div>
  );
}
/* --- SHF: portfolio artifact upload award (drop-in) --- */
(() => {
  if (window.__shfHook_portfolioUpload) return;
  window.__shfHook_portfolioUpload = true;

  const once = (artifactId, title) => {
    if (!artifactId) return;
    const key = `shf.award.artifact.${artifactId}`;
    if (localStorage.getItem(key)) return; // one-time per artifact
    try {
      window.shfCredit?.earn?.({
        action: "artifact.upload",
        rewards: { heart: 1 }, // ❤️
        scoreDelta: 8,
        meta: { artifactId, title }
      });
      localStorage.setItem(key, "1");
      window.shToast?.(`📎 Artifact uploaded · +1 ❤️ · +8 score`);
    } catch {}
  };

  // Preferred: dispatch after successful upload
  //   window.dispatchEvent(new CustomEvent("portfolio:upload:success", { detail: { id, title } }));
  window.addEventListener("portfolio:upload:success", (e) => {
    const { id, title } = e?.detail || {};
    once(id, title);
  });

  // Optional helper
  window.shfAward = Object.assign({}, window.shfAward, {
    artifactUpload: (id, title) => once(id, title)
  });
})();
/* --- SHF: Portfolio artifact upload award --- */
(() => {
  if (typeof window === "undefined") return;
  if (window.__shfHook_artifact) return;
  window.__shfHook_artifact = true;

  const once = (id) => {
    const key = `shf.award.artifact.${id}`;
    if (localStorage.getItem(key)) return false;
    localStorage.setItem(key, "1");
    return true;
  };

  window.addEventListener("portfolio:artifact-uploaded", (e) => {
    const { id, title } = (e && e.detail) || {};
    if (!id || !once(id)) return;
    try {
      window.shfCredit?.earn?.({
        action: "portfolio.artifact",
        rewards: { wheat: 2 }, // 🌾
        scoreDelta: 6,
        meta: { id, title }
      });
      window.shToast?.("📁 Artifact added · +2 🌾 · +6 score");
    } catch {}
  });

  // helper
  window.shfAward = Object.assign({}, window.shfAward || {}, {
    portfolioArtifact: (id, title) =>
      window.dispatchEvent(new CustomEvent("portfolio:artifact-uploaded", { detail: { id, title } }))
  });
})();
/* --- SHF: Portfolio artifact upload (once per artifactId) --- */
(() => {
  if (typeof window === "undefined") return;
  if (window.__shfHook_artifact) return;
  window.__shfHook_artifact = true;

  const oncePerId = (id) => {
    const key = id ? `shf.award.artifact.${id}` : "";
    if (!key) return true;
    if (localStorage.getItem(key)) return false;
    localStorage.setItem(key, "1");
    return true;
  };

  // Dispatch on successful add:
  //   window.dispatchEvent(new CustomEvent("portfolio:artifact:add", { detail:{ id, kind, title } }))
  window.addEventListener("portfolio:artifact:add", (e) => {
    const d = (e && e.detail) || {};
    if (d.id && !oncePerId(d.id)) return;
    try {
      window.shfCredit?.earn?.({
        action: "portfolio.artifact.add",
        rewards: { wheat: 2 },
        scoreDelta: 6,
        meta: { id: d.id, kind: d.kind, title: d.title }
      });
      window.shToast?.("🧾 Artifact added · +2 🌾 · +6 score");
    } catch {}
  });
})();
