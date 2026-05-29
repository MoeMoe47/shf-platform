
function go(path) {
  if (!path || typeof window === "undefined") return;
  window.location.hash = String(path).startsWith("/") ? path : `/${path}`;
}

const SHS_HUB_LOGO = "/assets/hub/shs-hub-logo.png";
import React from "react";
import {
  recordHubReferralAction,
  seedHubReferralsIntoTruthSpine,
  syncPartnerQueueActionToBackend,
  recordTruthSpineQueueAction,
} from "@/shared/truth-spine";
import "./partner-action-queue-v2.css";
import HubBusinessTourProvider from "./shared/HubBusinessTourProvider.jsx";
import { buildQueueWorkflowSignal, queueWorkflowSignalClass } from "./shared/hubQueueWorkflowSignals";

const HUB_SIGNAL_KEY = "shs_hub_growth_signals_v1";
const HUB_SIGNAL_EVENT_KEY = "shs_hub_growth_signal_events_v1";
const QUEUE_ACTION_KEY = "shs_partner_action_queue_v2_events";

const signalTemplates = [
  {
    id: "youth_family_checkin",
    icon: "👥",
    title: "Youth / family check-in pattern",
    lane: "Kermit",
    laneTone: "green",
    description:
      "Hub referrals show repeated youth and family support needs that may fit Kermit, SHF Programs, and SHS reporting.",
    signalType: "unmet_need_cluster",
    needCategory: "youth_family_checkin",
    priority: "high",
    value: 25000,
    volume: 14,
    partnerResponseRate: 82,
    completionHistory: 74,
    consentStatus: "mixed",
  },
  {
    id: "medication_access",
    icon: "💊",
    title: "Medication access barrier",
    lane: "VerifiedRx Logistics",
    laneTone: "cyan",
    description:
      "Hub queue activity shows medication access and delivery barriers that may fit VerifiedRx Logistics.",
    signalType: "pharmacy_access_need",
    needCategory: "medication_access",
    priority: "high",
    value: 50000,
    volume: 9,
    partnerResponseRate: 76,
    completionHistory: 68,
    consentStatus: "confirmed",
  },
  {
    id: "workforce_readiness",
    icon: "💼",
    title: "Workforce readiness demand",
    lane: "Workforce Pipeline",
    laneTone: "purple",
    description:
      "Referral activity shows participants ready for training, job placement, employer matching, and retention tracking.",
    signalType: "employer_demand",
    needCategory: "workforce_readiness",
    priority: "medium",
    value: 35000,
    volume: 12,
    partnerResponseRate: 71,
    completionHistory: 63,
    consentStatus: "confirmed",
  },
];

const referrals = [
  {
    id: "case_fdea72ed-ec6e-4eb5-96f9-1cdf84ca44cf",
    title: "Referral",
    status: "On Hold",
    statusTone: "amber",
    priority: "Medium Priority",
    priorityTone: "amber",
    assignment: "Assigned",
    assignmentTone: "green",
    sender: "Silicon Heartland Foundation",
    receiver: "Franklin County Workforce Partner",
    needCategory: "workforce_training",
    urgency: "medium",
    urgencyTone: "amber",
    created: "4/15/2026, 10:35:08 PM",
    assigned: "user_admin_001",
    notes: "—",
    actions: ["Assign", "Start Review", "Hold", "Resolve", "Close"],
  },
  {
    id: "case_1302bd05-7c7e-4915-bf96-b1e8426a5a8e",
    title: "Referral",
    status: "Closed",
    statusTone: "slate",
    priority: "Medium Priority",
    priorityTone: "amber",
    assignment: "Unassigned",
    assignmentTone: "purple",
    sender: "Silicon Heartland Foundation",
    receiver: "—",
    needCategory: "—",
    urgency: "medium",
    urgencyTone: "amber",
    created: "4/15/2026, 6:30:29 PM",
    assigned: "Unassigned",
    notes: "—",
    actions: ["Assign", "Start Review", "Resolve", "Close"],
  },
  {
    id: "case_1dfc9e8d-1daf-43a8-b892-360cfe068620",
    title: "Referral",
    status: "Closed",
    statusTone: "slate",
    priority: "High Priority",
    priorityTone: "green",
    assignment: "Assigned",
    assignmentTone: "green",
    sender: "Silicon Heartland Foundation",
    receiver: "—",
    needCategory: "—",
    urgency: "high",
    urgencyTone: "red",
    created: "4/15/2026, 4:20:38 PM",
    assigned: "user_admin_001",
    notes: "—",
    actions: ["Start Review", "Resolve", "Close"],
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
    // Local storage can be blocked in private contexts.
  }
}

