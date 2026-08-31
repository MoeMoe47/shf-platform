// src/pages/career/CareerCalendar.jsx
//
// The SHF Career Calendar owns the Career data adapters while its normalized
// view primitives are reused by the Curriculum adapter.
import React from "react";
import "@/styles/career-calendar.css";
import { markDarkScope } from "@/utils/careerTheme.js";
import { useCalendarEvents } from "./calendar/useCalendarEvents.js";
import { EVENT_TYPE_META } from "./calendar/eventContract.js";
import { unavailableSourcesMessage } from "./calendar/projectionAdapter.js";
import {
  addMonths,
  addDays,
  buildEventsByDay,
  formatMonthYear,
  formatWeekRange,
  toDateKey,
  eventDateKey,
} from "./calendar/dateUtils.js";
import CalendarMonthView from "./calendar/CalendarMonthView.jsx";
import CalendarWeekView from "./calendar/CalendarWeekView.jsx";
import CalendarAgendaView from "./calendar/CalendarAgendaView.jsx";
import CalendarUpcomingRail from "./calendar/CalendarUpcomingRail.jsx";
import CalendarFilters from "./calendar/CalendarFilters.jsx";
import CalendarEventDetail from "./calendar/CalendarEventDetail.jsx";
import ReminderFormDialog from "./calendar/ReminderFormDialog.jsx";
import { createReminder, updateReminder, deleteReminder } from "./calendar/reminders.js";

const VIEWS = [
  { id: "month", label: "Month" },
  { id: "week", label: "Week" },
  { id: "agenda", label: "Agenda" },
];

// SHF Ecosystem Phase 11.5 — restricted to the canonical categories real
// backend data can actually produce (matching Curriculum's own
// LEARNING_CALENDAR_FILTERS), plus the two sources this page still merges
// in locally (Portfolio demo, Personal reminders). The pre-unification
// default (FILTER_GROUPS from eventContract.js) included Learning/
// Mentoring chips that only ever matched now-removed demo data and would
// have sat permanently empty.
const CAREER_CALENDAR_FILTERS = [
  { id: "all", label: "All" },
  { id: "live", label: "Live" },
  { id: "career", label: "Career" },
  { id: "assignments", label: "Assignments" },
  { id: "projects", label: "Projects" },
  { id: "opportunities", label: "Opportunities" },
  { id: "credentials", label: "Credentials" },
  { id: "portfolio", label: "Portfolio" },
  { id: "personal", label: "Personal" },
];

function useNarrowViewport(breakpoint = 720) {
  const [narrow, setNarrow] = React.useState(
    () => typeof window !== "undefined" && window.innerWidth <= breakpoint
  );
  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const onChange = () => setNarrow(mql.matches);
    onChange();
    mql.addEventListener ? mql.addEventListener("change", onChange) : mql.addListener(onChange);
    return () =>
      mql.removeEventListener ? mql.removeEventListener("change", onChange) : mql.removeListener(onChange);
  }, [breakpoint]);
  return narrow;
}

