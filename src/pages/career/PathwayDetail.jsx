import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getCareer, getCareerCurriculum } from "@/lib/career/api.js";
import { listPublicOpportunities } from "@/lib/opportunities/api.js";
import { CareerPublicHero } from "@/components/career/CareerPublicPrimitives.jsx";

export default function PathwayDetail() {
  const { pathwaySlug } = useParams();
  const [state, setState] = useState({ status: "loading", career: null, requirements: [], opportunities: [] });

  useEffect(() => {
    let alive = true;
    setState({ status: "loading", career: null, requirements: [], opportunities: [] });
    Promise.all([getCareer(pathwaySlug), getCareerCurriculum(pathwaySlug), listPublicOpportunities().catch(() => [])])
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
        if (alive) setState({ status: error?.status === 404 ? "not-found" : "error", career: null, requirements: [], opportunities: [] });
      });
    return () => { alive = false; };
  }, [pathwaySlug]);

  if (state.status === "loading") return <main className="pathway-detail" aria-busy="true"><p role="status">Loading pathway information...</p></main>;

  if (state.status === "not-found") {
    return (
      <main className="pathway-detail" aria-labelledby="pathway-not-found-title">
        <div className="pathway-detailMessage" role="status">
          <p className="career-eyebrow">Career Pathways</p>
          <h1 id="pathway-not-found-title">Pathway not found</h1>
          <p>That pathway reference is not available in the active public catalog.</p>
          <Link className="sh-btn sh-btn--primary" to="/pathways">Return to Career Pathways</Link>
        </div>
      </main>
    );
  }

  if (state.status === "error" || !state.career) {
    return (
      <main className="pathway-detail" aria-labelledby="pathway-error-title">
        <div className="pathway-detailMessage" role="alert">
          <p className="career-eyebrow">Career Pathways</p>
          <h1 id="pathway-error-title">Pathway information is unavailable</h1>
          <p>We could not load this canonical pathway reference.</p>
          <Link className="sh-btn sh-btn--secondary" to="/pathways">Return to Career Pathways</Link>
        </div>
      </main>
    );
  }

  const { career, requirements, opportunities } = state;
  return (
    <main className="pathway-detail" aria-labelledby="pathway-detail-title">
      <nav className="pathway-detailBreadcrumbs" aria-label="Breadcrumb">
        <Link to="/pathways">Career Pathways</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{career.title}</span>
      </nav>

      <CareerPublicHero
        className="pathway-detailHero"
        eyebrow="Public pathway reference"
        title={`${career.title} pathway`}
        titleId="pathway-detail-title"
        description={career.description || "A description for this connected Career record has not been published yet."}
        aside={<div className="pathway-detailDefinition">
          <span>What a pathway represents</span>
          <strong>A structured exploration connection between a Career record and related preparation references.</strong>
        </div>}
      />

      <div className="pathway-detailGrid">
        <section className="pathway-detailSection" aria-labelledby="pathway-career-title">
          <p className="career-eyebrow">Career connection</p>
          <h2 id="pathway-career-title">Connected Career</h2>
          <p>This public pathway reference currently resolves to one canonical Career record.</p>
          <Link className="sh-btn sh-btn--secondary" to={`/careers/${encodeURIComponent(career.slug)}`}>View {career.title}</Link>
        </section>

        <section className="pathway-detailSection" aria-labelledby="pathway-program-title">
          <p className="career-eyebrow">Program relationship</p>
          <h2 id="pathway-program-title">Programs</h2>
          <p className="pathway-detailUnavailable">Public organization program mappings are not available for this pathway reference yet.</p>
        </section>

        <section className="pathway-detailSection pathway-detailSection--wide" aria-labelledby="pathway-learning-title">
          <p className="career-eyebrow">Learning connections</p>
          <h2 id="pathway-learning-title">Curriculum references</h2>
          {requirements.length ? (
            <ul className="pathway-detailReferences">
              {requirements.map((requirement) => (
                <li key={requirement.career_curriculum_requirement_id || requirement.lesson_id}>
                  <div><strong>{requirement.requirement_type === "required" ? "Required" : "Recommended"} learning reference</strong><span className="subtle">{requirement.curriculum_id} · {requirement.lesson_id}</span></div>
                  <a className="sh-btn sh-btn--secondary" href={`/curriculum.html#/curriculum/lessons/${encodeURIComponent(requirement.lesson_id)}`}>Open lesson</a>
                </li>
              ))}
            </ul>
          ) : <p className="pathway-detailUnavailable">No curriculum relationship is currently published for this pathway reference.</p>}
        </section>

        <section className="pathway-detailSection" aria-labelledby="pathway-skills-title">
          <p className="career-eyebrow">Data boundary</p>
          <h2 id="pathway-skills-title">Skills and credentials</h2>
          <p className="pathway-detailUnavailable">Public skill and credential mappings are not available in this phase.</p>
        </section>

        <section className="pathway-detailSection" aria-labelledby="pathway-next-title">
          <p className="career-eyebrow">Next steps</p>
          <h2 id="pathway-next-title">Keep exploring</h2>
          <div className="sh-actionsRow">
            <Link className="sh-btn sh-btn--secondary" to="/explore">Explore Careers</Link>
            <Link className="sh-btn sh-btn--primary" to="/discovery">Try Career Discovery</Link>
          </div>
        </section>
        <section className="pathway-detailSection pathway-detailSection--wide" aria-labelledby="pathway-opportunities-title">
          <p className="career-eyebrow">Canonical opportunity connection</p><h2 id="pathway-opportunities-title">Related public opportunities</h2>
          {opportunities.length ? <ul className="pathway-detailReferences">{opportunities.map((item) => <li key={item.id}><div><strong>{item.title}</strong><span className="subtle">{item.organization?.name || "Organization not published"}</span></div><Link className="sh-btn sh-btn--secondary" to={`/opportunities/${encodeURIComponent(item.id)}`}>View Opportunity</Link></li>)}</ul> : <p className="pathway-detailUnavailable">No publicly published opportunities are canonically linked to this pathway&apos;s connected Career record.</p>}
        </section>
      </div>

      <section className="pathway-detailHandoff" aria-labelledby="pathway-handoff-title">
        <div><p className="career-eyebrow">Personal next step</p><h2 id="pathway-handoff-title">Make it part of your plan</h2><p>Discovery is temporary guidance. Continue to My Career Planner when you are ready to plan personally.</p></div>
        <Link className="sh-btn sh-btn--primary" to="/planner">Continue in My Career Planner</Link>
      </section>

      <style>{`
        .pathway-detail{max-width:1180px;margin:0 auto;padding:24px clamp(16px,3vw,32px) 48px;}
        .pathway-detailBreadcrumbs{display:flex;gap:9px;align-items:center;margin-bottom:20px;color:var(--ink-soft,#58636d);font-size:13px;}
        .pathway-detailBreadcrumbs a{color:var(--orange,#d94d00);font-weight:700;}
        .pathway-detailHero{display:grid;grid-template-columns:minmax(0,1fr) 310px;gap:30px;align-items:end;padding:clamp(24px,4vw,44px);border:1px solid #d8e7dc;border-radius:16px;background:#f0f6f2;}
        .pathway-detail h1{margin:0;color:var(--ink,#18222b);font-size:clamp(34px,5vw,58px);line-height:1.04;letter-spacing:0;}
        .pathway-detail h2{margin:0;color:var(--ink,#18222b);font-size:22px;line-height:1.2;letter-spacing:0;}
        .pathway-detailHero p:not(.career-eyebrow){max-width:720px;margin:16px 0 0;color:var(--ink-soft,#58636d);font-size:18px;line-height:1.55;}
        .pathway-detailDefinition{display:grid;gap:8px;padding:18px;border-left:1px solid rgba(25,45,55,.16);color:var(--ink-soft,#58636d);}
        .pathway-detailDefinition span{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;}
        .pathway-detailDefinition strong{color:var(--ink,#18222b);line-height:1.45;}
        .pathway-detailGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:18px;}
        .pathway-detailSection{padding:22px;border:1px solid var(--ring,#dfe4ea);border-radius:12px;background:var(--card,#fff);}
        .pathway-detailSection--wide{grid-column:1 / -1;}
        .pathway-detailSection p:not(.career-eyebrow){color:var(--ink-soft,#58636d);line-height:1.55;}
        .pathway-detailUnavailable{padding-left:14px;border-left:3px solid #d5dce1;}
        .pathway-detailReferences{display:grid;gap:9px;margin:16px 0 0;padding:0;list-style:none;}
        .pathway-detailReferences li{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:14px;border:1px solid var(--ring,#dfe4ea);border-radius:9px;}
        .pathway-detailReferences li div{display:grid;gap:5px;min-width:0;}
        .pathway-detailHandoff{display:flex;justify-content:space-between;align-items:center;gap:22px;margin-top:18px;padding:24px;border-top:1px solid var(--ring,#dfe4ea);border-bottom:1px solid var(--ring,#dfe4ea);}
        .pathway-detailHandoff p:not(.career-eyebrow){margin:8px 0 0;color:var(--ink-soft,#58636d);line-height:1.5;}
        .pathway-detailMessage{max-width:620px;margin:32px auto;padding:32px;border:1px solid var(--ring,#dfe4ea);border-radius:12px;background:var(--card,#fff);text-align:center;}
        .pathway-detailMessage h1{font-size:34px;}
        .pathway-detailMessage p:not(.career-eyebrow){color:var(--ink-soft,#58636d);line-height:1.5;}
        @media (max-width:760px){.pathway-detailHero,.pathway-detailGrid{grid-template-columns:1fr;}.pathway-detailSection--wide{grid-column:auto;}.pathway-detailDefinition{border-left:0;border-top:1px solid rgba(25,45,55,.16);padding:16px 0 0;}.pathway-detailReferences li,.pathway-detailHandoff{align-items:flex-start;flex-direction:column;}}
      `}</style>
    </main>
  );
}
