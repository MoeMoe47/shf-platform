import React from "react";
import { infrastructureFlow, infrastructureLayers } from "./solutionsInfrastructureData.js";

const STORAGE_KEY = "shs_infrastructure_page_events_v1";

function readEvents() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeEvents(events) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(0, 100)));
  } catch {
    // ignore storage errors
  }
}

function scoreTone(score) {
  if (score >= 82) return "strong";
  if (score >= 72) return "ready";
  return "building";
}

export default function SolutionsInfrastructureLogicPanel() {
  const [activeId, setActiveId] = React.useState(infrastructureLayers[0]?.id || "");
  const [events, setEvents] = React.useState(() => readEvents());
  const activeLayer = infrastructureLayers.find((layer) => layer.id === activeId) || infrastructureLayers[0];

  const track = React.useCallback((eventType, metadata = {}) => {
    const event = {
      id: `infra_evt_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      surface: "solutions_infrastructure_page",
      eventType,
      layerId: metadata.layerId || activeLayer?.id || null,
      metadata,
      timestamp: new Date().toISOString(),
    };

    setEvents((prev) => {
      const next = [event, ...prev].slice(0, 100);
      writeEvents(next);
      return next;
    });
  }, [activeLayer?.id]);

  const selectLayer = (layer) => {
    setActiveId(layer.id);
    track("infrastructure.layer.selected", {
      layerId: layer.id,
      title: layer.title,
      readiness: layer.readiness,
    });
  };

  const openRoute = (layer) => {
    track("infrastructure.route.opened", {
      layerId: layer.id,
      route: layer.route,
    });

    if (layer.route) {
      window.location.href = layer.route;
    }
  };

  const requestDemo = () => {
    track("infrastructure.demo.requested", {
      layerId: activeLayer.id,
      title: activeLayer.title,
    });

    window.location.href = "solutions.html#/request-demo";
  };

  return (
    <section className="shs-infra-logic-panel">
      <div className="shs-infra-logic-panel__header">
        <div>
          <span className="shs-infra-eyebrow">Infrastructure Logic Console</span>
          <h2>How SHS turns activity into verified outcomes</h2>
          <p>
            Select a layer to see what it receives, how it works, what it produces,
            and which SHS surface it powers. This wiring prepares the page for real
            routes, demos, reporting, and future infrastructure events.
          </p>
        </div>

        <div className="shs-infra-logic-panel__score">
          <span>Selected Readiness</span>
          <strong>{activeLayer.readiness}%</strong>
          <em className={`is-${scoreTone(activeLayer.readiness)}`}>
            {scoreTone(activeLayer.readiness)}
          </em>
        </div>
      </div>

      <div className="shs-infra-flow-strip" aria-label="SHS infrastructure flow">
        {infrastructureFlow.map((step, index) => (
          <React.Fragment key={step}>
            <span>{step}</span>
            {index < infrastructureFlow.length - 1 && <i>→</i>}
          </React.Fragment>
        ))}
      </div>

      <div className="shs-infra-logic-grid">
        <nav className="shs-infra-layer-nav" aria-label="Infrastructure layers">
          {infrastructureLayers.map((layer) => (
            <button
              type="button"
              key={layer.id}
              className={layer.id === activeLayer.id ? "is-active" : ""}
              onClick={() => selectLayer(layer)}
            >
              <span>{layer.number}</span>
              <strong>{layer.shortName}</strong>
              <em>{layer.readiness}%</em>
            </button>
          ))}
        </nav>

        <article className="shs-infra-active-layer-card">
          <div className="shs-infra-active-layer-card__top">
            <div>
              <span className="shs-infra-layer-number">{activeLayer.number}</span>
              <h3>{activeLayer.title}</h3>
              <p>{activeLayer.purpose}</p>
            </div>

            <button type="button" onClick={() => openRoute(activeLayer)}>
              Open Surface →
            </button>
          </div>

          <div className="shs-infra-detail-columns">
            <div>
              <h4>Inputs</h4>
              <ul>
                {activeLayer.inputs.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>

            <div>
              <h4>Logic</h4>
              <ul>
                {activeLayer.logic.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>

            <div>
              <h4>Outputs</h4>
              <ul>
                {activeLayer.outputs.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>

          <div className="shs-infra-powered-row">
            <div>
              <h4>Powers</h4>
              <div className="shs-infra-powered-tags">
                {activeLayer.powers.map((item) => <span key={item}>{item}</span>)}
              </div>
            </div>

            <div className="shs-infra-status-card">
              <span>Status</span>
              <strong>{activeLayer.status}</strong>
            </div>
          </div>
        </article>

        <aside className="shs-infra-wiring-rail">
          <div className="shs-infra-wiring-card">
            <h3>Next wiring move</h3>
            <p>
              Connect this public page to live SHS proof: demo requests, selected layer
              interest, partner source, and requested infrastructure surface.
            </p>
            <button type="button" onClick={requestDemo}>
              Request Demo for {activeLayer.shortName}
            </button>
          </div>

          <div className="shs-infra-wiring-card">
            <h3>Event preview</h3>
            <p>
              Events written locally now. Later these can flow into the SHS Event Layer,
              Oracle readiness, and reporting.
            </p>

            <div className="shs-infra-event-list">
              {events.length === 0 ? (
                <span>No local infrastructure events yet.</span>
              ) : (
                events.slice(0, 4).map((event) => (
                  <div key={event.id}>
                    <strong>{event.eventType}</strong>
                    <small>{new Date(event.timestamp).toLocaleTimeString()}</small>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
