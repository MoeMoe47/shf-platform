import React from "react";
export default function CoachCopilot({ onAccept }) {
  const [role, setRole] = React.useState("IT Support Specialist");
  const [draft, setDraft] = React.useState("");

  function makeDraft() {
    setDraft(
`Hello Hiring Team,

I'm applying for the ${role} role. In my recent project, I resolved queue backlogs and improved first-contact resolution by 18%. I attached a short artifact demonstrating ticket triage and network basics.

Thank you,
Jordan`
    );
  }

  return (
    <div className="card card--pad">
      <h3 style={{ marginTop: 0 }}>Coach Copilot</h3>
      <label className="db-subtitle">Target role</label>
      <input className="sh-input" value={role} onChange={e => setRole(e.target.value)} />
      <div style={{ marginTop: 8 }}>
        <button className="btn btn--primary" onClick={makeDraft}>Draft outreach</button>
      </div>
      {draft && (
        <div className="wash" style={{ marginTop: 10, padding: 10, borderRadius: 10 }}>
          <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{draft}</pre>
          <div style={{ marginTop: 8 }}>
            <button className="btn" onClick={() => onAccept?.(draft)}>Save to portfolio</button>
          </div>
        </div>
      )}
    </div>
  );
}
