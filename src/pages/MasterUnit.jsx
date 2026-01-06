import React from "react";
import { Link, useParams } from "react-router-dom";
import { getMasterUnit } from "../content/lessons/masterLoader.js";

function Section({ title, children, right }) {
  return (
    <section className="card" style={{ marginTop: 12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        {right}
      </div>
      <div>{children}</div>
    </section>
  );
}

function List({ items, render = (x) => String(x) }) {
  if (!items || !items.length) return <p className="subtle">None</p>;
  return (
    <ul style={{ margin: "8px 0 0 18px" }}>
      {items.map((it, i) => <li key={i}>{render(it)}</li>)}
    </ul>
  );
}

export default function MasterUnit() {
  const { curriculum = "asl", slug } = useParams();
  const [unit, setUnit] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    getMasterUnit(curriculum, slug)
      .then((u) => { if (alive) { setUnit(u || null); setLoading(false); } })
      .catch(() => { if (alive) { setUnit(null); setLoading(false); } });
    return () => { alive = false; };
  }, [curriculum, slug]);

  if (loading) {
    return (
      <div className="card card--pad">
        <p className="subtle">Loading {curriculum.toUpperCase()} master unit…</p>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="card card--pad">
        <h2 style={{ marginTop: 0 }}>Not Found</h2>
        <p>No master unit found for slug <code>{slug}</code> in <strong>{curriculum.toUpperCase()}</strong>.</p>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop: 8 }}>
          <Link className="btn" to={`/${curriculum}/master`}>Back to Master Index</Link>
          <Link className="btn" to={`/${curriculum}/lessons`}>Student</Link>
          <Link className="btn" to={`/${curriculum}/instructor`}>Instructor</Link>
        </div>
      </div>
    );
  }

  const {
    title,
    order,
    index,
    contactHours,
    programOutcomes,
    courseOutcomes,
    standards,
    standardsMatrix,
    modules,
    assessments,
    rubric,
    iepAccommodations,
    differentiation,
    accessibility,
    compliance,
    fundingHooks,
    materials,
    accommodations,
    portfolioArtifact,
    microLessonRefs,
    grantAlignment,
    credentialProof,
    notes,
    revision,
  } = unit;

  return (
    <div className="card card--pad" style={{ padding: 16 }}>
      {/* Header */}
      <div className="row" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 12 }}>
        <div>
          <h1 className="h1" style={{ margin: "0 0 6px 0" }}>{title || slug}</h1>
          <div className="muted" style={{ fontSize: 14 }}>
            <span style={{ marginRight: 12 }}><strong>Slug:</strong> {slug}</span>
            {Number.isFinite(order) && <span className="pill">Order {order}</span>}
          </div>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <Link className="btn" to={`/${curriculum}/master`}>Master Index</Link>
          <Link className="btn" to={`/${curriculum}/admin/${slug}`}>Admin Compare</Link>
        </div>
      </div>

      {/* Index / Meta */}
      <Section title="Index / Meta">
        <table>
          <tbody>
            <tr><th>Course ID</th><td>{index?.courseId || "—"}</td></tr>
            <tr><th>Program</th><td>{index?.program || "—"}</td></tr>
            <tr><th>Level</th><td>{index?.level || "—"}</td></tr>
            <tr><th>Total Contact Hrs</th><td>{index?.totalContactHours ?? "—"}</td></tr>
            <tr><th>Delivery</th><td>{(index?.delivery || []).join(", ") || "—"}</td></tr>
            <tr><th>Funding Alignment</th><td>{(index?.fundingAlignment || []).join(", ") || "—"}</td></tr>
            <tr><th>Credential</th><td>{index?.credential || "—"}</td></tr>
          </tbody>
        </table>
      </Section>

      {/* Contact Hours */}
      <Section title="Contact Hours">
        <table>
          <tbody>
            <tr><th>Lecture</th><td>{contactHours?.lecture ?? "—"}</td></tr>
            <tr><th>Lab</th><td>{contactHours?.lab ?? "—"}</td></tr>
            <tr><th>Total</th><td>{contactHours?.total ?? "—"}</td></tr>
          </tbody>
        </table>
      </Section>

      {/* Outcomes */}
      <Section title="Program Outcomes">
        <List items={programOutcomes} />
      </Section>
      <Section title="Course Outcomes">
        <List items={courseOutcomes} />
      </Section>

      {/* Standards */}
      <Section title="Standards">
        {(!standards || standards.length === 0) ? (
          <p className="subtle">None</p>
        ) : (
          <table>
            <thead><tr><th>Code</th><th>Description</th><th>Outcomes</th></tr></thead>
            <tbody>
              {standards.map((s, i) => (
                <tr key={i}>
                  <td className="mono">{s.code}</td>
                  <td>{s.desc}</td>
                  <td>{Array.isArray(s.outcomes) ? s.outcomes.join(", ") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* Standards Matrix */}
      <Section title="Standards Matrix">
        {(!standardsMatrix || standardsMatrix.length === 0) ? (
          <p className="subtle">None</p>
        ) : (
          <table>
            <thead><tr><th>Outcome</th><th>Aligned Standards</th></tr></thead>
            <tbody>
              {standardsMatrix.map((row, i) => (
                <tr key={i}>
                  <td>{row.outcome}</td>
                  <td>
                    <List
                      items={row.aligned}
                      render={(a) => <span className="mono">{a.code}</span>}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* Modules */}
      <Section title="Modules">
        {(!modules || modules.length === 0) ? (
          <p className="subtle">None</p>
        ) : (
          <div className="stack">
            {modules.map((m, i) => (
              <div key={i} className="card" style={{ borderColor:"#e5e7eb" }}>
                <div className="row" style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
                  <strong>{m.title}</strong>
                  {Number.isFinite(m.hours) && <span className="pill">{m.hours} hrs</span>}
                </div>
                <div style={{ marginTop: 8 }}>
                  <strong>Objectives</strong>
                  <List items={m.objectives} />
                </div>
                <div style={{ marginTop: 8 }}>
                  <strong>Topics</strong>
                  <List items={m.topics} />
                </div>
                {m.evidence && (
                  <div style={{ marginTop: 8 }}>
                    <strong>Evidence</strong>
                    <List items={m.evidence} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Assessments & Rubric */}
      <Section title="Assessments">
        {(!assessments || assessments.length === 0) ? (
          <p className="subtle">None</p>
        ) : (
          <table>
            <thead><tr><th>Type</th><th>Description</th><th>Weight</th></tr></thead>
            <tbody>
              {assessments.map((a, i) => (
                <tr key={i}>
                  <td>{a.type}</td>
                  <td>{a.desc}</td>
                  <td>{a.weight ?? "—"}{a.weight != null ? "%" : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title="Rubric">
        {(!rubric || rubric.length === 0) ? (
          <p className="subtle">None</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Criterion</th>
                <th>Beginner</th>
                <th>Proficient</th>
                <th>Mastery</th>
                <th>IEP Note</th>
              </tr>
            </thead>
            <tbody>
              {rubric.map((r, i) => (
                <tr key={i}>
                  <td><strong>{r.criterion}</strong></td>
                  <td>{r.beginner || "—"}</td>
                  <td>{r.proficient || "—"}</td>
                  <td>{r.mastery || "—"}</td>
                  <td className="subtle">{r.iepNote || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* Supports & Compliance */}
      <Section title="IEP Accommodations">
        {iepAccommodations ? (
          <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(iepAccommodations, null, 2)}</pre>
        ) : <p className="subtle">None</p>}
      </Section>

      <Section title="Differentiation / Accessibility">
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {JSON.stringify({ differentiation, accessibility }, null, 2)}
        </pre>
      </Section>

      <Section title="Compliance & Funding">
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {JSON.stringify({ compliance, fundingHooks, grantAlignment }, null, 2)}
        </pre>
      </Section>

      {/* Materials & Portfolio */}
      <Section title="Materials">
        <List items={materials} />
      </Section>
      <Section title="Additional Accommodations">
        <List items={accommodations} />
      </Section>
      <Section title="Portfolio Artifact">
        <p>{portfolioArtifact || "—"}</p>
      </Section>

      {/* Micro refs / metadata */}
      <Section
        title="Linked Micro Lessons"
        right={<Link className="btn" to={`/${curriculum}/lessons`}>Go to Student Lessons</Link>}
      >
        {(!microLessonRefs || microLessonRefs.length === 0) ? (
          <p className="subtle">None</p>
        ) : (
          <ul style={{ marginLeft: 18 }}>
            {microLessonRefs.map((m, i) => (
              <li key={i}>
                <Link to={`/${curriculum}/lessons/${m.slug}`}><strong>{m.title || m.slug}</strong></Link>
                {m.role && <span className="subtle" style={{ marginLeft: 6 }}>({m.role})</span>}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Notes / Revision">
        <table>
          <tbody>
            <tr><th>Notes</th><td>{notes || "—"}</td></tr>
            <tr><th>Revision</th><td>{revision ? JSON.stringify(revision) : "—"}</td></tr>
            <tr><th>Credential Proof</th><td>{credentialProof ? JSON.stringify(credentialProof) : "—"}</td></tr>
          </tbody>
        </table>
      </Section>
    </div>
  );
}
