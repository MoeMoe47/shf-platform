import React, { useEffect, useMemo, useRef, useState } from "react";
import useOrganizations from "@/lib/hub/useOrganizations";
import {
  createBackendReferral,
  referralToTruthSpineRecord,
  upsertTruthSpineRecord,
  appendTruthSpineEvent,
  EVENT_TYPES,
  createTruthSpineRecordsFromHubReferrals,
  getTruthSpineSnapshot,
} from "@/shared/truth-spine";
import "./intake-navigator-shs.css";
import HubBusinessTourProvider from "./shared/HubBusinessTourProvider.jsx";
import { useAdaptiveExperience } from "@/system/adaptive-experience/useAdaptiveExperience";
import {
  ADAPTIVE_EVENT_TYPES,
  ADAPTIVE_ROLES,
  ADAPTIVE_SURFACES,
} from "@/system/adaptive-experience/adaptiveEvent.types";


const SHS_HOME_URL = "/admin.html#/hub";

const NEED_CATEGORIES = [
  "Workforce Training",
  "Housing Support",
  "Transportation",
  "Food Assistance",
  "Behavioral Health",
  "Youth Services",
  "Education Support",
  "Reentry Support",
  "Financial Coaching",
  "Healthcare Navigation",
  "Childcare Support",
  "Legal Aid",
  "Digital Access",
  "Emergency Assistance",
];


function openShsHome() {
  if (typeof window === "undefined") return;
  window.location.href = SHS_HOME_URL;
}

function go(path) {
  if (!path || typeof window === "undefined") return;
  window.location.hash = String(path).startsWith("/") ? path : `/${path}`;
}

function getOrgName(org) {
  return (
    org?.organization_name ||
    org?.display_name ||
    org?.legal_name ||
    org?.name ||
    org?.organization_id ||
    "Partner Organization"
  );
}

function getOrgId(org, index) {
  return org?.organization_id || org?.id || `org_${index + 1}`;
}

