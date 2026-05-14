import React from "react";
import { Link } from "react-router-dom";
import { allInstructorUnits } from "../content/lessons/instructorLoader.js";

export default function Instructor() {
  const data = allInstructorUnits();
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
          {data.map(u => (
            <li key={u.slug} style={{ marginBottom: 10 }}>
              <Link to={`/instructor/${u.slug}`}><strong>{u.title}</strong></Link>
              {u?.pacing?.minutes ? (
                <span className="subtle"> — {u.pacing.minutes} min</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
