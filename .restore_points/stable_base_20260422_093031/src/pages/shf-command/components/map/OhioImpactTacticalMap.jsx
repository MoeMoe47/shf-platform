import React, { useEffect, useMemo, useRef, useState } from "react";
import "./ohio-impact-tactical-map.css";

const SIGNAL_NODES = [
  { id: "franklin", label: "Franklin County", x: 54, y: 51, tier: "primary", status: "processing", programs: "5", people: "3,824", funding: "$4.5M", outcome: "82%", condition: "Stable" },
  { id: "cuyahoga", label: "Cuyahoga County", x: 69, y: 21, tier: "primary", status: "processing", programs: "4", people: "2,406", funding: "$3.2M", outcome: "79%", condition: "Watch" },
  { id: "hamilton", label: "Hamilton County", x: 33, y: 77, tier: "primary", status: "processing", programs: "3", people: "1,955", funding: "$2.1M", outcome: "74%", condition: "Stable" },
  { id: "summit", label: "Summit County", x: 63, y: 28, tier: "secondary", status: "watch", programs: "2", people: "1,240", funding: "$1.4M", outcome: "71%", condition: "Opportunity" },
  { id: "montgomery", label: "Montgomery County", x: 40, y: 60, tier: "secondary", status: "normal", programs: "2", people: "1,112", funding: "$1.1M", outcome: "69%", condition: "Stable" },
  { id: "lucas", label: "Lucas County", x: 54, y: 10, tier: "secondary", status: "normal", programs: "2", people: "913", funding: "$940K", outcome: "67%", condition: "Stable" },
  { id: "delaware", label: "Delaware County", x: 54, y: 44, tier: "secondary", status: "watch", programs: "1", people: "622", funding: "$610K", outcome: "73%", condition: "Stable" },
  { id: "licking", label: "Licking County", x: 61, y: 49, tier: "secondary", status: "normal", programs: "1", people: "508", funding: "$525K", outcome: "66%", condition: "Watch" },
  { id: "fairfield", label: "Fairfield County", x: 58, y: 57, tier: "secondary", status: "normal", programs: "1", people: "440", funding: "$430K", outcome: "65%", condition: "Stable" },
  { id: "pickaway", label: "Pickaway County", x: 51, y: 60, tier: "secondary", status: "normal", programs: "1", people: "320", funding: "$310K", outcome: "63%", condition: "Stable" },
];

function buildStatusMessage(mode, countyLabel = "") {
  if (mode === "init") return "Initializing statewide command surface…";
  if (mode === "hover") return `Reading county surface · ${countyLabel}…`;
  if (mode === "select") return `County selection received · ${countyLabel} · resolving county context…`;
  if (mode === "reset") return "Statewide command surface restored.";
  return "";
}

function OhioSilhouetteLayer() {
  return (
    <svg
      className="ohio-tactical-map__svg"
      viewBox="0 0 900 620"
      aria-hidden="true"
      role="presentation"
    >
      <path
        className="ohio-tactical-map__shape"
        d="M177 111
           L333 108
           L352 124
           L415 124
           L433 145
           L520 145
           L557 127
           L610 127
           L690 70
           L739 59
           L739 432
           L701 432
           L694 466
           L669 478
           L656 497
           L630 486
           L612 498
           L581 489
           L559 514
           L528 500
           L516 512
           L477 505
           L455 522
           L425 515
           L411 534
           L373 524
           L356 538
           L323 529
           L307 543
           L277 536
           L252 547
           L217 536
           L199 547
           L177 539
           Z"
      />
    </svg>
  );
}

function VanishingStatusStrip({ visible, message }) {
  return (
    <div className={`ohio-tactical-status ${visible ? "is-visible" : ""}`}>
      <span className="ohio-tactical-status__dot" />
      <span className="ohio-tactical-status__text">{message}</span>
    </div>
  );
}

function CountyDetailCard({ county }) {
  if (!county) return null;

  return (
    <div className="ohio-tactical-card">
      <div className="ohio-tactical-card__title-row">
        <strong>{county.label}</strong>
        <span>⌁</span>
      </div>

      <div className="ohio-tactical-card__grid">
        <span>Programs Active:</span>
        <strong>{county.programs}</strong>

        <span>People Served:</span>
        <strong>{county.people}</strong>

        <span>Funding Deployed:</span>
        <strong>{county.funding}</strong>

        <span>Top Outcome:</span>
        <strong>{county.outcome}</strong>

        <span>Risk Signal:</span>
        <strong>{county.condition}</strong>
      </div>
    </div>
  );
}

export default function OhioImpactTacticalMap() {
  const [hoveredCounty, setHoveredCounty] = useState(null);
  const [selectedCounty, setSelectedCounty] = useState(SIGNAL_NODES[0]);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusVisible, setStatusVisible] = useState(false);
  const timerRef = useRef(null);

  const activeCounty = hoveredCounty || selectedCounty || null;

  const processingIds = useMemo(
    () => new Set(SIGNAL_NODES.filter((n) => n.status === "processing").map((n) => n.id)),
    []
  );

  const showStatus = (mode, label = "", duration = 1400) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStatusMessage(buildStatusMessage(mode, label));
    setStatusVisible(true);
    timerRef.current = setTimeout(() => setStatusVisible(false), duration);
  };

  useEffect(() => {
    showStatus("init", "", 1800);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="ohio-tactical-map">
      <div className="ohio-tactical-map__grid" />

      <VanishingStatusStrip visible={statusVisible} message={statusMessage} />

      <div className="ohio-tactical-map__toolbar">
        <button
          type="button"
          onClick={() => {
            setHoveredCounty(null);
            setSelectedCounty(SIGNAL_NODES[0]);
            showStatus("reset", "", 1400);
          }}
        >
          Reset View
        </button>
        <button type="button" className="is-active">
          {selectedCounty ? selectedCounty.label : "Ohio : Statewide"}
        </button>
      </div>

      <div className="ohio-tactical-map__surface">
        <OhioSilhouetteLayer />

        <div className="ohio-tactical-map__signals">
          {SIGNAL_NODES.map((node) => {
            const isSelected = selectedCounty?.id === node.id;
            const isHovered = hoveredCounty?.id === node.id;
            const isProcessing = processingIds.has(node.id);

            return (
              <button
                key={node.id}
                type="button"
                className={[
                  "ohio-tactical-node",
                  `is-${node.tier}`,
                  isProcessing ? "is-processing" : "",
                  isSelected ? "is-selected" : "",
                  isHovered ? "is-hovered" : "",
                ].join(" ")}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
                onMouseEnter={() => {
                  setHoveredCounty(node);
                  showStatus("hover", node.label, 900);
                }}
                onMouseLeave={() => setHoveredCounty(null)}
                onClick={() => {
                  setSelectedCounty(node);
                  showStatus("select", node.label, 1600);
                }}
                aria-label={node.label}
                title={node.label}
              >
                <span className="ohio-tactical-node__core" />
              </button>
            );
          })}
        </div>

        <CountyDetailCard county={activeCounty} />
      </div>

      <div className="ohio-tactical-map__footer">
        <span>TACTICAL STATEWIDE SURFACE</span>
        <button type="button">Open Full County Surface</button>
      </div>
    </div>
  );
}
