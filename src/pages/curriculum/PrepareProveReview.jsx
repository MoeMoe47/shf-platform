import React from "react";
import { useParams } from "react-router-dom";
import { resolveDevUserId } from "@/lib/liveLearning/api.js";

function authHeaders() { return { "Content-Type": "application/json", Authorization: `Bearer dev-token:${resolveDevUserId("instructor")}` }; }

export default function PrepareProveReview() {
  const { evidenceId } = useParams();
  const [packet, setPacket] = React.useState(null);
  const [message, setMessage] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    fetch(`/api/prepare-prove/evidence/${encodeURIComponent(evidenceId)}`, { credentials: "include", cache: "no-store", headers: authHeaders() })
      .then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body?.error?.code || "Evidence unavailable"); return body.data; })
      .then((data) => { if (active) setPacket(data); })
      .catch((error) => { if (active) setMessage(error.message); });
    return () => { active = false; };
  }, [evidenceId]);

  async function decide(decision) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/prepare-prove/evidence/${encodeURIComponent(evidenceId)}/review`, {
        method: "POST", credentials: "include", headers: authHeaders(), body: JSON.stringify({ decision }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.code || "Review was not recorded");
      setMessage(`Review recorded: ${body.data.decision}`);
    } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  }

  if (message && !packet) return <main className="card card--pad"><h1>Evidence Review</h1><p role="alert">{message}</p></main>;
  if (!packet) return <main className="card card--pad"><h1>Evidence Review</h1><p role="status">Loading evidence…</p></main>;
  const criteria = packet.competency?.criteria_json?.criteria || [];
  return (
    <main className="card card--pad" data-testid="prepare-prove-review" style={{ minWidth: 0, maxWidth: "100%", boxSizing: "border-box", overflow: "hidden" }}>
      <h1>Evidence Review</h1>
      <p>Review the learner evidence against the defined criteria. This action creates an auditable institutional decision.</p>
      <h2>{packet.competency?.title}</h2>
      <p>Criteria version {packet.competency?.version}</p>
      <section aria-labelledby="review-criteria-heading"><h3 id="review-criteria-heading">Criteria</h3><ul>{criteria.map((item) => <li key={item}>{item}</li>)}</ul></section>
      <section aria-labelledby="review-source-heading"><h3 id="review-source-heading">Source result</h3><pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", maxWidth: "100%", overflowX: "auto" }}>{JSON.stringify(packet.result?.result_json, null, 2)}</pre></section>
      <p>Evidence status: {packet.evidence.status}</p>
      <div><button type="button" onClick={() => decide("DEMONSTRATED")} disabled={busy}>Record demonstrated</button>{" "}<button type="button" onClick={() => decide("EVIDENCE_INSUFFICIENT")} disabled={busy}>Record insufficient evidence</button></div>
      {message && <p role="status" aria-live="polite">{message}</p>}
    </main>
  );
}
