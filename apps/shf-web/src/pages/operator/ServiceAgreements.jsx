import React, { useEffect, useMemo, useState } from "react";
import ErrorBanner from "../../components/ErrorBanner";
import PageHeader from "../../components/PageHeader";
import StatusChip from "../../components/StatusChip";
import {
  activateServiceAgreement,
  approveServiceAgreement,
  createServiceAgreement,
  listServiceAgreements,
  suspendServiceAgreement,
  terminateServiceAgreement,
} from "../../services/service-agreements-client";

const fieldStyle = { display: "block", width: "100%", minHeight: 36, marginTop: 4 };

export default function ServiceAgreements() {
  const [agreements, setAgreements] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    consumerOrganizationId: "org_partner_001",
    serviceKey: "reporting",
    effectiveFrom: new Date().toISOString().slice(0, 10),
    effectiveUntil: "",
    serviceScope: "Governed reporting service access.",
    supportLevel: "Standard",
    agreementReference: "",
    responseTarget: "2 business days",
    reportingFrequency: "Monthly",
  });

  async function load() {
    setError("");
    try {
      const result = await listServiceAgreements();
      setAgreements(result.data.items);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const selected = useMemo(() => agreements.find((item) => item.agreementId === selectedId) || agreements[0], [agreements, selectedId]);

  async function run(action, message) {
    setError("");
    setNotice("");
    try {
      const result = await action();
      await load();
      if (result?.data?.agreementId) setSelectedId(result.data.agreementId);
      setNotice(message);
    } catch (err) {
      setError(err.message);
    }
  }

  async function submit(event) {
    event.preventDefault();
    await run(() => createServiceAgreement({
      consumerOrganizationId: form.consumerOrganizationId,
      serviceKey: form.serviceKey,
      effectiveFrom: form.effectiveFrom,
      effectiveUntil: form.effectiveUntil || null,
      serviceScope: form.serviceScope,
      supportLevel: form.supportLevel,
      agreementReference: form.agreementReference || null,
      serviceExpectations: {
        responseTarget: form.responseTarget,
        reportingFrequency: form.reportingFrequency,
      },
      reason: "Phase 6 service agreement creation",
    }), "Service agreement drafted.");
  }

  return (
    <div>
      <PageHeader title="Shared Services / Agreements" subtitle="Governed operating terms for entitled services" />
      <ErrorBanner message={error} />
      {notice ? <p role="status" aria-live="polite">{notice}</p> : null}

      <div className="agreements-grid" style={{ display: "grid", gap: 20, gridTemplateColumns: "minmax(0, 380px) minmax(0, 1fr)" }}>
        <section aria-label="Create Service Agreement">
          <h3>Create Agreement</h3>
          <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
            <label>
              Consumer Organization ID
              <input aria-label="Consumer Organization ID" value={form.consumerOrganizationId} onChange={(event) => setForm({ ...form, consumerOrganizationId: event.target.value })} style={fieldStyle} required />
            </label>
            <label>
              Service
              <select aria-label="Service" value={form.serviceKey} onChange={(event) => setForm({ ...form, serviceKey: event.target.value })} style={fieldStyle}>
                <option value="reporting">Reporting</option>
                <option value="project_studio">Project Studio</option>
                <option value="curriculum">Curriculum</option>
                <option value="truth_evidence">Truth / Evidence</option>
                <option value="career_workforce">Career / Workforce</option>
              </select>
            </label>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
              <label>
                Effective From
                <input aria-label="Effective From" type="date" value={form.effectiveFrom} onChange={(event) => setForm({ ...form, effectiveFrom: event.target.value })} style={fieldStyle} required />
              </label>
              <label>
                Effective Until
                <input aria-label="Effective Until" type="date" value={form.effectiveUntil} onChange={(event) => setForm({ ...form, effectiveUntil: event.target.value })} style={fieldStyle} />
              </label>
            </div>
            <label>
              Service Scope
              <textarea aria-label="Service Scope" value={form.serviceScope} onChange={(event) => setForm({ ...form, serviceScope: event.target.value })} style={{ ...fieldStyle, minHeight: 72 }} required />
            </label>
            <label>
              Support Level
              <input aria-label="Support Level" value={form.supportLevel} onChange={(event) => setForm({ ...form, supportLevel: event.target.value })} style={fieldStyle} />
            </label>
            <label>
              Response Target
              <input aria-label="Response Target" value={form.responseTarget} onChange={(event) => setForm({ ...form, responseTarget: event.target.value })} style={fieldStyle} />
            </label>
            <label>
              Reporting Frequency
              <input aria-label="Reporting Frequency" value={form.reportingFrequency} onChange={(event) => setForm({ ...form, reportingFrequency: event.target.value })} style={fieldStyle} />
            </label>
            <label>
              Agreement Reference
              <input aria-label="Agreement Reference" value={form.agreementReference} onChange={(event) => setForm({ ...form, agreementReference: event.target.value })} style={fieldStyle} />
            </label>
            <button type="submit">Create Draft</button>
          </form>
        </section>

        <section aria-label="Service Agreement List">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h3 style={{ margin: 0 }}>Agreements</h3>
            <button type="button" onClick={load}>Refresh</button>
          </div>
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {agreements.map((agreement) => (
              <button key={agreement.agreementId} type="button" onClick={() => setSelectedId(agreement.agreementId)} style={{ textAlign: "left", padding: 12 }}>
                <strong>{agreement.serviceName}</strong><br />
                {agreement.consumerOrganizationId} <StatusChip value={agreement.status} />
              </button>
            ))}
          </div>

          {selected ? (
            <article aria-label="Service Agreement Detail" style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginTop: 16, display: "grid", gap: 10, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <h3 style={{ margin: 0 }}>{selected.serviceName}</h3>
                <StatusChip value={selected.status} />
              </div>
              <p style={{ margin: 0 }}>Provider: {selected.providerOrganizationId}</p>
              <p style={{ margin: 0 }}>Consumer: {selected.consumerOrganizationId}</p>
              <p style={{ margin: 0 }}>Service: {selected.serviceKey}</p>
              <p style={{ margin: 0 }}>Effective: {String(selected.effectiveFrom).slice(0, 10)} to {selected.effectiveUntil ? String(selected.effectiveUntil).slice(0, 10) : "Open"}</p>
              <p style={{ margin: 0 }}>Support: {selected.supportLevel || "Not specified"}</p>
              <p style={{ margin: 0 }}>Reference: {selected.agreementReference || "Internal approval"}</p>
              <p style={{ margin: 0 }}>Scope: {selected.serviceScope}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" aria-label="Approve Agreement" disabled={selected.status !== "DRAFT"} onClick={() => run(() => approveServiceAgreement(selected.agreementId, "Phase 6 approval"), "Agreement approved.")}>Approve</button>
                <button type="button" aria-label="Activate Agreement" disabled={!["APPROVED", "SUSPENDED"].includes(selected.status)} onClick={() => run(() => activateServiceAgreement(selected.agreementId, "Phase 6 activation"), "Agreement activated.")}>Activate</button>
                <button type="button" aria-label="Suspend Agreement" disabled={selected.status !== "ACTIVE"} onClick={() => run(() => suspendServiceAgreement(selected.agreementId, "Phase 6 suspension"), "Agreement suspended.")}>Suspend</button>
                <button type="button" aria-label="Terminate Agreement" disabled={selected.status === "TERMINATED"} onClick={() => run(() => terminateServiceAgreement(selected.agreementId, "Phase 6 termination"), "Agreement terminated.")}>Terminate</button>
              </div>
            </article>
          ) : (
            <p>No service agreements found.</p>
          )}
        </section>
      </div>

      <style>{`
        @media (max-width: 820px) {
          .agreements-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
