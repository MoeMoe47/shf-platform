// src/components/AttendanceCard.jsx
import React from "react";
import KpiCard from "@/components/ui/KpiCard.jsx";
import { getPercentWash } from "@/utils/getWashClass.js";

/**
 * Washed KPI AttendanceCard
 *
 * Props (any of these work):
 *  - present: number  (e.g., 4)
 *  - total:   number  (e.g., 5)
 *  - events:  array of records; counts present via:
 *      • e.present === true
 *      • OR e.status/attended equals "present" (case-insensitive)
 *  - intensity: 5 | 10 | 15 (default 10)
 *  - title: string (default "Attendance")
 *  - periodLabel: string appended to subline (default "this week")
 *  - sub: string (override computed subline)
 */
export default function AttendanceCard({
  present,
  total,
  events = [],
  intensity = 10,
  title = "Attendance",
  periodLabel = "this week",
  sub,
}) {
  // Derive present/total from events if not explicitly provided
  let p = Number.isFinite(present) ? Number(present) : 0;
  let t = Number.isFinite(total) ? Number(total) : 0;

  if ((!Number.isFinite(present) || !Number.isFinite(total)) && Array.isArray(events) && events.length) {
    t = events.length;
    p = events.reduce((acc, e) => {
      if (e?.present === true) return acc + 1;
      const status = String(e?.status ?? e?.attended ?? "").toLowerCase();
      return acc + (status === "present" || status === "attended" ? 1 : 0);
    }, 0);
  }

  // Clamp 0–100 and round
  const pct = t > 0 ? Math.max(0, Math.min(100, Math.round((p / t) * 100))) : NaN;
  const washClass = getPercentWash(pct, { intensity }); // 5/10/15 tints

  const subtitle =
    sub ??
    (t > 0
      ? `Present ${p}/${t}${periodLabel ? ` ${periodLabel}` : ""}`
      : "No attendance data");

  return (
    <KpiCard
      washClass={washClass}
      label={title}
      value={`${Number.isFinite(pct) ? pct : 0}%`}
      sub={subtitle}
      aria-live="polite"
    />
  );
}
