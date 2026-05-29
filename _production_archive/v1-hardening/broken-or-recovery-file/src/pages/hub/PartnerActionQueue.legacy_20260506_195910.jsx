import React, { useEffect, useMemo, useState } from "react";
import useReferrals from "@/lib/hub/useReferrals";
import "./partner-action-queue-shs.css";
import { useAdaptiveExperience } from "@/system/adaptive-experience/useAdaptiveExperience";
import HubSignalSenderPanel from "@/pages/hub/HubSignalSenderPanel.jsx";
import {
  ADAPTIVE_EVENT_TYPES,
  ADAPTIVE_ROLES,
  ADAPTIVE_SURFACES,
} from "@/system/adaptive-experience/adaptiveEvent.types";



const SHS_HOME_URL = "/admin.html#/hub";

function openShsHome() {
  if (typeof window === "undefined") return;
  window.location.href = SHS_HOME_URL;
}

function go(path) {
  if (!path || typeof window === "undefined") return;
  window.location.hash = String(path).startsWith("/") ? path : `/${path}`;
}

function normalizeStatus(value) {
  return String(value || "").toLowerCase().replace(/[-\s]/g, "_");
}

function normalizePriority(value) {
  return String(value || "").toLowerCase().replace(/[-\s]/g, "_");
}

function getCaseId(item, index) {
  return item?.case_id || item?.referral_id || item?.id || `case_mock_${index + 1}`;
}

function getCreated(item) {
  const raw = item?.created_at || item?.createdAt || item?.created || null;
  if (!raw) return "—";

  try {
    return new Date(raw).toLocaleString();
  } catch {
    return String(raw);
  }
}

function getSender(item) {
  return item?.sender_name || item?.sending_organization_name || item?.sender || "Silicon Heartland Foundation";
}

function getReceiver(item) {
  return item?.receiver_name || item?.receiving_organization_name || item?.receiver || item?.receiving_organization_id || "—";
}

function getCategory(item) {
  return item?.need_category || item?.category || item?.needCategory || "—";
}

function getAssigned(item) {
  return item?.assigned_user_id || item?.assignedUserId || item?.assigned_to || item?.assignee || "Unassigned";
}

function statusLabel(status) {
  const s = normalizeStatus(status);
  if (s === "on_hold") return "ON_HOLD";
  if (s === "in_review") return "IN_REVIEW";
  if (s === "closed") return "CLOSED";
  if (s === "resolved") return "RESOLVED";
  if (s === "assigned") return "ASSIGNED";
  if (s === "open") return "OPEN";
  return String(status || "OPEN").toUpperCase();
}

function priorityLabel(priority) {
  const p = normalizePriority(priority);
  if (p === "high" || p === "urgent") return "HIGH PRIORITY";
  if (p === "medium") return "MEDIUM PRIORITY";
  if (p === "low") return "LOW PRIORITY";
  return `${String(priority || "medium").toUpperCase()} PRIORITY`;
}

function Sparkline({ tone = "blue" }) {
  return (
    <svg className={`paq-spark paq-spark--${tone}`} viewBox="0 0 100 36" aria-hidden="true">
      <polyline points="3,30 14,28 24,30 35,22 45,26 56,18 67,22 78,14 88,17 97,9" />
    </svg>
  );
}

function SummaryCard({ icon, label, value, chip, tone = "blue" }) {
  return (
    <article className="paq-kpi">
      <div className={`paq-kpiIcon paq-tone--${tone}`}>{icon}</div>
      <div>
        <h3>{label}</h3>
        <strong>{value}</strong>
        <span className={`paq-chip paq-chip--${tone}`}>{chip}</span>
      </div>
      <Sparkline tone={tone} />
    </article>
  );
}

function GuidanceRow({ icon, title, text, tone = "blue" }) {
  return (
    <div className="paq-guidanceRow">
      <div className={`paq-guideIcon paq-tone--${tone}`}>{icon}</div>
      <div>
        <strong>{title}</strong>
        <span>{text}</span>
      </div>
    </div>
  );
}

function ReferralMeta({ icon, label, value, dotTone }) {
  return (
    <div className="paq-metaRow">
      <span className="paq-metaIcon">{icon}</span>
      <small>{label}</small>
      <b>
        {dotTone ? <i className={`paq-dot paq-dot--${dotTone}`} /> : null}
        {value || "—"}
      </b>
    </div>
  );
}

