// EvidenceRelatedClaimsPanel.jsx — Related Claims tab: what this
// evidence supports (Outcome, Program, Provider, Funding), each with
// a REAL link to an already-built demo page, plus the full
// Evidence-to-Claim Chain visual. DEMO / FRAME DATA (see
// ../../evidenceSummaryMockData.js).
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";
import StatusBadge from "../StatusBadge.jsx";
import EvidenceClaimChain from "./EvidenceClaimChain.jsx";

export default function EvidenceRelatedClaimsPanel({ evidence }) {
  const { relatedClaims } = evidence;
  const { outcome, program, provider, funding } = relatedClaims;

  return (
    <div className="cse-evs-panel" role="tabpanel" id="cse-evs-tabpanel-related-claims" aria-labelledby="cse-evs-tab-related-claims">
      <div className="cse-evs-related-grid">
        <section className="cse-card cse-evs-related-outcome" aria-labelledby="cse-evs-related-outcome-heading">
          <h3 id="cse-evs-related-outcome-heading">Related Outcome</h3>
          <p className="cse-evs-related-outcome__name">{outcome.name}</p>
          <dl className="cse-evs-related-outcome__grid">
            <div>
              <dt>Actual</dt>
              <dd>{outcome.actual}</dd>
            </div>
            <div>
              <dt>Target</dt>
              <dd>{outcome.target}</dd>
            </div>
            <div>
              <dt>Evidence coverage</dt>
              <dd>{outcome.evidenceCoverage}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <StatusBadge state={outcome.status} />
              </dd>
            </div>
          </dl>
          <a className="cse-evs-related-action" href={`#/explorer/outcomes/${encodeURIComponent(outcome.outcomeId)}`}>
            View Outcome
            <ExplorerIcon name="arrowRight" />
          </a>
        </section>

        <section className="cse-card cse-evs-related-simple" aria-labelledby="cse-evs-related-program-heading">
          <h3 id="cse-evs-related-program-heading">Related Program</h3>
          <p className="cse-evs-related-simple__name">{program.name}</p>
          {program.programId ? (
            <a className="cse-evs-related-action" href={`#/explorer/programs/${encodeURIComponent(program.programId)}`}>
              View Program
              <ExplorerIcon name="arrowRight" />
            </a>
          ) : (
            <span className="cse-evs-related-action cse-evs-related-action--placeholder" aria-disabled="true" title="Coming soon">
              Not yet available
            </span>
          )}
        </section>

        <section className="cse-card cse-evs-related-simple" aria-labelledby="cse-evs-related-provider-heading">
          <h3 id="cse-evs-related-provider-heading">Related Provider</h3>
          <p className="cse-evs-related-simple__name">{provider.name}</p>
          {provider.providerId ? (
            <a className="cse-evs-related-action" href={`#/explorer/providers/${encodeURIComponent(provider.providerId)}`}>
              View Provider
              <ExplorerIcon name="arrowRight" />
            </a>
          ) : (
            <span className="cse-evs-related-action cse-evs-related-action--placeholder" aria-disabled="true" title="Coming soon">
              Not yet available
            </span>
          )}
        </section>

        <section className="cse-card cse-evs-related-simple" aria-labelledby="cse-evs-related-funding-heading">
          <h3 id="cse-evs-related-funding-heading">Related Funding</h3>
          <p className="cse-evs-related-simple__name">{funding.name}</p>
          {funding.fundingId ? (
            <a className="cse-evs-related-action" href={`#/explorer/funding/${encodeURIComponent(funding.fundingId)}`}>
              View Funding Lineage
              <ExplorerIcon name="arrowRight" />
            </a>
          ) : (
            <span className="cse-evs-related-action cse-evs-related-action--placeholder" aria-disabled="true" title="Coming soon">
              Not yet available
            </span>
          )}
        </section>
      </div>

      <EvidenceClaimChain
        chain={evidence.claimChain}
        heading="Evidence-to-Claim Chain"
        description="From evidence source to funded program, in plain language."
      />
    </div>
  );
}
