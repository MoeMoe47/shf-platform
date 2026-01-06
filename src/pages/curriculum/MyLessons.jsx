import React from "react";
import { Link, useNavigate } from "react-router-dom";
import ImportLessonsButton from "@/components/curriculum/ImportLessonsButton.jsx";

const KEY = "cur:lessons";

export default function MyLessons() {
  const nav = useNavigate();
  const [lessons, setLessons] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
  });

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
        <h1 style={{margin:0}}>My Lessons</h1>
        <ImportLessonsButton onImported={onImported} />
      </div>

      {lessons.length === 0 ? (
        <p style={{marginTop:16,opacity:.8}}>No lessons yet. Click <b>Import Lessons</b> and select one or more JSON files.</p>
      ) : (
        <div className="card" style={{marginTop:16}}>
          <table className="table">
            <thead><tr><th style={{textAlign:"left"}}>Title</th><th>ID</th><th style={{width:160}}></th></tr></thead>
            <tbody>
              {lessons.map(l => (
                <tr key={l.id}>
                  <td style={{textAlign:"left"}}>{l.title || "(untitled)"}</td>
                  <td><code>{l.id}</code></td>
                  <td style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                    <Link className="btn" to={`/lesson/${encodeURIComponent(l.id)}`}>Open</Link>
                    <button className="btn" onClick={()=>remove(l.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {lessons.length > 0 && (
        <div style={{marginTop:12}}>
          <button className="btn" onClick={()=>nav(`/lesson/${encodeURIComponent(lessons[0].id)}`)}>Open first lesson</button>
        </div>
      )}
    </div>
  );
}
