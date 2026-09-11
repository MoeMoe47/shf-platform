// src/layouts/CareerLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import { useLocation } from "react-router-dom";
import AppShellLayout from "@/layouts/AppShellLayout.jsx";
import CareerSidebar from "@/components/career/CareerSidebar.jsx";
import SHFFooter from "@/components/shared/SHFFooter.jsx";
import CareerPublicLayout from "@/components/career/CareerPublicLayout.jsx";
import { useCompanion } from "@/hooks/useCompanion.js";

// The floating .coach-fab and this file's own coachOpen state/Alt+C
// listener/local <CoachSlideOver/> mount are gone — Brainiact (mounted
// once, globally, via src/entries/RootProviders.jsx) is now the one
// visible companion/Coach trigger for both Career and Curriculum, and it
// owns opening the same CoachSlideOver via companion.openCoach(). Nothing
// about the Coach chat capability itself changed, only its visible
// trigger identity (see src/companion/CompanionProvider.jsx).
export default function CareerLayout() {
  const companion = useCompanion();
  const location = useLocation();
  const isPublic = location.pathname === "/" || location.pathname === "/explore" || location.pathname === "/pathways" || location.pathname === "/discovery" || location.pathname === "/opportunities" || location.pathname === "/employers" || location.pathname.startsWith("/careers/") || location.pathname.startsWith("/pathways/") || location.pathname.startsWith("/opportunities/") || location.pathname.startsWith("/employers/");

  if (isPublic) return <CareerPublicLayout />;

  return (
    <AppShellLayout
      app="career"
      Sidebar={CareerSidebar}
      title="Career Center"
      headerRight={
        // Equivalent, always-reachable Coach entry in the header utility
        // rail. Required so Brainiact can be safely suppressed while it
        // would otherwise cover the Resume Builder Preview workspace (see
        // career-shell.css `body[data-coach-suppress~="resume-workspace"]
        // .brainiact-root`) without ever making Coach unreachable.
        <button
          type="button"
          className="sh-btn sh-btn--soft car-headerCoachBtn"
          onClick={() => companion.openCoach()}
          title="Ask Coach (Alt+C)"
          aria-label="Ask Coach"
        >
          <span aria-hidden="true">🧠</span>
          <span className="car-headerCoachLabel">Coach</span>
        </button>
      }
      Footer={<SHFFooter variant="career" />}
    >
      <Outlet />
    </AppShellLayout>
  );
}
