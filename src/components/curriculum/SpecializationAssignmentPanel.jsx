import React, { useEffect, useState } from "react";
import { useAuthContext } from "../../auth/auth-context.jsx";
import { SHS_AUTH_API_BASE } from "../../system/identity/authConfig.js";

const PROGRAM_ID = "data-center-specialization-11";
const ASSIGN_PERMISSION = "program.specialization.assign";

async function api(path, options = {}) {
  const response = await fetch(`${SHS_AUTH_API_BASE}${path}`, { credentials: "include", cache: "no-store", headers: { "Content-Type": "application/json", ...(options.headers || {}) }, ...options });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message || body?.error?.code || "Request failed");
  return body.data;
}

function statusLabel(request, assignment) {
  if (assignment?.specialization_id) return `Current specialization: ${assignment.specialization_id}`;
  if (request?.status === "PENDING") return "Request pending confirmation";
  if (request?.status === "DECLINED") return "Request declined";
  return "No specialization assigned";
}

export default function SpecializationAssignmentPanel() {
  const auth = useAuthContext();
  const learnerId = auth.user?.id;
  const [options, setOptions] = useState([]);
  const [assignment, setAssignment] = useState(null);
  const [requests, setRequests] = useState([]);
  const [pending, setPending] = useState([]);
  const [selected, setSelected] = useState("");
  const [rationale, setRationale] = useState("");
  const [staffChoices, setStaffChoices] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    if (!auth.isAuthenticated || !learnerId) return;
    setError("");
    try {
      const canAssign = auth.hasPermission(ASSIGN_PERMISSION);
      const [available, assignments] = await Promise.all([
        api("/program-specialization-assignments/available"),
        canAssign ? Promise.resolve([]) : api(`/program-specialization-assignments?program_id=${PROGRAM_ID}`),
      ]);
      setOptions(available || []);
      setAssignment((assignments || []).find((row) => row.status === "ACTIVE") || null);
      if (canAssign) {
        setRequests([]);
        setPending(await api(`/program-specialization-requests/pending?program_id=${PROGRAM_ID}`));
      } else {
        setRequests(await api(`/program-specialization-requests?program_id=${PROGRAM_ID}`));
        setPending([]);
      }
    } catch (err) { setError(err.message); }
  }

  useEffect(() => { load(); }, [auth.isAuthenticated, learnerId, auth.permissions.join(",")]);

  async function submitRequest(event) {
    event.preventDefault();
    if (!selected) return;
    setMessage(""); setError("");
    try {
      await api("/program-specialization-requests", { method: "POST", body: JSON.stringify({ program_id: PROGRAM_ID, specialization_id: selected, learner_rationale: rationale }) });
      setRationale(""); setMessage("Request pending confirmation."); await load();
    } catch (err) { setError(err.message); }
  }

  async function confirmRequest(requestId, specializationId) {
    setMessage(""); setError("");
    try { await api(`/program-specialization-requests/${requestId}/confirm`, { method: "POST", body: JSON.stringify({ specialization_id: specializationId }) }); setMessage("Specialization confirmed."); await load(); }
    catch (err) { setError(err.message); }
  }

  if (!auth.isAuthenticated) return null;
  const latestRequest = requests[0];
  return (
    <section className="ld-card" aria-labelledby="specialization-assignment-heading">
      <p className="ld-eyebrow">Grade 11 pathway</p>
      <h2 id="specialization-assignment-heading" className="ld-cardTitle">Choose your specialization</h2>
      <p className="ld-mutedLine">A request is reviewed by authorized program staff before it becomes an assignment.</p>
      <p role="status" aria-live="polite">{statusLabel(latestRequest, assignment)}</p>
      {error && <p role="alert">{error}</p>}
      {message && <p role="status" aria-live="polite">{message}</p>}
      <form onSubmit={submitRequest}>
        <fieldset>
          <legend>Grade 11 specialization options</legend>
          {options.map((option) => (
            <label key={option.specialization_id} style={{ display: "block", margin: "0.65rem 0" }}>
              <input type="radio" name="specialization" value={option.specialization_id} checked={selected === option.specialization_id} onChange={(event) => setSelected(event.target.value)} /> {option.title}
            </label>
          ))}
        </fieldset>
        <label htmlFor="specialization-rationale">Why are you interested? (optional)</label>
        <textarea id="specialization-rationale" value={rationale} maxLength={1000} onChange={(event) => setRationale(event.target.value)} rows={3} style={{ display: "block", width: "100%", margin: "0.5rem 0" }} />
        <button type="submit" className="ld-btn ld-btnPrimary" disabled={!selected}>Request this specialization</button>
      </form>
      {auth.hasPermission(ASSIGN_PERMISSION) && pending.length > 0 && (
        <div style={{ marginTop: "1.25rem" }}>
          <h3>Pending confirmations</h3>
          {pending.map((request) => (
            <div key={request.request_id} style={{ borderTop: "1px solid currentColor", padding: "0.75rem 0" }}>
              <p><strong>{request.learner_id}</strong> requested <strong>{request.requested_specialization_id}</strong></p>
              <label htmlFor={`confirm-${request.request_id}`}>Confirmed specialization</label>
              <select id={`confirm-${request.request_id}`} value={staffChoices[request.request_id] || request.requested_specialization_id} onChange={(event) => setStaffChoices((current) => ({ ...current, [request.request_id]: event.target.value }))}>
                {options.map((option) => <option key={option.specialization_id} value={option.specialization_id}>{option.title}</option>)}
              </select>
              <button type="button" className="ld-btn ld-btnPrimary" onClick={() => confirmRequest(request.request_id, staffChoices[request.request_id] || request.requested_specialization_id)}>Confirm assignment</button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
