import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/PageHeader";
import StatusChip from "../../components/StatusChip";
import ErrorBanner from "../../components/ErrorBanner";
import {
  activateOnboardingCase,
  approveOnboardingCase,
  declineOnboardingCase,
  exitOnboardingCase,
  getCurrentAuth,
  listOnboardingCases,
  submitOnboardingCase,
  suspendOnboardingCase,
} from "../../services/organization-onboarding-client";
import { resolveOnboardingExperience } from "../../system/sea/onboardingRoleProjection";
import { SeaAttention, SeaDashboardSection, SeaHelpRegion, SeaNextAction } from "@/components/sea/SeaDashboardPrimitives.jsx";
import ExrJourneyContext from "@/components/exr/ExrJourneyContext.jsx";

const SERVICES = [
  ["curriculum", "Curriculum"],
  ["reporting", "Reporting"],
  ["project_studio", "Project Studio"],
  ["career_workforce", "Career / Workforce"],
  ["truth_evidence", "Truth / Evidence"],
];

const RELATIONSHIPS = [
  ["NETWORK_MEMBER_OF", "Network Member"],
  ["INCUBATES", "Incubated Organization"],
  ["SHARED_SERVICES_PROVIDER_FOR", "Shared Services Provider"],
];

const fieldStyle = { display: "block", width: "100%", minHeight: 36, marginTop: 4 };

