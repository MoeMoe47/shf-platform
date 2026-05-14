// Lightweight mock data hook for the Dashboard.
// - loading state w/ timeout (shimmers show)
// - refresh() to re-trigger skeletons
// - deterministic sample data (no flakiness)

import * as React from "react";

const SAMPLE = {
  resumeHint: {
    text: "Pick up where you left off in Module 1, Lesson 3.",
    continueHref: "/asl/lesson/student.asl-03",
    moduleHref: "/asl/courses",
  },
  progress: {
    overallPct: 65,
    lessonsDone: 8,
    lessonsTotal: 12,
    dueThisWeekPct: 42,
    streakDays: 4,
  },
  assignments: [
    { id: "a1", title: "Lesson 1 Reflection", due: "Today", status: "due-soon" },
    { id: "a2", title: "Quiz 1", due: "Fri", status: "ok" },
    { id: "a3", title: "Resume Draft", due: "Mon", status: "overdue" },
  ],
  today: [
    { labelClass: "live", time: "9:00 AM", text: "Live Class — Module 1" },
    { labelClass: "info", time: "All day", text: "Office Hours (Drop-in)" },
  ],
  quickActions: [
    { id: "qa1", kind: "primary", label: "New Note" },
    { id: "qa2", kind: "secondary", label: "Upload Artifact" },
    { id: "qa3", kind: "secondary", label: "Message Instructor" },
  ],
  announcements: [
    { text: "Module 2 rubric refreshed." },
    { text: "Career Fair next Friday." },
  ],
  calendarEvents: [
    { date: "2025-09-12", type: "zoom",       title: "Live Class — Module 1" },
    { date: "2025-09-14", type: "assignment", title: "Lesson 1 Reflection Due" },
    { date: "2025-09-18", type: "zoom",       title: "Workshop: Resume Polishing" },
    { date: "2025-09-20", type: "milestone",  title: "Module 1 Progress Check" },
    { date: "2025-09-25", type: "assignment", title: "Quiz 1 Due" },
  ],
  activity: [
    { id: "ev1", kind: "artifact", title: "Uploaded: Resume v1.pdf", when: "2h ago" },
    { id: "ev2", kind: "badge",    title: "Earned: Communication L1", when: "Yesterday" },
    { id: "ev3", kind: "proof",    title: "Notarized: Lesson 2 quiz score", when: "2d ago" },
  ],
  leaderboard: {
    you: { rank: 3, name: "You", xp: 420 },
    rows: [
      { rank: 1, name: "Alex", xp: 560 },
      { rank: 2, name: "Sam",  xp: 510 },
      { rank: 3, name: "You",  xp: 420 },
      { rank: 4, name: "Dee",  xp: 390 },
      { rank: 5, name: "Kai",  xp: 360 },
    ],
  },
};

export function useDashboardData() {
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState(SAMPLE);

  const load = React.useCallback(() => {
    setLoading(true);
    // Simulate network: 600–900ms
    const t = setTimeout(() => {
      setData(SAMPLE); // could randomize safely if you want
      setLoading(false);
    }, 700);
    return () => clearTimeout(t);
  }, []);

  React.useEffect(load, [load]);

  const refresh = React.useCallback(() => {
    load();
  }, [load]);

  return { loading, data, refresh };
}
