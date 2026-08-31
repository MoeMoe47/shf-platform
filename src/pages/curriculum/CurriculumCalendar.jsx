// src/pages/curriculum/CurriculumCalendar.jsx
//
// SHF Learning Calendar — rebuild. Reuses the existing approved SHF shell
// (CurriculumLayout → CurriculumSidebar/CurriculumHeader/SHFFooter, wired
// in src/router/CurriculumRoutes.jsx, unchanged by this file) and the
// real shared calendar engine already shipping in
// src/pages/career/calendar/* (event contract, date utils, Month/Week/
// Agenda views, filters, event-detail dialog) — extended, not duplicated,
// with a new "opportunity" event type and a Curriculum-owned real+demo
// event source (see useLearningCalendarEvents.js). See that file and
// career/calendar/adapters.js for exactly which sources are real vs.
// clearly-labeled demo data, and src/pages/curriculum/calendar/*.jsx for
// the new Smart Summary / Today / Deadlines / Opportunity Radar / Plan My
// Week / Journey Milestones pieces this rebuild adds.
//
// Ownership boundary: this page only ever projects source records into a
// read-only calendar view. It never marks a lesson/assignment/assessment
// complete, never manufactures attendance, and never invents a credential
// — those domains remain the sole owners of their own truth (see each new
// sub-component's own header comment for how it stays inside that line).
import React from "react";
import { useUser } from "@/context/UserContext.jsx";
import { EVENT_TYPE_META } from "@/pages/career/calendar/eventContract.js";
import { addDays, addMonths, buildEventsByDay, eventDateKey, formatMonthYear, formatWeekRange } from "@/pages/career/calendar/dateUtils.js";
import CalendarMonthView from "@/pages/career/calendar/CalendarMonthView.jsx";
import CalendarWeekView from "@/pages/career/calendar/CalendarWeekView.jsx";
import CalendarAgendaView from "@/pages/career/calendar/CalendarAgendaView.jsx";
import CalendarFilters from "@/pages/career/calendar/CalendarFilters.jsx";
import CalendarEventDetail from "@/pages/career/calendar/CalendarEventDetail.jsx";
import { useLearningCalendarEvents } from "./calendar/useLearningCalendarEvents.js";
import { useCalendarIntelligence } from "./calendar/useCalendarIntelligence.js";
import SummaryRow from "./calendar/SummaryRow.jsx";
import TodayPanel from "./calendar/TodayPanel.jsx";
import UpcomingDeadlinesCard from "./calendar/UpcomingDeadlinesCard.jsx";
import OpportunityRadarCard from "./calendar/OpportunityRadarCard.jsx";
import PlanMyWeekCard from "./calendar/PlanMyWeekCard.jsx";
import CalendarFeedSubscribe from "./calendar/CalendarFeedSubscribe.jsx";
import JourneyMilestones from "./calendar/JourneyMilestones.jsx";
import { unavailableSourcesMessage } from "@/pages/career/calendar/projectionAdapter.js";
import "@/styles/career-calendar.css";
import "@/styles/curriculum-calendar.css";
import "@/styles/curriculum-learning-calendar.css";

const VIEWS = [
  { id: "month", label: "Month" },
  { id: "week", label: "Week" },
  { id: "agenda", label: "Agenda" },
];

// SHF Ecosystem Phase 11.5 — this wording (and the source-label vocabulary
// it's built from) is now shared with every Calendar surface via
// projectionAdapter.js, so a source outage reads identically in
// Curriculum and Career rather than each app inventing its own copy.

// Matches the approved mock's filter row exactly. Portfolio/Mentoring/
// Arcade/Credentials remain real, registered filter groups (see
// eventContract.js) — just not surfaced as top-level chips here yet, per
// the build brief's own "only show filters backed by real event types /
// potential future filters: Projects, Community, Portfolio, Assessments"
// guidance. Their events still render on the calendar under "All".
const LEARNING_CALENDAR_FILTERS = [
  { id: "all", label: "All" },
  { id: "learning", label: "Learning" },
  { id: "live", label: "Live" },
  { id: "career", label: "Career" },
  { id: "assignments", label: "Assignments" },
  { id: "projects", label: "Projects" },
  { id: "opportunities", label: "Opportunities" },
  { id: "credentials", label: "Credentials" },
];

