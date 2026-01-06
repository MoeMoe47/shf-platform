// src/pages/curriculum/CurriculumDashboard.jsx
import React from "react";

/* Reuse the same cards Career uses */
import WalletCard from "@/components/dashboard/WalletCard.jsx";
import ProgressCard from "@/components/dashboard/ProgressCard.jsx";
import AssignmentsCard from "@/components/dashboard/AssignmentsCard.jsx";
import CalendarCard from "@/components/CalendarCard.jsx";
import MicroCertsCard from "@/components/dashboard/MicroCertsCard.jsx";
import ActivityFeedCard from "@/components/dashboard/ActivityFeedCard.jsx";

/* ✅ KPI + wash */
import KpiCard from "@/components/ui/KpiCard.jsx";
import { getPercentWash } from "@/utils/getWashClass.js";

/* Optional—nice section title chip like Career */
function SectionTitle({ children }) {
  return <h2 className="cur-secTitle">{children}</h2>;
}

export default function CurriculumDashboard() {
  // Derive/plug in your real attendance; this keeps working even without data
  const attendancePct = Number.isFinite(window.__mockAttendancePct)
    ? window.__mockAttendancePct
    : 86;

  const attendanceWash = getPercentWash(attendancePct, { intensity: 10 });

  return (
    <div className="cur-grid">
      {/* Left column */}
      <section className="cur-stack">
        <SectionTitle>Resume Learning</SectionTitle>

        {/* ✅ New KPI row */}
        <div className="cur-kpis">
          <KpiCard
            washClass={attendanceWash}
            label="Attendance"
            value={`${attendancePct}%`}
            sub="this week"
          />
        </div>

        <ProgressCard />

        <div className="cur-row">
          <AssignmentsCard />
          <CalendarCard />
        </div>

        <MicroCertsCard />
        <ActivityFeedCard />
      </section>

      {/* Right column */}
      <aside className="cur-aside">
        <WalletCard />
      </aside>

      {/* local skin so this works even if CSS is missing */}
      <style>{`
        /* Canvas and card surfaces follow Career tokens if present */
        .cur-grid{
          display:grid;
          grid-template-columns: minmax(0,1fr) 360px;
          gap: 20px;
          padding: 16px;
          background: var(--bg-canvas, #f5eee6);
        }
        @media (max-width: 1100px){
          .cur-grid{ grid-template-columns: 1fr; }
          .cur-aside{ order:-1; }
        }

        .cur-stack{ display:flex; flex-direction:column; gap:20px; }
        .cur-row{ display:grid; grid-template-columns:1fr 1fr; gap:20px; }
        @media (max-width: 900px){ .cur-row{ grid-template-columns:1fr; } }

        .cur-aside{ display:flex; flex-direction:column; gap:20px; }

        /* KPI row grid */
        .cur-kpis{
          display:grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
        }

        .cur-secTitle{
          margin: 4px 2px 2px;
          font-size: 20px;
          font-weight: 800;
          color: var(--ink, #111827);
        }

        /* Ensure child cards render on white like Career */
        .cur-grid :is(article, .card, .panel){
          background: var(--card, #fff);
          border: 1px solid var(--ring, #e5e7eb);
          border-radius: var(--radius, 14px);
          box-shadow: var(--shadow-sm, 0 1px 2px rgba(2,6,23,.06));
        }
      `}</style>
    </div>
  );
}
