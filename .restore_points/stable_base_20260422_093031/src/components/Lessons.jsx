// src/pages/Lessons.jsx
import React from "react";
import { Link, useParams } from "react-router-dom";

export default function Lessons() {
  const { curriculum = "asl" } = useParams();
  const [slugs, setSlugs] = React.useState([]);
  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let stop = false;
    (async () => {
      try {
        setLoading(true);
        const r = await fetch(`/api/merged/${curriculum}/index`);
        const j = r.ok ? await r.json() : { slugs: [] };
        const arr = Array.isArray(j) ? j : (j.slugs || j.lessons || []);
        const list = arr.map(s => (typeof s === "string" ? s : s?.slug)).filter(Boolean);
        if (!stop) setSlugs(list);
      } catch {
        if (!stop) setSlugs([]);
      } finally {
        if (!stop) setLoading(false);
      }
    })();
    return () => { stop = true; };
  }, [curriculum]);

  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    return term ? slugs.filter(s => s.toLowerCase().includes(term)) : slugs;
  }, [slugs, q]);

  return (
    <section style={{ padding: 16 }}>
      <h1 style={{ marginTop: 0 }}>{curriculum.toUpperCase()} — Lessons</h1>

      <div style={{ margin: "8px 0 16px", display:"flex", gap:8 }}>
        <input
          type="search"
          placeholder="Search lessons…"
          value={q}
          onChange={(e)=>setQ(e.target.value)}
          style={{ padding:"8px 10px", borderRadius:10, border:"1px solid #e5e7eb", minWidth:220 }}
        />
      </div>

      {loading && <p>Loading…</p>}
      {!loading && filtered.length === 0 && <p style={{ color:"#6b7280" }}><em>No lessons.</em></p>}

      <ul>
        {filtered.map(slug => (
          <li key={slug}>
            <Link to={`/${curriculum}/lesson/${slug}`}>{slug.toUpperCase()}</Link>
          </li>
        ))}
      </ul>

      <p style={{ color:"#666" }}>
        Data from <code>/api/merged/{curriculum}/index</code>.
      </p>
    </section>
  );
}
