import React from "react";
import { listProofs, setProofStatus } from "@/shared/external/proofStore.js";
import partners from "@/data/partners.json";
import { awardEvu, mintBadge } from "@/shared/ledger/badgeHooks.js";

function useProofs() {
  const [rows, setRows] = React.useState([]);
  const refresh = React.useCallback(() => setRows(listProofs()), []);
  React.useEffect(() => { refresh(); }, [refresh]);
  return { rows, refresh };
}
const getCourse = (id) => partners.find(p => p.id === id);

export default function Verifier() {
  const { rows, refresh } = useProofs();
  const [busy, setBusy] = React.useState(null);

  async function approve(id) {
    try {
      setBusy(id);
      const rec = rows.find(r => r.id === id);
      const course = getCourse(rec.courseId);
      if (course?.evu) await awardEvu({ userId: rec.userId, courseId: rec.courseId, evu: course.evu });
      await mintBadge({ userId: rec.userId, courseId: rec.courseId });
      setProofStatus(id, "approved");
    } finally {
      setBusy(null);
      refresh();
    }
  }
  function deny(id){ setProofStatus(id,"denied"); refresh(); }

  return (
    <div className="pl-wrap">
      <header className="pl-head">
        <h1 className="pl-title">External Proof Verifier</h1>
        <p className="pl-sub">Approve external completions and award EVUs/badges. <span className="pl-chip">International Orange</span></p>
      </header>

      <section className="pl-card">
        <div className="pl-toolbar">
          <strong>Queue</strong>
          <span style={{color:"#64748b"}}>{rows.length} item(s)</span>
        </div>
        <table className="pl-table">
          <thead>
            <tr>
              <th>Student</th><th>Course</th><th>Method</th><th>Submitted</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan="6" style={{padding:18,opacity:.7}}>No proofs yet.</td></tr>
            )}
            {rows.map(r=>{
              const c = getCourse(r.courseId);
              return (
                <tr key={r.id}>
                  <td>{r.userId}</td>
                  <td>{c?.title || r.courseId}</td>
                  <td>{r.method}</td>
                  <td>{new Date(r.submittedAt).toLocaleString()}</td>
                  <td className={`pl-status ${r.status}`}>{r.status}</td>
                  <td>
                    <div className="pl-actions">
                      <button className="btn btn-ok" onClick={()=>approve(r.id)} disabled={busy===r.id}>Approve</button>
                      <button className="btn btn-no" onClick={()=>deny(r.id)} disabled={busy===r.id}>Deny</button>
                      {r.method==="certificate-url" && r.payload?.url && (
                        <a className="btn btn-dark" href={r.payload.url} target="_blank" rel="noreferrer">Open Proof</a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
