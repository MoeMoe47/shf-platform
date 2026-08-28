import React from "react";
import { useUser } from "@/context/UserContext.jsx";
import { listLiveSessions } from "@/lib/liveLearning/api.js";
import { createCalendarEvent, EVENT_TYPE_META } from "@/pages/career/calendar/eventContract.js";
import { addDays, addMonths, buildEventsByDay, eventDateKey, formatMonthYear, formatWeekRange, toDateKey } from "@/pages/career/calendar/dateUtils.js";
import CalendarMonthView from "@/pages/career/calendar/CalendarMonthView.jsx";
import CalendarWeekView from "@/pages/career/calendar/CalendarWeekView.jsx";
import CalendarAgendaView from "@/pages/career/calendar/CalendarAgendaView.jsx";
import CalendarUpcomingRail from "@/pages/career/calendar/CalendarUpcomingRail.jsx";
import CalendarFilters from "@/pages/career/calendar/CalendarFilters.jsx";
import CalendarEventDetail from "@/pages/career/calendar/CalendarEventDetail.jsx";
import "@/styles/career-calendar.css";
import "@/styles/curriculum-calendar.css";

const VIEWS = [
  { id: "month", label: "Month" },
  { id: "week", label: "Week" },
  { id: "agenda", label: "Agenda" },
];
const CURRICULUM_FILTERS = [
  { id: "all", label: "All" },
  { id: "learning", label: "Learning" },
];

function useNarrowViewport() {
  const [narrow, setNarrow] = React.useState(() => typeof window !== "undefined" && window.innerWidth <= 720);
  React.useEffect(() => {
    const query = window.matchMedia("(max-width: 720px)");
    const onChange = () => setNarrow(query.matches);
    onChange();
    query.addEventListener?.("change", onChange);
    return () => query.removeEventListener?.("change", onChange);
  }, []);
  return narrow;
}

function useCurriculumCalendarEvents(role) {
  const [state, setState] = React.useState({ loading: true, error: null, events: [] });
  const refresh = React.useCallback(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true, error: null }));
    listLiveSessions(role)
      .then(({ items = [] }) => {
        if (!active) return;
        const events = items
          .filter((session) => session?.startsAt && session.status !== "cancelled")
          .map((session) => createCalendarEvent({
            id: `curriculum-live-${session.id}`,
            title: session.title,
            description: session.lessonId ? `Learning session for lesson ${session.lessonId}.` : "Scheduled Curriculum live learning session.",
            type: "instructor",
            start: session.startsAt,
            end: session.endsAt || null,
            allDay: false,
            route: "/curriculum/live-sessions",
            source: "curriculum-live-learning",
            status: session.status === "scheduled" ? "confirmed" : session.status,
            organizer: "Curriculum instruction",
          }));
        setState({ loading: false, error: null, events });
      })
      .catch((error) => active && setState({ loading: false, error, events: [] }));
    return () => { active = false; };
  }, [role]);

  React.useEffect(() => refresh(), [refresh]);
  return { ...state, refresh };
}

export default function CurriculumCalendar() {
  const { role } = useUser();
  const { loading, error, events, refresh } = useCurriculumCalendarEvents(role);
  const narrow = useNarrowViewport();
  const today = React.useMemo(() => new Date(), []);
  const [anchorDate, setAnchorDate] = React.useState(today);
  const [selectedDate, setSelectedDate] = React.useState(today);
  const [view, setView] = React.useState(() => narrow ? "agenda" : "month");
  const [filter, setFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [openEvent, setOpenEvent] = React.useState(null);

  const filteredEvents = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return events.filter((event) => {
      const matchesFilter = filter === "all" || EVENT_TYPE_META[event.type]?.filterGroup === filter;
      const matchesSearch = !query || event.title.toLowerCase().includes(query) || event.description.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [events, filter, search]);
  const eventsByDay = React.useMemo(() => buildEventsByDay(filteredEvents, eventDateKey), [filteredEvents]);

  const goToday = () => { const next = new Date(); setAnchorDate(next); setSelectedDate(next); };
  const move = (amount) => setAnchorDate((date) => view === "week" ? addDays(date, amount * 7) : addMonths(date, amount));
  const periodLabel = view === "week" ? formatWeekRange(anchorDate) : formatMonthYear(anchorDate);

  return (
    <main className="app-main cal-page curriculum-calendar-page" aria-labelledby="curriculum-cal-title">
      <div className="cal-pageHead">
        <div>
          <p className="cal-eyebrow">Curriculum</p>
          <h1 id="curriculum-cal-title" className="cal-pageTitle">Learning calendar</h1>
          <p className="sh-muted cal-pageSub">Live learning sessions and scheduled Curriculum activity.</p>
        </div>
      </div>

      <div className="cal-toolbar">
        <div className="cal-toolbarNav">
          <button type="button" className="sh-btn sh-btn--soft" onClick={goToday}>Today</button>
          <button type="button" className="cal-iconBtn" onClick={() => move(-1)} aria-label={view === "week" ? "Previous week" : "Previous month"}>‹</button>
          <button type="button" className="cal-iconBtn" onClick={() => move(1)} aria-label={view === "week" ? "Next week" : "Next month"}>›</button>
          <span className="cal-periodLabel" aria-live="polite">{periodLabel}</span>
        </div>
        <div className="cal-viewSwitch" role="group" aria-label="Calendar view">
          {VIEWS.map((item) => <button key={item.id} type="button" className={`cal-viewBtn ${view === item.id ? "is-active" : ""}`} aria-pressed={view === item.id} onClick={() => setView(item.id)}>{item.label}</button>)}
        </div>
      </div>

      <CalendarFilters groups={CURRICULUM_FILTERS} activeFilter={filter} onFilterChange={setFilter} search={search} onSearchChange={setSearch} />

      <div className="cal-layout">
        <div className="cal-mainRegion">
          {loading ? <div className="cal-loadingState" role="status">Loading your learning calendar…</div>
            : error ? <div className="cal-errorState" role="alert"><p className="cal-emptyTitle">Learning calendar unavailable.</p><p className="sh-muted">{String(error.message || error)}</p><button type="button" className="sh-btn sh-btn--soft" onClick={refresh}>Try again</button></div>
            : filteredEvents.length === 0 && events.length > 0 ? <div className="cal-emptyState" role="status"><p className="cal-emptyTitle">No sessions match your filters.</p><button type="button" className="sh-btn sh-btn--soft" onClick={() => { setFilter("all"); setSearch(""); }}>Clear filters</button></div>
            : view === "month" ? <CalendarMonthView anchorDate={anchorDate} selectedDate={selectedDate} eventsByDay={eventsByDay} today={today} onSelectDate={setSelectedDate} onOpenEvent={setOpenEvent} />
              : view === "week" ? <CalendarWeekView anchorDate={anchorDate} eventsByDay={eventsByDay} today={today} onOpenEvent={setOpenEvent} />
                : <CalendarAgendaView events={filteredEvents} today={today} onOpenEvent={setOpenEvent} emptyMessage="Scheduled learning sessions will appear here when they are available." />}
        </div>
        <CalendarUpcomingRail events={filteredEvents} today={today} onOpenEvent={setOpenEvent} />
      </div>

      {openEvent && <CalendarEventDetail event={openEvent} onClose={() => setOpenEvent(null)} linkBase="/curriculum.html#" />}
    </main>
  );
}

export { toDateKey };