function useNarrowViewport() {
  const [narrow, setNarrow] = React.useState(() => typeof window !== "undefined" && window.innerWidth <= 900);
  React.useEffect(() => {
    const query = window.matchMedia("(max-width: 900px)");
    const onChange = () => setNarrow(query.matches);
    onChange();
    query.addEventListener?.("change", onChange);
    return () => query.removeEventListener?.("change", onChange);
  }, []);
  return narrow;
}

export default function CurriculumCalendar() {
  const { role } = useUser();
  const { loading, error, events, partial, unavailableSources, refresh } = useLearningCalendarEvents(role);
  // SHF Ecosystem Phase 10 — derived-advice only; see
  // useCalendarIntelligence.js. A null intelligence (still loading, or the
  // Intelligence endpoint failed) is handled by SummaryRow/PlanMyWeekCard
  // falling back to their pre-Phase-10 local behavior — this never blocks
  // or blanks the Calendar page itself.
  const { intelligence } = useCalendarIntelligence(role);
  const narrow = useNarrowViewport();
  const today = React.useMemo(() => new Date(), []);
  const [anchorDate, setAnchorDate] = React.useState(today);
  const [selectedDate, setSelectedDate] = React.useState(today);
  const [view, setView] = React.useState(() => (narrow ? "agenda" : "month"));
  const [filter, setFilter] = React.useState("all");
  const [openEvent, setOpenEvent] = React.useState(null);

  const filteredEvents = React.useMemo(() => {
    return events.filter((event) => filter === "all" || EVENT_TYPE_META[event.type]?.filterGroup === filter);
  }, [events, filter]);
  const eventsByDay = React.useMemo(() => buildEventsByDay(filteredEvents, eventDateKey), [filteredEvents]);

  const goToday = () => {
    const next = new Date();
    setAnchorDate(next);
    setSelectedDate(next);
  };
  const move = (amount) => setAnchorDate((date) => (view === "week" ? addDays(date, amount * 7) : addMonths(date, amount)));
  const periodLabel = view === "week" ? formatWeekRange(anchorDate) : formatMonthYear(anchorDate);

  return (
    <main className="app-main cal-page curriculum-calendar-page lc-page" aria-labelledby="curriculum-cal-title">
      {/* Final Polish pass (Phase 43C): a shared curriculum shell rule
          (curriculum-skin.css's `.app-main > *`) pads EVERY direct child
          of this <main> with 28px top / 64px bottom, meant for
          single-section pages. This page has four stacked sections
          (intro, summary row, calendar layout, milestones), so left
          un-wrapped that padding silently compounded at every section
          boundary — the real source of the page's excess vertical
          whitespace. Wrapping everything in one element makes this page
          match that rule's one-section assumption again; all spacing
          between the sections below is now controlled explicitly via
          .lc-pageBody's own child margins (see
          curriculum-learning-calendar.css), not left to chance. */}
      <div className="lc-pageBody">
      <div className="cal-pageHead">
        <div>
          <p className="cal-eyebrow">Curriculum</p>
          <h1 id="curriculum-cal-title" className="cal-pageTitle">Learning Calendar</h1>
          <p className="sh-muted cal-pageSub">
            Your lessons, deadlines, live learning, career events, and opportunities — all in one place.
          </p>
        </div>
      </div>

      {/* Summary cards render even when the main calendar fails to load,
          as long as the shared demo sources succeeded (see
          useLearningCalendarEvents.js's `partial` state) — Phase I: a
          single source failing must not blank the whole page. */}
      {!loading && events.length > 0 && <SummaryRow events={events} today={today} intelligence={intelligence} />}

      {/* Composition Lock (Phase 43B): the toolbar (Today/‹/›/period +
          Month/Week/Agenda) and the filter chip row used to render as two
          standalone full-width cards above the calendar, pushing the
          actual month grid far down the page. They now render as the
          header of the single Calendar workspace card (.cal-mainRegion)
          below, matching the approved mock's "one integrated calendar"
          composition — same controls, same handlers, no logic changed. */}
      <div className="cal-layout">
        <div className="cal-mainRegion lc-calendarCard">
          <div className="lc-calHeader">
            <div className="cal-toolbar">
              <div className="cal-toolbarNav">
                <button type="button" className="sh-btn sh-btn--soft" onClick={goToday}>Today</button>
                <button type="button" className="cal-iconBtn" onClick={() => move(-1)} aria-label={view === "week" ? "Previous week" : "Previous month"}>‹</button>
                <button type="button" className="cal-iconBtn" onClick={() => move(1)} aria-label={view === "week" ? "Next week" : "Next month"}>›</button>
                <span className="cal-periodLabel" aria-live="polite">{periodLabel}</span>
              </div>
              <div className="cal-viewSwitch" role="group" aria-label="Calendar view">
                {VIEWS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`cal-viewBtn ${view === item.id ? "is-active" : ""}`}
                    aria-pressed={view === item.id}
                    onClick={() => setView(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <CalendarFilters groups={LEARNING_CALENDAR_FILTERS} activeFilter={filter} onFilterChange={setFilter} hideSearch />
          </div>

          {partial && !loading && (
            <div className="lc-partialNotice" role="status">
              <span className="lc-partialIcon" aria-hidden="true">⚠️</span>
              <span className="lc-partialText">{unavailableSourcesMessage(unavailableSources)}</span>
              <button type="button" className="lc-partialRetry" onClick={refresh}>Retry</button>
            </div>
          )}

          {loading ? (
            <div className="cal-loadingState" role="status">Loading your learning calendar…</div>
          ) : error ? (
            // Compact error panel (Phase I) — the previous version consumed
            // half the page with a large failure card; this keeps the page
            // shell, summary row (if it had data), and rail intact, and
            // explains what's unavailable with a real retry.
            <div className="lc-compactError" role="alert">
              <span className="lc-compactErrorIcon" aria-hidden="true">⚠️</span>
              <div>
                <p className="lc-compactErrorTitle">Your learning calendar couldn't be fully loaded.</p>
                <p className="sh-muted lc-compactErrorDetail">{String(error.message || error)}</p>
              </div>
              <button type="button" className="sh-btn sh-btn--soft" onClick={refresh}>Retry</button>
            </div>
          ) : filteredEvents.length === 0 && events.length > 0 ? (
            <div className="cal-emptyState" role="status">
              <p className="cal-emptyTitle">No events match your filters.</p>
              <button type="button" className="sh-btn sh-btn--soft" onClick={() => setFilter("all")}>
                Clear filters
              </button>
            </div>
          ) : view === "month" ? (
            <CalendarMonthView anchorDate={anchorDate} selectedDate={selectedDate} eventsByDay={eventsByDay} today={today} onSelectDate={setSelectedDate} onOpenEvent={setOpenEvent} />
          ) : view === "week" ? (
            <CalendarWeekView anchorDate={anchorDate} eventsByDay={eventsByDay} today={today} onOpenEvent={setOpenEvent} />
          ) : (
            <CalendarAgendaView
              events={filteredEvents}
              today={today}
              onOpenEvent={setOpenEvent}
              emptyMessage="Scheduled learning sessions, deadlines, and opportunities will appear here as they're available."
            />
          )}
        </div>

        {!error && (
          <div className="lc-rail">
            <TodayPanel events={filteredEvents} today={today} onOpenEvent={setOpenEvent} onViewAgenda={() => setView("agenda")} />
            <UpcomingDeadlinesCard events={filteredEvents} today={today} onOpenEvent={setOpenEvent} />
            <OpportunityRadarCard events={filteredEvents} today={today} onOpenEvent={setOpenEvent} />
            <PlanMyWeekCard events={filteredEvents} today={today} intelligence={intelligence} onOpenEvent={setOpenEvent} />
            <CalendarFeedSubscribe role={role} />
          </div>
        )}
      </div>

      {!loading && !error && <JourneyMilestones role={role} />}
      </div>

      {openEvent && <CalendarEventDetail event={openEvent} onClose={() => setOpenEvent(null)} linkBase="/curriculum.html#" />}
    </main>
  );
}
