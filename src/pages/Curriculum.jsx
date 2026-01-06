// src/pages/Curriculum.jsx
import React, { useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useCreditCtx } from "@/context/CreditContext.jsx";

/**
 * Program Dashboard for a curriculum (e.g., ASL).
 * Route: /:cur/dashboard
 *
 * - Emits a view event to the credit/rewards rail
 * - Shows quick links into Lessons, Vocabulary, Help
 * - Safe if :cur is missing → redirects to /asl/dashboard
 */
export default function Curriculum() {
  const navigate = useNavigate();
  const { cur } = useParams();
  const { emit } =
    typeof useCreditCtx === "function" ? useCreditCtx() : { emit: () => {} };

  // normalize curriculum param (fallback to "asl")
  const curriculum = (cur || "asl").toLowerCase();

  useEffect(() => {
    if (!cur) {
      navigate(`/asl/dashboard`, { replace: true });
      return;
    }
    try {
      emit?.("curriculum:dashboard:view", { app: "curriculum", curriculum });
    } catch {}
  }, [cur, curriculum, emit, navigate]);

  return (
    <div className="page pad" data-page="curriculum-dashboard">
      {/* Header */}
      <header className="card card--pad" style={{ display: "grid", gap: 8 }}>
        <h1 style={{ margin: 0 }}>
          {curriculum.toUpperCase()} Program <span style={{ opacity: 0.6 }}>Dashboard</span>
        </h1>
        <p style={{ margin: 0, opacity: 0.8 }}>
          Jump back into your lessons, review vocabulary, or explore resources.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
          <Link className="sh-btn sh-btn--primary" to={`/${curriculum}/lessons`}>
            View Lessons
          </Link>
          <Link className="sh-btn sh-btn--secondary" to={`/${curriculum}/lesson/chapter1`}>
            Continue (ch1)
          </Link>
          <Link className="sh-btn sh-btn--soft" to={`/${curriculum}/help`}>
            Help
          </Link>
        </div>
      </header>

      {/* Quick Cards */}
      <section
        className="grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 12,
          marginTop: 12,
        }}
      >
        <article className="card card--pad">
          <h2 style={{ marginTop: 0 }}>Lessons</h2>
          <p className="muted">Browse the full set of units and jump to any lesson.</p>
          <Link className="sh-btn sh-btn--secondary" to={`/${curriculum}/lessons`}>
            Open Lessons
          </Link>
        </article>

        <article className="card card--pad">
          <h2 style={{ marginTop: 0 }}>Vocabulary</h2>
          <p className="muted">Practice terms and review signs/key concepts.</p>
          <Link className="sh-btn sh-btn--secondary" to={`/${curriculum}/vocab`}>
            Open Vocab
          </Link>
        </article>

        <article className="card card--pad">
          <h2 style={{ marginTop: 0 }}>Resources</h2>
          <p className="muted">Guides, tips, and help for learners and instructors.</p>
          <Link className="sh-btn sh-btn--secondary" to={`/${curriculum}/help`}>
            Open Help
          </Link>
        </article>
      </section>

      {/* Recent Activity (placeholder) */}
      <section className="card card--pad" style={{ marginTop: 12 }}>
        <h2 style={{ marginTop: 0 }}>Recent Activity</h2>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li className="muted">No recent activity yet. Start with your first lesson.</li>
        </ul>
      </section>
    </div>
  );
}
