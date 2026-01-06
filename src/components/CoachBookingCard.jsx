// src/components/CoachBookingCard.jsx
import React from "react";
import { track } from "../utils/analytics.js";

// Safe shim: use credit layer if present, else no-op (or dev event)
function earn(detail) {
  try {
    if (window.shfCredit?.earn) return window.shfCredit.earn(detail);
    window.dispatchEvent(new CustomEvent("shf-credit-earn", { detail }));
  } catch {}
}

export default function CoachBookingCard({
  pathway = {},
  onBooked = () => {},
}) {
  const [open, setOpen] = React.useState(false);

  function pick(durationMinutes) {
    try {
      track("coach_booking_requested", {
        duration: durationMinutes,
        pathwayId: pathway?.id || null,
      });
    } catch {}

    // Credit: coaching engagement
    earn({
      action: "coach.booking",
      rewards: { heart: 1 },
      scoreDelta: 5,
      meta: { duration: durationMinutes, pathwayId: pathway?.id || null },
    });

    setOpen(false);
    onBooked({ duration: durationMinutes, pathwayId: pathway?.id || null });

    // Open your scheduler (replace with your org’s link or per-pathway URL)
    const url =
      pathway?.coachBookingUrl || "https://calendly.com/your-org/career-coach";
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {}
  }

  return (
    <section className="card card--pad" aria-label="Coach booking">
      <div className="sh-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <strong>Coach booking</strong>
        <button
          type="button"
          className="sh-btn sh-btn--secondary"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open ? "true" : "false"}
          aria-controls="coach-booking-options"
        >
          {open ? "Close" : "Book"}
        </button>
      </div>

      {open && (
        <div id="coach-booking-options" style={{ marginTop: 8, display: "grid", gap: 8 }}>
          <button type="button" className="sh-btn" onClick={() => pick(30)}>
            Book 30 min
          </button>
          <button type="button" className="sh-btn" onClick={() => pick(60)}>
            Book 60 min
          </button>
          <p className="subtle" style={{ margin: 0 }}>Opens scheduling in a new tab.</p>
        </div>
      )}
    </section>
  );
}
/* --- SHF: Coach booking & attendance micro-awards --- */
(() => {
  if (typeof window === "undefined") return;
  if (window.__shfHook_coachEvents) return;
  window.__shfHook_coachEvents = true;

  const once = (key) => {
    const tag = `shf.award.${key}`;
    if (localStorage.getItem(tag)) return false;
    localStorage.setItem(tag, String(Date.now()));
    return true;
  };

  // Award on booking (once per bookingId)
  window.addEventListener("coach:booked", (e) => {
    const { bookingId, coachId } = (e && e.detail) || {};
    if (!bookingId || !once(`coach.booked.${bookingId}`)) return;
    try {
      window.shfCredit?.earn?.({
        action: "coach.booking",
        rewards: { wheat: 1 }, // 🌾
        scoreDelta: 6,
        meta: { bookingId, coachId }
      });
      window.shToast?.("📅 Coaching booked · +1 🌾 · +6 score");
    } catch {}
  });

  // Award on attended (once per bookingId)
  window.addEventListener("coach:attended", (e) => {
    const { bookingId, minutes = 0 } = (e && e.detail) || {};
    if (!bookingId || !once(`coach.attended.${bookingId}`)) return;
    try {
      window.shfCredit?.earn?.({
        action: "coach.attended",
        rewards: { heart: 1 }, // ❤️
        scoreDelta: 8,
        meta: { bookingId, minutes }
      });
      window.shToast?.("🎧 Session attended · +1 ❤️ · +8 score");
    } catch {}
  });

  // Optional helpers you can call from UI:
  window.shfAward = Object.assign({}, window.shfAward || {}, {
    coachBooked:   (bookingId, coachId) => window.dispatchEvent(new CustomEvent("coach:booked",   { detail: { bookingId, coachId } })),
    coachAttended: (bookingId, minutes) => window.dispatchEvent(new CustomEvent("coach:attended", { detail: { bookingId, minutes } }))
  });
})();
