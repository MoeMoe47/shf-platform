// src/pages/InstructorUnit.jsx
import React from "react";
import { useParams, Link } from "react-router-dom";
import { getInstructorUnit } from "@/content/lessons/instructorLoader.js";
import { track } from "@/utils/analytics.js";

// NEW: Coach Mode bits
import CoachPanel from "@/components/CoachPanel.jsx";
import { useRole } from "@/hooks/useRole.js";

export default function InstructorUnit() {
  const { curriculum = "asl", slug } = useParams();
  const { role } = useRole();

  const [unit, setUnit] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [parentMode, setParentMode] = React.useState(() => /parent/i.test(role || ""));

  // If role changes at runtime, sync the default toggle
  React.useEffect(() => {
    setParentMode(/parent/i.test(role || ""));
  }, [role]);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");

    (async () => {
      try {
        const data = await getInstructorUnit(curriculum, slug);
        if (!alive) return;
        setUnit(data || null);
        track("instructor_unit_view", { curriculum, slug }, { silent: true });
      } catch (e) {
        if (!alive) return;
        setError(e?.message || String(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [curriculum, slug]);

  if (loading) {
    return <div className="card card--pad">Loading…</div>;
  }

  if (error || !unit) {
    return (
      <div className="card card--pad">
        <h2 style={{ marginTop: 0 }}>Not found</h2>
        {error ? (
          <p className="subtle" style={{ color: "#b91c1c" }}>{error}</p>
        ) : (
          <p>
            We couldn’t find <code>{slug}</code> in{" "}
            <code>src/content/lessons/{curriculum}-instructor</code>.
          </p>
        )}
        <p><Link to={`/${curriculum}/instructor`}>Back to Instructor Guide</Link></p>
      </div>
    );
  }

  return (
    <article className="stack">
      <div className="card card--pad">
        <p className="subtle" style={{ margin: 0 }}>
          <Link to={`/${curriculum}/instructor`}>{curriculum.toUpperCase()} · Instructor Guide</Link>
        </p>
        <h1 className="h1" style={{ marginTop: 4 }}>{unit.title || slug}</h1>

        {/* Parent-friendly language toggle */}
        <div style={{ display:"flex", gap:8, alignItems:"center", marginTop: 6 }}>
          <label className="check">
            <input
              type="checkbox"
              checked={parentMode}
              onChange={(e)=>setParentMode(e.target.checked)}
            />
            <span>Parent-friendly language</span>
          </label>
        </div>

        {unit?.pacing?.minutes && unit?.pacing?.blocks?.length ? (
          <p className="subtle">
            {unit.pacing.minutes} minutes · {unit.pacing.blocks.join(" • ")}
          </p>
        ) : null}
      </div>

      {/* Coach Mode panel (role-aware tips, logs parent engagement) */}
      <CoachPanel
        lesson={{
          slug: unit.slug || slug,
          title: unit.title,
          objectives: unit.objectives,
          pacing: unit.pacing,
        }}
      />

      {Array.isArray(unit?.objectives) && unit.objectives.length > 0 && (
        <section className="card card--pad">
          <strong>{parentMode ? "What we’re learning today" : "Objectives"}</strong>
          <ul style={{ marginTop: 8 }}>
            {unit.objectives.map((o, i) => <li key={i}>{parentMode ? simplify(o) : o}</li>)}
          </ul>
        </section>
      )}

      {Array.isArray(unit?.materials) && unit.materials.length > 0 && (
        <section className="card card--pad">
          <strong>{parentMode ? "What you’ll need" : "Materials"}</strong>
          <ul style={{ marginTop: 8 }}>
            {unit.materials.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </section>
      )}

      {unit?.standards && typeof unit.standards === "object" && (
        <section className="card card--pad">
          <strong>{parentMode ? "Standards (for teachers)" : "Standards"}</strong>
          <ul style={{ marginTop: 8 }}>
            {Object.entries(unit.standards).map(([k, v]) => (
              <li key={k}><code>{k}</code> — {v}</li>
            ))}
          </ul>
        </section>
      )}

      {Array.isArray(unit?.procedures) && unit.procedures.length > 0 && (
        <section className="card card--pad">
          <strong>{parentMode ? "Step-by-step" : "Procedures"}</strong>
          <ol style={{ marginTop: 8 }}>
            {unit.procedures.map((p, i) => (
              <li key={i}>
                <strong>{p.step}:</strong>{" "}
                {parentMode ? simplify(p.detail) : p.detail}
              </li>
            ))}
          </ol>
        </section>
      )}

      {Array.isArray(unit?.checks) && unit.checks.length > 0 && (
        <section className="card card--pad">
          <strong>{parentMode ? "Quick checks" : "Checks"}</strong>
          <ul style={{ marginTop: 8 }}>
            {unit.checks.map((c, i) => (
              <li key={i}>
                <em>{c.type}:</em>{" "}
                {parentMode ? simplify(c.what) : c.what}
              </li>
            ))}
          </ul>
        </section>
      )}

      {Array.isArray(unit?.misconceptions) && unit.misconceptions.length > 0 && (
        <section className="card card--pad">
          <strong>{parentMode ? "Common mix-ups" : "Common Misconceptions"}</strong>
          <ul style={{ marginTop: 8 }}>
            {unit.misconceptions.map((m, i) => <li key={i}>{parentMode ? simplify(m) : m}</li>)}
          </ul>
        </section>
      )}

      {unit?.differentiation && (
        <section className="card card--pad">
          <strong>{parentMode ? "Support options" : "Differentiation"}</strong>
          <ul style={{ marginTop: 8 }}>
            {unit.differentiation.iep && <li><strong>IEP:</strong> {parentMode ? simplify(unit.differentiation.iep) : unit.differentiation.iep}</li>}
            {unit.differentiation.ell && <li><strong>ELL:</strong> {parentMode ? simplify(unit.differentiation.ell) : unit.differentiation.ell}</li>}
            {unit.differentiation.extension && <li><strong>Extension:</strong> {parentMode ? simplify(unit.differentiation.extension) : unit.differentiation.extension}</li>}
          </ul>
        </section>
      )}

      {(unit?.teacherNotes || unit?.ethicsLine) && (
        <section className="card card--pad">
          {unit.teacherNotes && (
            <p style={{ marginTop: 8 }}>
              <strong>{parentMode ? "Coach notes" : "Teacher Notes"}:</strong>{" "}
              {parentMode ? simplify(unit.teacherNotes) : unit.teacherNotes}
            </p>
          )}
          {unit.ethicsLine && (
            <p className="subtle" style={{ marginTop: 8 }}>
              <em>{parentMode ? "Big idea" : "Ethical anchor"}:</em>{" "}
              {parentMode ? simplify(unit.ethicsLine) : unit.ethicsLine}
            </p>
          )}
        </section>
      )}
    </article>
  );
}

/** Tiny “parent-friendly” rephrasing helper (swap later for LLM) */
function simplify(text = "") {
  return text
    .replace(/demonstrate|apply|analyze|synthesize/gi, "show")
    .replace(/articulate/gi, "say")
    .replace(/\butilize\b/gi, "use")
    .replace(/\bformative assessment\b/gi, "quick check")
    .replace(/\bobjective\b/gi, "goal");
}
