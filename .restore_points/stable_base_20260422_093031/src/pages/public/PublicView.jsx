import React from "react";
import "./public-view.css";

const mainMetrics = [
  { value: "3,200", label: ["People", "Assisted"] },
  { value: "142", label: ["Active", "Contracts"] },
  { value: "105", label: ["Processes", "Supporting"] },
];

const subMetrics = [
  "100+ Goals Achieved",
  "12 Active Agreements",
  "75 Partners Activated",
];

const nodes = [
  { tone: "green xl", top: "58%", left: "33%" },
  { tone: "orange lg", top: "55%", left: "58%" },
  { tone: "orange lg", top: "56%", left: "77%" },
  { tone: "orange md", top: "48%", left: "82%" },
  { tone: "orange sm", top: "43%", left: "16%" },
  { tone: "orange sm", top: "48%", left: "21%" },
  { tone: "orange sm", top: "53%", left: "27%" },
  { tone: "green sm", top: "46%", left: "30%" },
  { tone: "orange sm", top: "42%", left: "52%" },
  { tone: "orange sm", top: "49%", left: "65%" },
  { tone: "orange sm", top: "69%", left: "69%" },
  { tone: "green sm", top: "80%", left: "46%" },
  { tone: "orange sm", top: "85%", left: "56%" },
];

export default function PublicView() {
  return (
    <div className="public-page">
      <div className="public-shell">
        <header className="public-topbar">
          <div className="public-brand">
            <div className="public-menu" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>

            <div className="public-brand-copy">
              <span className="public-brand-shs">SHS</span>
              <span className="public-brand-exchange">Exchange</span>
            </div>
          </div>

          <div className="public-topbar-icons" aria-hidden="true">
            <span>☁</span>
            <span>◌</span>
            <span>✉</span>
          </div>
        </header>

        <section className="public-hero">
          <div className="public-stage">
            <div className="public-sky-layer" />
            <div className="public-atmosphere-left" />
            <div className="public-atmosphere-right" />
            <div className="public-city-glow-layer" />
            <div className="public-city-light-bed" />
            <div className="public-bottom-falloff" />

            <h1 className="public-title">Building Stronger Communities!</h1>

            <div className="public-map-frame">
              <div className="public-map-stack">
                <img
                  className="public-usa-png"
                  src="/assets/maps/usa-public.png"
                  alt="United States network map"
                />

                <img
                  className="public-state-lines-png"
                  src="/assets/maps/usa-state-lines.png"
                  alt=""
                  aria-hidden="true"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />

                <div className="public-signal-layer">
                  {nodes.map((node, i) => (
                    <span
                      key={i}
                      className={`public-node ${node.tone}`}
                      style={{ top: node.top, left: node.left }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="public-metrics-panel">
            <div className="public-metrics-row">
              {mainMetrics.map((item, i) => (
                <div className="public-metric-card" key={i}>
                  <div className="public-metric-value">{item.value}</div>
                  <div className="public-metric-label">
                    {item.label.map((line, j) => (
                      <div key={j}>{line}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="public-submetrics-row">
              {subMetrics.map((item, i) => (
                <div className="public-submetric-card" key={i}>
                  <span className="public-submetric-icon">
                    <span className="public-submetric-dot" />
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
