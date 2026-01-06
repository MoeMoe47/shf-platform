import React from "react";
import { Link, useParams } from "react-router-dom";
import { allMasterUnits, listMasterSlugs } from "../content/lessons/masterLoader.js";

export default function MasterIndex() {
  const { curriculum = "asl" } = useParams();
  const [units, setUnits] = React.useState([]);
  const [slugs, setSlugs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([
      listMasterSlugs(curriculum),
      allMasterUnits(curriculum)
    ]).then(([s, u]) => {
      if (!alive) return;
      // Sort by `order` if present, else by slug
      const sorted = (u || []).slice().sort((a, b) => {
        const ao = Number(a.order ?? 9999);
        const bo = Number(b.order ?? 9999);
        if (ao !== bo) return ao - bo;
        return String(a.slug).localeCompare(String(b.slug));
      });
      setSlugs(s || []);
      setUnits(sorted);
      setLoading(false);
    }).catch(() => {
      if (alive) {
        setSlugs([]);
        setUnits([]);
        setLoading(false);
      }
    });
    return () => { alive = false; };
  }, [curriculum]);

  return (
    <div className="card card--pad">
      <div className="row" style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <h1 className="h1" style={{ margin: 0 }}>
          {curriculum.toUpperCase()} — Master Index
        </h1>
        <div style={{ display:"flex", gap:8 }}>
          <Link className="btn" to={`/${curriculum}/lessons`}>Student</Link>
          <Link className="btn" to={`/${curriculum}/instructor`}>Instructor</Link>
        </div>
      </div>

      {loading ? (
        <p className="subtle" style={{ marginTop: 12 }}>Loading masters…</p>
      ) : units.length === 0 ? (
        <div style={{ marginTop: 12 }}>
          <p>No master units found for <strong>{curriculum.toUpperCase()}</strong>.</p>
          {slugs.length > 0 && (
            <p className="subtle">Found slugs but couldn’t load details: {slugs.join(", ")}</p>
          )}
        </div>
      ) : (
        <ul style={{ marginTop: 16, paddingLeft: 18 }}>
          {units.map(u => (
            <li key={u.slug} style={{ marginBottom: 10 }}>
              <Link to={`/${curriculum}/master/${u.slug}`}>
                <strong>{u.title || u.slug}</strong>
              </Link>
              {Number.isFinite(u.order) && (
                <span className="pill" style={{ marginLeft: 8 }}>Order {u.order}</span>
              )}
              {u.index?.courseId && (
                <span className="subtle" style={{ marginLeft: 8 }}>{u.index.courseId}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