function ReferralCard({ item, index }) {
  const status = normalizeStatus(item.status);
  const priority = normalizePriority(item.priority || item.urgency_level || item.urgency);
  const assigned = getAssigned(item);
  const isUnassigned = String(assigned).toLowerCase() === "unassigned";

  const statusTone =
    status === "on_hold" ? "gold" :
    status === "closed" || status === "resolved" ? "muted" :
    status === "assigned" || status === "in_review" ? "blue" :
    "violet";

  const priorityTone = priority === "high" || priority === "urgent" ? "green" : "gold";

  return (
    <article className="paq-referralCard">
      <header>
        <div>
          <h3>Referral</h3>
          <p>{getCaseId(item, index)}</p>
        </div>
        <span className={`paq-status paq-status--${statusTone}`}>{statusLabel(item.status)}</span>
      </header>

      <div className="paq-cardChips">
        <span className={`paq-chip paq-chip--${priorityTone}`}>{priorityLabel(item.priority || item.urgency_level || item.urgency)}</span>
        <span className={`paq-chip paq-chip--${isUnassigned ? "violet" : "green"}`}>
          {isUnassigned ? "UNASSIGNED" : "ASSIGNED"}
        </span>
      </div>

      <div className="paq-cardMeta">
        <ReferralMeta icon="⊙" label="Sender" value={getSender(item)} />
        <ReferralMeta icon="♙" label="Receiver" value={getReceiver(item)} />
        <ReferralMeta icon="◇" label="Need Category" value={getCategory(item)} />
        <ReferralMeta
          icon="◷"
          label="Urgency"
          value={item.urgency_level || item.urgency || item.priority || "medium"}
          dotTone={priority === "high" || priority === "urgent" ? "red" : "gold"}
        />
        <ReferralMeta icon="◴" label="Created" value={getCreated(item)} />
        <ReferralMeta icon="♙" label="Assigned" value={assigned} />
        <ReferralMeta icon="▤" label="Notes" value={item.notes || "—"} />
      </div>

      <footer>
        {isUnassigned ? <button type="button">Assign</button> : null}
        <button type="button">Start Review</button>
        {status === "on_hold" ? (
          <button className="is-gold" type="button">Release Hold</button>
        ) : null}
        {status !== "closed" && status !== "resolved" ? (
          <button className="is-gold" type="button">Hold</button>
        ) : null}
        <button className="is-green" type="button">Resolve</button>
        <button type="button">Close</button>
      </footer>
    </article>
  );
}

const MOCK_REFERRALS = [
  {
    id: "case_1dfc9e8d-1daf-43a8-b892-360cfe068620",
    status: "closed",
    priority: "high",
    sender_name: "Silicon Heartland Foundation",
    receiver_name: "—",
    need_category: "—",
    urgency_level: "high",
    created_at: "2026-04-15T16:20:38",
    assigned_user_id: "user_admin_001",
    notes: "—",
  },
  {
    id: "case_fdea72ed-ec6e-4eb5-96f9-1cdf84ca44cf",
    status: "on_hold",
    priority: "medium",
    sender_name: "Silicon Heartland Foundation",
    receiver_name: "Franklin County Workforce Partner",
    need_category: "workforce_training",
    urgency_level: "medium",
    created_at: "2026-04-15T22:35:08",
    assigned_user_id: "user_admin_001",
    notes: "—",
  },
  {
    id: "case_1302bd05-7c7e-4915-bf96-b1e8426a5a8e",
    status: "closed",
    priority: "medium",
    sender_name: "Silicon Heartland Foundation",
    receiver_name: "—",
    need_category: "—",
    urgency_level: "medium",
    created_at: "2026-04-15T18:30:29",
    assigned_user_id: "Unassigned",
    notes: "—",
  },
];


function AdaptiveQueueSignal({ adaptive }) {
  const score = adaptive.experienceScore || {};
  const topFeature = adaptive.featureUsageMap?.[0];
  const recommendation = adaptive.recommendations?.[0];

  return (
    <section className="paq-card paq-adaptiveCard">
      <h2>◇ Adaptive Queue Signal</h2>
      <p>Learning how operators act on referrals and queue guidance.</p>

      <div className="paq-adaptiveScore">
        <span>Experience</span>
        <strong>{score.score || 0}</strong>
        <b>{score.grade || "No Data"}</b>
      </div>

      <div className="paq-adaptiveRows">
        <div>
          <small>Events</small>
          <strong>{adaptive.summary?.totalEvents || 0}</strong>
        </div>
        <div>
          <small>Top Action</small>
          <strong>{topFeature?.target || "Collecting data"}</strong>
        </div>
        <div>
          <small>Friction</small>
          <strong>{adaptive.frictionSignals?.length || 0}</strong>
        </div>
      </div>

      <div className="paq-adaptiveMemo">
        <small>Next-Version Recommendation</small>
        <p>{recommendation?.recommendation || "Continue collecting queue behavior before changing the layout."}</p>
      </div>
    </section>
  );
}