function appendEvent(key, event) {
  const previous = readJson(key, []);
  const next = [event, ...previous].slice(0, 200);
  writeJson(key, next);
  return next;
}

function hydratePartnerQueueTruthSpine() {
  try {
    seedHubReferralsIntoTruthSpine(referrals, "partner_action_queue_v2");
  } catch (error) {
    console.warn("[Truth Spine] Partner Action Queue seed failed", error);
  }
}

function getQueueStatusPatch(action) {
  const key = String(action || "").toLowerCase().replaceAll(" ", "_");

  const patches = {
    assign: {
      status: "Assigned",
      statusTone: "green",
      assignment: "Assigned",
      assignmentTone: "green",
      assigned: "user_admin_001",
    },
    start_review: {
      status: "In Review",
      statusTone: "blue",
      assignment: "Assigned",
      assignmentTone: "green",
      assigned: "user_admin_001",
    },
    hold: {
      status: "On Hold",
      statusTone: "amber",
    },
    resolve: {
      status: "Resolved",
      statusTone: "green",
    },
    close: {
      status: "Closed",
      statusTone: "slate",
    },
  };

  return patches[key] || {};
}

function getQueueActionLabel(action) {
  const patch = getQueueStatusPatch(action);
  return patch.status || String(action || "Updated");
}

