import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useCanonicalCareers from "@/hooks/useCanonicalCareers.js";

const WORK_STYLES = [
  { value: "systems", label: "Systems and tools" },
  { value: "people", label: "People and communication" },
  { value: "hands-on", label: "Hands-on problem solving" },
];

function tokens(value) {
  return new Set(String(value || "").toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2));
}

function rankCareers(careers, interestText, family, workStyle) {
  const interests = tokens(interestText);
  return careers.map((career) => {
    const source = `${career.title} ${career.description} ${career.cluster} ${career.sector}`.toLowerCase();
    const sourceTokens = tokens(source);
    const matchedInterests = [...interests].filter((token) => sourceTokens.has(token));
    const familyMatch = family && career.cluster === family;
    const styleWords = workStyle === "systems" ? ["system", "technical", "data", "infrastructure", "technology"]
      : workStyle === "people" ? ["people", "communication", "support", "community"]
      : workStyle === "hands-on" ? ["operations", "hardware", "facility", "build", "technical"] : [];
    const matchedStyle = styleWords.find((word) => source.includes(word));
    const score = matchedInterests.length * 3 + (familyMatch ? 4 : 0) + (matchedStyle ? 1 : 0);
    const reasons = [];
    if (matchedInterests.length) reasons.push(`your interest in ${matchedInterests.slice(0, 2).join(" and ")}`);
    if (familyMatch) reasons.push(`your selected family, ${family}`);
    if (matchedStyle) reasons.push(`the ${WORK_STYLES.find((item) => item.value === workStyle)?.label.toLowerCase()} preference`);
    return { career, score, reasons };
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score || a.career.title.localeCompare(b.career.title)).slice(0, 6);
}

export default function CareerDiscovery() {
  const { data: careers = [], loading, error } = useCanonicalCareers();
  const [interestText, setInterestText] = useState("");
  const [family, setFamily] = useState("");
  const [workStyle, setWorkStyle] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const families = useMemo(() => [...new Set(careers.map((career) => career.cluster).filter(Boolean))].sort(), [careers]);
  const matches = useMemo(() => submitted ? rankCareers(careers, interestText, family, workStyle) : [], [careers, family, interestText, submitted, workStyle]);

  return (
    <main className="career-discovery" aria-labelledby="career-discovery-title">
      <header className="career-discoveryHero">
        <p className="career-eyebrow">Guided exploration</p>
        <h1 id="career-discovery-title">Career Discovery</h1>
        <p>Use a few selections to find canonical Career records worth exploring next.</p>
        <p className="career-discoveryDisclosure">Career Discovery provides guidance based on your selections. It is not a psychological, aptitude, or validated career assessment.</p>
      </header>

      <section className="career-discoveryPanel" aria-labelledby="career-discovery-inputs-title">
        <div className="career-discoveryPanel__heading"><div><p className="career-eyebrow">Your selections</p><h2 id="career-discovery-inputs-title">What sounds worth exploring?</h2></div><span className="subtle">Nothing is saved.</span></div>
        <div className="career-discoveryFields">
          <label>Interests or topics<input value={interestText} onChange={(event) => setInterestText(event.target.value)} placeholder="Example: data, tools, building" /></label>
          <label>Career family<select value={family} onChange={(event) => setFamily(event.target.value)}><option value="">Any family</option>{families.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <fieldset><legend>Preferred work style</legend>{WORK_STYLES.map((item) => <label key={item.value}><input type="radio" name="work-style" value={item.value} checked={workStyle === item.value} onChange={(event) => setWorkStyle(event.target.value)} />{item.label}</label>)}</fieldset>
        </div>
        <div className="sh-actionsRow"><button type="button" className="sh-btn sh-btn--primary" onClick={() => setSubmitted(true)} disabled={loading || !!error}>Find careers</button><button type="button" className="sh-btn sh-btn--secondary" onClick={() => { setInterestText(""); setFamily(""); setWorkStyle(""); setSubmitted(false); }}>Clear</button></div>
      </section>

      <section className="career-discoveryResults" aria-live="polite" aria-labelledby="career-discovery-results-title">
        <div className="career-discoveryPanel__heading"><div><p className="career-eyebrow">Results</p><h2 id="career-discovery-results-title">Careers to explore</h2></div></div>
        {loading ? <p role="status">Loading canonical Career records...</p> : null}
        {error ? <p role="alert">Career information is temporarily unavailable.</p> : null}
        {!loading && !error && !submitted ? <p className="career-detailUnavailable">Choose at least one preference to see guidance from the active public catalog.</p> : null}
        {!loading && !error && submitted && !matches.length ? <p className="career-detailUnavailable">No Career records matched those selections. Try a broader interest or family.</p> : null}
        <div className="career-discoveryCards">{matches.map(({ career, reasons }) => <article className="career-discoveryCard" key={career.id}><p className="career-eyebrow">{career.cluster}</p><h3>{career.title}</h3><p>{career.description || "Description not published."}</p><p className="career-discoveryReason"><strong>Why this appeared:</strong> Suggested because of {reasons.join(" and ")}.</p><Link className="sh-btn sh-btn--secondary" to={`/careers/${encodeURIComponent(career.slug)}`}>View Career Detail</Link></article>)}</div>
      </section>

      <section className="career-discoveryHandoff" aria-labelledby="career-discovery-handoff-title"><div><p className="career-eyebrow">Personal planning</p><h2 id="career-discovery-handoff-title">Ready to make a plan?</h2><p>Discovery results are temporary guidance and are not saved.</p></div><Link className="sh-btn sh-btn--primary" to="/planner">Continue in My Career Planner</Link></section>

      <style>{`
        .career-discovery{max-width:1000px;margin:0 auto;padding:24px clamp(16px,3vw,32px) 48px;}
        .career-discoveryHero{padding:clamp(24px,5vw,48px);border:1px solid #d8e7dc;border-radius:16px;background:#f0f6f2;}
        .career-discovery h1{margin:0;color:var(--ink,#18222b);font-size:clamp(36px,5vw,58px);line-height:1.04;letter-spacing:0;}
        .career-discovery h2{margin:0;color:var(--ink,#18222b);font-size:23px;line-height:1.2;letter-spacing:0;}
        .career-discovery h3{margin:0;color:var(--ink,#18222b);font-size:20px;}
        .career-discoveryHero>p:not(.career-eyebrow){max-width:700px;color:var(--ink-soft,#58636d);font-size:18px;line-height:1.5;}
        .career-discoveryDisclosure{margin:20px 0 0!important;padding:12px 14px;border-left:3px solid var(--orange,#d94d00);background:rgba(255,255,255,.62);font-size:14px!important;}
        .career-discoveryPanel,.career-discoveryResults{margin-top:18px;padding:22px;border:1px solid var(--ring,#dfe4ea);border-radius:12px;background:var(--card,#fff);}
        .career-discoveryPanel__heading{display:flex;justify-content:space-between;align-items:end;gap:18px;margin-bottom:18px;}
        .career-discoveryFields{display:grid;grid-template-columns:1.2fr 1fr;gap:16px;margin-bottom:18px;}
        .career-discoveryFields>label,.career-discoveryFields fieldset{display:grid;gap:7px;color:var(--ink,#18222b);font-weight:700;}
        .career-discoveryFields input:not([type="radio"]),.career-discoveryFields select{width:100%;min-height:42px;padding:9px 11px;border:1px solid var(--ring,#cbd4da);border-radius:7px;background:var(--card,#fff);color:var(--ink,#18222b);font:inherit;font-weight:400;}
        .career-discoveryFields fieldset{grid-column:1 / -1;border:0;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:14px;}
        .career-discoveryFields legend{margin-bottom:2px;color:var(--ink,#18222b);font-weight:700;}
        .career-discoveryFields fieldset label{display:flex;align-items:center;gap:7px;font-weight:400;}
        .career-discoveryCards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;}
        .career-discoveryCard{display:flex;flex-direction:column;padding:18px;border:1px solid var(--ring,#dfe4ea);border-radius:10px;}
        .career-discoveryCard p:not(.career-eyebrow){color:var(--ink-soft,#58636d);line-height:1.5;}
        .career-discoveryCard .sh-btn{align-self:flex-start;margin-top:auto;}
        .career-discoveryReason{padding:10px 12px;border-left:3px solid #8eb7a0;background:#f3f8f4;font-size:13px;}
        .career-discoveryHandoff{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-top:18px;padding:22px 0;border-top:1px solid var(--ring,#dfe4ea);border-bottom:1px solid var(--ring,#dfe4ea);}
        .career-discoveryHandoff p:not(.career-eyebrow){margin:7px 0 0;color:var(--ink-soft,#58636d);line-height:1.5;}
        @media(max-width:720px){.career-discoveryFields,.career-discoveryCards{grid-template-columns:1fr;}.career-discoveryFields fieldset{grid-column:auto;}.career-discoveryPanel__heading,.career-discoveryHandoff{display:block;}.career-discoveryPanel__heading .subtle{display:block;margin-top:7px;}.career-discoveryHandoff .sh-btn{margin-top:16px;}}
      `}</style>
    </main>
  );
}