export default function PartnerActionQueue() {
  const { items = [], loading, error, refetch } = useReferrals();
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");

  const adaptive = useAdaptiveExperience({
    surface: ADAPTIVE_SURFACES.HUB_ACTION_QUEUE || "hub_action_queue",
    role: ADAPTIVE_ROLES.HUB_OPERATOR,
    dashboardVersion: "hub_action_queue_v1",
  });

  useEffect(() => {
    adaptive.track({
      eventType: ADAPTIVE_EVENT_TYPES.PAGE_VIEWED,
      target: "partner_action_queue",
    });

    adaptive.track({
      eventType: ADAPTIVE_EVENT_TYPES.RECOMMENDATION_VIEWED,
      target: "queue_guidance_panel",
      metadata: {
        guidance: "review_assign_unassigned_referrals",
      },
    });
  }, []);

  function trackQueueButton(target, eventType = ADAPTIVE_EVENT_TYPES.BUTTON_CLICKED, metadata = {}) {
    adaptive.track({
      eventType,
      target,
      metadata,
    });
  }

  function handleQueueClickCapture(event) {
    const referralCard = event.target.closest?.(".paq-referralCard");
    const button = event.target.closest?.("button");
    const card = event.target.closest?.(".paq-card, .paq-kpi");

    if (button) {
      const label = button.innerText?.trim() || "queue_button";
      const normalized = label.toLowerCase();

      let eventType = ADAPTIVE_EVENT_TYPES.BUTTON_CLICKED;

      if (
        normalized.includes("assign") ||
        normalized.includes("start review") ||
        normalized.includes("release hold") ||
        normalized.includes("resolve") ||
        normalized.includes("close")
      ) {
        eventType = ADAPTIVE_EVENT_TYPES.RECOMMENDATION_ACCEPTED;
      }

      if (normalized === "hold" || normalized.includes("previous") || normalized.includes("next")) {
        eventType = ADAPTIVE_EVENT_TYPES.RECOMMENDATION_IGNORED;
      }

      adaptive.track({
        eventType,
        target: `queue_button_${label.replace(/\s+/g, "_").toLowerCase()}`.slice(0, 100),
        metadata: {
          buttonLabel: label,
        },
      });

      return;
    }

    if (referralCard) {
      adaptive.track({
        eventType: ADAPTIVE_EVENT_TYPES.CARD_CLICKED,
        target:
          referralCard.querySelector("p")?.innerText?.trim()?.slice(0, 100) ||
          "referral_card",
      });
      return;
    }

    if (card) {
      adaptive.track({
        eventType: ADAPTIVE_EVENT_TYPES.CARD_CLICKED,
        target:
          card.querySelector("h2, h3")?.innerText?.trim()?.slice(0, 100) ||
          "queue_card",
      });
    }
  }useEffect(() => {
    adaptive.track({
      eventType: ADAPTIVE_EVENT_TYPES.PAGE_VIEWED,
      target: "partner_action_queue",
    });

    adaptive.track({
      eventType: ADAPTIVE_EVENT_TYPES.RECOMMENDATION_VIEWED,
      target: "queue_guidance_panel",
      metadata: {
        guidance: "review_assign_unassigned_referrals",
      },
    });
  }, []);

  function trackQueueButton(target, eventType = ADAPTIVE_EVENT_TYPES.BUTTON_CLICKED, metadata = {}) {
    adaptive.track({
      eventType,
      target,
      metadata,
    });
  }

  function handleQueueClickCapture(event) {
    const referralCard = event.target.closest?.(".paq-referralCard");
    const button = event.target.closest?.("button");
    const card = event.target.closest?.(".paq-card, .paq-kpi");

    if (button) {
      const label = button.innerText?.trim() || "queue_button";
      const normalized = label.toLowerCase();

      let eventType = ADAPTIVE_EVENT_TYPES.BUTTON_CLICKED;

      if (
        normalized.includes("assign") ||
        normalized.includes("start review") ||
        normalized.includes("release hold") ||
        normalized.includes("resolve") ||
        normalized.includes("close")
      ) {
        eventType = ADAPTIVE_EVENT_TYPES.RECOMMENDATION_ACCEPTED;
      }

      if (normalized === "hold" || normalized.includes("previous") || normalized.includes("next")) {
        eventType = ADAPTIVE_EVENT_TYPES.RECOMMENDATION_IGNORED;
      }

      adaptive.track({
        eventType,
        target: `queue_button_${label.replace(/\s+/g, "_").toLowerCase()}`.slice(0, 100),
        metadata: {
          buttonLabel: label,
        },
      });

      return;
    }

    if (referralCard) {
      adaptive.track({
        eventType: ADAPTIVE_EVENT_TYPES.CARD_CLICKED,
        target:
          referralCard.querySelector("p")?.innerText?.trim()?.slice(0, 100) ||
          "referral_card",
      });
      return;
    }

    if (card) {
      adaptive.track({
        eventType: ADAPTIVE_EVENT_TYPES.CARD_CLICKED,
        target:
          card.querySelector("h2, h3")?.innerText?.trim()?.slice(0, 100) ||
          "queue_card",
      });
    }
  }

  const referrals = items.length ? items : MOCK_REFERRALS;

  const counts = useMemo(() => {
    const open = referrals.filter((item) => normalizeStatus(item.status) === "open").length;
    const assigned = referrals.filter((item) => normalizeStatus(item.status) === "assigned").length;
    const inReview = referrals.filter((item) => normalizeStatus(item.status) === "in_review").length;
    const completed = referrals.filter((item) =>
      ["closed", "resolved", "completed"].includes(normalizeStatus(item.status))
    ).length;
    const highPriority = referrals.filter((item) =>
      ["high", "urgent"].includes(normalizePriority(item.priority || item.urgency_level || item.urgency))
    ).length;
    const unassigned = referrals.filter((item) => String(getAssigned(item)).toLowerCase() === "unassigned").length;

    return { open, assigned, inReview, completed, highPriority, unassigned };
  }, [referrals]);

  const visibleReferrals = useMemo(() => {
    let next = [...referrals];

    if (filter === "high") {
      next = next.filter((item) =>
        ["high", "urgent"].includes(normalizePriority(item.priority || item.urgency_level || item.urgency))
      );
    }

    if (filter === "unassigned") {
      next = next.filter((item) => String(getAssigned(item)).toLowerCase() === "unassigned");
    }

    if (filter === "on_hold") {
      next = next.filter((item) => normalizeStatus(item.status) === "on_hold");
    }

    if (sort === "newest") {
      next.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }

    return next.slice(0, 3);
  }, [referrals, filter, sort]);

  return (
    <main className="paq-shell" onClickCapture={handleQueueClickCapture}>
      <aside className="paq-rail">
        <button className="paq-logo" type="button" onClick={openShsHome}>
        <img
          src="/assets/hub/shs-hub-logo.png"
          alt="Silicon Heartland Hub"
        />
        </button>

        <nav className="paq-nav">
          <button type="button" onClick={openShsHome}>
            <span>⌂</span>
            <small>Overview</small>
          </button>
          <button type="button" onClick={() => go("/hub/network")}>
            <span>👥</span>
            <small>Partners</small>
          </button>
          <button type="button" onClick={() => go("/hub/lifecycle")}>
            <span>⇄</span>
            <small>Referrals</small>
          </button>
          <button type="button" onClick={() => go("/hub/intake")}>
            <span>▤</span>
            <small>Intake</small>
          </button>
          <button className="is-active" type="button">
            <span>☑</span>
            <small>Action Queue</small>
          </button>
          <button type="button" onClick={() => go("/hub/reports")}>
            <span>▥</span>
            <small>Reports</small>
          </button>
        </nav>

        <section className="paq-readiness">
          <strong>REPORTING READINESS</strong>
          <div>87%</div>
          <span>On track</span>
          <small>
            FY24 Q2
            <br />
            Report
            <br />
            Due in 18 days
          </small>
        </section>
      </aside>

      <section className="paq-page">
        <header className="paq-header">
          <div>
            <p>SHS HUB COLLABORATION LAYER</p>
            <h1>Partner Action Queue</h1>
            <span>Live referral action surface for assignments, reviews, holds, resolutions, and closures.</span>
          </div>

          <div className="paq-actions">
            <button type="button" onClick={openShsHome}>← Back to Hub</button>
            <button type="button" onClick={() => refetch?.()}>↻ Refresh</button>
            <button type="button" onClick={() => go("/hub/reports")}>▤ Queue Brief</button>
          </div>
        </header>

        {error ? (
          <div className="paq-error">
            Queue API notice: {String(error)}
          </div>
        ) : null}

        <section className="paq-kpiStrip">
          <SummaryCard icon="▣" label="Open" value={loading ? "…" : counts.open} chip="Stable" tone="blue" />
          <SummaryCard icon="👥" label="Assigned" value={loading ? "…" : counts.assigned} chip="Stable" tone="blue" />
          <SummaryCard icon="🛡" label="In Review" value={loading ? "…" : counts.inReview} chip="Stable" tone="blue" />
          <SummaryCard icon="⚑" label="High Priority" value={loading ? "…" : counts.highPriority} chip="Attention" tone="gold" />
          <SummaryCard icon="♙" label="Unassigned" value={loading ? "…" : counts.unassigned} chip="Needs Action" tone="violet" />
          <SummaryCard icon="✓" label="Completed" value={loading ? "…" : counts.completed} chip="Resolved" tone="green" />
        </section>

        <section className="paq-workGrid">
          <article className="paq-queuePanel">
            <div className="paq-panelHead">

      <HubSignalSenderPanel />

<div>
                <h2>◌ Live Referral Queue</h2>
                <p>Real-time view of referral action items requiring attention.</p>
              </div>

              <div className="paq-controls">
                <select value={filter} onChange={(event) => {
                  setFilter(event.target.value);
                  trackQueueButton("queue_filter_changed", ADAPTIVE_EVENT_TYPES.BUTTON_CLICKED, { filter: event.target.value });
                }}>
                  <option value="all">Filter</option>
                  <option value="high">High Priority</option>
                  <option value="unassigned">Unassigned</option>
                  <option value="on_hold">On Hold</option>
                </select>

                <select value={sort} onChange={(event) => {
                  setSort(event.target.value);
                  trackQueueButton("queue_sort_changed", ADAPTIVE_EVENT_TYPES.BUTTON_CLICKED, { sort: event.target.value });
                }}>
                  <option value="newest">Sort: Newest</option>
                  <option value="oldest">Sort: Oldest</option>
                </select>
              </div>
            </div>

            <div className="paq-referralGrid">
              {visibleReferrals.map((item, index) => (
                <ReferralCard key={getCaseId(item, index)} item={item} index={index} />
              ))}
            </div>

            <footer className="paq-queueFoot">
              <span>Showing 1 to {visibleReferrals.length} of {referrals.length} referrals</span>
              <div>
                <button disabled type="button">Previous</button>
                <button className="is-current" type="button">1</button>
                <button disabled type="button">Next</button>
              </div>
            </footer>
          </article>

          <aside className="paq-sidePanel">
            <AdaptiveQueueSignal adaptive={adaptive} />
            <section className="paq-card">
              <h2>◎ Queue Guidance</h2>
              <p>Recommended focus and risk signals.</p>

              <GuidanceRow icon="▶" tone="green" title="Next Action" text="Review or assign 1 unassigned referral." />
              <GuidanceRow icon="△" tone="gold" title="Risk Signal" text="1 high priority item requires attention." />
              <GuidanceRow icon="👥" tone="blue" title="Ownership Gap" text="1 referral is unassigned." />
              <GuidanceRow icon="🛡" tone="orange" title="Escalation Note" text="1 item is on hold and needs resolution." />
            </section>

            <section className="paq-card">
              <h2>◎ Action Focus</h2>
              <p>Key indicators for today.</p>

              <div className="paq-focusGrid">
                <div>
                  <small>⚑ High Priority</small>
                  <strong>{counts.highPriority}</strong>
                  <span>Requires attention</span>
                </div>
                <div>
                  <small>♙ Unassigned</small>
                  <strong>{counts.unassigned}</strong>
                  <span>Needs assignment</span>
                </div>
                <div>
                  <small>✓ Completed Today</small>
                  <strong>{counts.completed}</strong>
                  <span>Resolved</span>
                </div>
              </div>
            </section>

            <section className="paq-card">
              <div className="paq-cardTitleRow">
                <div>
                  <h2>☷ Recent Queue Activity</h2>
                  <p>Latest actions across the queue.</p>
                </div>
                <button type="button">View All →</button>
              </div>

              <div className="paq-activityList">
                <div>
                  <b className="gold">Ⅱ</b>
                  <strong>Referral placed on hold</strong>
                  <small>case_fdea72ed-ec6e-4eb5-96f9-1cdf84ca44cf</small>
                  <time>10:35 PM</time>
                </div>
                <div>
                  <b className="violet">♙</b>
                  <strong>Referral assigned</strong>
                  <small>case_1302bd05-7c7e-4915-bf96-b1e8426a5a8e</small>
                  <time>9:14 PM</time>
                </div>
                <div>
                  <b className="green">✓</b>
                  <strong>Referral resolved</strong>
                  <small>case_1dfc9e8d-1daf-43a8-b892-360cfe068620</small>
                  <time>8:02 PM</time>
                </div>
              </div>

              <button className="paq-viewActivity" type="button">View All Activity →</button>
            </section>
          </aside>
        </section>
      </section>
    </main>
  );
}
