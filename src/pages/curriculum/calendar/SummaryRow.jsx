// src/pages/curriculum/calendar/SummaryRow.jsx
//
// Four compact summary cards, all computed from the same real aggregated
// event list the calendar itself uses (no separate/duplicate data path).
//
// SHF Ecosystem Phase 10: Weekly Load now prefers the canonical backend
// Calendar Intelligence Engine's real, typed component counts (scheduled
// events, required deadlines, major deadlines — see
// apps/shs-api/.../calendar-intelligence-service.ts) over the local,
// type-blind "any event this week" count this card used before. The four
// display buckets (Light/Balanced/Busy/Heavy) and their thresholds are
// unchanged — only the input became real classified data instead of a raw
// count — so this remains a transparent capacity heuristic, never a
// medical/psychological assessment. If Intelligence hasn't loaded yet (or
// failed), this card falls back to the original local event-count
// heuristic rather than blanking — a derived-advice feature degrading
// gracefully, never taking the whole summary row down with it.
import React from "react";
import { parseLocalDate, startOfDay, addDays } from "@/pages/career/calendar/dateUtils.js";

const LOAD_LABEL_BY_CATEGORY = {
  LOW: { label: "Light", pct: 25 },
  MODERATE: { label: "Balanced", pct: 50 },
  HIGH: { label: "Busy", pct: 75 },
  VERY_HIGH: { label: "Heavy", pct: 100 },
};

function loadLabelFor(count) {
  if (count <= 2) return { label: "Light", pct: 25 };
  if (count <= 5) return { label: "Balanced", pct: 50 };
  if (count <= 8) return { label: "Busy", pct: 75 };
  return { label: "Heavy", pct: 100 };
}

