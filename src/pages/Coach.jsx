import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import CoachPanel from "@/components/CoachPanel.jsx";

export default function Coach() {
  const location = useLocation();

  // 🔹 Global helper to open Coach Mode anywhere
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.coach = {
        open: () => {
          const event = new CustomEvent("open-coach-panel");
          window.dispatchEvent(event);
        },
      };
    }
  }, []);

  // 🔹 Context-aware coaching hint
  const pageHint = React.useMemo(() => {
    if (location.pathname.includes("portfolio")) return "Guide learners on showcasing their work and achievements.";
    if (location.pathname.includes("career")) return "Assist learners in refining career goals and next steps.";
    if (location.pathname.includes("explore")) return "Help students compare pathways and identify best-fit careers.";
    if (location.pathname.includes("arcade")) return "Use interactive practice games to reinforce learning outcomes.";
    return "Provide personalized feedback, motivation, and growth-focused coaching.";
  }, [location.pathname]);

  return (
    <div className="stack" style={{ paddingBottom: 60 }}>
      <div className="card card--pad">
        <p className="subtle" style={{ margin: 0 }}>
          <Link to="/dashboard">Career Center</Link> / Coach
        </p>
        <h1 className="h1" style={{ margin: 0 }}>Coach Mode</h1>
        <p className="subtle">
          Real-time pedagogy tips, mentoring insights, and adaptive feedback powered by Billy Gateson AI.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link className="btn" to="/lessons">📘 Browse Lessons</Link>
          <Link className="btn" to="/instructor">🧑‍🏫 Instructor Guides</Link>
        </div>
      </div>

      {/* Universal Coach Panel */}
      <CoachPanel
        lesson={{
          title: "Global Coaching Mode",
          objectives: [pageHint],
        }}
      />

      <div style={{ textAlign: "center", marginTop: 16 }}>
        <p className="subtle" style={{ fontSize: 13, opacity: 0.75 }}>
          Tip: You can open Coach Mode from anywhere with <strong>Alt + C</strong> or by calling <code>window.coach.open()</code>.
        </p>
      </div>

      <style>{`
        .stack { display: grid; gap: 12px; }
        .btn {
          background: var(--accent, #ff4f00);
          color: #fff;
          text-decoration: none;
          padding: 8px 14px;
          border-radius: 8px;
          font-weight: 600;
        }
        .btn:hover { opacity: 0.9; }
        :not([data-app="curriculum"])[data-theme="dark"] .btn { background: #ff6a1a; color: #fff; }
      `}</style>
    </div>
  );
}