export default function CareerCalendar() {
  const { loading, error, events, partial, unavailableSources, refresh } = useCalendarEvents();
  const narrow = useNarrowViewport();

  const today = React.useMemo(() => new Date(), []);
  const [anchorDate, setAnchorDate] = React.useState(today);
  const [selectedDate, setSelectedDate] = React.useState(today);
  const [view, setView] = React.useState(narrow ? "agenda" : "month");
  const [filter, setFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [openEvent, setOpenEvent] = React.useState(null);
  const [reminderDraft, setReminderDraft] = React.useState(null); // null | {} (new) | reminder (edit)
  const [showReminderForm, setShowReminderForm] = React.useState(false);
  const [liveMessage, setLiveMessage] = React.useState("");

  // Dark mode is opt-in per page (see careerTheme.js) — activate this
  // page's dark styling only while it's mounted.
  React.useEffect(() => {
    markDarkScope("calendar", true);
    return () => markDarkScope("calendar", false);
  }, []);

  React.useEffect(() => {
    if (narrow && view === "month") return; // let the student switch back manually; don't fight their choice
  }, [narrow, view]);

  const filteredEvents = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((evt) => {
      const meta = EVENT_TYPE_META[evt.type];
      if (filter !== "all" && meta.filterGroup !== filter) return false;
      if (q && !evt.title.toLowerCase().includes(q) && !(evt.description || "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [events, filter, search]);

  const eventsByDay = React.useMemo(
    () => buildEventsByDay(filteredEvents, eventDateKey),
    [filteredEvents]
  );

  function goToday() {
    setAnchorDate(new Date());
    setSelectedDate(new Date());
    setLiveMessage("Jumped to today.");
  }
  function goPrev() {
    setAnchorDate((d) => (view === "week" ? addDays(d, -7) : addMonths(d, -1)));
  }
  function goNext() {
    setAnchorDate((d) => (view === "week" ? addDays(d, 7) : addMonths(d, 1)));
  }

  function handleOpenEvent(evt) {
    setOpenEvent(evt);
  }
  function handleCloseEvent() {
    setOpenEvent(null);
  }
  function handleEditReminder(evt) {
    setOpenEvent(null);
    setReminderDraft({
      id: evt.id,
      title: evt.title,
      date: toDateKey(new Date(evt.start)),
      time: evt.allDay ? "09:00" : new Date(evt.start).toTimeString().slice(0, 5),
      allDay: evt.allDay,
      note: evt.description,
      reminderMinutes: evt.reminder,
    });
    setShowReminderForm(true);
  }
  function handleDeleteReminder(evt) {
    setOpenEvent(null);
    deleteReminder(evt.id);
    setLiveMessage("Reminder deleted.");
  }
  function handleNewReminder() {
    setReminderDraft(null);
    setShowReminderForm(true);
  }
  function handleSaveReminder(input) {
    const result = reminderDraft?.id
      ? updateReminder(reminderDraft.id, input)
      : createReminder(input);
    if (result.ok) {
      setShowReminderForm(false);
      setReminderDraft(null);
      setLiveMessage(reminderDraft?.id ? "Reminder updated." : "Reminder saved.");
    }
    return result;
  }

  const periodLabel = view === "week" ? formatWeekRange(anchorDate) : formatMonthYear(anchorDate);

  return (
    <main className="app-main cal-page" aria-labelledby="cal-page-title">
      <div className="cal-pageHead">
        <div>
          <h1 id="cal-page-title" className="cal-pageTitle">Calendar</h1>
          <p className="sh-muted cal-pageSub">
            Your unified schedule — classes, deadlines, reviews, and check-ins in one place.
          </p>
        </div>
        <button type="button" className="sh-btn sh-btn--primary cal-newReminderBtn" onClick={handleNewReminder}>
          + Personal reminder
        </button>
      </div>

      <div className="cal-toolbar">
        <div className="cal-toolbarNav">
          <button type="button" className="sh-btn sh-btn--soft" onClick={goToday}>Today</button>
          <button type="button" className="cal-iconBtn" onClick={goPrev} aria-label={view === "week" ? "Previous week" : "Previous month"}>‹</button>
          <button type="button" className="cal-iconBtn" onClick={goNext} aria-label={view === "week" ? "Next week" : "Next month"}>›</button>
          <span className="cal-periodLabel" aria-live="polite">{periodLabel}</span>
        </div>
        <div className="cal-viewSwitch" role="group" aria-label="Calendar view">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              className={`cal-viewBtn ${view === v.id ? "is-active" : ""}`}
              aria-pressed={view === v.id}
              onClick={() => setView(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <CalendarFilters
        activeFilter={filter}
        onFilterChange={setFilter}
        search={search}
        onSearchChange={setSearch}
        groups={CAREER_CALENDAR_FILTERS}
      />

      <div aria-live="polite" className="cal-srOnly">{liveMessage}</div>

      <div className="cal-layout">
        <div className="cal-mainRegion">
          {partial && !loading && (
            <div className="cal-partialNotice" role="status">
              <span className="cal-partialIcon" aria-hidden="true">⚠️</span>
              <span className="cal-partialText">{unavailableSourcesMessage(unavailableSources)}</span>
              <button type="button" className="cal-partialRetry" onClick={refresh}>Retry</button>
            </div>
          )}
          {loading ? (
            <div className="cal-loadingState" role="status" aria-live="polite">
              <div className="cal-skeletonMonth" aria-hidden="true" />
              <span className="cal-srOnly">Loading your calendar…</span>
            </div>
          ) : error ? (
            <div className="cal-errorState" role="alert">
              <p className="cal-emptyTitle">Your calendar couldn't be loaded.</p>
              <p className="sh-muted">{String(error?.message || error)}</p>
              <button type="button" className="sh-btn sh-btn--soft" onClick={refresh}>Try again</button>
            </div>
          ) : filteredEvents.length === 0 && events.length > 0 ? (
            <div className="cal-emptyState" role="status">
              <p className="cal-emptyTitle">No events match your filters.</p>
              <p className="sh-muted">Try a different filter or clear your search.</p>
              <button
                type="button"
                className="sh-btn sh-btn--soft"
                onClick={() => { setFilter("all"); setSearch(""); }}
              >
                Clear filters
              </button>
            </div>
          ) : view === "month" ? (
            <CalendarMonthView
              anchorDate={anchorDate}
              selectedDate={selectedDate}
              eventsByDay={eventsByDay}
              today={today}
              onSelectDate={setSelectedDate}
              onOpenEvent={handleOpenEvent}
            />
          ) : view === "week" ? (
            <CalendarWeekView
              anchorDate={anchorDate}
              eventsByDay={eventsByDay}
              today={today}
              onOpenEvent={handleOpenEvent}
            />
          ) : (
            <CalendarAgendaView events={filteredEvents} today={today} onOpenEvent={handleOpenEvent} />
          )}
        </div>

        <CalendarUpcomingRail events={filteredEvents} today={today} onOpenEvent={handleOpenEvent} />
      </div>

      {openEvent && (
        <CalendarEventDetail
          event={openEvent}
          onClose={handleCloseEvent}
          onEdit={handleEditReminder}
          onDelete={handleDeleteReminder}
        />
      )}

      {showReminderForm && (
        <ReminderFormDialog
          initial={reminderDraft}
          onSave={handleSaveReminder}
          onCancel={() => { setShowReminderForm(false); setReminderDraft(null); }}
        />
      )}
    </main>
  );
}
