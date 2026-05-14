import React from "react";
import { approveZoom, denyZoom, getApproved, getPending } from "@/utils/zoomAccess.js";
import { track } from "@/utils/analytics.js";

export default function AdminZoom(){
  const [pending, setPending] = React.useState(getPending());
  const [approved, setApproved] = React.useState(getApproved());

  React.useEffect(() => {
    const onStorage = (e) => {
      if (!e || !e.key) return;
      if (e.key.includes("zoom:")) {
        setPending(getPending());
        setApproved(getApproved());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function doApprove(u){
    const r = approveZoom(u.userId || u);
    setPending(r.pending); setApproved(r.approved);
    track("zoom_approved", { userId: u.userId || u });
  }
  function doDeny(u){
    const r = denyZoom(u.userId || u);
    setPending(r.pending); setApproved(r.approved);
    track("zoom_denied", { userId: u.userId || u });
  }

  return (
    <div style={sx.page}>
      <header style={sx.header}>
        <h1 style={sx.h1}>Zoom Access</h1>
        <div style={sx.muted}>Approve/deny student access to join Zoom to control costs.</div>
      </header>

      <section style={sx.card}>
        <div style={sx.cardHead}>
          <h3 style={sx.cardTitle}>Pending Approvals</h3>
          <span style={sx.muted}>{pending.length} waiting</span>
        </div>

        {pending.length === 0 ? (
          <div style={sx.muted}>No pending requests right now.</div>
        ) : (
          <div style={{ display:"grid", gap:8 }}>
            {pending.map((p) => (
              <div key={p.id} style={sx.row}>
                <div style={{ display:"grid" }}>
                  <b>{p.name || p.userId}</b>
                  <span style={sx.muted}>requested {new Date(p.when).toLocaleString()}</span>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button style={sx.btn} onClick={()=>doApprove(p)}>Approve</button>
                  <button style={sx.btnGhost} onClick={()=>doDeny(p)}>Deny</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={sx.card}>
        <div style={sx.cardHead}>
          <h3 style={sx.cardTitle}>Approved Users</h3>
          <span style={sx.muted}>{approved.length} total</span>
        </div>
        {approved.length === 0 ? (
          <div style={sx.muted}>Nobody is approved yet.</div>
        ) : (
          <ul style={{ margin:0, paddingLeft:16 }}>
            {approved.map((id) => (
              <li key={id} style={{ display:"flex", alignItems:"center", gap:8 }}>
                <code style={sx.code}>{id}</code>
                <button style={sx.btnTiny} onClick={()=>doDeny(id)} title="Revoke">Revoke</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const sx = {
  page: { padding:16, background:"#f6f3ed", minHeight:"100vh", color:"#0f172a", fontFamily:"Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif" },
  header: { display:"flex", alignItems:"baseline", justifyContent:"space-between", gap:12, flexWrap:"wrap", marginBottom:12 },
  h1: { margin:0, fontSize:22, fontWeight:800 },
  muted: { color:"#6b7280", fontSize:13 },
  card: { background:"#fff", border:"1px solid #e6e4de", borderRadius:12, padding:12, boxShadow:"0 2px 6px rgba(0,0,0,.04)", marginBottom:12 },
  cardHead: { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 },
  cardTitle: { margin:0, fontSize:14, fontWeight:800 },
  row: { display:"grid", gridTemplateColumns:"1fr auto", gap:10, alignItems:"center", border:"1px solid #f1eee8", borderRadius:10, padding:10, background:"#fff" },
  btn: { border:"1px solid #dcd7ce", background:"#fff", padding:"8px 10px", borderRadius:10, cursor:"pointer", fontWeight:700 },
  btnGhost: { border:"1px solid #e7e5e4", background:"#fafaf9", padding:"8px 10px", borderRadius:10, cursor:"pointer", fontWeight:700 },
  btnTiny: { border:"1px solid #e6e4de", background:"#fff", padding:"4px 8px", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:700 },
  code: { fontSize:12, background:"#0f172a", color:"#fff", padding:"2px 6px", borderRadius:6 },
};