function money(value) {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${Math.round(value / 1000)}K`;
  return `$${value}`;
}

function makeSignal(template) {
  return {
    id: `signal_from_partner_queue_${template.id}_${Date.now()}`,
    source: "hub",
    sourceSurface: "Partner Action Queue V2",
    sourcePartnerId: `partner_${template.id}`,
    sourcePartnerName:
      template.id === "youth_family_checkin"
        ? "Hub Family Support Partner"
        : template.id === "medication_access"
          ? "Community Care Medication Partner"
          : "Hub Workforce Partner",
    signalType: template.signalType,
    needCategory: template.needCategory,
    description: template.description,
    priority: template.priority,
    estimatedValue: template.value,
    volume: template.volume,
    consentStatus: template.consentStatus,
    partnerResponseRate: template.partnerResponseRate,
    completionHistory: template.completionHistory,
    createdAt: new Date().toISOString(),
  };
}

function Sparkline({ tone = "blue" }) {
  return (
    <svg className={`paq2-spark paq2-spark--${tone}`} viewBox="0 0 120 34" aria-hidden="true">
      <polyline points="4,28 18,24 32,25 46,19 60,21 74,15 88,18 104,10 116,6" />
    </svg>
  );
}


function QueueWorkflowSignal({ referral }) {
  const signal = buildQueueWorkflowSignal(referral);

  return (
    <div className="paq2-workflowSignalBox">
      <div
        className={[
          "paq2-workflowSignal",
          queueWorkflowSignalClass(signal.tone),
        ].join(" ")}
        title={signal.reason}
      >
        <span>{signal.label}</span>
        <strong>{signal.ageDays}d age</strong>
      </div>

      <p>{signal.nextAction}</p>

      {signal.blockers.length ? (
        <small>{signal.blockers.join(", ")}</small>
      ) : (
        <small>clear_for_next_action</small>
      )}
    </div>
  );
}


function Badge({ children, tone = "blue" }) {
  return <span className={`paq2-badge paq2-badge--${tone}`}>{children}</span>;
}

function Sidebar() {
  const items = [
    ["⌂", "Overview"],
    ["👥", "Partners"],
    ["⇄", "Referrals"],
    ["▤", "Intake"],
    ["☑", "Action Queue", true],
    ["▥", "Reports"],
  ];

  return (
    <aside className="paq2-sidebar" data-tour="hub-queue-sidebar">
      <button
        className="paq2-logo"
        type="button"
        onClick={() => (window.location.href = SHS_HOME_URL)}
        aria-label="Go to SHS Hub Overview"
        title="Go to SHS Hub Overview"
      >
        <img src={SHS_HUB_LOGO} alt="Silicon Heartland Hub" />
      </button>

<nav className="paq2-nav" data-tour="hub-queue-sidebar">
          <button type="button" onClick={() => go("/hub")} title="Overview">
            <span>⌂</span>
            <small>Overview</small>
          </button>

          <button type="button" onClick={() => go("/hub/network")} title="Partners">
            <span>👥</span>
            <small>Partners</small>
          </button>

          <button type="button" onClick={() => go("/hub/lifecycle")} title="Referrals">
            <span>↔</span>
            <small>Referrals</small>
          </button>

          <button type="button" onClick={() => go("/hub/intake")} title="Intake">
            <span>▤</span>
            <small>Intake</small>
          </button>

          <button type="button" className="is-active" onClick={() => go("/hub/queue")} title="Action Queue">
            <span>☑</span>
            <small>Action<br />Queue</small>
          </button>

          <button type="button" onClick={() => go("/hub/reports")} title="Reports">
            <span>▥</span>
            <small>Reports</small>
          </button>
        </nav>

      <div className="paq2-readiness" data-tour="hub-queue-readiness">
        <span>Reporting Readiness</span>
        <div className="paq2-ring">
          <strong>87%</strong>
        </div>
        <b>On track</b>
        <small>FY24 Q2 Report<br />Due in 18 days</small>
      </div>
    </aside>
  );
}

function Header() {
  return (
    <header className="paq2-header" data-tour="hub-queue-header">
      <div>
        <span className="paq2-eyebrow">SHS Hub Collaboration Layer</span>
        <h1>Partner Action Queue</h1>
        <p>Live referral action surface for assignments, reviews, holds, resolutions, and closures.</p>
      </div>

      <div className="paq2-headerActions" data-tour="hub-queue-header-actions">
        <button type="button">← Back to Hub</button>
        <button type="button">↻ Refresh</button>
        <button type="button">▤ Queue Brief</button>
      </div>
    </header>
  );
}

function KpiStrip() {
  const metrics = [
    ["▣", "Open", "24", "Stable", "blue"],
    ["👥", "Assigned", "18", "Stable", "blue"],
    ["🛡", "In Review", "12", "Stable", "blue"],
    ["⚑", "High Priority", "7", "Attention", "orange"],
    ["▵", "Unassigned", "6", "Needs Action", "purple"],
    ["✓", "Completed", "48", "Resolved", "green"],
  ];

  return (
    <section className="paq2-kpis" data-tour="hub-queue-kpis">
      {metrics.map(([icon, label, value, chip, tone]) => (
        <article className="paq2-kpi" key={label}>
          <div className="paq2-kpiIcon">{icon}</div>
          <div>
            <span>{label}</span>
            <strong>{value}</strong>
            <Badge tone={tone}>{chip}</Badge>
          </div>
          <Sparkline tone={tone === "orange" ? "orange" : tone === "purple" ? "purple" : tone === "green" ? "green" : "blue"} />
        </article>
      ))}
    </section>
  );
}

function AdaptiveGrowthBridge() {
  const [sent, setSent] = React.useState(() => readJson(HUB_SIGNAL_EVENT_KEY, []));
  const [notice, setNotice] = React.useState("");
  const [sentSignalIds, setSentSignalIds] = React.useState(() => {
    const events = readJson(HUB_SIGNAL_EVENT_KEY, []);
    return events
      .map((event) => event?.metadata?.templateId)
      .filter(Boolean);
  });

  const sendSignal = (template) => {
    const signal = makeSignal(template);
    const currentSignals = readJson(HUB_SIGNAL_KEY, []);
    writeJson(HUB_SIGNAL_KEY, [signal, ...currentSignals].slice(0, 200));

    const event = {
      id: `hub_signal_event_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      surface: "partner_action_queue_v2",
      eventType: "hub.signal.sent_to_growth_engine",
      signalId: signal.id,
      sourcePartnerName: signal.sourcePartnerName,
      needCategory: signal.needCategory,
      recommendedLane: template.lane,
      metadata: {
        templateId: template.id,
        priority: signal.priority,
        estimatedValue: signal.estimatedValue,
        volume: signal.volume,
      },
      timestamp: new Date().toISOString(),
    };

    const next = appendEvent(HUB_SIGNAL_EVENT_KEY, event);
    appendEvent(QUEUE_ACTION_KEY, event);
    setSent(next);
    setSentSignalIds((current) => Array.from(new Set([template.id, ...current])));
    setNotice(`${template.title} sent to Adaptive Growth Optimization.`);

    try {
      window.dispatchEvent(new CustomEvent("shs:hub-growth-signal-created", { detail: { signal, event } }));
      window.dispatchEvent(new CustomEvent("shs:growth-signals-refresh"));
    } catch {
      // Ignore dispatch errors.
    }

    window.clearTimeout(window.__paq2Notice);
    window.__paq2Notice = window.setTimeout(() => setNotice(""), 2600);
  };

  return (
    <section className="paq2-panel paq2-bridge" data-tour="hub-queue-growth-bridge">
      <div className="paq2-sectionTop">
        <div>
          <span className="paq2-eyebrow">Adaptive Growth Bridge</span>
          <h2>Send Hub signals to Growth Engine</h2>
          <p>Convert Hub referral patterns, unmet needs, and partner demand into scored Growth signals for service-lane activation.</p>
        </div>
        <a href="admin.html#/growth">Open Growth Engine →</a>
      </div>

      <div className="paq2-signalRows" data-tour="hub-queue-signals">
        {signalTemplates.map((signal) => (
          <article className={`paq2-signalRow ${sentSignalIds.includes(signal.id) ? "is-sent" : ""}`} key={signal.id}>
            <div className={`paq2-signalIcon paq2-signalIcon--${signal.laneTone}`}>{signal.icon}</div>

            <div className="paq2-signalCopy">
              <h3>{signal.title}</h3>
              <p>{signal.description}</p>
            </div>

            <div className="paq2-laneStack">
              <Badge tone={signal.laneTone}>{signal.lane}</Badge>
              {sentSignalIds.includes(signal.id) && <span className="paq2-sentChip">Sent</span>}
            </div>

            <div className="paq2-miniStats">
              <span><small>Priority</small><b>{signal.priority}</b></span>
              <span><small>Value</small><b>{money(signal.value)}</b></span>
              <span><small>Volume</small><b>{signal.volume}</b></span>
            </div>

            <button type="button" onClick={() => sendSignal(signal)}>
              {sentSignalIds.includes(signal.id) ? "Sent to Growth ✓" : "Send to Growth Engine"}
            </button>
          </article>
        ))}
      </div>

      <div className="paq2-bridgeFoot">
        <strong>{sent.length}</strong>
        <span>Hub signals sent</span>
        <p>Signals write to <code>shs_hub_growth_signals_v1</code> and are scored by the Adaptive Growth Optimization Layer.</p>
      </div>

      {notice && <div className="paq2-notice">{notice}</div>}
    </section>
  );
}

