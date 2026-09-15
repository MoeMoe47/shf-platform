import React, { useMemo, useState } from "react";

const SECTION_ORDER = [
  ["VERIFIED CAPABILITIES", ["VERIFIED_SKILL", "VERIFIED_EVIDENCE"]],
  ["PROJECT EXPERIENCE", ["PROJECT_COMPLETION", "PORTFOLIO_ARTIFACT"]],
  ["MISSIONS & PROGRAMS", ["MISSION_COMPLETION", "PROGRAM_COMPLETION"]],
  ["OPPORTUNITIES", ["OPPORTUNITY_COMPLETION"]],
  ["CAREER CONNECTIONS", ["CAREER_PROGRESS", "CREDENTIAL"]],
  ["ARCADE PRACTICE", ["ARCADE_MASTERY_SIGNAL"]],
  ["TEAM EXPERIENCE", ["TEAM_EXPERIENCE"]],
  ["RELIABILITY", ["RELIABILITY_FACT"]],
];

const LEVEL_LABEL = {
  VERIFIED: "Verified",
  SOURCE_CONFIRMED: "Source Confirmed",
  EVIDENCE_CANDIDATE: "Evidence Candidate",
  ACTIVITY_COMPLETED: "Activity History",
  UNVERIFIED: "Unverified",
};

const CLAIM_LABEL = {
  VERIFIED_SKILL: "Verified capability",
  VERIFIED_EVIDENCE: "Evidence",
  ASSESSMENT_OUTCOME: "Assessment",
  CREDENTIAL: "Credential",
  PROJECT_COMPLETION: "Project",
  MISSION_COMPLETION: "Mission",
  OPPORTUNITY_COMPLETION: "Opportunity",
  ARCADE_MASTERY_SIGNAL: "Practice Signal",
  PORTFOLIO_ARTIFACT: "Portfolio",
  CAREER_PROGRESS: "Career",
  TEAM_EXPERIENCE: "Team",
  RELIABILITY_FACT: "Reliability",
  PROGRAM_COMPLETION: "Program",
};

function groupClaims(claims) {
  return SECTION_ORDER.map(([title, types]) => ({
    title,
    claims: claims.filter((claim) => types.includes(claim.claimType)),
  })).filter((section) => section.claims.length > 0);
}

function TrustLabel({ claim }) {
  return (
    <span className={`met-passport__trust met-passport__trust--${claim.verificationLevel.toLowerCase()}`}>
      {LEVEL_LABEL[claim.verificationLevel] || claim.verificationLevel}
    </span>
  );
}

function ClaimCard({ claim }) {
  const [open, setOpen] = useState(false);
  const describedBy = `${claim.passportClaimId}-details`;
  return (
    <li className="met-passport__claim">
      <div className="met-passport__claim-top">
        <div>
          <p className="met-passport__claim-kind">{CLAIM_LABEL[claim.claimType] || claim.claimType}</p>
          <h4>{claim.title}</h4>
        </div>
        <TrustLabel claim={claim} />
      </div>
      <p>{claim.summary}</p>
      <button
        type="button"
        className="met-passport__source-button"
        aria-expanded={open}
        aria-controls={describedBy}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "Hide source" : "Inspect source"}
      </button>
      {open ? (
        <dl id={describedBy} className="met-passport__source">
          <div><dt>Source</dt><dd>{claim.sourceAuthority.replace(/_/g, " ")}</dd></div>
          <div><dt>Reference</dt><dd>{claim.sourceType}: {claim.sourceRef}</dd></div>
          <div><dt>Verification</dt><dd>{LEVEL_LABEL[claim.verificationLevel] || claim.verificationLevel}</dd></div>
          <div><dt>Date</dt><dd>{new Date(claim.issuedAt).toLocaleDateString()}</dd></div>
        </dl>
      ) : null}
    </li>
  );
}

function CapabilityGraphTree({ graph }) {
  if (!graph?.accessibleTree?.length) return null;
  return (
    <section className="met-passport__graph" aria-labelledby="met-passport-graph-title">
      <h3 id="met-passport-graph-title">Capability Graph</h3>
      <div className="met-passport__graph-canvas" aria-hidden="true">
        {graph.nodes.slice(0, 8).map((node) => (
          <span key={node.id} className={`met-passport__node met-passport__node--${node.type.toLowerCase()}`}>{node.label}</span>
        ))}
      </div>
      <ul className="met-passport__tree" aria-label="Capability graph list equivalent">
        {graph.accessibleTree.map((item) => (
          <li key={item.sourceClaimId}>
            <strong>{item.label}</strong>
            <span>{item.details.join(" • ")}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function MetaverseWorkPassport({ open, passport, loading, error, onClose }) {
  const sections = useMemo(() => groupClaims(passport?.claims || []), [passport]);
  const verifiedCount = (passport?.claims || []).filter((claim) => claim.claimType === "VERIFIED_SKILL").length;
  const projectCount = (passport?.claims || []).filter((claim) => claim.claimType === "PROJECT_COMPLETION" || claim.projectRefs?.length).length;

  return (
    <section className={`met-passport ${open ? "is-open" : ""}`} aria-label="Work Passport">
      <div className="met-passport__header">
        <div>
          <p className="met-passport__eyebrow">Work Passport</p>
          <h2>Source-backed learner record</h2>
        </div>
        <button type="button" onClick={onClose}>Close</button>
      </div>

      {loading ? <p className="met-passport__status" role="status">Loading passport…</p> : null}
      {error ? <p className="met-passport__status" role="alert">{error}</p> : null}

      {!loading && !error && passport ? (
        <>
          <div className="met-passport__summary" aria-label="Passport summary">
            <span><strong>{verifiedCount}</strong> verified capabilities</span>
            <span><strong>{projectCount}</strong> project links</span>
            <span><strong>{passport.reliabilityFacts?.length || 0}</strong> reliability facts</span>
          </div>

          <p className="met-passport__boundary">
            SHF Credits, Arcade practice, mission completion, opportunity awards, and market fulfillment are not displayed as verified skills.
          </p>

          {sections.length === 0 ? <p className="met-passport__status">No source-backed passport claims are available yet.</p> : null}
          {sections.map((section) => (
            <section key={section.title} className="met-passport__section" aria-labelledby={`met-passport-${section.title.replace(/\W+/g, "-").toLowerCase()}`}>
              <h3 id={`met-passport-${section.title.replace(/\W+/g, "-").toLowerCase()}`}>{section.title}</h3>
              <ul className="met-passport__claims">
                {section.claims.map((claim) => <ClaimCard key={claim.passportClaimId} claim={claim} />)}
              </ul>
            </section>
          ))}

          {passport.reliabilityFacts?.length ? (
            <section className="met-passport__section" aria-labelledby="met-passport-reliability-facts">
              <h3 id="met-passport-reliability-facts">Reliability Facts</h3>
              <ul className="met-passport__facts">
                {passport.reliabilityFacts.map((fact) => (
                  <li key={fact.reliabilityFactId}>
                    <strong>{fact.label}</strong>
                    <span>{fact.valueText}</span>
                    <small>{fact.sourceAuthority.replace(/_/g, " ")}</small>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <CapabilityGraphTree graph={passport.capabilityGraph} />
        </>
      ) : null}
    </section>
  );
}
