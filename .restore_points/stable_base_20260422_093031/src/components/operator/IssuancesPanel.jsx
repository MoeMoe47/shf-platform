import React from "react";

const API_BASE = "http://127.0.0.1:8000";

export default function IssuancesPanel() {
  const [contractCode, setContractCode] = React.useState("JOB_UI_ISSUE_TEST");
  const [participantId, setParticipantId] = React.useState("");
  const [evidenceRoot, setEvidenceRoot] = React.useState("");
  const [operator, setOperator] = React.useState("operator_admin");

  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  async function issueCredit() {
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${API_BASE}/api/v1/operator/issuances/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contract_code: contractCode,
          participant_id: participantId,
          evidence_root_hash: evidenceRoot,
          operator_id: operator,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Issuance failed");
      }

      setSuccess(`Credit issued: ${data.issuance_id}`);
      setParticipantId("");
      setEvidenceRoot("");
    } catch (err) {
      setError(err.message);
    }

    setBusy(false);
  }

  return (
    <section
      style={{
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 16,
        padding: 16,
        background: "rgba(255,255,255,0.04)",
        overflow: "hidden",
        minWidth: 0,
      }}
    >
      <h3 style={{ marginTop: 0 }}>Issue Credit</h3>

      <div style={{ display: "grid", gap: 10 }}>
        <input
          placeholder="Contract Code"
          value={contractCode}
          onChange={(e) => setContractCode(e.target.value)}
          style={{ width: "100%", minWidth: 0, boxSizing: "border-box" }}
        />

        <input
          placeholder="Participant ID"
          value={participantId}
          onChange={(e) => setParticipantId(e.target.value)}
          style={{ width: "100%", minWidth: 0, boxSizing: "border-box" }}
        />

        <input
          placeholder="Evidence Root Hash"
          value={evidenceRoot}
          onChange={(e) => setEvidenceRoot(e.target.value)}
          style={{
            width: "100%",
            minWidth: 0,
            boxSizing: "border-box",
            fontFamily: "monospace",
            fontSize: 12,
          }}
        />

        <input
          placeholder="Operator"
          value={operator}
          onChange={(e) => setOperator(e.target.value)}
          style={{ width: "100%", minWidth: 0, boxSizing: "border-box" }}
        />

        <button
          onClick={issueCredit}
          disabled={busy}
          style={{ width: "100%", boxSizing: "border-box" }}
        >
          {busy ? "Issuing..." : "Issue Credit"}
        </button>

        {error ? (
          <div style={{ color: "#ff6b6b", wordBreak: "break-word", overflowWrap: "anywhere" }}>
            {error}
          </div>
        ) : null}

        {success ? (
          <div style={{ color: "#4ade80", wordBreak: "break-word", overflowWrap: "anywhere" }}>
            {success}
          </div>
        ) : null}
      </div>
    </section>
  );
}