export default function IntakeNavigatorConsole() {
  const { items: organizations = [], loading } = useOrganizations();

  const fallbackOrganizations = [
    {
      organization_id: "org_shf_001",
      organization_name: "Silicon Heartland Foundation",
    },
    {
      organization_id: "org_partner_001",
      organization_name: "Franklin County Workforce Partner",
    },
  ];

  const orgItems = organizations.length ? organizations : fallbackOrganizations;

  const adaptive = useAdaptiveExperience({
    surface: ADAPTIVE_SURFACES.HUB_INTAKE_NAVIGATOR || "hub_intake_navigator",
    role: ADAPTIVE_ROLES.HUB_OPERATOR,
    dashboardVersion: "hub_intake_v1",
  });

  const formStartedRef = useRef(false);
  const submittedRef = useRef(false);

  const [senderId, setSenderId] = useState(getOrgId(orgItems[0], 0));
  const [receiverId, setReceiverId] = useState(getOrgId(orgItems[1] || orgItems[0], 1));
  const [category, setCategory] = useState("Workforce Training");
  const [urgency, setUrgency] = useState("Medium");
  const [notes, setNotes] = useState("");
  const [draftState, setDraftState] = useState("Ready to Submit");
  const [truthEngineStatus, setTruthEngineStatus] = useState("ready");
  const [truthEngineNotice, setTruthEngineNotice] = useState("");

  useEffect(() => {
    adaptive.track({
      eventType: ADAPTIVE_EVENT_TYPES.PAGE_VIEWED,
      target: "intake_navigator_console",
    });

    return () => {
      if (formStartedRef.current && !submittedRef.current) {
        adaptive.track({
          eventType: ADAPTIVE_EVENT_TYPES.FORM_ABANDONED,
          target: "referral_intake_form",
          metadata: {
            category,
            urgency,
            hasNotes: Boolean(notes.trim()),
          },
        });
      }
    };
  }, []);

  function trackFormStarted(target) {
    if (!formStartedRef.current) {
      formStartedRef.current = true;
      adaptive.track({
        eventType: ADAPTIVE_EVENT_TYPES.FORM_STARTED,
        target: "referral_intake_form",
        metadata: { firstInteraction: target },
      });
    }
  }

  function trackButton(target) {
    adaptive.track({
      eventType: ADAPTIVE_EVENT_TYPES.BUTTON_CLICKED,
      target,
    });
  }

  const sender = useMemo(
    () => orgItems.find((org, index) => getOrgId(org, index) === senderId) || orgItems[0],
    [orgItems, senderId]
  );

  const receiver = useMemo(
    () => orgItems.find((org, index) => getOrgId(org, index) === receiverId) || orgItems[1] || orgItems[0],
    [orgItems, receiverId]
  );

  const canCreate = Boolean(senderId && receiverId && category);

  async function saveReferralThroughTruthEngine(referralInput, payload, backend = null) {
    setTruthEngineStatus("syncing");

    try {
      const engineResult = createTruthSpineRecordsFromHubReferrals(
        [referralInput],
        "hub_intake_navigator"
      );

      const saved =
        Array.isArray(engineResult)
          ? engineResult[0]
          : engineResult?.record || engineResult;

      if (!saved?.entityId) {
        throw new Error("Truth Spine Engine did not return a saved record.");
      }

      appendTruthSpineEvent({
        eventType: EVENT_TYPES.HUB_REFERRAL_CREATED,
        entityId: saved.entityId,
        entityType: saved.entityType,
        sourceSurface: "hub_intake_navigator",
        traceId: saved.trustEnvelope?.traceId,
        actorId: "demo-user-1",
        actorRole: "hub_operator",
        organizationId: saved.organizationId || "shf-core",
        payload: {
          backend,
          intake: payload,
          engineRouted: true,
        },
      });

      const snapshot = await getTruthSpineSnapshot({ includeBackend: false });

      setTruthEngineStatus("connected");
      setTruthEngineNotice(
        `Truth Spine Engine captured referral. Records: ${snapshot?.summary?.totalRecords ?? "updated"}`
      );

      window.clearTimeout(window.__intakeTruthEngineNotice);
      window.__intakeTruthEngineNotice = window.setTimeout(() => {
        setTruthEngineNotice("");
      }, 4200);

      return saved;
    } catch (error) {
      console.warn("[Truth Spine Engine] Intake engine save failed; using legacy fallback", error);

      const fallbackRecord = referralToTruthSpineRecord(referralInput, "hub_intake_navigator");
      const saved = upsertTruthSpineRecord(fallbackRecord);

      appendTruthSpineEvent({
        eventType: EVENT_TYPES.HUB_REFERRAL_CREATED,
        entityId: saved.entityId,
        entityType: saved.entityType,
        sourceSurface: "hub_intake_navigator",
        traceId: saved.trustEnvelope?.traceId,
        actorId: "demo-user-1",
        actorRole: "hub_operator",
        organizationId: saved.organizationId || "shf-core",
        payload: {
          backend,
          intake: payload,
          engineFallback: true,
          error: error?.message || "Truth Spine Engine save failed",
        },
      });

      setTruthEngineStatus("fallback");
      setTruthEngineNotice("Truth Spine Engine fallback used; local proof preserved.");

      window.clearTimeout(window.__intakeTruthEngineNotice);
      window.__intakeTruthEngineNotice = window.setTimeout(() => {
        setTruthEngineNotice("");
      }, 4200);

      return saved;
    }
  }

  async function handleCreateReferral() {
    submittedRef.current = true;
    adaptive.track({
      eventType: ADAPTIVE_EVENT_TYPES.FORM_SUBMITTED,
      target: "referral_intake_form",
      metadata: {
        category,
        urgency,
        hasNotes: Boolean(notes.trim()),
      },
    });

    const payload = {
      sending_organization_id: senderId,
      receiving_organization_id: receiverId,
      need_category: category,
      urgency_level: urgency.toLowerCase(),
      notes,
      source: "hub_intake_navigator",
    };

    setDraftState("Creating Referral");

    try {
      const created = await createBackendReferral({
        ...payload,
        organization_id: senderId,
        priority: urgency.toLowerCase(),
        status: "open",
        reason_text: "Referral created from SHS Hub Intake Navigator",
      });

      const referralInput = {
        ...payload,
        ...created,
        id: created?.case_id || created?.id || `case_${Date.now()}`,
        case_id: created?.case_id || created?.id,
        title: "Referral",
        status: created?.status || "open",
        sender: getOrgName(sender),
        receiver: getOrgName(receiver),
        needCategory: category,
        urgency: urgency.toLowerCase(),
        notes,
      };

      await saveReferralThroughTruthEngine(referralInput, payload, created);

      setDraftState("Referral Created");
      go("/hub/queue");
    } catch (error) {
      console.warn("[SHS Hub Intake] Backend referral create failed; using Truth Spine fallback:", error);

      const fallbackReferral = {
        id: `case_local_${Date.now()}`,
        title: "Referral",
        status: "open",
        sender: getOrgName(sender),
        receiver: getOrgName(receiver),
        needCategory: category,
        urgency: urgency.toLowerCase(),
        notes,
        sending_organization_id: senderId,
        receiving_organization_id: receiverId,
      };

      await saveReferralThroughTruthEngine(
        {
          ...fallbackReferral,
          fallback: true,
          backendError: error?.message || "Backend unavailable",
        },
        payload,
        null
      );

      setDraftState("Referral Created Locally");
      go("/hub/queue");
    }
  }

  return (
    <HubBusinessTourProvider pageKey="intake">
      <main className="intakeShs-shell" data-tour="hub-intake-shell">
      <aside className="intakeShs-rail" data-tour="hub-intake-rail">
        <button className="intakeShs-logo" type="button" onClick={openShsHome}>
        <img
          src="/assets/hub/shs-hub-logo.png"
          alt="Silicon Heartland Hub"
        />
        </button>

        <nav className="intakeShs-nav" data-tour="hub-intake-nav">
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

          <button className="is-active" type="button">
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

        <section className="intakeShs-readiness" data-tour="hub-intake-readiness">
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

      <section className="intakeShs-page">
        <header className="intakeShs-header" data-tour="hub-intake-header">
          <div>
            <p>SHS HUB COLLABORATION LAYER</p>
            <h1>Intake Navigator Console</h1>
            <span>
              Operator-facing intake, routing, and handoff workspace for organization selection,
              need classification, and referral preparation.
            </span>
            <div className="intakeShs-engineStatus">
              <strong>Truth Spine Engine:</strong> {truthEngineStatus}
              {truthEngineNotice ? <em>{truthEngineNotice}</em> : null}
            </div>
          </div>

          <div className="intakeShs-actions" data-tour="hub-intake-actions">
            <button type="button" onClick={() => { trackButton("back_to_hub"); openShsHome(); }}>← Back to Hub</button>
            <button type="button" onClick={() => trackButton("save_draft")}>▣ Save Draft</button>
            <button className="is-primary" type="button" onClick={handleCreateReferral} disabled={!canCreate}>
              Create Referral →
            </button>
          </div>
        </header>

        <section className="intakeShs-formCard" data-tour="hub-intake-form">
          <div className="intakeShs-field" data-tour="hub-intake-sender">
            <label>Sending Organization</label>
            <select value={senderId} onChange={(event) => { trackFormStarted("sending_organization"); setSenderId(event.target.value); }}>
              {orgItems.map((org, index) => (
                <option key={`sender-${getOrgId(org, index)}`} value={getOrgId(org, index)}>
                  {getOrgName(org)}
                </option>
              ))}
            </select>
            <small><i /> {loading ? "Loading organizations..." : `${orgItems.length} organizations loaded`}</small>
          </div>

          <div className="intakeShs-field" data-tour="hub-intake-receiver">
            <label>Receiving Organization</label>
            <select value={receiverId} onChange={(event) => { trackFormStarted("receiving_organization"); setReceiverId(event.target.value); }}>
              {orgItems.map((org, index) => (
                <option key={`receiver-${getOrgId(org, index)}`} value={getOrgId(org, index)}>
                  {getOrgName(org)}
                </option>
              ))}
            </select>
            <small><i /> {loading ? "Loading organizations..." : `${orgItems.length} organizations loaded`}</small>
          </div>

          <div className="intakeShs-field" data-tour="hub-intake-category">
            <label>Need Category</label>
            <select value={category} onChange={(event) => { trackFormStarted("need_category"); setCategory(event.target.value); }}>
              {NEED_CATEGORIES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <small><i /> {NEED_CATEGORIES.length} categories loaded</small>
          </div>

          <div className="intakeShs-divider" />

          <div className="intakeShs-priority" data-tour="hub-intake-priority">
            <label>Priority / Urgency</label>
            <div>
              {["Low", "Medium", "High"].map((level) => (
                <button
                  key={level}
                  type="button"
                  className={urgency === level ? "is-selected" : ""}
                  onClick={() => { trackFormStarted("priority_urgency"); setUrgency(level); }}
                >
                  {level}
                </button>
              ))}
            </div>

            <button className="intakeShs-create" type="button" onClick={handleCreateReferral} disabled={!canCreate}>
              Create Referral →
            </button>
          </div>

          <div className="intakeShs-notes" data-tour="hub-intake-notes">
            <label>Intake Notes (Barriers, Routing Guidance, Context)</label>
            <textarea
              value={notes}
              maxLength={2000}
              onChange={(event) => { trackFormStarted("intake_notes"); setNotes(event.target.value); }}
              placeholder="Capture intake notes, barriers, or routing guidance..."
            />
            <small>{notes.length} / 2000</small>
          </div>
        </section>

        <section className="intakeShs-supportGrid" data-tour="hub-intake-support">
          <article className="intakeShs-card" data-tour="hub-intake-org-context">
            <div className="intakeShs-cardIcon">👥</div>
            <h2>Organization Context</h2>

            <dl>
              <dt>Sender</dt>
              <dd>{getOrgName(sender)}</dd>

              <dt>Receiver</dt>
              <dd>{getOrgName(receiver)}</dd>
            </dl>

            <button type="button" onClick={() => { trackButton("view_organizations"); go("/hub/network"); }}>View organizations →</button>
          </article>

          <article className="intakeShs-card" data-tour="hub-intake-classification">
            <div className="intakeShs-cardIcon">◇</div>
            <h2>Need Classification</h2>

            <dl>
              <dt>Category</dt>
              <dd>{category}</dd>

              <dt>Available</dt>
              <dd>{NEED_CATEGORIES.length} categories</dd>
            </dl>

            <button type="button" onClick={() => trackButton("view_all_categories")}>View all categories →</button>
          </article>

          <article className="intakeShs-card" data-tour="hub-intake-draft">
            <div className="intakeShs-cardIcon is-green">✓</div>
            <h2>Referral Draft Readiness</h2>

            <dl>
              <dt>Status</dt>
              <dd><span className="intakeShs-pill is-green">{draftState}</span></dd>

              <dt>Urgency</dt>
              <dd><span className="intakeShs-pill is-gold">{urgency}</span></dd>

              <dt>Notes</dt>
              <dd>{notes ? "Intake notes captured." : "No intake notes entered yet."}</dd>
            </dl>

            <button type="button" onClick={() => trackButton("review_draft_summary")}>Review draft summary →</button>
          </article>


          <article className="intakeShs-card intakeShs-adaptiveCard" data-tour="hub-intake-adaptive">
            <div className="intakeShs-cardIcon">◇</div>
            <h2>Adaptive Intake Signal</h2>

            <dl>
              <dt>Events</dt>
              <dd>{adaptive.summary?.totalEvents || 0} captured</dd>

              <dt>Experience</dt>
              <dd>{adaptive.experienceScore?.grade || "Collecting data"}</dd>

              <dt>Friction</dt>
              <dd>{adaptive.frictionSignals?.length || 0} signals</dd>
            </dl>

            <button type="button" onClick={() => trackButton("adaptive_intake_review")}>
              Review intake signals →
            </button>
          </article>

          <article className="intakeShs-card" data-tour="hub-intake-routing">
            <div className="intakeShs-cardIcon is-violet">↪</div>
            <h2>Routing Guidance</h2>

            <dl>
              <dt>Next Step</dt>
              <dd>{notes ? "Create referral or save draft" : "Add intake notes or barriers"}</dd>

              <dt>Recommendation</dt>
              <dd>Add context to ensure accurate routing and partner alignment.</dd>
            </dl>

            <button type="button" onClick={() => trackButton("view_routing_playbook")}>View routing playbook →</button>
          </article>
        </section>

        <section className="intakeShs-consent" data-tour="hub-intake-consent">
          <div className="intakeShs-consentIcon">✓</div>

          <div>
            <h2>Consent & Data Check</h2>
            <p>Ensure appropriate consent is on file and data can be shared with the receiving organization.</p>
          </div>

          <span>● All Clear</span>
          <button type="button" onClick={() => trackButton("view_consent_details")}>View details →</button>
        </section>
      </section>
      </main>
    </HubBusinessTourProvider>
  );
}
