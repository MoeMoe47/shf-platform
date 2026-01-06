// src/components/ZoomCard.jsx
import React from "react";
import { useCreditCtx } from "@/context/CreditContext.jsx";

export default function ZoomCard({ meeting }) {
  const credit = useCreditCtx();
  const mtg = meeting || { id: "zoom-555", title: "Live Lesson", url: "#", when: "Today 3:30 PM" };

  function joinAndCheckIn() {
    try {
      credit?.earn?.({
        action: "calendar.checkin",
        rewards: { corn: 1 },
        scoreDelta: 1,
        meta: { eventId: mtg.id, title: mtg.title, via: "zoom" }
      });
      window.dispatchEvent(new CustomEvent("calendar:checkin", { detail: { eventId: mtg.id, title: mtg.title }}));
      window.shToast?.(`🎥 Joined: ${mtg.title} · +1 🌽 · +1 score`);
    } catch {}
    // window.open(mtg.url, "_blank", "noopener,noreferrer"); // real join
  }

  return (
    <section className="card card--pad" role="region" aria-labelledby="zoom-card-title">
      <h3 id="zoom-card-title" className="h4" style={{ marginTop: 0 }}>Zoom session</h3>
      <div className="subtle">{mtg.title} — {mtg.when}</div>
      <div className="sh-actionsRow" style={{ marginTop: 8 }}>
        <button className="sh-btn" onClick={joinAndCheckIn}>Join / Check-in</button>
      </div>
    </section>
  );
}
