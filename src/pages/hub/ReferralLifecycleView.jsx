import React, { useEffect, useMemo, useState } from "react";
import useReferrals from "@/lib/hub/useReferrals";
import {
  getTruthSpineRecords,
  getTruthSpineSnapshot,
  verifyTruthSpineRecord,
  forceVerifyTruthSpineRecord,
  markTruthSpineRecordVerified,
} from "@/shared/truth-spine";
import "./referral-tracker-shs.css";
import HubBusinessTourProvider from "./shared/HubBusinessTourProvider.jsx";
import { useAdaptiveExperience } from "@/system/adaptive-experience/useAdaptiveExperience";
import {
  ADAPTIVE_EVENT_TYPES,
  ADAPTIVE_ROLES,
  ADAPTIVE_SURFACES,
} from "@/system/adaptive-experience/adaptiveEvent.types";



const SHS_HOME_URL = "/admin.html#/hub";
const TRUTH_SPINE_RECORDS_KEY = "shs_truth_spine_records_v1";
const TRUTH_SPINE_EVENTS_KEY = "shs_truth_spine_events_v1";

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

function getTruthEntityId(item, index) {
  return item?.truthEntityId || item?.referral_id || item?.entityId || getCaseId(item, index);
}

function hardVerifyTruthSpineRecord(candidateId) {
  if (typeof window === "undefined") return null;

  const wanted = String(candidateId || "").trim();
  if (!wanted) return null;

  const records = JSON.parse(window.localStorage.getItem(TRUTH_SPINE_RECORDS_KEY) || "[]");

  let matchedEntityId = wanted;

  const nextRecords = records.map((record) => {
    const raw = record?.raw || {};
    const candidates = [
      record?.entityId,
      record?.id,
      raw?.id,
      raw?.case_id,
      raw?.referral_id,
      raw?.truthEntityId,
      raw?.sourceId,
    ].filter(Boolean).map(String);

    if (!candidates.includes(wanted)) return record;

    matchedEntityId = record.entityId || wanted;

    return {
      ...record,
      verification: {
        ...(record.verification || {}),
        verificationStatus: "verified",
        evidenceCount: Math.max(Number(record?.verification?.evidenceCount || 0), 1),
        evidenceStrength: "high",
        verifiedBy: "demo-user-1",
        verifiedAt: new Date().toISOString(),
      },
      reconciliation: {
        ...(record.reconciliation || {}),
        contradictionStatus: "none",
        conflictCount: 0,
        resolutionStatus: "not_required",
      },
      oracle: {
        ...(record.oracle || {}),
        truthStatus: "verified_true",
        confidenceScore: 88,
        confidenceBand: "high",
        readinessStatus: "report_ready",
        recommendedNextAction: "Generate report or audit packet.",
      },
      trustEnvelope: {
        ...(record.trustEnvelope || record.truthEnvelope || {}),
        auditReady: true,
        reportingReady: true,
        sourceCoverage: "complete",
      },
    };
  });

  window.localStorage.setItem(TRUTH_SPINE_RECORDS_KEY, JSON.stringify(nextRecords));

  const events = JSON.parse(window.localStorage.getItem(TRUTH_SPINE_EVENTS_KEY) || "[]");
  events.unshift({
    id: `verify_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    eventType: "verification.record.approved",
    entityId: matchedEntityId,
    entityType: "referral",
    sourceSurface: "referral_lifecycle_tracker",
    actorId: "demo-user-1",
    actorRole: "hub_operator",
    organizationId: "shf-core",
    timestamp: new Date().toISOString(),
    payload: {
      verificationStatus: "verified",
      readinessStatus: "report_ready",
      truthStatus: "verified_true",
    },
  });
  window.localStorage.setItem(TRUTH_SPINE_EVENTS_KEY, JSON.stringify(events.slice(0, 500)));

  window.dispatchEvent(new CustomEvent("shs:truth-spine-record-updated", {
    detail: { entityId: matchedEntityId, verificationStatus: "verified" },
  }));

  window.dispatchEvent(new CustomEvent("shs:truth-spine-event", {
    detail: { entityId: matchedEntityId, eventType: "verification.record.approved" },
  }));

  return matchedEntityId;
}

function resolveTruthSpineEntityId(candidateId) {
  const wanted = String(candidateId || "").trim();

  if (!wanted) return "";

  try {
    const records = getTruthSpineRecords();

    const match = records.find((record) => {
      const raw = record?.raw || {};

      return [
        record?.entityId,
        record?.id,
        raw?.id,
        raw?.case_id,
        raw?.referral_id,
        raw?.truthEntityId,
        raw?.sourceId,
      ]
        .filter(Boolean)
        .map(String)
        .includes(wanted);
    });

    return match?.entityId || wanted;
  } catch (error) {
    console.warn("[Truth Spine] Could not resolve entity id", error);
    return wanted;
  }
}

function resolveTruthSpineEntityFromReferral(itemOrId, index = 0) {
  if (typeof itemOrId === "string") {
    return resolveTruthSpineEntityId(itemOrId);
  }

  const item = itemOrId || {};
  const raw = item.raw || {};

  const candidates = [
    item.entityId,
    item.truthEntityId,
    item.referral_id,
    item.case_id,
    item.id,
    raw.entityId,
    raw.truthEntityId,
    raw.referral_id,
    raw.case_id,
    raw.id,
    getTruthEntityId(item, index),
    getCaseId(item, index),
  ].filter(Boolean).map(String);

  try {
    const records = getTruthSpineRecords();

    const match = records.find((record) => {
      const recordRaw = record?.raw || {};

      const recordCandidates = [
        record?.entityId,
        record?.id,
        recordRaw?.id,
        recordRaw?.case_id,
        recordRaw?.referral_id,
        recordRaw?.truthEntityId,
        recordRaw?.sourceId,
      ].filter(Boolean).map(String);

      return candidates.some((candidate) => recordCandidates.includes(candidate));
    });

    return match?.entityId || candidates[0] || "";
  } catch (error) {
    console.warn("[Truth Spine] Could not resolve referral entity", error);
    return candidates[0] || "";
  }
}

function getAllReferralCandidateIds(itemOrId, index = 0, resolvedEntityId = "") {
  if (typeof itemOrId === "string") {
    return [itemOrId, resolvedEntityId].filter(Boolean);
  }

  const item = itemOrId || {};
  const raw = item.raw || {};

  return [
    resolvedEntityId,
    item.entityId,
    item.truthEntityId,
    item.referral_id,
    item.case_id,
    item.id,
    raw.entityId,
    raw.truthEntityId,
    raw.referral_id,
    raw.case_id,
    raw.id,
    getTruthEntityId(item, index),
    getCaseId(item, index),
  ].filter(Boolean).map(String);
}

function isTruthRecordVerified(item) {
  return (
    item?.verification?.verificationStatus === "verified" ||
    item?.truthEnvelope?.reportingReady === true ||
    item?.oracle?.readinessStatus === "report_ready"
  );
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

function getReceiver(item) {
  return item?.receiver_name || item?.receiving_organization_name || item?.receiver || item?.receiving_organization_id || "—";
}

function getCategory(item) {
  return item?.need_category || item?.category || item?.needCategory || "—";
}

function getAssigned(item) {
  return item?.assigned_user_id || item?.assignedUserId || item?.assigned_to || item?.assignee || "Unassigned";
}

function priorityLabel(value) {
  const p = normalizePriority(value);
  if (p === "high" || p === "urgent") return "HIGH PRIORITY";
  if (p === "medium") return "MEDIUM PRIORITY";
  if (p === "low") return "LOW PRIORITY";
  return `${String(value || "medium").toUpperCase()} PRIORITY`;
}

function Sparkline({ tone = "blue" }) {
  return (
    <svg className={`rt-spark rt-spark--${tone}`} viewBox="0 0 100 36" aria-hidden="true">
      <polyline points="3,30 14,28 24,26 35,20 45,22 56,16 67,18 78,11 88,13 97,6" />
    </svg>
  );
}

function SummaryCard({ icon, label, value, chip, note, tone = "blue" }) {
  return (
    <article className="rt-kpi">
      <div className={`rt-kpiIcon rt-tone--${tone}`}>{icon}</div>
      <div>
        <h3>{label}</h3>
        <strong>{value}</strong>
        <span className={`rt-chip rt-chip--${tone}`}>{chip}</span>
        <p>{note}</p>
      </div>
      <Sparkline tone={tone} />
    </article>
  );
}

function EmptyStage() {
  return (
    <div className="rt-emptyStage">
      <div>▱</div>
      <p>No referrals in<br />this stage.</p>
    </div>
  );
}

function StageReferralCard({ item, index, compact = false, onVerifyForReport }) {
  const priority = normalizePriority(item.priority || item.urgency_level || item.urgency);
  const priorityTone = priority === "high" || priority === "urgent" ? "red" : "gold";
  const assigned = getAssigned(item);
  const assignedTone = String(assigned).toLowerCase() === "unassigned" ? "violet" : "green";
  const caseId = getCaseId(item, index);
  const truthEntityId = getTruthEntityId(item, index);
  const verifiedForReport = isTruthRecordVerified(item);
  const urgencyValue = item.urgency_level || item.urgency || item.priority || "medium";

  return (
    <article
      data-tour="hub-lifecycle-referral-card"
      className={`rt-stageReferral ${compact ? "is-compact" : ""} ${verifiedForReport ? "is-report-ready" : ""}`}
      tabIndex={0}
      aria-label={`Referral preview for ${caseId}`}
    >
      <header>
        <strong>{caseId}</strong>
        <i />
      </header>

      <div className="rt-cardChips">
        <span className={`rt-chip rt-chip--${priorityTone}`}>{priorityLabel(item.priority || urgencyValue)}</span>
        <span className={`rt-chip rt-chip--${assignedTone}`}>
          {String(assigned).toLowerCase() === "unassigned" ? "UNASSIGNED" : "ASSIGNED"}
        </span>
        {verifiedForReport && (
          <span className="rt-chip rt-chip--reportReady">REPORT READY</span>
        )}
      </div>

      <dl>
        <dt>Receiver</dt>
        <dd>{getReceiver(item)}</dd>

        <dt>Need Category</dt>
        <dd>{getCategory(item)}</dd>

        <dt>Urgency</dt>
        <dd>
          <b className={`rt-dot rt-dot--${priorityTone}`} />
          {urgencyValue}
        </dd>

        <dt>Created</dt>
        <dd>{getCreated(item)}</dd>

        <dt>Assigned</dt>
        <dd>{assigned}</dd>
      </dl>

      <button type="button">View details →</button>
      <button
        type="button"
        className={`rt-verifyButton ${verifiedForReport ? "is-verified" : ""}`}
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onVerifyForReport?.(item, index);
        }}
        disabled={verifiedForReport}
        title={verifiedForReport ? "Already verified for report" : "Verify this referral for reporting readiness"}
      >
        {verifiedForReport ? "Verified ✓" : "Verify for Report"}
      </button>

      <div className="rt-hoverPreview" aria-hidden="true">
        <div className="rt-hoverPreviewTop">
          <span className={`rt-chip rt-chip--${priorityTone}`}>{priorityLabel(item.priority || urgencyValue)}</span>
          <span className={`rt-chip rt-chip--${assignedTone}`}>
            {String(assigned).toLowerCase() === "unassigned" ? "UNASSIGNED" : "ASSIGNED"}
          </span>
        </div>

        <h4>Referral Preview</h4>
        <p>{caseId}</p>

        <dl>
          <dt>Receiver</dt>
          <dd>{getReceiver(item)}</dd>

          <dt>Need Category</dt>
          <dd>{getCategory(item)}</dd>

          <dt>Urgency</dt>
          <dd>
            <b className={`rt-dot rt-dot--${priorityTone}`} />
            {urgencyValue}
          </dd>

          <dt>Created</dt>
          <dd>{getCreated(item)}</dd>

          <dt>Assigned</dt>
          <dd>{assigned}</dd>

          <dt>Notes</dt>
          <dd>{item.notes || "No notes entered."}</dd>
        </dl>

        <button type="button">Open full referral →</button>
      </div>
    </article>
  );
}

function StageColumn({ title, count, children, tone = "blue" }) {
  return (
    <section className={`rt-stage rt-stage--${tone}`} data-tour="hub-lifecycle-stage">
      <header>
        <h3>{title}</h3>
        <span>{count}</span>
      </header>
      <div className="rt-stageBody">
        {children}
      </div>
    </section>
  );
}

function GuidanceRow({ icon, title, text, tone = "blue" }) {
  return (
    <div className="rt-guidanceRow">
      <div className={`rt-guideIcon rt-tone--${tone}`}>{icon}</div>
      <div>
        <strong>{title}</strong>
        <span>{text}</span>
      </div>
    </div>
  );
}

const MOCK_REFERRALS = [
  {
    id: "case_fdea72ed-ec6e-4eb5-96f9-1cdf84ca44cf",
    status: "on_hold",
    priority: "medium",
    receiver_name: "Franklin County Workforce Partner",
    need_category: "workforce_training",
    urgency_level: "medium",
    created_at: "2026-04-15T22:35:08",
    assigned_user_id: "user_admin_001",
  },
  {
    id: "case_1dfc9e8d-1daf-43a8-b892-360cfe068620",
    status: "closed",
    priority: "high",
    receiver_name: "—",
    need_category: "—",
    urgency_level: "high",
    created_at: "2026-04-15T16:20:38",
    assigned_user_id: "user_admin_001",
  },
  {
    id: "case_1302bd05-7c7e-4915-bf96-b1e8426a5a8e",
    status: "closed",
    priority: "medium",
    receiver_name: "—",
    need_category: "—",
    urgency_level: "medium",
    created_at: "2026-04-15T18:30:29",
    assigned_user_id: "Unassigned",
  },
];

function truthRecordToLifecycleReferral(record = {}) {
  const raw = record.raw || {};
  const entityId = record.entityId || raw.case_id || raw.id || `truth_record_${Date.now()}`;

  return {
    id: raw.case_id || raw.id || entityId,
    case_id: raw.case_id || raw.id || entityId,
    referral_id: entityId,
    truthEntityId: entityId,
    entityId,
    status: record.currentStatus || raw.status || "open",
    priority: raw.priority || raw.urgency_level || raw.urgency || "medium",
    receiver_name:
      raw.receiver ||
      raw.receiver_name ||
      raw.receiving_organization_name ||
      raw.receiving_organization_id ||
      record.partnerId ||
      "—",
    need_category:
      raw.needCategory ||
      raw.need_category ||
      record.title ||
      "—",
    urgency_level:
      raw.urgency ||
      raw.urgency_level ||
      raw.priority ||
      "medium",
    created_at:
      raw.created_at ||
      raw.createdAt ||
      record.createdAt ||
      new Date().toISOString(),
    assigned_user_id:
      raw.assigned ||
      raw.assigned_user_id ||
      raw.assignedUserId ||
      "Unassigned",
    notes: raw.notes || record.summary || "",
    truthEnvelope: record.trustEnvelope,
    verification: record.verification,
    reconciliation: record.reconciliation,
    oracle: record.oracle,
    sourceSurface: record.sourceSurface,
  };
}

function mergeLifecycleReferralStreams(primary = [], truthItems = []) {
  const byId = new Map();

  [...primary, ...truthItems].forEach((item, index) => {
    const id = getCaseId(item, index);
    if (!id) return;

    const existing = byId.get(id) || {};
    byId.set(id, {
      ...existing,
      ...item,
    });
  });

  return Array.from(byId.values());
}


function AdaptiveLifecycleSignal({ adaptive }) {
  const score = adaptive.experienceScore || {};
  const topFeature = adaptive.featureUsageMap?.[0];
  const recommendation = adaptive.recommendations?.[0];

  return (
    <section className="rt-card rt-adaptiveCard" data-tour="hub-lifecycle-adaptive">
      <h2>◇ Adaptive Lifecycle Signal</h2>
      <p>Learning where referral flow slows down and which stages operators inspect most.</p>

      <div className="rt-adaptiveScore">
        <span>Experience</span>
        <strong>{score.score || 0}</strong>
        <b>{score.grade || "No Data"}</b>
      </div>

      <div className="rt-adaptiveRows">
        <div>
          <small>Events</small>
          <strong>{adaptive.summary?.totalEvents || 0}</strong>
        </div>
        <div>
          <small>Top Focus</small>
          <strong>{topFeature?.target || "Collecting data"}</strong>
        </div>
        <div>
          <small>Friction</small>
          <strong>{adaptive.frictionSignals?.length || 0}</strong>
        </div>
      </div>

      <div className="rt-adaptiveMemo">
        <small>Next-Version Recommendation</small>
        <p>{recommendation?.recommendation || "Continue collecting lifecycle behavior before changing the workflow."}</p>
      </div>
    </section>
  );
}

export default function ReferralLifecycleView() {
  const { items = [], loading, error } = useReferrals();
  const [viewMode, setViewMode] = useState("board");

  const adaptive = useAdaptiveExperience({
    surface: ADAPTIVE_SURFACES.HUB_REFERRAL_LIFECYCLE || "hub_referral_lifecycle",
    role: ADAPTIVE_ROLES.HUB_OPERATOR,
    dashboardVersion: "hub_referral_lifecycle_v1",
  });

  useEffect(() => {
    adaptive.track({
      eventType: ADAPTIVE_EVENT_TYPES.PAGE_VIEWED,
      target: "referral_lifecycle_tracker",
    });

    adaptive.track({
      eventType: ADAPTIVE_EVENT_TYPES.RECOMMENDATION_VIEWED,
      target: "lifecycle_guidance_panel",
      metadata: {
        guidance: "review_on_hold_and_high_priority_referrals",
      },
    });
  }, []);

  function trackLifecycleEvent(target, eventType = ADAPTIVE_EVENT_TYPES.BUTTON_CLICKED, metadata = {}) {
    adaptive.track({
      eventType,
      target,
      metadata,
    });
  }

  function handleLifecycleClickCapture(event) {
    const referralCard = event.target.closest?.(".rt-stageReferral");
    const stageColumn = event.target.closest?.(".rt-stage");
    const button = event.target.closest?.("button");
    const card = event.target.closest?.(".rt-card, .rt-kpi");

    if (button) {
      const label = button.innerText?.trim() || "lifecycle_button";
      const normalized = label.toLowerCase();

      let eventType = ADAPTIVE_EVENT_TYPES.BUTTON_CLICKED;

      if (
        normalized.includes("view details") ||
        normalized.includes("open full referral") ||
        normalized.includes("view full guidance") ||
        normalized.includes("view pressure")
      ) {
        eventType = ADAPTIVE_EVENT_TYPES.RECOMMENDATION_ACCEPTED;
      }

      if (normalized.includes("export") || normalized.includes("brief")) {
        eventType = ADAPTIVE_EVENT_TYPES.REPORT_EXPORTED;
      }

      adaptive.track({
        eventType,
        target: `lifecycle_button_${label.replace(/\s+/g, "_").toLowerCase()}`.slice(0, 100),
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
          referralCard.querySelector("strong")?.innerText?.trim()?.slice(0, 100) ||
          "lifecycle_referral_card",
      });
      return;
    }

    if (stageColumn) {
      adaptive.track({
        eventType: ADAPTIVE_EVENT_TYPES.CARD_CLICKED,
        target:
          stageColumn.querySelector("h3")?.innerText?.trim()?.slice(0, 100) ||
          "lifecycle_stage_column",
      });
      return;
    }

    if (card) {
      adaptive.track({
        eventType: ADAPTIVE_EVENT_TYPES.CARD_CLICKED,
        target:
          card.querySelector("h2, h3")?.innerText?.trim()?.slice(0, 100) ||
          "lifecycle_card",
      });
    }
  }

  const [truthSpineVersion, setTruthSpineVersion] = useState(0);
  const [truthEngineSnapshot, setTruthEngineSnapshot] = useState(null);
  const [truthEngineStatus, setTruthEngineStatus] = useState("loading");
  const [verifiedEntityIds, setVerifiedEntityIds] = useState(() => new Set());
  const [verifyNotice, setVerifyNotice] = useState("");

  useEffect(() => {
    const refreshTruthSpine = () => setTruthSpineVersion((value) => value + 1);

    window.addEventListener("shs:truth-spine-record-updated", refreshTruthSpine);
    window.addEventListener("shs:truth-spine-event", refreshTruthSpine);
    window.addEventListener("shs:partner-action-queue-truth-updated", refreshTruthSpine);

    return () => {
      window.removeEventListener("shs:truth-spine-record-updated", refreshTruthSpine);
      window.removeEventListener("shs:truth-spine-event", refreshTruthSpine);
      window.removeEventListener("shs:partner-action-queue-truth-updated", refreshTruthSpine);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadTruthEngineSnapshot() {
      try {
        const snapshot = await getTruthSpineSnapshot();

        if (!cancelled) {
          setTruthEngineSnapshot(snapshot);
          setTruthEngineStatus("connected");
        }
      } catch (error) {
        console.warn("[Truth Spine Engine] Referral Tracker snapshot failed", error);

        if (!cancelled) {
          setTruthEngineSnapshot(null);
          setTruthEngineStatus("fallback");
        }
      }
    }

    loadTruthEngineSnapshot();

    return () => {
      cancelled = true;
    };
  }, [truthSpineVersion]);

  const truthSpineReferrals = useMemo(() => {
    truthSpineVersion;
    try {
      const records = truthEngineSnapshot?.records || getTruthSpineRecords();
      return records.map(truthRecordToLifecycleReferral);
    } catch (error) {
      console.warn("[Truth Spine Engine] Lifecycle read failed", error);
      return [];
    }
  }, [truthSpineVersion, truthEngineSnapshot]);

  const sourceReferrals = items.length ? items : MOCK_REFERRALS;
  const referrals = mergeLifecycleReferralStreams(sourceReferrals, truthSpineReferrals).map((item, index) => {
    const entityId = getTruthEntityId(item, index);

    if (!verifiedEntityIds.has(entityId)) return item;

    return {
      ...item,
      verification: {
        ...(item.verification || {}),
        verificationStatus: "verified",
      },
      oracle: {
        ...(item.oracle || {}),
        readinessStatus: "report_ready",
        truthStatus: "verified_true",
      },
      trustEnvelope: {
        ...(item.trustEnvelope || item.truthEnvelope || {}),
        reportingReady: true,
        auditReady: true,
      },
    };
  });

  function handleVerifyForReport(itemOrId, index = 0) {
    const resolvedEntityId = resolveTruthSpineEntityFromReferral(itemOrId, index);

    if (!resolvedEntityId) {
      setVerifyNotice("Could not find a Truth Spine record for this referral.");
      return;
    }

    const candidateIds = getAllReferralCandidateIds(itemOrId, index, resolvedEntityId);

    try {
      hardVerifyTruthSpineRecord(resolvedEntityId);
    } catch (error) {
      console.warn("[Truth Spine] Hard verify failed", error);
    }

    setVerifiedEntityIds((current) => {
      const next = new Set(current);
      candidateIds.forEach((id) => next.add(id));
      return next;
    });

    setVerifyNotice(`${resolvedEntityId} verified for report.`);

    window.clearTimeout(window.__rtlVerifyNotice);
    window.__rtlVerifyNotice = window.setTimeout(() => {
      setVerifyNotice("");
    }, 3500);

    try {
      markTruthSpineRecordVerified(resolvedEntityId, {
        sourceSurface: "referral_lifecycle_tracker",
        actorId: "demo-user-1",
        actorRole: "hub_operator",
      });
    } catch (error) {
      console.warn("[Truth Spine] Legacy verify fallback failed after hard patch", error);
    }

    setTruthSpineVersion((value) => value + 1);
  }


  const grouped = useMemo(() => {
    const buckets = {
      open: [],
      assigned: [],
      in_review: [],
      on_hold: [],
      resolved: [],
      closed: [],
    };

    referrals.forEach((item) => {
      const status = normalizeStatus(item.status);
      if (status === "in_review") buckets.in_review.push(item);
      else if (status === "on_hold") buckets.on_hold.push(item);
      else if (status === "resolved" || status === "completed") buckets.resolved.push(item);
      else if (status === "closed") buckets.closed.push(item);
      else if (status === "assigned") buckets.assigned.push(item);
      else buckets.open.push(item);
    });

    return buckets;
  }, [referrals]);

  const counts = useMemo(() => {
    const total = referrals.length;
    const active = grouped.open.length + grouped.assigned.length + grouped.in_review.length;
    const completed = grouped.resolved.length + grouped.closed.length;
    const onHold = grouped.on_hold.length;
    const highPriority = referrals.filter((item) =>
      ["high", "urgent"].includes(normalizePriority(item.priority || item.urgency_level || item.urgency))
    ).length;
    const completionRate = total ? Math.round((completed / total) * 100) : 0;

    return { total, active, completed, onHold, highPriority, completionRate };
  }, [referrals, grouped]);

  return (
    <HubBusinessTourProvider pageKey="lifecycle">
      <main className="rt-shell" data-tour="hub-lifecycle-shell" onClickCapture={handleLifecycleClickCapture}>
      <aside className="rt-rail" data-tour="hub-lifecycle-rail">
        <button className="rt-logo" type="button" onClick={openShsHome}>
        <img
          src="/assets/hub/shs-hub-logo.png"
          alt="Silicon Heartland Hub"
        />
        </button>

        <nav className="rt-nav" data-tour="hub-lifecycle-nav">
          <button type="button" onClick={openShsHome}>
            <span>⌂</span>
            <small>Overview</small>
          </button>
          <button type="button" onClick={() => go("/hub/network")}>
            <span>👥</span>
            <small>Partners</small>
          </button>
          <button className="is-active" type="button">
            <span>↗</span>
            <small>Referral Tracker</small>
          </button>
          <button type="button" onClick={() => go("/hub/intake")}>
            <span>▤</span>
            <small>Intake</small>
          </button>
          <button type="button" onClick={() => go("/hub/queue")}>
            <span>☑</span>
            <small>Action Queue</small>
            <b>12</b>
          </button>
          <button type="button" onClick={() => go("/hub/reports")}>
            <span>▥</span>
            <small>Reports</small>
          </button>
        </nav>

        <section className="rt-readiness" data-tour="hub-lifecycle-readiness">
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

      <section className="rt-page">
        <header className="rt-header" data-tour="hub-lifecycle-header">
          <div>
            <p>SHS HUB COLLABORATION LAYER</p>
            <h1>Referral Tracker</h1>
            <span>Track referral movement from intake through routing, service progression, and verified completion.</span>
          </div>

          <div className="rt-actions" data-tour="hub-lifecycle-actions">
            <button type="button" onClick={openShsHome}>← Back to Hub</button>
            <button type="button" onClick={() => go("/hub/reports")}>⇩ Export</button>
            <button type="button" onClick={() => go("/hub/reports")}>▤ Lifecycle Brief</button>
          </div>
        </header>

        {error ? (
          <div className="rt-error">
            Referral tracker API notice: {String(error)}
          </div>
        ) : null}

        <section className="rt-kpiStrip" data-tour="hub-lifecycle-kpis">
          <SummaryCard icon="👥" label="Total Referrals" value={loading ? "…" : counts.total} chip="Live" note="Live API count" tone="green" />
          <SummaryCard icon="↪" label="Active Flow" value={loading ? "…" : counts.active} chip="Open Path" note="Open + Assigned + In Review" tone="blue" />
          <SummaryCard icon="✓" label="Completed Flow" value={loading ? "…" : counts.completed} chip="Resolved" note="Resolved + Closed" tone="green" />
          <SummaryCard icon="▣" label="On Hold Pressure" value={loading ? "…" : counts.onHold} chip="Needs Attention" note="Items paused and needing operator attention" tone="gold" />
          <SummaryCard icon="⚑" label="High Priority" value={loading ? "…" : counts.highPriority} chip="Urgent" note="Urgent referrals needing faster movement" tone="red" />
          <SummaryCard icon="◷" label="Completion Rate" value={loading ? "…" : `${counts.completionRate}%`} chip="On Track" note="Completed / total referrals in stream" tone="blue" />
        </section>

        <section className="rt-workGrid" data-tour="hub-lifecycle-workgrid">
          <article className="rt-lifecyclePanel" data-tour="hub-lifecycle-panel">
            <div className="rt-panelHead" data-tour="hub-lifecycle-panel-head">
              <div>
                <h2>↻ Referral Lifecycle</h2>
                <p>
            Track referrals across each stage of the lifecycle.
            <span style={{ marginLeft: 10, color: "#67e8f9", fontWeight: 800 }}>
              Truth Spine Engine: {truthEngineStatus}
            </span>
          </p>
          {verifyNotice && (
            <div className="rt-verifyNotice">
              {verifyNotice}
            </div>
          )}
              </div>

              <div className="rt-viewToggle" data-tour="hub-lifecycle-view-toggle">
                <span>View as:</span>
                <button className={viewMode === "board" ? "is-active" : ""} type="button" onClick={() => { setViewMode("board"); trackLifecycleEvent("view_mode_board"); }}>Board</button>
                <button className={viewMode === "list" ? "is-active" : ""} type="button" onClick={() => { setViewMode("list"); trackLifecycleEvent("view_mode_list"); }}>List</button>
              </div>
            </div>

            <div className="rt-board" data-tour="hub-lifecycle-board">
              <StageColumn title="Open" count={grouped.open.length}>
                {grouped.open.length ? grouped.open.map((item, index) => (
                  <StageReferralCard key={getCaseId(item, index)} item={item} index={index} compact />
                )) : <EmptyStage />}
              </StageColumn>

              <StageColumn title="Assigned" count={grouped.assigned.length}>
                {grouped.assigned.length ? grouped.assigned.map((item, index) => (
                  <StageReferralCard key={getCaseId(item, index)} item={item} index={index} compact />
                )) : <EmptyStage />}
              </StageColumn>

              <StageColumn title="In Review" count={grouped.in_review.length}>
                {grouped.in_review.length ? grouped.in_review.map((item, index) => (
                  <StageReferralCard key={getCaseId(item, index)} item={item} index={index} compact />
                )) : <EmptyStage />}
              </StageColumn>

              <StageColumn title="On Hold" count={grouped.on_hold.length} tone="gold">
                {grouped.on_hold.length ? grouped.on_hold.map((item, index) => (
                  <StageReferralCard key={getCaseId(item, index)} item={item} index={index} />
                )) : <EmptyStage />}
              </StageColumn>

              <StageColumn title="Resolved" count={grouped.resolved.length} tone="green">
                {grouped.resolved.length ? grouped.resolved.map((item, index) => (
                  <StageReferralCard key={getCaseId(item, index)} item={item} index={index} compact />
                )) : <EmptyStage />}
              </StageColumn>

              <StageColumn title="Closed" count={grouped.closed.length} tone="green">
                {grouped.closed.length ? grouped.closed.map((item, index) => (
                  <StageReferralCard key={getCaseId(item, index)} item={item} index={index} compact />
                )) : <EmptyStage />}
              </StageColumn>
            </div>
          </article>

          <aside className="rt-sidePanel" data-tour="hub-lifecycle-side-panel">
            <AdaptiveLifecycleSignal adaptive={adaptive} />
            <section className="rt-card" data-tour="hub-lifecycle-guidance">
              <h2>◎ Lifecycle Guidance</h2>
              <p>Insights to keep referral flow healthy.</p>

              <GuidanceRow icon="▶" title="Next Action" text="Review on-hold items and route high-priority referrals." tone="green" />
              <GuidanceRow icon="⌁" title="Flow Pressure" text="1 item on hold is creating flow pressure. Monitor and reduce delays." tone="blue" />
              <GuidanceRow icon="✓" title="Completion Signal" text="You are at 67% completion rate. Keep momentum moving." tone="green" />

              <button type="button">View full guidance →</button>
            </section>

            <section className="rt-card" data-tour="hub-lifecycle-pressure-card">
              <h2>▧ Flow Pressure</h2>
              <p>Real-time snapshot of flow health.</p>

              <div className="rt-focusGrid" data-tour="hub-lifecycle-flow-pressure">
                <div>
                  <small>⚑ High Priority</small>
                  <strong>{counts.highPriority}</strong>
                  <span>Requires attention</span>
                </div>
                <div>
                  <small>Ⅱ On Hold</small>
                  <strong>{counts.onHold}</strong>
                  <span>Needs attention</span>
                </div>
                <div>
                  <small>✓ Completed</small>
                  <strong>{counts.completed}</strong>
                  <span>Resolved items</span>
                </div>
              </div>

              <button type="button">View pressure details →</button>
            </section>

            <section className="rt-card" data-tour="hub-lifecycle-recent-movement">
              <div className="rt-cardTitleRow">
                <div>
                  <h2>◷ Recent Referral Movement</h2>
                  <p>Latest activity across the lifecycle.</p>
                </div>
                <button type="button">View all →</button>
              </div>

              <div className="rt-activityList" data-tour="hub-lifecycle-activity">
                <div>
                  <b className="gold">Ⅱ</b>
                  <strong>Referral placed on hold</strong>
                  <small>case_fdea72ed-ec6e-4eb5-96f9-1cdf84ca44cf</small>
                  <time>10:35 PM</time>
                </div>
                <div>
                  <b className="green">✓</b>
                  <strong>Referral resolved</strong>
                  <small>case_1dfc9e8d-1daf-43a8-b892-360cfe068620</small>
                  <time>4:20 PM</time>
                </div>
                <div>
                  <b className="green">✓</b>
                  <strong>Referral closed</strong>
                  <small>case_1302bd05-7c7e-4915-bf96-b1e8426a5a8e</small>
                  <time>3:45 PM</time>
                </div>
              </div>

              <button className="rt-viewActivity" type="button">View all activity →</button>
            </section>
          </aside>
        </section>
      </section>
      </main>
    </HubBusinessTourProvider>
  );
}
