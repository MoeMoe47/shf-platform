import React from "react";
import "./shs-exchange-mission-control.css";

function HeaderBar() {
  return (
    <header className="shs-header">
      <div className="shs-header-left">
        <button className="shs-icon-button">☰</button>
        <div className="shs-brand">
          <span className="shs-brand-mark">SHS</span>
          <span className="shs-brand-name">Exchange</span>
        </div>
      </div>

      <div className="shs-header-right">
        <button className="shs-chip-button">Summary</button>
        <button className="shs-icon-button">🔔</button>
        <button className="shs-icon-button">⚙</button>
      </div>
    </header>
  );
}

function DecisionBanner() {
  return (
    <section className="decision-banner">
      <h1>System Stable — 2 Regions Need Attention</h1>
    </section>
  );
}

function LeftRail() {
  return (
    <aside className="left-rail">
      <section className="rail-panel">
        <div className="rail-panel-title">Overview</div>

        <div className="metric-row">
          <span className="metric-dot metric-dot-green"></span>
          <span className="metric-label">Active</span>
          <span className="metric-value">1,450</span>
        </div>

        <div className="metric-row">
          <span className="metric-dot metric-dot-orange"></span>
          <span className="metric-label">Overloaded</span>
          <span className="metric-value">28</span>
        </div>

        <div className="metric-row">
          <span className="metric-dot metric-dot-red"></span>
          <span className="metric-label">Critical</span>
          <span className="metric-value">6</span>
        </div>
      </section>

      <section className="rail-panel">
        <div className="rail-panel-title">AI Recommendation</div>

        <div className="recommendation-block">
          <div className="recommendation-icon">💡</div>
          <div className="recommendation-text">
            Reallocate resources to Denver region
          </div>
        </div>
      </section>
    </aside>
  );
}

function MapStage() {
  return (
    <section className="map-stage">
      <div className="space-overlay"></div>
      <div className="earth-horizon"></div>

      <div className="region-marker region-marker-green marker-west">
        <div className="marker-core"></div>
      </div>

      <div className="region-marker region-marker-orange marker-central">
        <div className="marker-core"></div>
      </div>

      <div className="region-marker region-marker-red marker-east">
        <div className="marker-core"></div>
      </div>

      <div className="region-marker region-marker-red marker-northeast">
        <div className="marker-core"></div>
      </div>
    </section>
  );
}

function ActionStrip() {
  return (
    <section className="action-strip">
      <button className="alert-card alert-red">
        <span className="alert-icon">📍</span>
        <span className="alert-text">New York Alert</span>
      </button>

      <button className="alert-card alert-orange">
        <span className="alert-icon">◯</span>
        <span className="alert-text">Denver Overload</span>
      </button>

      <button className="alert-card alert-green">
        <span className="alert-icon">✔</span>
        <span className="alert-text">West Coast Stable</span>
      </button>
    </section>
  );
}

export default function SHSExchangeMissionControl() {
  return (
    <div className="shs-exchange-page">
      <HeaderBar />

      <main className="shs-exchange-shell">
        <DecisionBanner />

        <div className="shs-main-grid">
          <LeftRail />
          <MapStage />
        </div>

        <ActionStrip />
      </main>
    </div>
  );
}
