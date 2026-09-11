import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/PageHeader";
import StatusChip from "../../components/StatusChip";
import ErrorBanner from "../../components/ErrorBanner";
import {
  createFundingGrant,
  createGrantAllocation,
  listFundingGrants,
  transitionFundingGrant,
} from "../../services/funding-grants-client";

const fieldStyle = { display: "block", width: "100%", minHeight: 36, marginTop: 4 };

const RESTRICTIONS = [
  ["UNRESTRICTED", "Unrestricted"],
  ["PROGRAM_RESTRICTED", "Restricted to Program"],
  ["PURPOSE_RESTRICTED", "Restricted Purpose"],
  ["TIME_RESTRICTED", "Time Restricted"],
  ["GEOGRAPHY_RESTRICTED", "Geography Restricted"],
  ["POPULATION_RESTRICTED", "Population Restricted"],
  ["OTHER", "Other Restriction"],
];

export default function FundingGrants() {
  const [grants, setGrants] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    grantNumber: "",
    funderOrganizationId: "",
    recipientOrganizationId: "",
    reportingOrganizationId: "",
    awardAmount: "100000.00",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    purpose: "",
    restrictionType: "UNRESTRICTED",
    restrictedProgramId: "",
  });
  const [allocation, setAllocation] = useState({ programId: "", allocatedAmount: "60000.00", purpose: "" });

  async function load() {
    setError("");
    try {
      const result = await listFundingGrants();
      setGrants(result.data.items);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const selected = useMemo(() => grants.find((grant) => grant.grantId === selectedId) || grants[0], [grants, selectedId]);

  async function run(action, message) {
    setError("");
    setNotice("");
    try {
      const result = await action();
      await load();
      if (result?.data?.grantId) setSelectedId(result.data.grantId);
      setNotice(message);
    } catch (err) {
      setError(err.message);
    }
  }

  async function submit(event) {
    event.preventDefault();
    const payload = {
      ...form,
      endDate: form.endDate || null,
      restrictedProgramId: form.restrictionType === "PROGRAM_RESTRICTED" ? form.restrictedProgramId : null,
    };
    await run(() => createFundingGrant(payload), "Grant award recorded.");
  }

  return (
    <div>
      <PageHeader title="Funding / Grants" subtitle="Canonical awards, restrictions, allocations, and reporting responsibility" />
      <ErrorBanner message={error} />
      {notice ? <p role="status" aria-live="polite">{notice}</p> : null}

      <div className="funding-grid" style={{ display: "grid", gap: 20, gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)" }}>
        <section aria-label="Create Grant Award">
          <h3>Create Grant Award</h3>
          <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
            <label>
              Title
              <input aria-label="Grant Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} style={fieldStyle} required />
            </label>
            <label>
              Grant Number
              <input aria-label="Grant Number" value={form.grantNumber} onChange={(event) => setForm({ ...form, grantNumber: event.target.value })} style={fieldStyle} />
            </label>
            <label>
              Funder Organization ID
              <input aria-label="Funder Organization ID" value={form.funderOrganizationId} onChange={(event) => setForm({ ...form, funderOrganizationId: event.target.value })} style={fieldStyle} required />
            </label>
            <label>
              Recipient Organization ID
              <input aria-label="Recipient Organization ID" value={form.recipientOrganizationId} onChange={(event) => setForm({ ...form, recipientOrganizationId: event.target.value })} style={fieldStyle} required />
            </label>
            <label>
              Reporting Organization ID
              <input aria-label="Reporting Organization ID" value={form.reportingOrganizationId} onChange={(event) => setForm({ ...form, reportingOrganizationId: event.target.value })} style={fieldStyle} required />
            </label>
            <label>
              Award Amount USD
              <input aria-label="Award Amount USD" inputMode="decimal" value={form.awardAmount} onChange={(event) => setForm({ ...form, awardAmount: event.target.value })} style={fieldStyle} required />
            </label>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
              <label>
                Start Date
                <input aria-label="Start Date" type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} style={fieldStyle} required />
              </label>
              <label>
                End Date
                <input aria-label="End Date" type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} style={fieldStyle} />
              </label>
            </div>
            <label>
              Restriction
              <select aria-label="Restriction" value={form.restrictionType} onChange={(event) => setForm({ ...form, restrictionType: event.target.value })} style={fieldStyle}>
                {RESTRICTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            {form.restrictionType === "PROGRAM_RESTRICTED" ? (
              <label>
                Restricted Program ID
                <input aria-label="Restricted Program ID" value={form.restrictedProgramId} onChange={(event) => setForm({ ...form, restrictedProgramId: event.target.value })} style={fieldStyle} required />
              </label>
            ) : null}
            <label>
              Purpose
              <textarea aria-label="Purpose" value={form.purpose} onChange={(event) => setForm({ ...form, purpose: event.target.value })} style={{ ...fieldStyle, minHeight: 72 }} />
            </label>
            <button type="submit">Record Award</button>
          </form>
        </section>

        <section aria-label="Grant List and Allocation">
          <h3>Grant Awards</h3>
          <button type="button" onClick={load}>Refresh Grants</button>
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {grants.map((grant) => (
              <button key={grant.grantId} type="button" onClick={() => setSelectedId(grant.grantId)} style={{ textAlign: "left", padding: 12 }}>
                <strong>{grant.title}</strong><br />
                {grant.currency} {grant.awardAmount} <StatusChip value={grant.status} />
              </button>
            ))}
          </div>

          {selected ? (
            <article aria-label="Grant Detail" style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginTop: 16, display: "grid", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <h3 style={{ margin: 0 }}>{selected.title}</h3>
                <StatusChip value={selected.status} />
              </div>
              <p style={{ margin: 0 }}>Funder: {selected.funderOrganizationId}</p>
              <p style={{ margin: 0 }}>Recipient: {selected.recipientOrganizationId}</p>
              <p style={{ margin: 0 }}>Reporting: {selected.reportingOrganizationId}</p>
              <p style={{ margin: 0 }}>Award {selected.awardAmount}; allocated {selected.allocatedAmount}; remaining {selected.remainingAmount}</p>
              <p style={{ margin: 0 }}>Restriction: {selected.restrictionType}{selected.restrictedProgramId ? ` (${selected.restrictedProgramId})` : ""}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" aria-label="Activate Grant" onClick={() => run(() => transitionFundingGrant(selected.grantId, "ACTIVE"), "Grant activated.")}>Activate</button>
                <button type="button" aria-label="Close Grant" onClick={() => run(() => transitionFundingGrant(selected.grantId, "CLOSED"), "Grant closed.")}>Close</button>
                <button type="button" aria-label="Cancel Grant" onClick={() => run(() => transitionFundingGrant(selected.grantId, "CANCELLED"), "Grant cancelled.")}>Cancel</button>
              </div>
              <form onSubmit={(event) => {
                event.preventDefault();
                run(() => createGrantAllocation(selected.grantId, allocation), "Program allocation recorded.");
              }} style={{ display: "grid", gap: 10 }}>
                <h4 style={{ marginBottom: 0 }}>Allocate to Program</h4>
                <label>
                  Program ID
                  <input aria-label="Allocation Program ID" value={allocation.programId} onChange={(event) => setAllocation({ ...allocation, programId: event.target.value })} style={fieldStyle} required />
                </label>
                <label>
                  Allocation Amount USD
                  <input aria-label="Allocation Amount USD" inputMode="decimal" value={allocation.allocatedAmount} onChange={(event) => setAllocation({ ...allocation, allocatedAmount: event.target.value })} style={fieldStyle} required />
                </label>
                <label>
                  Allocation Purpose
                  <input aria-label="Allocation Purpose" value={allocation.purpose} onChange={(event) => setAllocation({ ...allocation, purpose: event.target.value })} style={fieldStyle} />
                </label>
                <button type="submit">Create Allocation</button>
              </form>
              <ul>
                {(selected.allocations || []).map((item) => (
                  <li key={item.allocationId}>{item.programId}: {item.allocatedAmount} ({item.operatorOrganizationId})</li>
                ))}
              </ul>
            </article>
          ) : null}
        </section>
      </div>

      <style>{`
        @media (max-width: 820px) {
          .funding-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
