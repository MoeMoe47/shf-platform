import React from "react";
import { useLibrary } from "@/shared/library/LibraryProvider.jsx";

export default function LessonImportDialog({ open, onClose }) {
  const { app, upsert } = useLibrary();
  const [drag, setDrag] = React.useState(false);
  if (!open) return null;

  const parseAndSave = async (file) => {
    const ext = file.name.toLowerCase().split(".").pop();
    const txt = await file.text();
    try {
      if (ext === "json") {
        const obj = JSON.parse(txt);
        const arr = Array.isArray(obj) ? obj : [obj];
        arr.forEach((it) => upsert(normalize(it)));
      } else if (ext === "csv") {
        // naive CSV: id,title,type,content (semicolon sep paragraphs)
        const rows = txt.split(/\r?\n/).filter(Boolean);
        const [header, ...data] = rows;
        const cols = header.split(",");
        data.forEach(line => {
          const vals = line.split(",");
          const rec = Object.fromEntries(cols.map((c,i)=>[c.trim(), vals[i]?.trim()]));
          upsert(normalize({
            id: rec.id,
            type: rec.type || "lesson",
            title: rec.title,
            content: rec.content ? rec.content.split(";") : []
          }));
        });
      } else if (ext === "md" || ext === "mdx") {
        // minimal MD: first line = title, rest paragraphs
        const lines = txt.split(/\r?\n/);
        const title = lines[0].replace(/^#\s*/,"").trim() || file.name;
        const body = lines.slice(1).join("\n").split(/\n\n+/);
        upsert(normalize({ id: file.name, type: "lesson", title, content: body }));
      }
      onClose?.();
    } catch (e) {
      alert(`Import failed: ${e.message}`);
    }
  };

  const onFiles = (files) => { [...files].forEach(parseAndSave); };
  const onDrop = (e) => { e.preventDefault(); setDrag(false); onFiles(e.dataTransfer.files); };

  return (
    <div className="kb-overlay" onClick={(e)=>{ if(e.target===e.currentTarget) onClose?.(); }}>
      <div className="kb-card" role="dialog" aria-modal="true" aria-label={`Import into ${app}`}>
        <strong style={{ fontSize: 16 }}>Import lessons/chapters/books</strong>
        <p className="sh-hint" style={{ marginTop: 6 }}>
          Drop <code>.json</code>, <code>.csv</code>, or <code>.md</code>. JSON schema is preferred.
        </p>
        <div
          onDragOver={(e)=>{e.preventDefault(); setDrag(true);}}
          onDragLeave={()=>setDrag(false)}
          onDrop={onDrop}
          className="sh-drop"
          style={{
            marginTop: 10, padding: 18, border: "2px dashed var(--ring,#e5e7eb)",
            borderRadius: 12, background: drag ? "rgba(99,102,241,.06)" : "transparent"
          }}
        >
          <div>📥 Drop files here</div>
          <div style={{ marginTop: 8 }}>
            <label className="sh-btn sh-btn--secondary">
              Browse…
              <input type="file" hidden multiple onChange={(e)=>onFiles(e.target.files)} />
            </label>
          </div>
        </div>

        <div className="sh-actionsRow" style={{ marginTop: 10 }}>
          <button className="sh-btn is-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function normalize(x) {
  const id = x.id || (crypto?.randomUUID?.() ?? String(Date.now()));
  const type = x.type || "lesson";
  return {
    id, type,
    title: x.title || "Untitled",
    overview: x.overview || [],
    objectives: x.objectives || [],
    vocab: x.vocab || [],
    content: Array.isArray(x.content) ? x.content : (x.content ? [String(x.content)] : []),
    quiz: Array.isArray(x.quiz) ? x.quiz : [],
    media: x.media || null,
    meta: x.meta || {}
  };
}
