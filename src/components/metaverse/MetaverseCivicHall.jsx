import React, { useEffect, useMemo, useState } from "react";
import { castBallot, fileCandidacy, getBallot, getCivicHall, submitProposal } from "@/system/metaverse/metaverseCivicClient.js";

function StatusLine({ children, tone = "neutral" }) {
  return <p className={`met-civic__status met-civic__status--${tone}`} role={tone === "error" ? "alert" : "status"}>{children}</p>;
}

function CandidateProfile({ candidate }) {
  return (
    <article className="met-civic__candidate">
      <h4>{candidate.displayName}</h4>
      <p>{candidate.platformSummary}</p>
      <p>{candidate.statement}</p>
      <ul aria-label={`${candidate.displayName} priorities`}>
        {(candidate.priorityTopics || []).map((topic) => <li key={topic}>{topic}</li>)}
      </ul>
      <small>Profile fields, limits, and visibility are equal for all approved candidates. No contact information is shown.</small>
    </article>
  );
}

function OfficeDirectory({ offices }) {
  return (
    <section aria-labelledby="met-civic-offices-title">
      <h3 id="met-civic-offices-title">Offices</h3>
      <div className="met-civic__grid">
        {offices.map((office) => (
          <article key={office.officeId} className="met-civic__office">
            <p>{office.officeType}</p>
            <h4>{office.title}</h4>
            <dl>
              <div><dt>Representation</dt><dd>{office.representationScope.replaceAll("_", " ")}</dd></div>
              <div><dt>Seats</dt><dd>{office.seatCount}</dd></div>
              <div><dt>Term</dt><dd>{office.termLengthDays} days</dd></div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function Ballot({ election, onNotice }) {
  const [ballot, setBallot] = useState(null);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadBallot = async () => {
    setLoading(true);
    setError("");
    try {
      setBallot(await getBallot(election.electionId));
    } catch (err) {
      setError(err?.message || "Ballot unavailable.");
    } finally {
      setLoading(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!selected) return;
    try {
      await castBallot(election.electionId, selected);
      onNotice("Ballot submitted. Your vote choice is not displayed in public views.");
    } catch (err) {
      onNotice(err?.message || "Ballot could not be submitted.", "error");
    }
  };

  return (
    <section aria-labelledby="met-civic-ballot-title">
      <div className="met-civic__section-head">
        <h3 id="met-civic-ballot-title">Ballot</h3>
        <button type="button" onClick={loadBallot}>Load ballot</button>
      </div>
      {loading ? <StatusLine>Loading server-generated ballot...</StatusLine> : null}
      {error ? <StatusLine tone="error">{error}</StatusLine> : null}
      {ballot ? (
        <form className="met-civic__ballot" onSubmit={submit} aria-describedby="met-civic-ballot-privacy">
          <fieldset>
            <legend>{election.title}</legend>
            {ballot.candidates.map((candidate) => (
              <label key={candidate.candidacyId} className="met-civic__choice">
                <input type="radio" name="candidate" value={candidate.candidacyId} checked={selected === candidate.candidacyId} onChange={(event) => setSelected(event.target.value)} />
                <span>{candidate.displayName}</span>
              </label>
            ))}
          </fieldset>
          <p id="met-civic-ballot-privacy">Ballot choices are private; certified results are aggregate only.</p>
          <button type="submit" disabled={!selected}>Cast student ballot</button>
        </form>
      ) : null}
    </section>
  );
}

export default function MetaverseCivicHall({ open, civicState, onClose }) {
  const [hall, setHall] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState({ text: "", tone: "neutral" });
  const [statement, setStatement] = useState("");
  const [proposalTitle, setProposalTitle] = useState("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    getCivicHall()
      .then((result) => {
        if (!cancelled) setHall(result);
      })
      .catch((error) => {
        if (!cancelled) setNotice({ text: error?.message || "Civic Hall unavailable.", tone: "error" });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const projection = hall?.publicProjection || civicState?.civicHall?.publicProjection || {};
  const offices = projection.offices || civicState?.offices || [];
  const elections = projection.elections || civicState?.elections || [];
  const candidates = projection.candidacies || civicState?.approvedCandidateProfiles || [];
  const representation = hall?.myCivicStatus?.representation || civicState?.myCivicStatus?.representation;
  const course = hall?.myCivicStatus?.course || civicState?.myCivicStatus?.coursePrerequisite;
  const cityOperations = projection.cityOperations || civicState?.cityOperations || [];
  const candidateNames = useMemo(() => candidates.map((candidate) => candidate.displayName).join(","), [candidates]);

  const notify = (text, tone = "neutral") => setNotice({ text, tone });

  const submitCandidacy = async (event) => {
    event.preventDefault();
    try {
      await fileCandidacy({ officeId: offices[0]?.officeId, statement, platformSummary: statement });
      notify("Candidacy submitted for governed review.");
      setStatement("");
    } catch (error) {
      notify(error?.message || "Candidacy could not be submitted.", "error");
    }
  };

  const submitCityProposal = async (event) => {
    event.preventDefault();
    try {
      await submitProposal({ title: proposalTitle, summary: "Student-authored civic proposal", proposalType: "CITY_PROJECT" });
      notify("Proposal submitted to SHF Civic for governed review.");
      setProposalTitle("");
    } catch (error) {
      notify(error?.message || "Proposal could not be submitted.", "error");
    }
  };

  return (
    <section className={`met-civic ${open ? "is-open" : ""}`} aria-label="Civic Hall">
      <div className="met-civic__header">
        <div>
          <p className="met-civic__eyebrow">SHF Civic</p>
          <h2>Civic Hall</h2>
        </div>
        <button type="button" onClick={onClose}>Close</button>
      </div>

      {loading ? <StatusLine>Loading Civic Hall...</StatusLine> : null}
      {notice.text ? <StatusLine tone={notice.tone}>{notice.text}</StatusLine> : null}

      <section className="met-civic__summary" aria-labelledby="met-civic-status-title">
        <h3 id="met-civic-status-title">My Civic Status</h3>
        <dl>
          <div><dt>Authority</dt><dd>SHF Civic</dd></div>
          <div><dt>Representation</dt><dd>{representation?.displayName || "Server-derived constituency"}</dd></div>
          <div><dt>Course</dt><dd>{course?.enrolled ? "Enrolled" : "Prerequisite pending"}</dd></div>
          <div><dt>Credit boundary</dt><dd>SHF Credits cannot buy office, votes, eligibility, or campaign visibility.</dd></div>
        </dl>
      </section>

      <OfficeDirectory offices={offices} />

      <section aria-labelledby="met-civic-candidates-title">
        <h3 id="met-civic-candidates-title">Approved Candidate Profiles</h3>
        <p className="met-civic__boundary">Neutral alphabetical presentation: {candidateNames || "no candidates available"}. No ranking, favored indicator, prediction, or paid boost is generated.</p>
        <div className="met-civic__grid">
          {candidates.map((candidate) => <CandidateProfile key={candidate.candidacyId} candidate={candidate} />)}
        </div>
      </section>

      {elections[0] ? <Ballot election={elections[0]} onNotice={notify} /> : null}

      <section aria-labelledby="met-civic-filing-title">
        <h3 id="met-civic-filing-title">Candidate Filing</h3>
        <form className="met-civic__form" onSubmit={submitCandidacy}>
          <label>
            Statement
            <textarea value={statement} onChange={(event) => setStatement(event.target.value)} maxLength={1200} />
          </label>
          <button type="submit" disabled={!statement.trim()}>Submit candidacy</button>
        </form>
      </section>

      <section aria-labelledby="met-civic-council-title">
        <h3 id="met-civic-council-title">Council</h3>
        <p>Agenda, public comment, proposal review, and roll-call council voting use active office-holder authority. Student election ballot secrecy remains separate.</p>
        <button type="button" disabled title="Only active office holders receive council vote controls">Council vote</button>
      </section>

      <section aria-labelledby="met-civic-proposal-title">
        <h3 id="met-civic-proposal-title">Proposal</h3>
        <form className="met-civic__form" onSubmit={submitCityProposal}>
          <label>
            Title
            <input value={proposalTitle} onChange={(event) => setProposalTitle(event.target.value)} />
          </label>
          <button type="submit" disabled={!proposalTitle.trim()}>Submit city proposal</button>
        </form>
      </section>

      <section aria-labelledby="met-civic-public-comment-title">
        <h3 id="met-civic-public-comment-title">Public Comment</h3>
        <textarea aria-label="Written public comment" placeholder="Written comment simulation" />
        <p>Written alternatives are available; comments are moderated for safety using viewpoint-neutral rules.</p>
      </section>

      <section aria-labelledby="met-civic-projects-title">
        <h3 id="met-civic-projects-title">City Projects & Operations</h3>
        <ul className="met-civic__ops">
          {cityOperations.map((operation) => <li key={`${operation.area}-${operation.state}`}><strong>{operation.area}</strong><span>{operation.state}</span><p>{operation.summary}</p></li>)}
        </ul>
      </section>
    </section>
  );
}
