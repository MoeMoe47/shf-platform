// src/components/CalendarCard.jsx
import React from "react";

/**
 * CalendarCard (Collapsible + Export Day/Month + Loading)
 * - Collapse/expand toggle (persists via localStorage)
 * - Compact "Upcoming" strip when collapsed (next 3 events)
 * - Month grid with dots + count badges
 * - Day details drawer + tags + action buttons
 * - Dev Add-Event panel + prefill toggle
 * - Export CSV: selected day & visible month
 *
 * Props:
 *   loading?: boolean
 *   events?: Array<{ date:"YYYY-MM-DD", type:"zoom"|"assignment"|"milestone", title:string, time?:string, location?:string, link?:string }>
 *   onDayClick?: (isoDate:string, eventsForDay:Array<Event>) => void
 *   defaultCollapsed?: boolean
 */
export default function CalendarCard({
  loading = false,
  events,
  onDayClick,
  defaultCollapsed = false,
}) {
  const today = new Date();
  const [year, setYear] = React.useState(today.getFullYear());
  const [month, setMonth] = React.useState(today.getMonth()); // 0-11
  const [selectedISO, setSelectedISO] = React.useState(null);

  // collapsed state (persist)
  const STORAGE_KEY = "sh_calendar_collapsed";
  const [collapsed, setCollapsed] = React.useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "true" || saved === "false") return saved === "true";
    } catch {}
    return defaultCollapsed;
  });
  React.useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, String(collapsed)); } catch {}
  }, [collapsed]);

  // local dev-only events (added via form)
  const [devEvents, setDevEvents] = React.useState([]);
  const [prefillFromSelection, setPrefillFromSelection] = React.useState(true);

  // Fallback sample events if none passed in
  const sample = React.useMemo(() => ([
    { date: iso(today, +2), type: "zoom",       title: "Live Class — Module 1", time: "3:00–4:00 PM", link: "https://zoom.us/j/123" },
    { date: iso(today, +4), type: "assignment", title: "Lesson 1 Reflection Due", time: "11:59 PM", location: "LMS" },
    { date: iso(today, +6), type: "milestone",  title: "Module 1 Progress Check" },
    { date: monthIso(today, 0, 18), type: "assignment", title: "Quiz 1 Due", time: "11:59 PM" },
    { date: monthIso(today, 0, 25), type: "zoom",       title: "Guest Mentor Session" },
  ]), [today]);

  // normalize + combine
  const allEvents = React.useMemo(() => {
    const base = (events && events.length ? events : sample).map(normalize);
    const extra = devEvents.map(normalize);
    return base.concat(extra);
  }, [events, sample, devEvents]);

  // Build month grid
  const monthStart = new Date(year, month, 1);
  const monthEnd   = new Date(year, month + 1, 0);
  const startDay   = monthStart.getDay(); // 0=Sun
  const daysInMonth = monthEnd.getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = 0; i < startDay; i++) cells.push({ d: prevMonthDays - startDay + 1 + i, muted: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ d, muted: false });
  while (cells.length % 7 !== 0) {
    const x = cells.length - (startDay + daysInMonth) + 1;
    cells.push({ d: x, muted: true });
  }

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const week = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  const goPrev = () => {
    setSelectedISO(null);
    const m = month - 1;
    if (m < 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m);
  };
  const goNext = () => {
    setSelectedISO(null);
    const m = month + 1;
    if (m > 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m);
  };

  const isToday = (d) =>
    !d.muted && d.d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  // Group events by day in visible month
  const grouped = React.useMemo(() => {
    const m = {};
    for (const ev of allEvents) {
      const dt = new Date(ev.date);
      if (dt.getFullYear() === year && dt.getMonth() === month) {
        const key = `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}`;
        (m[key] ||= []).push(ev);
      }
    }
    return m;
  }, [allEvents, year, month]);

  const selectedList = selectedISO ? (grouped[selectedISO] || []) : [];

  // Upcoming (for collapsed mode): next 3 events from allEvents (≥ today)
  const upcoming3 = React.useMemo(() => {
    const nowISO = iso(today, 0);
    return allEvents
      .slice()
      .sort((a,b) => a.date.localeCompare(b.date))
      .filter(e => e.date >= nowISO)
      .slice(0, 3);
  }, [allEvents, today]);

  // Keyboard shortcuts on grid
  const onKeyDown = (e) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
    if (e.key === "ArrowRight"){ e.preventDefault(); goNext(); }
    if (e.key === "Escape")    { e.preventDefault(); setSelectedISO(null); }
  };

  // Dev form
  const [form, setForm] = React.useState({
    date: iso(today, 0),
    type: "zoom",
    title: "",
    time: "",
    location: "",
    link: "",
  });
  const onFormChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSelectDay = (isoKey, dayEvents) => {
    setSelectedISO(isoKey);
    if (prefillFromSelection) setForm(f => ({ ...f, date: isoKey }));
    if (onDayClick) onDayClick(isoKey, dayEvents);
  };

  const addEvent = (e) => {
    e.preventDefault();
    if (!isISO(form.date)) return alert("Use YYYY-MM-DD");
    if (!form.title.trim()) return alert("Please add a title");
    setDevEvents(list => list.concat({
      date: form.date,
      type: form.type,
      title: form.title.trim(),
      time: form.time.trim() || undefined,
      location: form.location.trim() || undefined,
      link: form.link.trim() || undefined,
    }));
    setForm(f => ({ ...f, title: "", time: "", location: "", link: "" }));
  };
  const quickAddSelected = () => {
    if (!selectedISO) return alert("Select a day first");
    setDevEvents(list => list.concat({ date: selectedISO, type: "assignment", title: "New item" }));
  };
  const clearAdded = () => setDevEvents([]);

  // Export selected day to CSV
  const exportSelectedCSV = () => {
    if (!selectedISO || selectedList.length === 0) return;
    const rows = [
      ["date","type","title","time","location","link"],
      ...selectedList.map(ev => [ev.date || selectedISO, ev.type || "", ev.title || "", ev.time || "", ev.location || "", ev.link || ""]),
    ];
    downloadCSV(rows, `events_${selectedISO}.csv`);
  };
  // Export visible month to CSV
  const exportMonthCSV = () => {
    const dates = Object.keys(grouped).sort();
    if (dates.length === 0) return;
    const rows = [["date","type","title","time","location","link"]];
    for (const d of dates) {
      const evs = grouped[d].slice().sort((a,b) => {
        const t = (a.type || "").localeCompare(b.type || "");
        return t !== 0 ? t : (a.title || "").localeCompare(b.title || "");
      });
      for (const ev of evs) rows.push([d, ev.type || "", ev.title || "", ev.time || "", ev.location || "", ev.link || ""]);
    }
    downloadCSV(rows, `events_month_${year}-${pad(month+1)}.csv`);
  };

  return (
    <section className="sh-card" role="group" aria-labelledby="calendar">
      <div className="sh-cardStripe" />
      <div className="sh-cardBody">
        {/* Header row with collapse toggle */}
        <div className="sh-calHeader">
          <button className="sh-calBtn sh-calBtn--secondary" onClick={goPrev} aria-label="Previous month">←</button>
          <h2 id="calendar" className="sh-cardTitle" style={{margin:0}}>
            {monthNames[month]} {year}
          </h2>
          <div className="sh-calHeaderRight">
            <button
              className="sh-calBtn sh-calBtn--secondary sh-collapseBtn"
              onClick={() => setCollapsed(c => !c)}
              aria-expanded={!collapsed}
              aria-controls="calendar-body"
              title={collapsed ? "Expand calendar" : "Collapse calendar"}
            >
              {collapsed ? "Expand" : "Collapse"}
            </button>
            <button className="sh-calBtn sh-calBtn--secondary" onClick={goNext} aria-label="Next month">→</button>
          </div>
        </div>

        {/* Loading skeleton (covers both states) */}
        {loading ? (
          <div aria-hidden className="sh-calSkel">
            <div className="skel skel--text-2" style={{ width: '40%', height: 16, borderRadius: 6, margin: '6px 0' }} />
            <div className="skel" style={{ height: 120, borderRadius: 10, marginBottom: 10 }} />
            <div className="skel" style={{ height: 16, width: '70%', borderRadius: 6, marginBottom: 6 }} />
            <div className="skel" style={{ height: 16, width: '55%', borderRadius: 6 }} />
          </div>
        ) : (
          <>
            {/* Compact UPCOMING strip when collapsed */}
            {collapsed && (
              <div className="sh-upcoming" role="list" aria-label="Upcoming events">
                {upcoming3.length === 0 ? (
                  <div className="sh-upcomingItem sh-muted">No upcoming events.</div>
                ) : (
                  upcoming3.map((ev, i) => (
                    <div key={i} role="listitem" className="sh-upcomingItem">
                      <span className={`sh-tag sh-tag-${(ev.type||"assignment").toLowerCase()}`}>{(ev.type||"").toUpperCase() || "ASSIGNMENT"}</span>
                      <span className="up-title">{ev.title}</span>
                      <span className="up-meta">· {ev.date}{ev.time ? ` · ${ev.time}` : ""}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Everything else hides when collapsed */}
            <div
              id="calendar-body"
              className={`sh-collapseWrap ${collapsed ? "is-collapsed" : "is-open"}`}
              aria-hidden={collapsed}
            >
              {/* Legend */}
              <div className="sh-calLegend" aria-hidden="true">
                <span><i className="dot dot-zoom" /> Zoom</span>
                <span><i className="dot dot-assignment" /> Assignment</span>
                <span><i className="dot dot-milestone" /> Milestone</span>
              </div>

              {/* Grid */}
              <div
                className="sh-calGrid"
                role="grid"
                aria-labelledby="calendar"
                tabIndex={0}
                onKeyDown={onKeyDown}
              >
                {week.map((w) => (
                  <div key={w} className="sh-calDow" role="columnheader" aria-label={w}>{w}</div>
                ))}

                {cells.map((c, i) => {
                  const keyISO = !c.muted ? `${year}-${pad(month+1)}-${pad(c.d)}` : null;
                  const dayEvents = keyISO ? (grouped[keyISO] || []) : [];
                  const dots = summarizeDots(dayEvents);
                  return (
                    <button
                      type="button"
                      key={i}
                      className={`sh-calCell ${c.muted ? "is-muted" : ""} ${isToday(c) ? "is-today" : ""}`}
                      role="gridcell"
                      aria-selected={selectedISO === keyISO}
                      aria-label={`Day ${c.d}${isToday(c) ? " (today)" : ""}${dayEvents.length ? `, ${dayEvents.length} event${dayEvents.length>1?"s":""}` : ""}`}
                      onClick={() => !c.muted && handleSelectDay(keyISO, dayEvents)}
                      disabled={c.muted}
                      title={dayEvents.map(e => e.title).join(" • ")}
                    >
                      <div className="sh-calHead">
                        <span className="sh-calNum">{c.d}</span>
                        {dayEvents.length > 0 && (
                          <span className="sh-calBadge" aria-label={`${dayEvents.length} events`}>{dayEvents.length}</span>
                        )}
                      </div>
                      <span className="sh-calDots" aria-hidden="true">
                        {dots.zoom      ? <i className="dot dot-zoom" /> : null}
                        {dots.assign    ? <i className="dot dot-assignment" /> : null}
                        {dots.milestone ? <i className="dot dot-milestone" /> : null}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Selected day drawer */}
              {selectedISO && (
                <div className="sh-dayEvents" role="region" aria-labelledby="dayDetails">
                  <div className="sh-dayHeader">
                    <strong id="dayDetails">{selectedISO}</strong>
                    <div style={{display:"flex",gap:8}}>
                      <button className="sh-calBtn sh-calBtn--secondary" onClick={quickAddSelected}>+ quick</button>
                      <button className="sh-calBtn sh-calBtn--secondary" onClick={exportSelectedCSV} disabled={selectedList.length===0}>Export Day CSV</button>
                      <button className="sh-calBtn sh-calBtn--secondary" onClick={exportMonthCSV}>Export Month CSV</button>
                      <button className="sh-linkBtn" onClick={()=>setSelectedISO(null)} aria-label="Clear selection">clear</button>
                    </div>
                  </div>

                  {selectedList.length === 0 ? (
                    <p className="sh-muted">No events.</p>
                  ) : (
                    <ul className="sh-evList">
                      {selectedList.map((ev, idx) => {
                        const TYPE = (ev.type || "assignment").toLowerCase();
                        const TYPE_LABEL = { zoom: "ZOOM", assignment: "ASSIGNMENT", milestone: "MILESTONE" };
                        const label = TYPE_LABEL[TYPE] || TYPE.toUpperCase();
                        const href = TYPE === "zoom" && ev.link ? ev.link : undefined;

                        return (
                          <li key={idx} className={`ev ev-${TYPE}`} data-type={TYPE}>
                            <div className="ev-left">
                              <span className={`sh-tag sh-tag-${TYPE}`}>{label}</span>
                              <span className="ev-title">{ev.title || "Untitled"}</span>
                              {ev.time && <span className="ev-meta">· {ev.time}</span>}
                              {ev.location && <span className="ev-meta">· {ev.location}</span>}
                            </div>
                            <div className="ev-right">
                              {TYPE === "zoom" && (
                                <a
                                  className="sh-miniBtn"
                                  href={href || "#"}
                                  target="_blank"
                                  rel="noreferrer"
                                  aria-disabled={!href}
                                  onClick={(e) => { if (!href) e.preventDefault(); }}
                                >
                                  {href ? "Join" : "Join (link TBD)"}
                                </a>
                              )}
                              {TYPE === "assignment" && <button className="sh-miniBtn" type="button">Open</button>}
                              {TYPE === "milestone" && <button className="sh-miniBtn" type="button">Details</button>}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}

              {/* Dev add-event panel */}
              <details className="sh-devPanel" open>
                <summary>Add Event (dev)</summary>

                <label className="sh-toggle">
                  <input
                    type="checkbox"
                    checked={prefillFromSelection}
                    onChange={(e)=>setPrefillFromSelection(e.target.checked)}
                  />
                  <span>Prefill date with selected day</span>
                </label>

                <form className="sh-devForm" onSubmit={addEvent}>
                  <label className="sh-devRow">
                    <span>Date</span>
                    <input name="date" type="date" value={form.date} onChange={onFormChange} required />
                  </label>
                  <label className="sh-devRow">
                    <span>Type</span>
                    <select name="type" value={form.type} onChange={onFormChange}>
                      <option value="zoom">Zoom</option>
                      <option value="assignment">Assignment</option>
                      <option value="milestone">Milestone</option>
                    </select>
                  </label>
                  <label className="sh-devRow">
                    <span>Title</span>
                    <input name="title" type="text" placeholder="e.g., Office Hours" value={form.title} onChange={onFormChange} required />
                  </label>
                  <label className="sh-devRow">
                    <span>Time (optional)</span>
                    <input name="time" type="text" placeholder="e.g., 2:00–3:00 PM" value={form.time} onChange={onFormChange} />
                  </label>
                  <label className="sh-devRow">
                    <span>Location (optional)</span>
                    <input name="location" type="text" placeholder="e.g., LMS or Room 101" value={form.location} onChange={onFormChange} />
                  </label>
                  <label className="sh-devRow">
                    <span>Zoom Link (optional)</span>
                    <input name="link" type="url" placeholder="https://zoom.us/..." value={form.link} onChange={onFormChange} />
                  </label>
                  <div className="sh-devActions">
                    <button type="submit" className="sh-calBtn">Add</button>
                    <button type="button" className="sh-calBtn sh-calBtn--secondary" onClick={clearAdded}>Clear added</button>
                  </div>
                </form>
                <p className="sh-hint">Dev-only: these events live in component state and reset on reload.</p>
              </details>
            </div>
          </>
        )}
      </div>

      {/* Scoped styles */}
      <style>{`
        .sh-calHeader{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
        .sh-calHeaderRight{display:flex;gap:8px;align-items:center}
        .sh-collapseBtn{min-width:90px}

        /* collapsed upcoming strip */
        .sh-upcoming{display:flex;flex-direction:column;gap:6px;margin:6px 0 8px 0}
        .sh-upcomingItem{
          display:flex;align-items:center;gap:8px;
          padding:8px 10px;border:1px solid var(--line);border-radius:10px;background:#fff;
        }
        .up-title{font-weight:600;color:var(--slate)}
        .up-meta{color:#6b7280;font-size:12px}

        /* collapse wrapper (smooth-ish) */
        .sh-collapseWrap{overflow:hidden; transition: max-height .25s ease;}
        .sh-collapseWrap.is-collapsed{ max-height: 0; }
        .sh-collapseWrap.is-open{ max-height: 2000px; } /* large enough */

        .sh-calLegend{display:flex;gap:16px;margin-bottom:8px;font-size:12px;color:#6b7280}
        .dot{display:inline-block;width:8px;height:8px;border-radius:999px;margin-right:6px;vertical-align:middle}
        .dot-zoom{background:var(--orange)}
        .dot-assignment{background:#0f172a}
        .dot-milestone{background:#6b7280}

        .sh-calGrid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
        .sh-calDow{font-size:12px;color:#6b7280;text-align:center}

        .sh-calCell{
          background:var(--beige);
          border:1px solid var(--line);
          border-radius:10px;
          min-height:64px;
          display:flex;
          flex-direction:column;
          align-items:stretch;
          justify-content:flex-start;
          padding:6px;
          cursor:pointer;
          outline:none;
        }
        .sh-calCell:hover{background:#fff}
        .sh-calCell:focus-visible{box-shadow:0 0 0 2px rgba(255,79,0,.28)}
        .sh-calCell.is-muted{opacity:.55; cursor:default}
        .sh-calCell.is-today{background:#fff; border-color:var(--orange); box-shadow:0 0 0 2px rgba(255,79,0,.12) inset}

        .sh-calHead{display:flex;align-items:center;justify-content:space-between;width:100%}
        .sh-calNum{font-size:12px;color:var(--slate);font-weight:700}
        .sh-calBadge{font-size:11px;background:#fff;color:var(--orange);border:1px solid var(--orange);border-radius:999px;padding:0 6px;}
        .sh-calDots{margin-top:auto; display:flex; gap:4px}

        .sh-dayEvents{margin-top:10px; background:#fff; border:1px solid var(--line); border-radius:10px; padding:10px}
        .sh-dayHeader{display:flex; align-items:center; justify-content:space-between; margin-bottom:6px}

        /* list rows */
        .sh-evList{list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:6px}
        .ev{display:flex; align-items:center; justify-content:space-between; gap:8px; padding:8px 10px; border:1px solid var(--line); border-radius:10px; background:#fff;}
        .ev-left{display:flex; align-items:center; gap:8px; flex-wrap:wrap}
        .ev-title{font-weight:600; color:var(--slate)}
        .ev-meta{color:#6b7280; font-size:12px}

        /* pill tags */
        .sh-tag{display:inline-block; font-size:11px; font-weight:700; letter-spacing:.3px; padding:2px 8px; border-radius:999px; border:1px solid var(--line); background:#fff; margin-right:2px; vertical-align:middle;}
        .sh-tag-zoom{ border-color:var(--orange); color:var(--orange) }
        .sh-tag-assignment{ border-color:var(--slate); color:var(--slate) }
        .sh-tag-milestone{ border-color:#6b7280; color:#6b7280 }$1.sh-calBtn{padding:8px 12px;border-radius:10px;border:1px solid var(--orange);background:var(--orange);color:#fff;font-weight:600;cursor:pointer}
        .sh-calBtn--secondary{background:#fff;color:var(--slate);border-color:var(--line)}
        .sh-linkBtn{background:none;border:none;color:var(--orange);cursor:pointer;padding:2px 6px}

        /* dev panel */
        .sh-devPanel{margin-top:12px}
        .sh-toggle{display:flex;align-items:center;gap:8px;margin-top:10px;font-size:14px}
        .sh-devForm{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px}
        .sh-devRow{display:flex;flex-direction:column;gap:4px;font-size:14px}
        .sh-devRow input,.sh-devRow select{ padding:8px;border:1px solid var(--line);border-radius:8px;background:#fff;color:var(--slate); }
        .sh-devActions{grid-column:1 / -1; display:flex; gap:10px}
        .sh-hint{font-size:12px;color:#6b7280;margin-top:6px}

        /* loading skeleton helpers */
        .skel{ background: linear-gradient(90deg, #eee 25%, #f7f7f7 37%, #eee 63%); background-size: 400% 100%; animation: skel 1.2s ease-in-out infinite; }
        .skel--text-2{ height:14px; border-radius:6px; }
        @keyframes skel{ 0%{background-position:100% 0} 100%{background-position:0 0} }

        @media (max-width:900px){
          .sh-calCell{min-height:50px}
          .sh-devForm{grid-template-columns:1fr}
        }
      `}</style>
    </section>
  );
}

/* ---------- helpers ---------- */
function pad(n){ return String(n).padStart(2,"0"); }
function iso(baseDate, addDays=0){
  const d = new Date(baseDate);
  d.setDate(d.getDate()+addDays);
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function monthIso(baseDate, monthOffset, day){
  const d = new Date(baseDate.getFullYear(), baseDate.getMonth()+monthOffset, day);
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function isISO(s){ return /^\d{4}-\d{2}-\d{2}$/.test(s); }
function normalize(ev){
  const t = (ev.type || "assignment").toLowerCase();
  return {
    date: ev.date,
    type: ["zoom","assignment","milestone"].includes(t) ? t : "assignment",
    title: ev.title || "",
    time: ev.time,
    location: ev.location,
    link: ev.link
  };
}
function summarizeDots(dayEvents){
  return {
    zoom:      dayEvents.some(e => e.type === "zoom"),
    assign:    dayEvents.some(e => e.type === "assignment"),
    milestone: dayEvents.some(e => e.type === "milestone"),
  };
}
function csvEscape(v){
  const s = String(v ?? "");
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g,'""')}"`;
  return s;
}
function downloadCSV(rows, filename){
  const csv = rows.map(r => r.map(csvEscape).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
