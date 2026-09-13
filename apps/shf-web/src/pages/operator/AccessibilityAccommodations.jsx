import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/PageHeader";
import StatusChip from "../../components/StatusChip";
import ErrorBanner from "../../components/ErrorBanner";
import {
  activateAccommodation, approveAccommodation, createAccommodationDraft, fulfillAccommodation,
  getAccommodationProjection, getCurrentAuth, getOwnAccommodation, listAccommodations, reviewAccommodation, submitAccommodation,
} from "../../services/accessibility-accommodations-client";

const savedCaseKey = "shfAccommodationCaseId";
const fieldStyle = { display: "block", width: "100%", minHeight: 38, marginTop: 5 };

export default function AccessibilityAccommodations() {
  const [items, setItems] = useState([]);
  const [ownCase, setOwnCase] = useState(null);
  const [selectedId, setSelectedId] = useState(window.localStorage.getItem(savedCaseKey) || "");
  const [requestType, setRequestType] = useState("ALTERNATIVE_FORMAT");
  const [explanation, setExplanation] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [permissions, setPermissions] = useState([]);
  const [projection, setProjection] = useState(null);

  const selected = useMemo(() => items.find((item) => item.accommodationCaseId === selectedId) || items[0], [items, selectedId]);

  async function refresh() {
    setError("");
    const ownId = window.localStorage.getItem(savedCaseKey);
    const results = await Promise.allSettled([
      getCurrentAuth(), listAccommodations(), ownId ? getOwnAccommodation(ownId) : Promise.resolve(null),
    ]);
    if (results[0].status === "fulfilled") setPermissions(results[0].value?.permissions || results[0].value?.user?.permissions || []);
    if (results[1].status === "fulfilled") setItems(results[1].value?.items || []);
    if (results[2].status === "fulfilled") setOwnCase(results[2].value);
    const failure = results.find((result) => result.status === "rejected");
    if (failure) setError(failure.reason.message);
  }

  useEffect(() => { refresh(); }, []);

  async function run(action, message) {
    setError(""); setNotice("");
    try { const result = await action(); if (result?.accommodationCaseId) { setSelectedId(result.accommodationCaseId); window.localStorage.setItem(savedCaseKey, result.accommodationCaseId); } await refresh(); setNotice(message); }
    catch (err) { setError(err.message); }
  }

  async function createRequest(event) {
    event.preventDefault();
    await run(async () => { const draft = await createAccommodationDraft({ requestType, requestPayload: { explanation }, scope: { service: "accessibility-support" } }); await submitAccommodation(draft.accommodationCaseId); return draft; }, "Request submitted. Institutional review is still required.");
  }

  async function openRepresentation(requirement) {
    await run(async () => {
      const representation = await fetch(`${import.meta.env.VITE_SHS_API_BASE || "http://127.0.0.1:8091"}/accessibility/content/representations`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${window.localStorage.getItem("shfOperatorToken") || ""}` }, body: JSON.stringify({ sourceType: "CURRICULUM_LESSON", sourceId: "phase8_lesson_a", representationType: "ACCESSIBLE_HTML" }) });
      if (!representation.ok) throw new Error("Accessible representation is unavailable.");
      const body = await representation.json();
      const representationId = body?.data?.representationId || body?.data?.representation?.representationId;
      if (!representationId) throw new Error("Accessible representation reference is unavailable.");
      const delivered = await fetch(`${import.meta.env.VITE_SHS_API_BASE || "http://127.0.0.1:8091"}/accessibility/content/representations/${representationId}/content`, { headers: { Authorization: `Bearer ${window.localStorage.getItem("shfOperatorToken") || ""}` } });
      if (!delivered.ok) throw new Error("Accessible representation could not be delivered.");
      const content = await delivered.text();
      const popup = window.open("", "_blank");
      popup?.document.write(content);
      popup?.document.close();
      return fulfillAccommodation(selected.accommodationCaseId, requirement.requirementId, "DELIVERED");
    }, "Accessible representation delivered; fulfillment state updated.");
  }

  return <div>
    <PageHeader title="Accessibility Support" subtitle="Request, review, and fulfill institutional accessibility support through the canonical workflow." />
    <ErrorBanner message={error} />
    {notice ? <p role="status" aria-live="polite">{notice}</p> : null}
    <section aria-labelledby="support-request-heading" style={{ marginBottom: 24 }}>
      <h2 id="support-request-heading">Request support</h2>
      <p>Personal accessibility preferences remain separate from institutional accommodation decisions.</p>
      <form onSubmit={createRequest} style={{ display: "grid", gap: 12, maxWidth: 560 }}>
        <label>Support type<select aria-label="Support type" value={requestType} onChange={(event) => setRequestType(event.target.value)} style={fieldStyle}><option>ALTERNATIVE_FORMAT</option><option>CAPTIONS</option><option>TRANSCRIPT</option><option>INTERPRETER</option><option>EXTENDED_TIME</option></select></label>
        <label>Context or explanation<textarea aria-label="Context or explanation" value={explanation} onChange={(event) => setExplanation(event.target.value)} style={{ ...fieldStyle, minHeight: 76 }} /></label>
        <button type="submit">Submit accommodation request</button>
      </form>
      {ownCase ? <p role="status">Your request: <StatusChip value={ownCase.status} />. Review and approval are handled by authorized institutional staff.</p> : null}
    </section>
    {items.length ? <section aria-labelledby="queue-heading"><h2 id="queue-heading">Authorized work queue</h2><div style={{ display: "grid", gap: 16 }}>{items.map((item) => <article key={item.accommodationCaseId} style={{ border: "1px solid #ddd", padding: 16 }}><h3>{item.requestType} <StatusChip value={item.status} /></h3><p>Case {item.accommodationCaseId}</p><p>Scope: {JSON.stringify(item.scope)}</p><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{item.status === "SUBMITTED" && permissions.includes("accessibility.accommodation.review") ? <button type="button" onClick={() => run(() => reviewAccommodation(item.accommodationCaseId), "Review started.")}>Start review</button> : null}{item.status === "UNDER_REVIEW" && permissions.includes("accessibility.accommodation.approve") ? <button type="button" onClick={() => run(() => approveAccommodation(item.accommodationCaseId, { requirements: [{ requirementType: item.requestType }] }), "Request approved.")}>Approve bounded support</button> : null}{item.status === "APPROVED" && permissions.includes("accessibility.accommodation.approve") ? <button type="button" onClick={() => run(() => activateAccommodation(item.accommodationCaseId), "Accommodation activated.")}>Activate</button> : null}</div>{item.requirements?.map((requirement) => <div key={requirement.requirementId} style={{ marginTop: 12 }}><strong>{requirement.requirementType}</strong> <StatusChip value={requirement.fulfillmentStatus} /> {requirement.fulfillmentStatus === "PENDING" && requirement.requirementType === "ALTERNATIVE_FORMAT" && permissions.includes("accessibility.accommodation.fulfill") ? <button type="button" onClick={() => openRepresentation(requirement)}>Deliver accessible representation</button> : null}</div>)}</article>)}</div></section> : <p role="status">No authorized institutional cases are available for this account.</p>}
    {selected ? <section aria-labelledby="projection-heading" style={{ marginTop: 24 }}><h2 id="projection-heading">Minimum-necessary support projection</h2><button type="button" onClick={async () => { try { const nextProjection = await getAccommodationProjection(selected.accommodationCaseId); setProjection(nextProjection); setNotice(`Projection loaded for ${nextProjection.accommodationCaseId}.`); } catch (err) { setError(err.message); } }}>Refresh projection</button>{projection?.accommodationCaseId === selected.accommodationCaseId ? <dl aria-label="Minimum-necessary support details"><dt>Status</dt><dd>{projection.status}</dd><dt>Scope</dt><dd>{JSON.stringify(projection.scope)}</dd><dt>Effective period</dt><dd>{projection.effectiveFrom || "Not specified"} to {projection.effectiveUntil || "No expiration"}</dd><dt>Support requirements</dt><dd><ul>{projection.requirements.map((requirement) => <li key={requirement.requirementType}>{requirement.requirementType}: {requirement.fulfillmentStatus}</li>)}</ul></dd></dl> : null}</section> : null}
  </div>;
}
