import React from "react";
import { Link, useParams } from "react-router-dom";
import { resolveDevUserId } from "@/lib/liveLearning/api.js";
import "@/styles/curriculum-operations.css";

export default function StaffProjectReview() {
  const { submissionId } = useParams();
  const [state, setState] = React.useState({ status: "idle", message: "" });
  async function decide(status) {
    setState({ status: "loading", message: "" });
    const response = await fetch(`/api/project-submissions/${encodeURIComponent(submissionId)}/review`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer dev-token:${resolveDevUserId("instructor")}` }, body: JSON.stringify({ status }) });
    const body = await response.json().catch(() => ({}));
    setState(response.ok ? { status: "ready", message: `Review recorded: ${body?.data?.status || status}` } : { status: "error", message: body?.error?.code || "Review was not authorized." });
  }
  return <main className="ops-page"><header className="ops-header"><div><p className="ops-eyebrow">Project Review</p><h1>Submission review</h1><p>Canonical Project lifecycle action.</p></div><Link className="ops-secondary" to="/curriculum/instructor/operations">Back to workspace</Link></header><section className="ops-panel"><p>Submission: <strong>{submissionId}</strong></p><div className="ops-actions"><button type="button" className="ops-primary" disabled={state.status === "loading"} onClick={() => decide("ACCEPTED")}>Accept</button><button type="button" className="ops-secondary" disabled={state.status === "loading"} onClick={() => decide("NEEDS_REVISION")}>Return</button></div>{state.message && <p role={state.status === "error" ? "alert" : "status"}>{state.message}</p>}</section></main>;
}
