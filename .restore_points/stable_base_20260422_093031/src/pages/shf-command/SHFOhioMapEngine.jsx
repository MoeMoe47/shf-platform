import React, { useMemo, useState } from "react";
import OhioCountyNeutralBase from "@/pages/iep-command-v2/OhioCountyNeutralBase";
import "./shf-ohio-map-engine.css";

const COUNTY_METRICS = {
  franklin: { programs: "5", served: "3,824", funding: "$4.5M", outcome: "82%", risk: "Stable" },
  cuyahoga: { programs: "4", served: "2,406", funding: "$3.2M", outcome: "79%", risk: "Watch" },
  hamilton: { programs: "3", served: "1,955", funding: "$2.1M", outcome: "74%", risk: "Stable" },
  summit: { programs: "2", served: "1,240", funding: "$1.4M", outcome: "71%", risk: "Opportunity" },
  montgomery: { programs: "2", served: "1,112", funding: "$1.1M", outcome: "69%", risk: "Stable" },
  lucas: { programs: "2", served: "913", funding: "$940K", outcome: "67%", risk: "Stable" },
  delaware: { programs: "1", served: "622", funding: "$610K", outcome: "73%", risk: "Stable" },
  licking: { programs: "1", served: "508", funding: "$525K", outcome: "66%", risk: "Watch" },
};

function normalizeCountyName(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+county$/, "");
}

export default function SHFOhioMapEngine({ onCountyClick }) {
  const [activeCounty, setActiveCounty] = useState("Franklin");

  const activeMetrics = useMemo(() => {
    const key = normalizeCountyName(activeCounty);
    return COUNTY_METRICS[key] || {
      programs: "—",
      served: "—",
      funding: "—",
      outcome: "—",
      risk: "—",
    };
  }, [activeCounty]);

  return (
    <div className="shf-ohio-engine">
      <div className="shf-ohio-engine__surface">
        <OhioCountyNeutralBase
          activeCounty={activeCounty}
          onCountyClick={(countyName) => {
            setActiveCounty(countyName);
            onCountyClick?.(countyName);
          }}
        />
      </div>

      <div className="shf-ohio-engine__card">
        <div className="shf-ohio-engine__card-title-row">
          <strong>{activeCounty} County</strong>
          <span>⌁</span>
        </div>

        <div className="shf-ohio-engine__grid">
          <span>Programs Active:</span>
          <strong>{activeMetrics.programs}</strong>

          <span>People Served:</span>
          <strong>{activeMetrics.served}</strong>

          <span>Funding Deployed:</span>
          <strong>{activeMetrics.funding}</strong>

          <span>Top Outcome:</span>
          <strong>{activeMetrics.outcome}</strong>

          <span>Risk Signal:</span>
          <strong>{activeMetrics.risk}</strong>
        </div>
      </div>
    </div>
  );
}
