import React from "react";
import { useParams, Link } from "react-router-dom";

export default function Calendar() {
  const { curriculum = "asl" } = useParams();

  // Placeholder “upcoming” items; replace with real calendar feed later
  const items = [
    { id: "live-1",  date: "Sep 18", time: "9:00 AM",  kind: "live",       title: "Live Class — Module 1" },
    { id: "ws-1",    date: "Sep 19", time: "1:00 PM",  kind: "milestone",  title: "Workshop: Resume Polishing" },
    { id: "due-1",   date: "Sep 20", time: "11:59 PM", kind: "due",        title: "Module 1 Progress Check" },
    { id: "due-2",   date: "Sep 25", time: "11:59 PM", kind: "due",        title: "Quiz 1 Due" },
    { id: "info-1",  date: "Sep 26", time: "All day",  kind: "info",       title: "Office Hours (Drop-in)" },
  ];

  const chip = (k) =>
    k === "live" ? "sb-chip live"
    : k === "due" ? "sb-chip due"
    : k === "milestone" ? "sb-chip milestone"
    : "sb-chip info";

  return (
    <main className="app-main">
      <h1 style={{ marginTop: 0 }}>Calendar</h1>
      <p className="sh-muted">Sessions and deadlines for {curriculum.toUpperCase()}.</p>

      <section className="card card--pad" aria-labelledby="upcoming">
        <h2 id="upcoming" style={{ marginTop: 0 }}>Upcoming</h2>

        <ul className="sh-listReset" style={{ display: "grid", gap: 12 }}>
          {items.map(ev => (
            <li key={ev.id} className="sb-assignItem" style={{ borderBottom: "1px solid var(--line)" }}>
              <div className="sb-assignMain" style={{ cursor: "default" }}>
                <span className="sb-assignTitle">{ev.title}</span>
                <span className="sb-due">
                  <span className={chip(ev.kind)}>{ev.time}</span>
                  <span style={{ marginLeft: 8 }} className="sb-chip info">{ev.date}</span>
                </span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {ev.kind === "live" ? (
                  <button className="btn btn--small btn--primary">Join</button>
                ) : ev.kind === "due" ? (
                  <Link to={`/${curriculum}/assignments`} className="btn btn--small btn--primary">View</Link>
                ) : (
                  <button className="btn btn--small btn--secondary">Details</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
/* --- SHF: Calendar check-in / attendance --- */
(() => {
  if (typeof window === "undefined" || window.__shfHook_calendar) return; window.__shfHook_calendar = true;

  const once = (k) => { if (!k) return true; if (localStorage.getItem(k)) return false; localStorage.setItem(k,"1"); return true; };

  // on check-in for an event:
  //   window.dispatchEvent(new CustomEvent("calendar:checkin", { detail:{ eventId, title } }))
  window.addEventListener("calendar:checkin", (e) => {
    const d = (e && e.detail) || {};
    const key = d.eventId ? `shf.award.cal.${d.eventId}` : "";
    if (!once(key)) return;
    try {
      window.shfCredit?.earn?.({
        action: "calendar.checkin",
        rewards: { corn: 1 },
        scoreDelta: 2,
        meta: { eventId: d.eventId, title: d.title }
      });
      window.shToast?.("🗓️ Checked in · +1 🌽 · +2 score");
    } catch {}
  });
})();
