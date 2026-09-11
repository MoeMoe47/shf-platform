// apps/shf-web/src/pages/civicsure/explorer/CivicSureExplorerPage.jsx
//
// CivicSure Explorer — public-facing live public-assurance projection.
import React, { useEffect, useState } from "react";
import "../../../styles/civicsure-explorer.css";
import "../../../styles/civicsure-public-footer.css";
import CivicSurePublicNav from "../../../components/civicsure/CivicSurePublicNav.jsx";
import CivicSurePublicFooter from "../../../components/civicsure/CivicSurePublicFooter.jsx";
import ExplorerHero from "./components/ExplorerHero.jsx";
import ExplorerSectionNav from "./components/ExplorerSectionNav.jsx";
import ExplorerFilters from "./components/ExplorerFilters.jsx";
import ProgramResultList from "./components/ProgramResultList.jsx";
import ExplorerTrustCallout from "./components/ExplorerTrustCallout.jsx";
import { ExplorerIcon } from "./explorerIcons.jsx";
import { listPublicAssuranceProjections } from "../../../services/public-assurance-client.js";
import { toPublicAssuranceViewModel } from "./publicAssuranceViewModel.js";

export default function CivicSureExplorerPage() {
  const [activeCategory, setActiveCategory] = useState("programs");
  const [view, setView] = useState("list");
  const [records, setRecords] = useState([]);
  const [state, setState] = useState("loading");

  useEffect(() => {
    let mounted = true;
    listPublicAssuranceProjections()
      .then((items) => { if (mounted) { setRecords(items.map(toPublicAssuranceViewModel)); setState("ready"); } })
      .catch(() => { if (mounted) setState("error"); });
    return () => { mounted = false; };
  }, []);

  return (
    <div className="civicsure-explorer">
      <a className="cse-skip-link" href="#cse-main">
        Skip to main content
      </a>

      <CivicSurePublicNav activeKey="explorer" />

      <ExplorerHero />

      <ExplorerSectionNav activeKey={activeCategory} onSelect={setActiveCategory} />

      <main id="cse-main">
        <div className="cse-container">
          <div className="cse-section-head">
            <div>
              <h2 className="cse-section-head__title">Programs Explorer</h2>
              <p className="cse-section-head__subtitle">
                Browse public programs, see what&rsquo;s delivered, and explore verified results.
              </p>
            </div>
            <a href="#/explorer" className="cse-info-link">
              <ExplorerIcon name="infoCircle" />
              About this data
            </a>
          </div>

          {state === "ready" && <p className="cse-live-status" role="status">{records.length} approved public projection{records.length === 1 ? "" : "s"}</p>}
          {state === "error" && <p className="cse-empty-state" role="alert">Public assurance data is temporarily unavailable. No sample data is shown.</p>}
          <ExplorerFilters view={view} onViewChange={setView} />

          <div className="cse-content-grid">
            {view === "list" ? <ProgramResultList programs={state === "ready" ? records : []} /> : <p className="cse-empty-state" role="status">A public geographic projection is not currently available.</p>}

            <div className="cse-side-stack">
              <ExplorerTrustCallout />
            </div>
          </div>
        </div>
      </main>

      <CivicSurePublicFooter />
    </div>
  );
}