export default function OrganizationOnboarding() {
  const [actorMode, setActorMode] = useState(null);
  const [cases, setCases] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [approvedServices, setApprovedServices] = useState(["curriculum", "reporting"]);
  const [reason, setReason] = useState("Phase 4 onboarding decision");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    organizationName: "",
    organizationType: "INDEPENDENT_NETWORK",
    website: "",
    primaryContactName: "",
    primaryContactEmail: "",
    primaryContactPhone: "",
    geography: "",
    missionDescription: "",
    requestedRelationshipType: "NETWORK_MEMBER_OF",
    requestedServices: ["curriculum", "reporting"],
  });

  async function load() {
    setError("");
    try {
      const result = await listOnboardingCases();
      setCases(result.data.items);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    let mounted = true;
    Promise.all([getCurrentAuth(), listOnboardingCases()])
      .then(([auth, result]) => {
        if (!mounted) return;
        setActorMode(resolveOnboardingExperience(auth));
        setCases(result.data.items);
      })
      .catch((err) => {
        if (!mounted) return;
        setActorMode("UNAUTHORIZED");
        setError(err.message);
      });
    return () => { mounted = false; };
  }, []);

  const selected = useMemo(() => cases.find((item) => item.onboardingCaseId === selectedId) || cases[0], [cases, selectedId]);

  function updateService(key, checked) {
    setForm((current) => ({
      ...current,
      requestedServices: checked
        ? Array.from(new Set([...current.requestedServices, key]))
        : current.requestedServices.filter((item) => item !== key),
    }));
  }

  function updateApprovedService(key, checked) {
    setApprovedServices((current) => checked
      ? Array.from(new Set([...current, key]))
      : current.filter((item) => item !== key));
  }

  async function run(action, message) {
    setError("");
    setNotice("");
    try {
      const result = await action();
      await load();
      if (result?.data?.onboardingCaseId) setSelectedId(result.data.onboardingCaseId);
      setNotice(message);
    } catch (err) {
      setError(err.message);
    }
  }

  async function submit(event) {
    event.preventDefault();
    await run(() => submitOnboardingCase(form), "Application submitted.");
  }

  return (
    <div>
      <PageHeader title="Organization Onboarding" subtitle="Network application review and activation" />
      <ErrorBanner message={error} />
      {notice ? <p role="status" aria-live="polite">{notice}</p> : null}
      <ExrJourneyContext journeyId="organization-applicant" actor={actorMode === "REVIEWER" ? "org_admin" : "applicant"} organizationId={selected?.organizationId || null} roleLabel={actorMode === "REVIEWER" ? "Onboarding reviewer" : "Organization applicant"} state={selected?.status || "NO_APPLICATION"} currentWork={selected ? `Application ${selected.onboardingCaseId}` : "No active application"} nextAction={actorMode === "REVIEWER" ? (selected ? "Review the selected application" : "Open the reviewer queue") : (selected ? "Review application status" : "Complete the application")} nextActionSource="WORKFLOW_STATE_MACHINE" />

      {actorMode === "UNAUTHORIZED" ? (
        <p role="alert">This account is not authorized for an onboarding experience.</p>
      ) : actorMode ? (
        <>
          <SeaDashboardSection title={actorMode === "REVIEWER" ? "Reviewer context" : "Applicant context"} eyebrow="Organization service">
            <p>Applications move through the canonical lifecycle; the current actor only receives actions authorized by the onboarding service.</p>
          </SeaDashboardSection>
          <SeaAttention items={actorMode === "REVIEWER"
            ? (selected?.status === "UNDER_REVIEW" ? [{ type: "REVIEW_REQUIRED", label: `${selected.organizationName} is ready for authorized review.`, owner: "Onboarding reviewer" }] : [])
            : (selected?.status === "UNDER_REVIEW" ? [{ type: "WAITING", label: "Your application is waiting for reviewer action.", owner: "Onboarding reviewer" }] : [])} />
          <SeaNextAction
            label={actorMode === "REVIEWER" ? (selected ? "Review the selected application" : "Open the onboarding queue") : "Complete the applicant intake"}
            description={actorMode === "REVIEWER"
              ? "The onboarding state machine remains the source of truth for the next reviewer action."
              : "The onboarding state machine remains the source of truth for the next applicant action."}
            source="WORKFLOW_STATE_MACHINE"
          />
        </>
      ) : null}

      {actorMode === "APPLICANT" ? (
        <section aria-label="Applicant Intake">
          <h3>Applicant Intake</h3>
          {selected ? <p>Application status: <StatusChip value={selected.status} />. Reviewer and activation work remain outside this applicant view.</p> : null}
          <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
            <label>
              Organization Name
              <input aria-label="Organization Name" value={form.organizationName} onChange={(event) => setForm({ ...form, organizationName: event.target.value })} style={fieldStyle} required />
            </label>
            <label>
              Organization Type
              <input aria-label="Organization Type" value={form.organizationType} onChange={(event) => setForm({ ...form, organizationType: event.target.value })} style={fieldStyle} required />
            </label>
            <label>
              Website
              <input aria-label="Website" value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} style={fieldStyle} />
            </label>
            <label>
              Primary Contact
              <input aria-label="Primary Contact" value={form.primaryContactName} onChange={(event) => setForm({ ...form, primaryContactName: event.target.value })} style={fieldStyle} required />
            </label>
            <label>
              Contact Email
              <input aria-label="Contact Email" type="email" value={form.primaryContactEmail} onChange={(event) => setForm({ ...form, primaryContactEmail: event.target.value })} style={fieldStyle} required />
            </label>
            <label>
              Contact Phone
              <input aria-label="Contact Phone" value={form.primaryContactPhone} onChange={(event) => setForm({ ...form, primaryContactPhone: event.target.value })} style={fieldStyle} />
            </label>
            <label>
              Geography
              <input aria-label="Geography" value={form.geography} onChange={(event) => setForm({ ...form, geography: event.target.value })} style={fieldStyle} />
            </label>
            <label>
              Requested Relationship
              <select aria-label="Requested Relationship" value={form.requestedRelationshipType} onChange={(event) => setForm({ ...form, requestedRelationshipType: event.target.value })} style={fieldStyle}>
                {RELATIONSHIPS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <fieldset style={{ border: "1px solid #ddd", borderRadius: 8 }}>
              <legend>Requested Services</legend>
              {SERVICES.map(([key, label]) => (
                <label key={key} style={{ display: "block", margin: "6px 0" }}>
                  <input type="checkbox" checked={form.requestedServices.includes(key)} onChange={(event) => updateService(key, event.target.checked)} /> {label}
                </label>
              ))}
            </fieldset>
            <label>
              Mission / Description
              <textarea aria-label="Mission / Description" value={form.missionDescription} onChange={(event) => setForm({ ...form, missionDescription: event.target.value })} style={{ ...fieldStyle, minHeight: 74 }} />
            </label>
            <button type="submit">Submit Application</button>
          </form>
        </section>
      ) : null}

      {actorMode === "REVIEWER" ? (
        <section aria-label="Reviewer Queue">
          <h3>Reviewer Queue</h3>
          <button type="button" onClick={load}>Refresh Queue</button>
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {cases.map((item) => (
              <button
                key={item.onboardingCaseId}
                type="button"
                onClick={() => {
                  setSelectedId(item.onboardingCaseId);
                  const approved = item.services.filter((service) => service.approved).map((service) => service.serviceKey);
                  setApprovedServices(approved.length ? approved : item.services.map((service) => service.serviceKey));
                }}
                style={{ textAlign: "left", padding: 12 }}
              >
                <strong>{item.organizationName}</strong><br />
                {item.requestedRelationshipType} <StatusChip value={item.status} />
              </button>
            ))}
          </div>

          {selected ? (
            <article aria-label="Review Detail" style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginTop: 16, display: "grid", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <h3 style={{ margin: 0 }}>{selected.organizationName}</h3>
                <StatusChip value={selected.status} />
              </div>
              <p style={{ margin: 0 }}>Relationship: {selected.requestedRelationshipType}</p>
              <p style={{ margin: 0 }}>Canonical Organization: {selected.activatedOrganizationId || selected.existingOrganizationId || "create on activation"}</p>
              <p style={{ margin: 0 }}>Activation Preview: relationship {selected.requestedRelationshipType}; entitlements {approvedServices.join(", ") || "none"}</p>
              <fieldset style={{ border: "1px solid #ddd", borderRadius: 8 }}>
                <legend>Approved Services</legend>
                {SERVICES.map(([key, label]) => (
                  <label key={key} style={{ display: "block", margin: "6px 0" }}>
                    <input type="checkbox" checked={approvedServices.includes(key)} onChange={(event) => updateApprovedService(key, event.target.checked)} /> {label}
                  </label>
                ))}
              </fieldset>
              <label>
                Decision Reason
                <input aria-label="Decision Reason" value={reason} onChange={(event) => setReason(event.target.value)} style={fieldStyle} />
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" aria-label="Approve Onboarding" onClick={() => run(() => approveOnboardingCase(selected.onboardingCaseId, { approved_services: approvedServices, reason }), "Application approved.")}>Approve</button>
                <button type="button" aria-label="Decline Onboarding" onClick={() => run(() => declineOnboardingCase(selected.onboardingCaseId, { reason }), "Application declined.")}>Decline</button>
                <button type="button" aria-label="Activate Onboarding" onClick={() => run(() => activateOnboardingCase(selected.onboardingCaseId), "Organization activated.")}>Activate</button>
                <button type="button" aria-label="Suspend Onboarding" onClick={() => run(() => suspendOnboardingCase(selected.onboardingCaseId, reason), "Organization suspended.")}>Suspend</button>
                <button type="button" aria-label="Exit Onboarding" onClick={() => run(() => exitOnboardingCase(selected.onboardingCaseId, reason), "Organization exited.")}>Exit</button>
              </div>
            </article>
          ) : null}
        </section>
      ) : null}
      <SeaHelpRegion>
        <p>Documents, agreements, and guidance remain DGAL-owned; this surface does not grant entitlement or activation authority.</p>
      </SeaHelpRegion>

      <style>{`
        @media (max-width: 820px) {
          .onboarding-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
