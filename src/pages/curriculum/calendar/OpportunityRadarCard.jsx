// src/pages/curriculum/calendar/OpportunityRadarCard.jsx
//
// Aggregates "opportunity"-type events. As of SHF Ecosystem Phase 4 these
// are real Opportunity application-deadline projections from
// useLearningCalendarEvents.js's mapOpportunityDeadline() (backed by
// apps/shs-api's /opportunities, entitlement-filtered server-side) — no
// component change was needed here since this card has always read the
// generic merged `events` array, filtered by type, rather than importing
// demo fixtures directly. "View all" still links to the Store Catalog:
// no dedicated Opportunities list page exists yet, and building one is
// out of scope this phase (no new visual surfaces, Calendar/Curriculum
// design is locked).
import React from "react";
import { parseLocalDate, startOfDay } from "@/pages/career/calendar/dateUtils.js";

const LIMIT = 5;

export default function OpportunityRadarCard({ events, today, onOpenEvent }) {
  const opportunities = React.useMemo(() => {
    const todayStart = startOfDay(today);
    return events
      .filter((evt) => evt.type === "opportunity")
      .filter((evt) => {
        const d = parseLocalDate(evt.dueDate || evt.start);
        return d && startOfDay(d) >= todayStart;
      })
      .sort((a, b) => parseLocalDate(a.dueDate || a.start) - parseLocalDate(b.dueDate || b.start))
      .slice(0, LIMIT);
  }, [events, today]);

  return (
    <section className="lc-railCard" aria-labelledby="lc-opportunity-title">
      <div className="lc-railCardHead">
        <h2 id="lc-opportunity-title" className="lc-railCardTitle">Opportunity Radar</h2>
        <a className="lc-railViewAll" href="/store.html#/catalog">
          View all
        </a>
      </div>
      {opportunities.length === 0 ? (
        <p className="lc-railEmpty">No upcoming opportunities match your current pathway.</p>
      ) : (
        <ul className="lc-plainList">
          {opportunities.map((evt) => {
            const d = parseLocalDate(evt.dueDate || evt.start);
            return (
              <li key={evt.id}>
                <button type="button" className="lc-plainRow" onClick={() => onOpenEvent(evt)}>
                  <span className="lc-typeDot" style={{ "--chip-color": "var(--cal-type-opportunity)" }} aria-hidden="true" />
                  <span className="lc-plainRowTitle">{evt.title}</span>
                  <span className="lc-plainRowDate">{d ? d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : ""}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
