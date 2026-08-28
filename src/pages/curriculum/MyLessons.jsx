// src/pages/curriculum/MyLessons.jsx
//
// Phase 1 correction (2026-08-27): this page is the sidebar's "Lessons"
// destination (/curriculum/lessons — see CurriculumSidebar.jsx), so it is
// the normal entry point into the Student Lesson Guided Experience. It
// previously only listed browser-imported, localStorage-backed lessons
// ("cur:lessons") and showed "No lessons yet" for every real student —
// the repo's real, canonical student lesson content
// (src/content/lessons/*-student/*.json) was never surfaced here, even
// though it's fully reachable via GuidedLessonExperience at
// /curriculum/lessons/:slug. This adds a canonical lessons section, using
// studentLoader.js's allStudentUnitsCatalog() — no new content source, no
// localStorage-as-catalog. Import Lessons is preserved exactly as before,
// as a clearly-labeled secondary/manual, preview-only capability.
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import ImportLessonsButton from "@/components/curriculum/ImportLessonsButton.jsx";
import { allStudentUnitsCatalog } from "@/content/lessons/studentLoader.js";

const KEY = "cur:lessons";

export default function MyLessons() {
  const nav = useNavigate();
  const [canonical, setCanonical] = React.useState([]);
  const [canonicalLoading, setCanonicalLoading] = React.useState(true);
  const [lessons, setLessons] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
  });

  React.useEffect(() => {
    let alive = true;
    allStudentUnitsCatalog().then((entries) => {
      if (!alive) return;
      const sorted = [...entries].sort((a, b) => String(a.routeSlug).localeCompare(String(b.routeSlug)));
      setCanonical(sorted);
      setCanonicalLoading(false);
    });
    return () => { alive = false; };
  }, []);

  function refresh(next) {
    const data = next ?? JSON.parse(localStorage.getItem(KEY) || "[]");
    setLessons(data);
  }

  function onImported(next) { refresh(next); }

  function remove(id) {
    const next = lessons.filter(l => l.id !== id);
    localStorage.setItem(KEY, JSON.stringify(next));
    refresh(next);
  }

  return (
    <div className="page pad">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
        {/* Heading text kept as "My Lessons" — pinned by
            tests/ui/assignments-lessons-regression.spec.mjs's "Back to My
            Lessons" navigation check. */}
        <h1 style={{margin:0}}>My Lessons</h1>
      </div>

      <section className="card" style={{marginTop:16, padding:16}} aria-label="Canonical lessons">
        <h2 style={{marginTop:0}}>Your Lessons</h2>
        {canonicalLoading ? (
          <p style={{opacity:.8}}>Loading lessons…</p>
        ) : canonical.length === 0 ? (
          <p style={{opacity:.8}}>No canonical lessons found in this repository.</p>
        ) : (
          <table className="table">
            <thead><tr><th style={{textAlign:"left"}}>Title</th><th>Curriculum</th><th style={{width:120}}></th></tr></thead>
            <tbody>
              {canonical.map((entry) => (
                <tr key={`${entry.curriculum}:${entry.routeSlug}`}>
                  <td style={{textAlign:"left"}}>{entry.unit?.title || entry.routeSlug}</td>
                  <td>{String(entry.curriculum).toUpperCase()}</td>
                  <td>
                    <Link className="btn" to={`/curriculum/lessons/${encodeURIComponent(entry.routeSlug)}`}>Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card" style={{marginTop:16, padding:16}} aria-label="Imported lessons">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <h2 style={{margin:0}}>Imported Lessons</h2>
          <ImportLessonsButton onImported={onImported} />
        </div>
        <p style={{marginTop:8, marginBottom:0, opacity:.8, fontSize:13}}>
          Manually imported lessons are local preview only — they do not count toward institutional completion.
        </p>

        {lessons.length === 0 ? (
          <p style={{marginTop:16,opacity:.8}}>No imported lessons yet. Click <b>Import Lessons</b> and select one or more JSON files.</p>
        ) : (
          <div style={{marginTop:16}}>
            <table className="table">
              <thead><tr><th style={{textAlign:"left"}}>Title</th><th>ID</th><th style={{width:160}}></th></tr></thead>
              <tbody>
                {lessons.map(l => (
                  <tr key={l.id}>
                    <td style={{textAlign:"left"}}>{l.title || "(untitled)"}</td>
                    <td><code>{l.id}</code></td>
                    <td style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                      <Link className="btn" to={`/curriculum/lesson/${encodeURIComponent(l.id)}`}>Open</Link>
                      <button className="btn" onClick={()=>remove(l.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{marginTop:12}}>
              <button className="btn" onClick={()=>nav(`/curriculum/lesson/${encodeURIComponent(lessons[0].id)}`)}>Open first imported lesson</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
