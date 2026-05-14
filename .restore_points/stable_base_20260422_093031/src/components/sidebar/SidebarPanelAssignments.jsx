import AppLink from "@/components/nav/AppLink";
import React from "react";
import { Link } from "react-router-dom";
import { readJSON, safeSet } from "@/utils/storage.js";

/**
 * SidebarPanelAssignments
 * - Shows active, upcoming, and completed assignments
 * - Syncs with API or local cache
 * - Minimal but extensible (badges, due dates, CTA buttons)
 */
export default function SidebarPanelAssignments() {
  const [assignments, setAssignments] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const r = await fetch("/api/assignments");
        let data;
        if (r.ok) data = await r.json();
        else data = readJSON("cache.assignments", SAMPLE);
        if (!cancelled) {
          setAssignments(normalizeAssignments(data));
          safeSet("cache.assignments", data);
        }
      } catch {
        if (!cancelled) setAssignments(normalizeAssignments(readJSON("cache.assignments", SAMPLE)));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const active = assignments.filter(a => a.status === "active");
  const upcoming = assignments.filter(a => a.status === "upcoming");
  const done = assignments.filter(a => a.status === "done");

  return (
    <section aria-label="Assignments">
      {loading && <div className="sb-skel">Loading assignments…</div>}

      {!loading && (
        <div className="sb-assignList">
          {/* Active */}
          <Block title="Active">
            {active.length ? active.map(renderItem) : <div className="sb-muted">No active assignments.</div>}
          </Block>

          {/* Upcoming */}
          <Block title="Upcoming">
            {upcoming.length ? upcoming.map(renderItem) : <div className="sb-muted">No upcoming work.</div>}
          </Block>

          {/* Done */}
          <Block title="Completed">
            {done.length ? done.map(renderItem) : <div className="sb-muted">Nothing completed yet.</div>}
          </Block>
        </div>
      )}
    </section>
  );
}

function Block({ title, children }) {
  return (
    <div className="sb-card card card--pad">
      <h4 className="sb-cardTitle">{title}</h4>
      <div className="sb-blockBody">{children}</div>
    </div>
  );
}

function renderItem(a) {
  return (
    <div key={a.id} className="sb-assignItem">
      <Link to={a.link} className="sb-assignMain">
        <span className="sb-assignTitle">{a.title}</span>
        {a.due && <span className="sb-due">📅 {a.due}</span>}
      </Link>
      {a.status === "active" && (
        <button type="button" className="btn btn--small btn--primary" onClick={() => alert("Start assignment")}>
          Start
        </button>
      )}
      {a.status === "upcoming" && <span className="sb-badge">Soon</span>}
      {a.status === "done" && <span className="sb-badge sb-badge--done">✓ Done</span>}
    </div>
  );
}

/* ---------- helpers ---------- */
function normalizeAssignments(raw) {
  const arr = Array.isArray(raw) ? raw : (raw?.assignments || []);
  return arr.map(a => ({
    id: a.id || a.slug || "assign",
    title: a.title || "Assignment",
    due: a.due || null,
    status: a.status || "active", // "active" | "upcoming" | "done"
    link: a.link || `/assignments/${a.id || a.slug}`,
  }));
}

// tiny sample
const SAMPLE = {
  assignments: [
    { id: "1", title: "Quiz: Chapter 1", due: "2025-10-02", status: "active", link: "/quiz/1" },
    { id: "2", title: "Reflection Essay", due: "2025-10-05", status: "upcoming", link: "/reflection/1" },
    { id: "3", title: "Vocabulary Drill", due: "2025-09-28", status: "done", link: "/vocab/1" },
  ]
};
