import React from "react";
import "./hub-signal-sender-panel.css";

const HUB_SIGNAL_KEY = "shs_hub_growth_signals_v1";
const HUB_SIGNAL_EVENT_KEY = "shs_hub_growth_signal_events_v1";

const signalTemplates = [
  {
    id: "hub_sender_youth_family",
    title: "Youth / family check-in pattern",
    sourcePartnerName: "Hub Family Support Partner",
    signalType: "unmet_need_cluster",
    needCategory: "youth_family_checkin",
    description:
      "Hub referrals show repeated youth and family support needs that may fit Kermit, SHF Programs, and SHS reporting.",
    priority: "high",
    estimatedValue: 25000,
    volume: 14,
    consentStatus: "mixed",
    partnerResponseRate: 82,
    completionHistory: 74,
    recommendedLane: "Kermit",
  },
  {
    id: "hub_sender_medication_access",
    title: "Medication access barrier",
    sourcePartnerName: "Community Care Medication Partner",
    signalType: "pharmacy_access_need",
    needCategory: "medication_access",
    description:
      "Hub queue activity shows medication access and delivery barriers that may fit VerifiedRx Logistics.",
    priority: "high",
    estimatedValue: 50000,
    volume: 9,
    consentStatus: "confirmed",
    partnerResponseRate: 76,
    completionHistory: 68,
    recommendedLane: "VerifiedRx Logistics",
  },
  {
    id: "hub_sender_workforce_readiness",
    title: "Workforce readiness demand",
    sourcePartnerName: "Hub Workforce Partner",
    signalType: "employer_demand",
    needCategory: "workforce_readiness",
    description:
      "Referral activity shows participants ready for training, job placement, employer matching, and retention tracking.",
    priority: "medium",
    estimatedValue: 35000,
    volume: 12,
    consentStatus: "confirmed",
    partnerResponseRate: 71,
    completionHistory: 63,
    recommendedLane: "Workforce Pipeline",
  },
];

function readJson(key, fallback = []) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage may be unavailable
  }
}

function createHubSignal(template) {
  const signal = {
    id: `signal_from_hub_queue_${template.id}_${Date.now()}`,
    source: "hub",
    sourceSurface: "Partner Action Queue",
    sourcePartnerId: `partner_${template.id}`,
    sourcePartnerName: template.sourcePartnerName,
    signalType: template.signalType,
    needCategory: template.needCategory,
    description: template.description,
    priority: template.priority,
    estimatedValue: template.estimatedValue,
    volume: template.volume,
    consentStatus: template.consentStatus,
    partnerResponseRate: template.partnerResponseRate,
    completionHistory: template.completionHistory,
    createdAt: new Date().toISOString(),
  };

  const existing = readJson(HUB_SIGNAL_KEY, []);
  const nextSignals = [signal, ...existing].slice(0, 150);
  writeJson(HUB_SIGNAL_KEY, nextSignals);

  const event = {
    id: `hub_signal_event_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    surface: "shs_hub_collaboration_layer",
    eventType: "hub.signal.sent_to_growth_engine",
    signalId: signal.id,
    sourceSurface: signal.sourceSurface,
    sourcePartnerName: signal.sourcePartnerName,
    needCategory: signal.needCategory,
    recommendedLane: template.recommendedLane,
    metadata: {
      estimatedValue: signal.estimatedValue,
      priority: signal.priority,
      volume: signal.volume,
    },
    timestamp: new Date().toISOString(),
  };

  const previousEvents = readJson(HUB_SIGNAL_EVENT_KEY, []);
  writeJson(HUB_SIGNAL_EVENT_KEY, [event, ...previousEvents].slice(0, 150));

  try {
    window.dispatchEvent(
      new CustomEvent("shs:hub-growth-signal-created", {
        detail: { signal, event },
      })
    );
    window.dispatchEvent(new CustomEvent("shs:growth-signals-refresh"));
  } catch {
    // ignore dispatch failures
  }

  return signal;
}

export default function HubSignalSenderPanel() {
  const [sentSignals, setSentSignals] = React.useState(() => readJson(HUB_SIGNAL_EVENT_KEY, []));
  const [notice, setNotice] = React.useState("");

  const sendSignal = (template) => {
    const signal = createHubSignal(template);
    setSentSignals(readJson(HUB_SIGNAL_EVENT_KEY, []));
    setNotice(`${signal.sourcePartnerName} sent to Adaptive Growth Optimization.`);
    window.clearTimeout(window.__shsHubSenderNotice);
    window.__shsHubSenderNotice = window.setTimeout(() => setNotice(""), 2800);
  };

  return (
    <section className="hub-signal-sender">
      <div className="hub-signal-sender__head">
        <div>
          <span>Adaptive Growth Bridge</span>
          <h2>Send Hub signals to Growth Engine</h2>
          <p>
            Convert Hub referral patterns, unmet needs, and partner demand into scored Growth
            signals for service-lane activation.
          </p>
        </div>

        <a href="admin.html#/growth">Open Growth Engine →</a>
      </div>

      <div className="hub-signal-sender__grid">
        {signalTemplates.map((template) => (
          <article key={template.id} className="hub-signal-sender__card">
            <div className="hub-signal-sender__cardTop">
              <h3>{template.title}</h3>
              <strong>{template.recommendedLane}</strong>
            </div>

            <p>{template.description}</p>

            <div className="hub-signal-sender__metrics">
              <span>
                <small>Priority</small>
                <b>{template.priority}</b>
              </span>
              <span>
                <small>Value</small>
                <b>${Math.round(template.estimatedValue / 1000)}K</b>
              </span>
              <span>
                <small>Volume</small>
                <b>{template.volume}</b>
              </span>
            </div>

            <button type="button" onClick={() => sendSignal(template)}>
              Send to Growth Engine
            </button>
          </article>
        ))}
      </div>

      <div className="hub-signal-sender__foot">
        <div>
          <strong>{sentSignals.length}</strong>
          <span>Hub signals sent</span>
        </div>

        <p>
          Signals write to <code>shs_hub_growth_signals_v1</code> and are scored by the Adaptive Growth Optimization Layer.
        </p>
      </div>

      {notice && <div className="hub-signal-sender__notice">{notice}</div>}
    </section>
  );
}
