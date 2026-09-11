// EvidenceVerificationPanel.jsx — Verification tab: the 8-stage
// evidence verification process (each with status, date, and a
// plain-English explanation) plus the Verification Decision panel.
// The reviewer/authority is always a generic public-safe label
// (CivicSure Assurance Review) — never a fabricated named individual.
// DEMO / FRAME DATA (see ../../evidenceSummaryMockData.js).
import React from "react";
import StatusBadge from "../StatusBadge.jsx";

export default function EvidenceVerificationPanel({ evidence }) {
  const { verificationProcess } = evidence;
  const { decision } = verificationProcess;

  return (
    <div className="cse-evs-panel" role="tabpanel" id="cse-evs-tabpanel-verification" aria-labelledby="cse-evs-tab-verification">
      <section className="cse-card cse-evs-process" aria-labelledby="cse-evs-process-heading">
        <h3 id="cse-evs-process-heading">Verification Process</h3>
        <ol className="cse-evs-process__list">
          {verificationProcess.stages.map((stage, i) => (
            <li key={stage.key} className="cse-evs-process__item">
              <span className="cse-evs-process__index" aria-hidden="true">
                {i + 1}
              </span>
              <div className="cse-evs-process__content">
                <div className="cse-evs-process__head">
                  <p className="cse-evs-process__label">{stage.label}</p>
                  <StatusBadge state={stage.status} />
                </div>
                <p className="cse-evs-process__date">{stage.date}</p>
                <p className="cse-evs-process__explanation">{stage.explanation}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="cse-card cse-evs-decision" aria-labelledby="cse-evs-decision-heading">
        <h3 id="cse-evs-decision-heading">Verification Decision</h3>
        <dl className="cse-evs-decision__grid">
          <div>
            <dt>Decision</dt>
            <dd>
              <StatusBadge state={decision.decision} />
            </dd>
          </div>
          <div>
            <dt>Decision date</dt>
            <dd>{decision.decisionDate}</dd>
          </div>
          <div>
            <dt>Coverage</dt>
            <dd>{decision.coverage}</dd>
          </div>
          <div>
            <dt>Reviewer/authority</dt>
            <dd>{decision.authority}</dd>
          </div>
        </dl>
        <div className="cse-evs-decision__reason">
          <h4>Reason</h4>
          <p>{decision.reason}</p>
        </div>
      </section>
    </div>
  );
}
