// src/components/ZoomCard.jsx
//
// Phase 1 Zoom/live-learning restoration (SHF Curriculum Infrastructure
// Audit §28-30): this card's real external join call was already disabled
// (the `window.open(mtg.url, ...)` line was commented out with "// real
// join") because there is no real backend Zoom API/SDK/OAuth integration
// anywhere in the repo — access approval today is localStorage-only
// (src/utils/zoomAccess.js), which is not real authorization for a live
// meeting. This restores the card's reachability with HONEST messaging
// about that state instead of a silently-inert button, and still does not
// call window.open. See LiveSessions.jsx for where this is now mounted.
import React from "react";
import { useCreditCtx } from "@/context/CreditContext.jsx";

export default function ZoomCard({ meeting }) {
  const credit = useCreditCtx();
  const mtg = meeting || { id: "zoom-555", title: "Live Lesson", url: "#", when: "Today 3:30 PM" };

  function checkIn() {
    try {
      credit?.earn?.({
        action: "calendar.checkin",
        rewards: { corn: 1 },
        scoreDelta: 1,
        meta: { eventId: mtg.id, title: mtg.title, via: "zoom" }
      });
      window.dispatchEvent(new CustomEvent("calendar:checkin", { detail: { eventId: mtg.id, title: mtg.title }}));
      window.shToast?.(`✅ Checked in: ${mtg.title} · +1 🌽 · +1 score`);
    } catch {}
    // Deliberately does NOT call window.open(mtg.url, ...) — see file
    // header. Real external launch stays disabled until a secure backend
    // provider integration exists (Phase 2).
  }

  return (
    <section className="card card--pad" role="region" aria-labelledby="zoom-card-title">
      <h3 id="zoom-card-title" className="h4" style={{ marginTop: 0 }}>Live session (Zoom)</h3>
      <div className="subtle">{mtg.title} — {mtg.when}</div>
      <p className="subtle" style={{ marginTop: 8, marginBottom: 0 }}>
        Live session integration pending secure connection.
      </p>
      <div className="sh-actionsRow" style={{ marginTop: 8 }}>
        <button className="sh-btn" onClick={checkIn}>Check in for this session</button>
      </div>
    </section>
  );
}
