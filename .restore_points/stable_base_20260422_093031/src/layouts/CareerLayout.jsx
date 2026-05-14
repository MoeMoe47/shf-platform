// src/layouts/CareerLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import AppShellLayout from "@/layouts/AppShellLayout.jsx";
import CareerSidebar from "@/components/career/CareerSidebar.jsx";
import CoachSlideOver from "@/components/CoachSlideOver.jsx";

export default function CareerLayout() {
  const [coachOpen, setCoachOpen] = React.useState(false);

  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.altKey || e.metaKey) && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        setCoachOpen(v => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <AppShellLayout app="career" Sidebar={CareerSidebar} title="Career Center">
        <Outlet />
      </AppShellLayout>

      <CoachSlideOver open={coachOpen} onClose={() => setCoachOpen(false)} />
      <button
        className="coach-fab"
        onClick={() => setCoachOpen(true)}
        title="Ask Coach (Alt+C)"
        style={{
          position:"fixed", right:18, bottom:18, zIndex:105,
          borderRadius:999, padding:"10px 14px",
          background:"linear-gradient(135deg, #ff8947 0%, #ff4f00 60%, #ff9659 100%)",
          color:"#fff", fontWeight:800, boxShadow:"0 10px 28px rgba(255,79,0,.35)"
        }}
      >
        Ask Coach
      </button>
    </>
  );
}
