// ProgramOverviewTab.jsx — Overview tab content: what/who/who-runs
// facts on the left, program image + "Why this status?" checklist +
// quick links on the right. DEMO / FRAME DATA (see
// ../../programDetailMockData.js).
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";
import ProgramAssuranceChecklist from "./ProgramAssuranceChecklist.jsx";
import ProgramQuickLinks from "./ProgramQuickLinks.jsx";

export default function ProgramOverviewTab({ program, onNavigateTab }) {
  return (
    <div className="cse-pd-overview" role="tabpanel" id="cse-pd-tabpanel-overview" aria-labelledby="cse-pd-tab-overview">
      <div className="cse-pd-overview__main">
        <section className="cse-card cse-pd-facts">
          <div className="cse-pd-fact">
            <h2 className="cse-pd-fact__heading">What is this program?</h2>
            <p className="cse-pd-fact__body">{program.whatIsThis}</p>
          </div>
          <div className="cse-pd-fact">
            <h2 className="cse-pd-fact__heading">Who benefits?</h2>
            <p className="cse-pd-fact__body">{program.whoBenefits}</p>
          </div>
          <div className="cse-pd-fact">
            <h2 className="cse-pd-fact__heading">Who runs it?</h2>
            <p className="cse-pd-fact__body">{program.whoRuns}</p>
          </div>

          <dl className="cse-pd-summary-row">
            <div>
              <dt>Program period</dt>
              <dd>{program.period}</dd>
            </div>
            <div>
              <dt>Total funding</dt>
              <dd>{program.metrics.totalFunding}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <span className="cse-pill">{program.status}</span>
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="cse-pd-overview__side">
        <div className="cse-pd-image" aria-hidden="true">
          <ExplorerIcon name={program.heroIcon} />
        </div>

        <ProgramAssuranceChecklist program={program} />
        <ProgramQuickLinks onNavigateTab={onNavigateTab} />
      </div>
    </div>
  );
}
