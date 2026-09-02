// src/pages/curriculum/sections/CurrentPathwayCard.jsx
import React from "react";
/**
 * There is no connected "current pathway / resume lesson" data source in
 * this repo yet. Keep the honest empty state until one exists.
 */
export default function CurrentPathwayCard() {
  return (
    <section className="ld-card ld-cardPathway" aria-labelledby="ld-pathway-h">
      <p className="ld-eyebrow">Current Pathway</p>
      <h2 id="ld-pathway-h" className="ld-cardTitle">Current pathway</h2>
      <p className="ld-mutedLine" role="status">Pathway progress is not available yet.</p>
      <span className="ld-btn ld-btnPrimary" aria-disabled="true">Resume lesson unavailable</span>
    </section>
  );
}