export default function SummaryRow({ events, today, intelligence }) {
  const stats = React.useMemo(() => {
    const todayStart = startOfDay(today);
    const weekEnd = addDays(todayStart, 7);

    const todaysEvents = events.filter((evt) => {
      const d = parseLocalDate(evt.start);
      return d && startOfDay(d).getTime() === todayStart.getTime();
    });
    const liveToday = todaysEvents.filter((e) => e.type === "instructor").length;
    const assignmentsToday = todaysEvents.filter((e) => e.type === "assignment").length;

    const dueThisWeek = events.filter((evt) => {
      if (!evt.dueDate) return false;
      const d = parseLocalDate(evt.dueDate);
      return d && startOfDay(d) >= todayStart && startOfDay(d) < weekEnd;
    });
    const assignmentsDue = dueThisWeek.filter((e) => e.type === "assignment").length;
    const opportunitiesDue = dueThisWeek.filter((e) => e.type === "opportunity").length;

    const opportunities = events.filter((evt) => {
      if (evt.type !== "opportunity" || !evt.dueDate) return false;
      const d = parseLocalDate(evt.dueDate);
      return d && startOfDay(d) >= todayStart;
    });

    const weekEvents = events.filter((evt) => {
      const d = parseLocalDate(evt.start);
      return d && startOfDay(d) >= todayStart && startOfDay(d) < weekEnd;
    });
    const weeklyLoad = intelligence?.weeklyLoad;
    const load = weeklyLoad ? LOAD_LABEL_BY_CATEGORY[weeklyLoad.category] : loadLabelFor(weekEvents.length);
    const loadDetail = weeklyLoad
      ? [
          weeklyLoad.scheduledEventCount ? `${weeklyLoad.scheduledEventCount} scheduled` : null,
          weeklyLoad.requiredDeadlineCount ? `${weeklyLoad.requiredDeadlineCount} deadline${weeklyLoad.requiredDeadlineCount === 1 ? "" : "s"}` : null,
          weeklyLoad.presentationCount ? `${weeklyLoad.presentationCount} presentation${weeklyLoad.presentationCount === 1 ? "" : "s"}` : null,
        ].filter(Boolean).join(" · ") || null
      : null;

    return {
      todayCount: todaysEvents.length,
      liveToday,
      assignmentsToday,
      dueThisWeekCount: dueThisWeek.length,
      assignmentsDue,
      opportunitiesDue,
      opportunitiesCount: opportunities.length,
      load,
      loadDetail,
      conflictCount: intelligence?.conflicts?.length || 0,
    };
  }, [events, today, intelligence]);

  return (
    <div className="lc-summaryRow">
      <div className="lc-summaryCard">
        <span className="lc-summaryIcon lc-summaryIcon--today" aria-hidden="true">📅</span>
        <div className="lc-summaryBody">
          <span className="lc-summaryLabel">Today</span>
          <span className="lc-summaryValue">{stats.todayCount} event{stats.todayCount === 1 ? "" : "s"}</span>
          <span className="lc-summaryDetail">
            {stats.todayCount === 0
              ? "Nothing scheduled"
              : [
                  stats.liveToday ? `${stats.liveToday} live session${stats.liveToday === 1 ? "" : "s"}` : null,
                  stats.assignmentsToday ? `${stats.assignmentsToday} assignment${stats.assignmentsToday === 1 ? "" : "s"} due` : null,
                ].filter(Boolean).join(" · ") || "See agenda for details"}
          </span>
        </div>
      </div>

      <div className="lc-summaryCard">
        <span className="lc-summaryIcon lc-summaryIcon--due" aria-hidden="true">✅</span>
        <div className="lc-summaryBody">
          <span className="lc-summaryLabel">Due This Week</span>
          <span className="lc-summaryValue">{stats.dueThisWeekCount} item{stats.dueThisWeekCount === 1 ? "" : "s"}</span>
          <span className="lc-summaryDetail">
            {stats.dueThisWeekCount === 0
              ? "You're caught up"
              : [
                  stats.assignmentsDue ? `${stats.assignmentsDue} assignment${stats.assignmentsDue === 1 ? "" : "s"}` : null,
                  stats.opportunitiesDue ? `${stats.opportunitiesDue} deadline${stats.opportunitiesDue === 1 ? "" : "s"}` : null,
                ].filter(Boolean).join(" · ") || "See deadlines below"}
          </span>
        </div>
      </div>

      <div className="lc-summaryCard">
        <span className="lc-summaryIcon lc-summaryIcon--opportunity" aria-hidden="true">⭐</span>
        <div className="lc-summaryBody">
          <span className="lc-summaryLabel">Opportunities</span>
          <span className="lc-summaryValue">{stats.opportunitiesCount} deadline{stats.opportunitiesCount === 1 ? "" : "s"}</span>
          <span className="lc-summaryDetail">
            {stats.opportunitiesCount === 0 ? "None open right now" : "See Opportunity Radar"}
          </span>
        </div>
      </div>

      <div className="lc-summaryCard">
        <span className="lc-summaryIcon lc-summaryIcon--load" aria-hidden="true">📊</span>
        <div className="lc-summaryBody">
          <span className="lc-summaryLabel">Weekly Load</span>
          <span className="lc-summaryValue">{stats.load.label}</span>
          <span className="lc-loadBar" role="img" aria-label={`Weekly load: ${stats.load.label}`}>
            <span className="lc-loadBarFill" style={{ width: `${stats.load.pct}%` }} />
          </span>
          {/* SHF Ecosystem Phase 10 — transparent, factual breakdown from
              real typed components (never a fabricated percentage claim)
              plus an honest schedule-conflict count. Text/icon-based, not
              color-only, per the phase's accessibility requirement. */}
          {stats.loadDetail && <span className="lc-summaryDetail">{stats.loadDetail}</span>}
          {stats.conflictCount > 0 && (
            <span className="lc-summaryDetail lc-summaryDetail--conflict">
              <span aria-hidden="true">⚠️</span> {stats.conflictCount} schedule conflict{stats.conflictCount === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
