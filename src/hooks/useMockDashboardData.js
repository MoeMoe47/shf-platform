import React from "react";

/**
 * useMockDashboardData
 * Simulates async loading of dashboard data for cards.
 */
export default function useMockDashboardData() {
  const [state, setState] = React.useState({
    loading: true,
    events: [],
    assignments: [],
    progress: null
  });

  React.useEffect(() => {
    const t = setTimeout(() => {
      setState({
        loading: false,
        events: [
          { date: "2025-09-12", type: "zoom",       title: "Live Class — Module 1" },
          { date: "2025-09-14", type: "assignment", title: "Lesson 1 Reflection Due" },
          { date: "2025-09-18", type: "zoom",       title: "Workshop: Resume Polishing" },
          { date: "2025-09-20", type: "milestone",  title: "Module 1 Progress Check" },
          { date: "2025-09-25", type: "assignment", title: "Quiz 1 Due" },
        ],
        assignments: [
          { id: 1, title: "Lesson 1 Reflection", due: "Sep 14", status: "due-soon" },
          { id: 2, title: "Quiz 1",              due: "Sep 25", status: "ok" },
        ],
        progress: {
          overallPct: 65,
          lessonsDone: 8,
          lessonsTotal: 12,
          dueThisWeekPct: 42,
          streakDays: 4,
        }
      });
    }, 900);

    return () => clearTimeout(t);
  }, []);

  return state;
}
