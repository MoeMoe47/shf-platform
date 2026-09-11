// ExplorerTrustCallout.jsx — light-blue closing callout.
import React from "react";
import { ExplorerIcon } from "../explorerIcons.jsx";

export default function ExplorerTrustCallout() {
  return (
    <a href="#/explorer" className="cse-trust-callout">
      <span className="cse-trust-callout__icon" aria-hidden="true">
        <ExplorerIcon name="barChart" />
      </span>
      <span className="cse-trust-callout__text">
        <h3>From data to a stronger tomorrow.</h3>
        <p>Explore. Understand. Hold accountable. Build trust.</p>
      </span>
      <span className="cse-trust-callout__arrow" aria-hidden="true">
        <ExplorerIcon name="arrowRight" />
      </span>
    </a>
  );
}
