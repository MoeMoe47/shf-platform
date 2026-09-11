// EvidencePendingNotice.jsx — "Still Pending" section. Locked
// transparency principle: pending/missing evidence is always shown
// openly, and its absence never implies the claimed activity did not
// occur. DEMO / FRAME DATA (see ../../evidenceSummaryMockData.js).
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function EvidencePendingNotice({ pending }) {
  return (
    <section className="cse-card cse-evs-pending" aria-labelledby="cse-evs-pending-heading">
      <h3 id="cse-evs-pending-heading" className="cse-evs-pending__heading">
        <ExplorerIcon name="infoCircle" aria-hidden="true" />
        Still Pending
      </h3>
      <p className="cse-evs-pending__statement">{pending.statement}</p>
      <p className="cse-evs-pending__explanation">{pending.explanation}</p>
    </section>
  );
}
