import React from "react";
import { useParams, Link } from "react-router-dom";
import { allInstructorUnits } from "../content/lessons/instructorLoader.js";

export default function Instructor() {
  const { curriculum = "asl" } = useParams();
  const [data, setData] = React.useState([]);

  React.useEffect(() => {
    let alive = true;
    allInstructorUnits(curriculum).then((units) => {
      if (alive) setData(Array.isArray(units) ? units : []);
    });
    return () => {
      alive = false;
    };
  }, [curriculum]);

  return (
    <div className="card card--pad">
      <div className="row">
        <h1 className="h1" style={{ margin: 0 }}>Instructor Guide</h1>
        <span className="subtle">{data.length} unit{data.length===1?"":"s"}</span>
      </div>

      {data.length === 0 ? (
        <p className="subtle" style={{ marginTop:12 }}>
          No instructor units found in <code>src/content/lessons/asl-instructor</code>.
          Add <code>.json</code> files and reload.
        </p>
      ) : (
        <ul style={{ marginTop: 14, paddingLeft: 18 }}>
          {data.map((u, i) => {
            // Real instructor JSON has no `slug` field — the loader looks
            // units up by filename (see instructorLoader.js's
            // getInstructorUnit), and `id` matches that filename in every
            // sampled file (e.g. "instructor.asl-01"). Fall back to `slug`
            // first in case a future unit adds one explicitly.
            const unitSlug = u.slug || u.id;
            return (
            <li key={unitSlug || i} style={{ marginBottom: 10 }}>
              {unitSlug ? (
                <Link to={`/curriculum/instructor/${encodeURIComponent(unitSlug)}`}><strong>{u.title}</strong></Link>
              ) : (
                <strong>{u.title}</strong>
              )}
              {u?.estMinutes ? (
                <span className="subtle"> — {u.estMinutes} min</span>
              ) : null}
            </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
