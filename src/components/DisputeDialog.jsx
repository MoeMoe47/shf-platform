// src/components/DisputeDialog.jsx
import React from "react";
import { useCreditCtx } from "@/context/CreditContext.jsx";

export default function DisputeDialog({ open = false, row = null, onClose = () => {} }) {
  const { openDispute } = useCreditCtx() || {};
  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    if (open) setReason("");
  }, [open]);

  if (!open || !row) return null;

  const submit = (e) => {
    e.preventDefault();
    const r = reason.trim();
    if (!r) return;
    try {
      openDispute?.({ targetId: row.id, reason: r });
      onClose();
      alert("Dispute submitted.");
    } catch (err) {
      console.error(err);
      alert("Could not submit dispute.");
    }
  };

  return (
    <>
      <div className="app-scrim is-visible" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Open a dispute"
        className="card card--pad"
        style={{
          position: "fixed", inset: "20% 0 0 0", margin: "0 auto", maxWidth: 520,
          zIndex: 60, background: "#fff", border: "1px solid var(--ring,#e5e7eb)", borderRadius: 12
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sh-row" style={{ alignItems: "center" }}>
          <h3 className="h4" style={{ margin: 0 }}>Open dispute</h3>
          <div style={{ flex: 1 }} />
          <button className="sh-btn sh-btn--secondary" onClick={onClose}>✕</button>
        </div>

        <p className="subtle" style={{ marginTop: 8 }}>
          You’re disputing: <strong>{row.action}</strong> · <small>{new Date(row.ts).toLocaleString()}</small>
        </p>

        <form onSubmit={submit} style={{ display: "grid", gap: 8, marginTop: 8 }}>
          <label className="subtle" htmlFor="dispute-reason">Reason</label>
          <textarea
            id="dispute-reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="sh-input"
            placeholder="Explain what seems wrong or inaccurate…"
            required
          />
          <div className="sh-actionsRow" style={{ marginTop: 6 }}>
            <button className="sh-btn" type="submit">Submit dispute</button>
            <button className="sh-btn sh-btn--secondary" type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </>
  );
}
