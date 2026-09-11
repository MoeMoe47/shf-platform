// apps/shf-web/src/pages/civicsure/explorer/CivicSureProgramDetailPage.jsx
//
import React, { useEffect, useState } from "react";
import "../../../styles/civicsure-explorer.css";
import "../../../styles/civicsure-public-footer.css";
import "../../../styles/civicsure-program-detail.css";
import CivicSurePublicNav from "../../../components/civicsure/CivicSurePublicNav.jsx";
import CivicSurePublicFooter from "../../../components/civicsure/CivicSurePublicFooter.jsx";
import { getPublicAssuranceProjection } from "../../../services/public-assurance-client.js";
import { toPublicAssuranceViewModel } from "./publicAssuranceViewModel.js";
import { ExplorerIcon } from "./explorerIcons.jsx";

export default function CivicSureProgramDetailPage({ programId }) {
  const [record, setRecord] = useState(null);
  const [state, setState] = useState("loading");

  useEffect(() => {
    let mounted = true;
    getPublicAssuranceProjection(programId)
      .then((item) => { if (mounted) { setRecord(toPublicAssuranceViewModel(item)); setState("ready"); } })
      .catch(() => { if (mounted) setState("missing"); });
    return () => { mounted = false; };
  }, [programId]);

  if (state === "missing") {
    return (
      <div className="civicsure-program-detail">
        <a className="cse-skip-link" href="#cspd-main">
          Skip to main content
        </a>
        <CivicSurePublicNav activeKey="explorer" />
        <main id="cspd-main">
          <div className="cse-container cse-pd-not-found">
            <h1>Program not found</h1>
            <p>We couldn&rsquo;t find an approved public assurance projection matching this reference.</p>
            <a className="cse-btn cse-btn--primary" href="#/explorer">
              Back to Explorer
            </a>
          </div>
        </main>
        <CivicSurePublicFooter />
      </div>
    );
  }

  return (
    <div className="civicsure-program-detail">
      <a className="cse-skip-link" href="#cspd-main">
        Skip to main content
      </a>

      <CivicSurePublicNav activeKey="explorer" />

      {state === "loading" ? <p className="cse-empty-state" role="status">Loading approved public assurance data...</p> : <header className="cse-pd-header">
        <div className="cse-container cse-pd-header__inner">
          <a href="#/explorer" className="cse-pd-back"><ExplorerIcon name="chevronLeft" className="cse-pd-back__icon" />Back to Explorer</a>
          <div className="cse-pd-header__row"><div className="cse-pd-header__title-block"><div className="cse-pd-header__title-row"><h1 className="cse-pd-header__title">{record.name}</h1><span className="cse-pill">{record.status}</span></div><p className="cse-pd-header__meta">{record.county} | {record.category}</p></div></div>
        </div>
      </header>}

      <main id="cspd-main">
        <div className="cse-container">
          {state === "ready" && <article className="cse-pd-overview">
            <h2>Published public assurance result</h2>
            <p>{record.description}</p>
            <dl className="cse-pd-facts">
              <div><dt>Public value</dt><dd>{record.record.public_display_value}</dd></div>
              <div><dt>Reporting period</dt><dd>{record.record.reporting_period_label || record.record.reporting_period || "Not specified"}</dd></div>
              <div><dt>Data as of</dt><dd>{record.record.data_as_of || "Not specified"}</dd></div>
              <div><dt>Representation</dt><dd>{record.record.public_representation_type || "Public-safe projection"}</dd></div>
            </dl>
            <p className="cse-pd-note">This page displays only the current publication projection. Internal organization, tenant, evidence, security, and agent details are not public fields.</p>
          </article>}
        </div>
      </main>

      <CivicSurePublicFooter />
    </div>
  );
}