function ReferralQueue() {
  const [events, setEvents] = React.useState(() => readJson(QUEUE_ACTION_KEY, []));
  const [truthEngineStatus, setTruthEngineStatus] = React.useState("ready");
  const [truthEngineNotice, setTruthEngineNotice] = React.useState("");
  const [queueReferrals, setQueueReferrals] = React.useState(() => referrals);
  const [actionNotice, setActionNotice] = React.useState("");

  React.useEffect(() => {
    hydratePartnerQueueTruthSpine();
  }, []);

  const handleAction = async (referral, action) => {
    const event = {
      id: `queue_action_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      surface: "partner_action_queue_v2",
      eventType: `partner_action_queue.${action.toLowerCase().replaceAll(" ", "_")}`,
      referralId: referral.id,
      title: referral.title,
      metadata: {
        action,
        status: referral.status,
        urgency: referral.urgency,
        assigned: referral.assigned,
      },
      timestamp: new Date().toISOString(),
    };

    const statusPatch = getQueueStatusPatch(action);
    const nextStatusLabel = getQueueActionLabel(action);

    setQueueReferrals((current) =>
      current.map((item) =>
        item.id === referral.id
          ? {
              ...item,
              ...statusPatch,
              rawLastAction: action,
              lastUpdatedAt: new Date().toISOString(),
            }
          : item
      )
    );

    setActionNotice(`${referral.id} updated: ${nextStatusLabel}`);

    window.clearTimeout(window.__paq2ActionNotice);
    window.__paq2ActionNotice = window.setTimeout(() => {
      setActionNotice("");
    }, 3200);

    let truthResult = null;

    const referralForSync = {
      ...referral,
      ...statusPatch,
      status: statusPatch.status || referral.status,
      assigned: statusPatch.assigned || referral.assigned,
    };

    try {
      truthResult = recordHubReferralAction(referralForSync, action, {
        sourceSurface: "partner_action_queue_v2",
        actorId: "demo-user-1",
        actorRole: "hub_operator",
        organizationId: "shf-core",
      });
    } catch (error) {
      console.warn("[Truth Spine] Partner Action Queue action failed", error);
    }

    const truthEvent = truthResult?.record
      ? {
          id: `truth_spine_${Date.now()}_${Math.random().toString(16).slice(2)}`,
          surface: "partner_action_queue_v2",
          eventType: "truth_spine.record.updated",
          referralId: referral.id,
          title: referral.title,
          metadata: {
            action,
            traceId: truthResult.record.trustEnvelope?.traceId,
            readinessStatus: truthResult.record.oracle?.readinessStatus,
            confidenceScore: truthResult.record.oracle?.confidenceScore,
            truthStatus: truthResult.record.oracle?.truthStatus,
          },
          timestamp: new Date().toISOString(),
        }
      : null;

    const nextEvents = truthEvent
      ? appendEvent(QUEUE_ACTION_KEY, truthEvent)
      : readJson(QUEUE_ACTION_KEY, []);

    try {
      setTruthEngineStatus("syncing");

      const engineResult = await recordTruthSpineQueueAction(referralForSync, action, {
        sourceSurface: "partner_action_queue_v2",
        actorId: "demo-user-1",
        actorRole: "hub_operator",
        organizationId: "shf-core",
        syncBackend: true,
      });

      appendEvent(QUEUE_ACTION_KEY, {
        id: `engine_sync_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        surface: "partner_action_queue_v2",
        eventType: engineResult.backendStatus === "synced" ? "truth.engine.synced" : "truth.engine.sync_failed",
        referralId: referral.id,
        title: referral.title,
        metadata: {
          action,
          engineResult,
          caseId: referral.case_id || referral.id,
        },
        timestamp: new Date().toISOString(),
      });

      if (engineResult.backendStatus === "synced") {
        setTruthEngineStatus("connected");
        setActionNotice(`${referral.id} updated: ${nextStatusLabel} · Truth Spine Engine synced`);
        setTruthEngineNotice(`Truth Spine Engine recorded ${action} and backend audit proof.`);
      } else {
        setTruthEngineStatus("fallback");
        setActionNotice(`${referral.id} updated locally: ${nextStatusLabel} · Engine fallback preserved`);
        setTruthEngineNotice(`Truth Spine Engine recorded ${action}; backend sync needs review.`);
      }
    } catch (error) {
      setTruthEngineStatus("fallback");

      appendEvent(QUEUE_ACTION_KEY, {
        id: `engine_sync_failed_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        surface: "partner_action_queue_v2",
        eventType: "truth.engine.sync_failed",
        referralId: referral.id,
        title: referral.title,
        metadata: {
          action,
          caseId: referral.case_id || referral.id,
          error: error?.message || "Truth Spine Engine sync failed",
        },
        timestamp: new Date().toISOString(),
      });

      setActionNotice(`${referral.id} updated locally: ${nextStatusLabel} · Engine sync needs review`);
      setTruthEngineNotice(`Truth Spine Engine fallback active for ${action}.`);
      console.warn("[Truth Spine Engine] Queue action failed; local page state preserved", error);

      try {
        const backendResult = await syncPartnerQueueActionToBackend(referralForSync, action);

        appendEvent(QUEUE_ACTION_KEY, {
          id: `backend_sync_${Date.now()}_${Math.random().toString(16).slice(2)}`,
          surface: "partner_action_queue_v2",
          eventType: "backend.case.synced",
          referralId: referral.id,
          title: referral.title,
          metadata: {
            action,
            backendResult,
            caseId: referral.case_id || referral.id,
          },
          timestamp: new Date().toISOString(),
        });
      } catch (fallbackError) {
        console.warn("[Truth Spine] Legacy backend fallback also failed", fallbackError);
      }
    }

    window.clearTimeout(window.__paq2EngineNotice);
    window.__paq2EngineNotice = window.setTimeout(() => {
      setTruthEngineNotice("");
    }, 3800);

    setEvents(appendEvent(QUEUE_ACTION_KEY, event));

    try {
      window.dispatchEvent(
        new CustomEvent("shs:partner-action-queue-truth-updated", {
          detail: {
            referral,
            action,
            truthRecord: truthResult?.record || null,
            truthEvent: truthResult?.event || null,
            queueEvent: event,
            localTruthEvent: truthEvent,
            queueEvents: nextEvents,
          },
        })
      );
    } catch {
      // Ignore dispatch errors.
    }
  };

  return (
    <section className="paq2-panel paq2-referrals" data-tour="hub-queue-referrals">
      <div className="paq2-referralTop">
        <div>
          <h2>Live Referral Queue</h2>
          <p>Real-time referral cards with status, assignments, and next actions.</p>
        </div>

        <div className="paq2-filters" data-tour="hub-queue-filters">
          <button type="button">All Status⌄</button>
          <button type="button">All Priorities⌄</button>
          <button type="button">Sort: Newest⌄</button>
        </div>
      </div>

      <div className="paq2-notice" style={{ marginBottom: 12 }}>
        <strong>Truth Spine Engine:</strong> {truthEngineStatus}
        {truthEngineNotice ? <span> · {truthEngineNotice}</span> : null}
      </div>

      {actionNotice && (
        <div className="paq2-notice" style={{ marginBottom: 12 }}>
          {actionNotice}
        </div>
      )}

      <div className="paq2-referralGrid" data-tour="hub-queue-referral-cards">
        {queueReferrals.map((referral) => (
          <article className="paq2-referralCard" key={referral.id}>
            <div className="paq2-referralHead">
              <div>
                <h3>{referral.title}</h3>
                <small>{referral.id}</small>
              </div>
              <Badge tone={referral.statusTone}>{referral.status}</Badge>
            </div>

            <div className="paq2-tagRow">
              <Badge tone={referral.priorityTone}>{referral.priority}</Badge>
              <Badge tone={referral.assignmentTone}>{referral.assignment}</Badge>
            </div>

            <dl className="paq2-meta">
              <div><dt>⊙ Sender</dt><dd>{referral.sender}</dd></div>
              <div><dt>♙ Receiver</dt><dd>{referral.receiver}</dd></div>
              <div><dt>◇ Need Category</dt><dd>{referral.needCategory}</dd></div>
              <div><dt>◷ Urgency</dt><dd><i className={`paq2-dot paq2-dot--${referral.urgencyTone}`} />{referral.urgency}</dd></div>
              <div><dt>◴ Created</dt><dd>{referral.created}</dd></div>
              <div><dt>♙ Assigned</dt><dd>{referral.assigned}</dd></div>
              <div><dt>▤ Notes</dt><dd>{referral.notes}</dd></div>
              {referral.rawLastAction && (
                <div><dt>✓ Last Action</dt><dd>{referral.rawLastAction}</dd></div>
              )}
            </dl>

            <div className="paq2-cardActions" data-tour="hub-queue-card-actions">
              {referral.actions.map((action) => (
                <button
                  key={action}
                  type="button"
                  className={`is-${action.toLowerCase().replaceAll(" ", "-")}`}
                  onClick={() => handleAction(referral, action)}
                >
                  {action}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>

      <footer className="paq2-pagination">
        <span>Showing 1 to 3 of 3 referrals</span>
        <div>
          <button type="button">Previous</button>
          <button type="button" className="is-active">1</button>
          <button type="button">Next</button>
        </div>
      </footer>
    </section>
  );
}

function RightRail() {
  const actionEvents = readJson(QUEUE_ACTION_KEY, []);

  return (
    <aside className="paq2-rightRail" data-tour="hub-queue-right-rail">
      <section className="paq2-railCard">
        <h3>◇ Adaptive Queue Signal</h3>
        <p>Learning how operators act on referrals and queue guidance.</p>
        <div className="paq2-signalScore">
          <div><span>Experience</span><strong>Stable</strong></div>
          <b>70</b>
        </div>
        <div className="paq2-railRows">
          <span><em>Events</em><strong>{160 + actionEvents.length}</strong></span>
          <span><em>Top Action</em><strong>partner_action_queue</strong></span>
          <span><em>Friction</em><strong>0</strong></span>
        </div>
        <div className="paq2-recBox">
          <span>Next-Version Recommendation</span>
          <p>Consider making “partner_action_queue” more visible in the next dashboard version.</p>
        </div>
      </section>

      <section className="paq2-railCard">
        <h3>◎ Queue Guidance</h3>
        <p>Recommended focus and risk signals.</p>
        <div className="paq2-guidance" data-tour="hub-queue-guidance">
          <div><b>▶</b><span><strong>Next Action</strong><em>Review or assign 6 unassigned referrals.</em></span></div>
          <div><b>△</b><span><strong>Risk Signal</strong><em>7 high priority items require attention.</em></span></div>
          <div><b>👥</b><span><strong>Ownership Gap</strong><em>6 referrals are unassigned.</em></span></div>
          <div><b>🛡</b><span><strong>Escalation Note</strong><em>2 items are on hold and need resolution.</em></span></div>
        </div>
      </section>

      <section className="paq2-railCard">
        <h3>◎ Action Focus</h3>
        <p>Key indicators for today.</p>
        <div className="paq2-focusGrid" data-tour="hub-queue-focus">
          <div><span>⚑ High Priority</span><strong>7</strong><em>Requires attention</em></div>
          <div><span>♙ Unassigned</span><strong>6</strong><em>Needs assignment</em></div>
          <div><span>✓ Completed Today</span><strong>12</strong><em>Resolved</em></div>
        </div>
      </section>

      <section className="paq2-railCard">
        <div className="paq2-railHead">
          <h3>▦ Recent Queue Activity</h3>
          <a href="#activity">View All →</a>
        </div>
        <p>Latest actions across the queue.</p>
        <div className="paq2-activity" data-tour="hub-queue-activity">
          <div><i className="is-amber" /><span><strong>Referral placed on hold</strong><em>case_fdea72ed-ec6e...</em></span><time>10:35 PM</time></div>
          <div><i className="is-purple" /><span><strong>Referral assigned</strong><em>case_1302bd05-7c7e...</em></span><time>9:14 PM</time></div>
          <div><i className="is-green" /><span><strong>Referral resolved</strong><em>case_1dfc9e8d-1daf...</em></span><time>8:02 PM</time></div>
        </div>
        <button type="button" className="paq2-wideButton">View All Activity →</button>
      </section>
    </aside>
  );
}

export default function PartnerActionQueueV2() {
  return (
    <HubBusinessTourProvider pageKey="queue">
      <div className="paq2-page" data-tour="hub-queue-shell" data-hub-tour-page="queue">
      <Sidebar />

      <main className="paq2-main">
        <Header />
        <KpiStrip />

        <div className="paq2-bodyGrid">
          <div className="paq2-leftColumn">
            <AdaptiveGrowthBridge />
            <ReferralQueue />
          </div>

          <RightRail />
        </div>
      </main>
      </div>
      <footer className="paq2-institutionalFooter" data-tour="hub-queue-footer">
          <section className="paq2-footerBrand">
            <div className="paq2-footerLogo">
              <img src={SHS_HUB_LOGO} alt="Silicon Heartland Solutions" />
            </div>
            <div>
              <h3>Silicon Heartland Solutions</h3>
              <p>
                Truth Spine reporting infrastructure for referrals, queue actions,
                verification, audit trace, and institutional proof.
              </p>
              <div className="paq2-footerPills">
                <span>Secure Infrastructure</span>
                <span>Audit Ready</span>
                <span>Institutional Reporting</span>
                <span>Adaptive Growth Intelligence</span>
              </div>
            </div>
          </section>

          <section className="paq2-footerLinks">
            <div>
              <strong>Growth</strong>
              <span>Growth Engine</span>
              <span>Referrals</span>
              <span>Hub Network</span>
              <span>Hub Reports</span>
            </div>
            <div>
              <strong>Infrastructure</strong>
              <span>Command Surface</span>
              <span>Aggregation</span>
              <span>Verification</span>
              <span>Reporting</span>
            </div>
            <div>
              <strong>Trust Layer</strong>
              <span>Audit Ledger</span>
              <span>Identity</span>
              <span>Files & Imports</span>
              <span>Alignment</span>
            </div>
          </section>

          <section className="paq2-footerStatus">
            <div>
              <small>Version</small>
              <strong>Truth Spine V1</strong>
            </div>
            <div>
              <small>Environment</small>
              <strong>Local / Development</strong>
            </div>
            <div>
              <small>Status</small>
              <strong className="is-operational">Operational</strong>
            </div>
            <p>© 2026 Silicon Heartland Solutions</p>
          </section>
        </footer>
    </HubBusinessTourProvider>
  );
}
