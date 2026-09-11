import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getCareer, getCareerCurriculum } from "@/lib/career/api.js";
import { listPublicOpportunities } from "@/lib/opportunities/api.js";
import { CareerPublicHero } from "@/components/career/CareerPublicPrimitives.jsx";

function CurriculumReference({ requirement }) {
  const lessonPath = `/curriculum.html#/curriculum/lessons/${encodeURIComponent(requirement.lesson_id)}`;
  const gradeBand = requirement.min_grade && requirement.max_grade
    ? `Grades ${requirement.min_grade}-${requirement.max_grade}`
    : "Grade band not published";

  return (
    <li className="career-detailReference">
      <div>
        <strong>{requirement.requirement_type === "required" ? "Required" : "Recommended"} learning reference</strong>
        <span className="subtle">{requirement.curriculum_id} · {gradeBand}</span>
      </div>
      <a className="sh-btn sh-btn--secondary" href={lessonPath}>Open lesson</a>
    </li>
  );
}

export default function CareerDetail() {
  const { careerSlug } = useParams();
  const [state, setState] = useState({ status: "loading", career: null, requirements: [], opportunities: [] });

  useEffect(() => {
    let alive = true;
    setState({ status: "loading", career: null, requirements: [], opportunities: [] });

    Promise.all([getCareer(careerSlug), getCareerCurriculum(careerSlug), listPublicOpportunities().catch(() => [])])
      .then(([career, curriculum, opportunities]) => {
        if (!alive) return;
        setState({
          status: career ? "ready" : "not-found",
          career,
          requirements: Array.isArray(curriculum?.requirements) ? curriculum.requirements : [],
          opportunities: (opportunities || []).filter((item) => item.career?.slug === career?.slug),
        });
      })
      .catch((error) => {
        if (!alive) return;
        setState({ status: error?.status === 404 ? "not-found" : "error", career: null, requirements: [], opportunities: [] });
      });

    return () => { alive = false; };
  }, [careerSlug]);

  if (state.status === "loading") {
    return <main className="career-detail" aria-busy="true"><p role="status">Loading career information...</p></main>;
  }

  if (state.status === "not-found") {
    return (
      <main className="career-detail" aria-labelledby="career-detail-not-found-title">
        <div className="career-detailMessage" role="status">
          <p className="career-eyebrow">Career Center</p>
          <h1 id="career-detail-not-found-title">Career not found</h1>
          <p>That career record is not available in the active public catalog.</p>
          <Link className="sh-btn sh-btn--primary" to="/explore">Return to Explore Careers</Link>
        </div>
      </main>
    );
  }

  if (state.status === "error" || !state.career) {
    return (
      <main className="career-detail" aria-labelledby="career-detail-error-title">
        <div className="career-detailMessage" role="alert">
          <p className="career-eyebrow">Career Center</p>
          <h1 id="career-detail-error-title">Career information is unavailable</h1>
          <p>We could not load this canonical Career record. Please return to Explore Careers and try again.</p>
          <Link className="sh-btn sh-btn--secondary" to="/explore">Return to Explore Careers</Link>
        </div>
      </main>
    );
  }

  const { career, requirements, opportunities } = state;

  return (
    <main className="career-detail" aria-labelledby="career-detail-title">
      <nav className="career-detailBreadcrumbs" aria-label="Breadcrumb">
        <Link to="/explore">Explore Careers</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{career.title}</span>
      </nav>

      <CareerPublicHero
        className="career-detailHero"
        eyebrow={career.family_name || "Career record"}
        title={career.title}
        titleId="career-detail-title"
        description={career.description || "A description for this career has not been published yet."}
        aside={<dl className="career-detailMeta">
          <div><dt>Career ID</dt><dd>{career.career_id}</dd></div>
          {career.sector ? <div><dt>Sector</dt><dd>{career.sector}</dd></div> : null}
        </dl>}
      />

      <div className="career-detailGrid">
        <section className="career-detailSection" aria-labelledby="career-detail-does-title">
          <p className="career-eyebrow">Career identity</p>
          <h2 id="career-detail-does-title">What this career does</h2>
          <p>{career.description || "A plain-language explanation is not available in the canonical record yet."}</p>
        </section>

        <section className="career-detailSection" aria-labelledby="career-detail-skills-title">
          <p className="career-eyebrow">Canonical data boundary</p>
          <h2 id="career-detail-skills-title">Core skills</h2>
          <p className="career-detailUnavailable">Public skill relationships are not published for this Career record yet.</p>
        </section>

        <section className="career-detailSection" aria-labelledby="career-detail-pathway-title">
          <p className="career-eyebrow">Pathway connection</p>
          <h2 id="career-detail-pathway-title">Career pathway</h2>
          <p className="career-detailUnavailable">No public pathway connection is available for this Career record yet.</p>
          <Link className="sh-btn sh-btn--secondary" to="/pathways">Browse Career Pathways</Link>
        </section>

        <section className="career-detailSection career-detailSection--wide" aria-labelledby="career-detail-learning-title">
          <p className="career-eyebrow">Learning connections</p>
          <h2 id="career-detail-learning-title">Related curriculum references</h2>
          {requirements.length ? (
            <ul className="career-detailReferences">
              {requirements.map((requirement) => <CurriculumReference key={requirement.career_curriculum_requirement_id || requirement.lesson_id} requirement={requirement} />)}
            </ul>
          ) : <p className="career-detailUnavailable">No curriculum requirements are currently published for this Career record.</p>}
        </section>

        <section className="career-detailSection" aria-labelledby="career-detail-prep-title">
          <p className="career-eyebrow">Preparation</p>
          <h2 id="career-detail-prep-title">Education and training</h2>
          <p className="career-detailUnavailable">Public education or training requirements are not available in the canonical record yet.</p>
        </section>

        <section className="career-detailSection" aria-labelledby="career-detail-workforce-title">
          <p className="career-eyebrow">Workforce context</p>
          <h2 id="career-detail-workforce-title">Opportunities and regional data</h2>
          <p className="career-detailUnavailable">Public opportunity, wage, demand, employer, and regional workforce data are not available here yet.</p>
        </section>

        <section className="career-detailSection career-detailSection--wide" aria-labelledby="career-detail-opportunities-title">
          <p className="career-eyebrow">Canonical opportunity connection</p>
          <h2 id="career-detail-opportunities-title">Related public opportunities</h2>
          {opportunities.length ? <ul className="career-detailReferences">{opportunities.map((item) => <li className="career-detailReference" key={item.id}><div><strong>{item.title}</strong><span className="subtle">{item.organization?.name || "Organization not published"}</span></div><Link className="sh-btn sh-btn--secondary" to={`/opportunities/${encodeURIComponent(item.id)}`}>View Opportunity</Link></li>)}</ul> : <p className="career-detailUnavailable">No publicly published opportunities are canonically linked to this Career record.</p>}
        </section>
      </div>

      <section className="career-detailHandoff" aria-labelledby="career-detail-handoff-title">
        <div>
          <p className="career-eyebrow">Personal next step</p>
          <h2 id="career-detail-handoff-title">Ready to keep exploring?</h2>
          <p>Open your personal Career Center to work with your own plan, resume, portfolio, learning, and calendar.</p>
        </div>
        <Link className="sh-btn sh-btn--primary" to="/dashboard">Open My Career Center</Link>
      </section>

      <style>{`
        .career-detail{max-width:1180px;margin:0 auto;padding:24px clamp(16px,3vw,32px) 48px;}
        .career-detailBreadcrumbs{display:flex;gap:9px;align-items:center;margin-bottom:20px;color:var(--ink-soft,#58636d);font-size:13px;}
        .career-detailBreadcrumbs a{color:var(--orange,#d94d00);font-weight:700;}
        .career-detailHero{display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:30px;align-items:end;padding:clamp(24px,4vw,44px);border-radius:16px;background:#f0f6f2;border:1px solid #d8e7dc;}
        .career-detail h1{margin:0;color:var(--ink,#18222b);font-size:clamp(34px,5vw,58px);line-height:1.04;letter-spacing:0;}
        .career-detail h2{margin:0;color:var(--ink,#18222b);font-size:22px;line-height:1.2;letter-spacing:0;}
        .career-detailHero__description{max-width:720px;margin:16px 0 0;color:var(--ink-soft,#58636d);font-size:18px;line-height:1.55;}
        .career-detailMeta{display:grid;gap:14px;margin:0;padding:0;border-left:1px solid rgba(25,45,55,.16);padding-left:20px;}
        .career-detailMeta div{display:grid;gap:4px;}
        .career-detailMeta dt{color:var(--ink-soft,#58636d);font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;}
        .career-detailMeta dd{margin:0;overflow-wrap:anywhere;color:var(--ink,#18222b);font-weight:700;}
        .career-detailGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:18px;}
        .career-detailSection{padding:22px;border:1px solid var(--ring,#dfe4ea);border-radius:12px;background:var(--card,#fff);}
        .career-detailSection--wide{grid-column:1 / -1;}
        .career-detailSection .career-eyebrow{margin-bottom:7px;}
        .career-detailSection p:not(.career-eyebrow){color:var(--ink-soft,#58636d);line-height:1.55;}
        .career-detailUnavailable{padding-left:14px;border-left:3px solid #d5dce1;}
        .career-detailReferences{display:grid;gap:9px;margin:16px 0 0;padding:0;list-style:none;}
        .career-detailReference{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:14px;border:1px solid var(--ring,#dfe4ea);border-radius:9px;}
        .career-detailReference div{display:grid;gap:5px;min-width:0;}
        .career-detailReference strong{color:var(--ink,#18222b);}
        .career-detailHandoff{display:flex;justify-content:space-between;align-items:center;gap:22px;margin-top:18px;padding:24px;border-top:1px solid var(--ring,#dfe4ea);border-bottom:1px solid var(--ring,#dfe4ea);}
        .career-detailHandoff p:not(.career-eyebrow){margin:8px 0 0;color:var(--ink-soft,#58636d);line-height:1.5;}
        .career-detailMessage{max-width:620px;margin:32px auto;padding:32px;border:1px solid var(--ring,#dfe4ea);border-radius:12px;background:var(--card,#fff);text-align:center;}
        .career-detailMessage h1{font-size:34px;}
        .career-detailMessage p:not(.career-eyebrow){color:var(--ink-soft,#58636d);line-height:1.5;}
        @media (max-width:760px){.career-detailHero,.career-detailGrid{grid-template-columns:1fr;}.career-detailSection--wide{grid-column:auto;}.career-detailMeta{border-left:0;border-top:1px solid rgba(25,45,55,.16);padding:16px 0 0;}.career-detailReference,.career-detailHandoff{align-items:flex-start;flex-direction:column;}}
      `}</style>
    </main>
  );
}
