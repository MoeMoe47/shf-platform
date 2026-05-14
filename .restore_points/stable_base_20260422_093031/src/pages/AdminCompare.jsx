// src/pages/AdminCompare.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";

// ✅ alias + correct locations
import { allStudentUnits, getStudentUnit, listCurricula } from "@/content/lessons/studentLoader.js";
import { getInstructorUnit } from "@/content/lessons/instructorLoader.js";
import { getMasterUnit } from "@/content/lessons/masterLoader.js";
import { getMasterSlug, getStudentSlug } from "@/content/crosswalk.js";
import { track } from "@/utils/analytics.js";

export default function AdminCompare() {
  const { curriculum = "asl", slug } = useParams(); // slug can be student OR master
  const navigate = useNavigate();

  const [curricula] = useState(() => listCurricula());
  const [unitList, setUnitList] = useState([]); // student units for dropdown

  const [student, setStudent] = useState(null);
  const [instructor, setInstructor] = useState(null);
  const [master, setMaster] = useState(null);

  const [loading, setLoading] = useState(true);

  // Effective slugs after resolving crosswalks
  const [effectiveStudentSlug, setEffectiveStudentSlug] = useState(slug);
  const [effectiveMasterSlug, setEffectiveMasterSlug] = useState(slug);

  // Banner state (what mapping happened)
  const [mappingBanner, setMappingBanner] = useState(null);

  // Load student unit list for selector
  useEffect(() => {
    let alive = true;
    allStudentUnits(curriculum).then((u) => {
      if (!alive) return;
      setUnitList([...u].sort((a, b) => (a.slug > b.slug ? 1 : -1)));
    });
    return () => { alive = false; };
  }, [curriculum]);

  // Resolve whether route slug is student or master, then load all three layers
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setStudent(null); setInstructor(null); setMaster(null);
      setMappingBanner(null);

      // Try student first
      const tryStudent = await getStudentUnit(curriculum, slug);

      // If not student, reverse-crosswalk from master → student
      const resolvedStudentSlug = tryStudent ? slug : getStudentSlug(curriculum, slug);

      // Micro → master (works even if slug was already master)
      const resolvedMasterSlug = getMasterSlug(curriculum, slug);

      // Compute banner message (only show if any mapping actually changed)
      const messages = [];
      if (!tryStudent && resolvedStudentSlug !== slug) {
        messages.push(
          <>Mapped <code>{slug}</code> (master) → student <code>{resolvedStudentSlug}</code>.</>
        );
      }
      if (resolvedMasterSlug !== slug && resolvedMasterSlug !== resolvedStudentSlug) {
        messages.push(
          <>Mapped <code>{slug}</code> (student) → master <code>{resolvedMasterSlug}</code>.</>
        );
      }
      setMappingBanner(messages.length ? messages : null);

      // Load all 3 layers using resolved slugs
      const [s, i, m] = await Promise.all([
        getStudentUnit(curriculum, resolvedStudentSlug),
        getInstructorUnit(curriculum, resolvedStudentSlug),
        getMasterUnit(curriculum, resolvedMasterSlug),
      ]);

      if (!alive) return;
      setStudent(s || null);
      setInstructor(i || null);
      setMaster(m || null);
      setEffectiveStudentSlug(resolvedStudentSlug);
      setEffectiveMasterSlug(resolvedMasterSlug);
      setLoading(false);

      // quiet analytics ping
      track(
        "admin_compare_view",
        { curriculum, slug, studentSlug: resolvedStudentSlug, masterSlug: resolvedMasterSlug },
        { silent: true }
      );
    })();
    return () => { alive = false; };
  }, [curriculum, slug]);

  const onCurriculumChange = (e) => {
    const nextC = e.target.value;
    const fallback = unitList[0]?.slug || effectiveStudentSlug || slug || "";
    navigate(`/${nextC}/admin/${fallback}`);
  };

  const onSlugChange = (e) => {
    // Dropdown lists student units → navigate using a student slug
    navigate(`/${curriculum}/admin/${e.target.value}`);
  };

  const title = useMemo(() => {
    return student?.title || instructor?.title || master?.title || slug;
  }, [student, instructor, master, slug]);

  return (
    <div className="stack">
      <div className="card card--pad">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <p className="subtle" style={{ margin: 0 }}>
              <Link to={`/${curriculum}/lessons`}>{curriculum.toUpperCase()}</Link> / Admin Compare
            </p>
            <h1 className="h1" style={{ margin: 0 }}>{title}</h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <select className="btn" value={curriculum} onChange={onCurriculumChange}>
              {curricula.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
            </select>
            <select
              className="btn"
              value={
                unitList.some(u => u.slug === effectiveStudentSlug)
                  ? effectiveStudentSlug
                  : ""
              }
              onChange={onSlugChange}
            >
              {!unitList.some(u => u.slug === effectiveStudentSlug) && effectiveStudentSlug && (
                <option value="" disabled>({effectiveStudentSlug})</option>
              )}
              {unitList.map(u => <option key={u.slug} value={u.slug}>{u.slug}</option>)}
            </select>
            <button className="btn" onClick={() => window.print()}>Print</button>
          </div>
        </div>

        {/* Mapping banner */}
        {mappingBanner && mappingBanner.length > 0 && (
          <div
            style={{
              marginTop: 10,
              padding: "8px 12px",
              background: "var(--note-bg, #f0f9ff)",
              border: "1px solid var(--note-line, #cfe8ff)",
              borderRadius: 8,
              fontSize: 14
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span aria-hidden>🔗</span>
              <div>
                {mappingBanner.map((msg, i) => (
                  <div key={i} style={{ opacity: 0.9 }}>{msg}</div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="card card--pad">Loading…</div>
      ) : (
        <div className="admin-grid">
          {/* Student */}
          <section className="card card--pad">
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <strong>Student (Micro)</strong>
              <Link className="btn" to={`/${curriculum}/lessons/${effectiveStudentSlug}`}>Open</Link>
            </header>
            {student ? <StudentBlock node={student} /> : <EmptyBlock label="No student micro-lesson found." />}
          </section>

          {/* Instructor */}
          <section className="card card--pad">
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <strong>Instructor</strong>
              <Link className="btn" to={`/${curriculum}/instructor/${effectiveStudentSlug}`}>Open</Link>
            </header>
            {instructor ? <InstructorBlock node={instructor} /> : <EmptyBlock label="No instructor guide found." />}
          </section>

          {/* Master */}
          <section className="card card--pad">
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <strong>Master (Accreditation)</strong>
              <Link className="btn" to={`/${curriculum}/master/${effectiveMasterSlug}`}>Open</Link>
            </header>
            {master ? <MasterBlock node={master} /> : (
              <EmptyBlock label="No master unit linked to this micro-lesson (slug may differ or be unmapped)." />
            )}
          </section>
        </div>
      )}
    </div>
  );
}

/* ---------- small helpers ---------- */
function EmptyBlock({ label }) {
  return <p className="subtle" style={{ marginTop: 8 }}>{label}</p>;
}

function StudentBlock({ node }) {
  return (
    <div className="stack">
      {/* Time */}
      {node.estMinutes ? <p className="subtle">{node.estMinutes} minutes</p> : null}

      {/* Objectives */}
      {Array.isArray(node.objectives) && node.objectives.length > 0 && (
        <div>
          <strong>Objectives</strong>
          <ul style={{ marginTop: 6 }}>
            {node.objectives.map((o, i) => <li key={i}>{o}</li>)}
          </ul>
        </div>
      )}

      {/* Vocabulary (NEW) */}
      {Array.isArray(node.vocab) && node.vocab.length > 0 && (
        <div>
          <strong>Vocabulary</strong>
          <ul style={{ marginTop: 6 }}>
            {node.vocab.map((v, i) => (
              <li key={i}>
                <code style={{ fontWeight: 700 }}>{v.term}</code> — {v.def}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sections + microChecks (NEW: shows check Q/A when present) */}
      {Array.isArray(node.sections) && node.sections.length > 0 && (
        <div>
          <strong>Sections</strong>
          <ul style={{ marginTop: 6 }}>
            {node.sections.map((s, i) => (
              <li key={i}>
                <strong>{s.heading}:</strong> {s.body}
                {s.microCheck ? (
                  <div className="subtle" style={{ marginTop: 4 }}>
                    <em>Check:</em> {s.microCheck.question}{" "}
                    <strong>Answer:</strong> {s.microCheck.answer}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Practice */}
      {Array.isArray(node.practice) && node.practice.length > 0 && (
        <div>
          <strong>Practice</strong>
          <ul style={{ marginTop: 6 }}>
            {node.practice.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </div>
      )}

      {/* Quiz (NEW) */}
      {node.quiz && node.quiz.question && Array.isArray(node.quiz.options) && (
        <div>
          <strong>Quiz</strong>
          <p style={{ marginTop: 6 }}>{node.quiz.question}</p>
          <ul>
            {node.quiz.options.map((opt, i) => <li key={i}>{opt}</li>)}
          </ul>
          {node.quiz.answer && (
            <p className="subtle"><em>Answer:</em> {node.quiz.answer}</p>
          )}
        </div>
      )}

      {/* Portfolio artifact (NEW) */}
      {node.portfolioArtifact && (
        <p className="subtle" style={{ marginTop: 6 }}>
          <em>Portfolio:</em> {node.portfolioArtifact}
        </p>
      )}
    </div>
  );
}

function InstructorBlock({ node }) {
  return (
    <div className="stack">
      {node.pacing?.minutes ? (
        <p className="subtle">
          {node.pacing.minutes} minutes · {Array.isArray(node.pacing.blocks) ? node.pacing.blocks.join(" • ") : null}
        </p>
      ) : null}

      {Array.isArray(node.objectives) && node.objectives.length > 0 && (
        <div>
          <strong>Objectives</strong>
          <ul style={{ marginTop: 6 }}>{node.objectives.map((o,i)=><li key={i}>{o}</li>)}</ul>
        </div>
      )}

      {Array.isArray(node.procedures) && node.procedures.length > 0 && (
        <div>
          <strong>Procedures</strong>
          <ol style={{ marginTop: 6 }}>{node.procedures.map((p,i)=><li key={i}><strong>{p.step}:</strong> {p.detail}</li>)}</ol>
        </div>
      )}

      {Array.isArray(node.assessment?.rubric) && node.assessment.rubric.length > 0 && (
        <div>
          <strong>Rubric (summary)</strong>
          <ul style={{ marginTop: 6 }}>
            {node.assessment.rubric.slice(0,3).map((r,i)=>(
              <li key={i}><strong>{r.criterion}</strong> — B:{r.beginner} · P:{r.proficient} · M:{r.mastery}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function MasterBlock({ node }) {
  return (
    <div className="stack">
      {node.contactHours?.total ? (
        <p className="subtle">
          {node.contactHours.lecture ?? 0}h lecture · {node.contactHours.lab ?? 0}h lab · {node.contactHours.total}h total
        </p>
      ) : null}

      {Array.isArray(node.courseOutcomes) && node.courseOutcomes.length > 0 && (
        <div>
          <strong>Course Outcomes</strong>
          <ul style={{ marginTop: 6 }}>{node.courseOutcomes.map((o,i)=><li key={i}>{o}</li>)}</ul>
        </div>
      )}

      {Array.isArray(node.standards) && node.standards.length > 0 && (
        <div>
          <strong>Standards</strong>
          <ul style={{ marginTop: 6 }}>
            {node.standards.map((s,i)=>(
              <li key={i}>
                <code>{s.code}</code> — {s.desc}
                {Array.isArray(s.outcomes) && s.outcomes.length > 0 ? (
                  <span className="subtle"> (maps: {s.outcomes.join(", ")})</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      {Array.isArray(node.modules) && node.modules.length > 0 && (
        <div>
          <strong>Modules</strong>
          <ol style={{ marginTop: 6 }}>
            {node.modules.map((m,i)=>(
              <li key={i}>
                <strong>{m.title}</strong>{m.hours ? <span className="subtle"> — {m.hours}h</span> : null}
              </li>
            ))}
          </ol>
        </div>
      )}

      {Array.isArray(node.assessments) && node.assessments.length > 0 && (
        <div>
          <strong>Assessment Plan</strong>
          <ul style={{ marginTop: 6 }}>
            {node.assessments.map((a,i)=>(
              <li key={i}><em>{a.type}:</em> {a.desc}{a.weight ? <span className="subtle"> — {a.weight}%</span> : null}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
