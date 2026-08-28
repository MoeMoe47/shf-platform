// src/pages/career/Portfolio.jsx
//
// Rebuilt to match the approved Student Portfolio mock. Reused/adapted
// (not deleted) from the prior implementation: the real localStorage
// photo-upload flow (AvatarUploader.jsx) and the real interview-practice
// timer/rating/notes/export system (InterviewPractice.jsx). The prior
// static "Badges" and "High Scores" mock lists had no real backing data
// and are superseded here by the mock's own Credentials & Badges
// section; the shared AttendanceCard is not duplicated here since the
// Curriculum Learning Dashboard already surfaces attendance.
//
// Mounted by both src/router/CareerRoutes.jsx ("/portfolio") and
// src/router/CurriculumRoutes.jsx ("asl/portfolio") — see discovery
// notes in the accompanying report. Styles are scoped under .sp-page
// so they cannot leak into either host app's other pages.
import React from "react";

import { markDarkScope } from "../../utils/careerTheme.js";

import PortfolioHeader from "./portfolio-sections/PortfolioHeader.jsx";
import StudentProfileHero from "./portfolio-sections/StudentProfileHero.jsx";
import AvatarUploader from "./portfolio-sections/AvatarUploader.jsx";
import FeaturedProjects from "./portfolio-sections/FeaturedProjects.jsx";
import ProfileStrength from "./portfolio-sections/ProfileStrength.jsx";
import CredentialsBadges from "./portfolio-sections/CredentialsBadges.jsx";
import InterviewPractice from "./portfolio-sections/InterviewPractice.jsx";
import CareerReadiness from "./portfolio-sections/CareerReadiness.jsx";
import RecentAchievements from "./portfolio-sections/RecentAchievements.jsx";

export default function Portfolio() {
  const [editOpen, setEditOpen] = React.useState(false);
  const [shareStatus, setShareStatus] = React.useState("");

  // Dark mode is opt-in per page (see careerTheme.js) — activates only
  // while this page is mounted, so no other page is ever affected.
  // "student-portfolio" gates this file's own .sp-* dark rules
  // (student-portfolio-dark.css). "resume-builder" is ALSO set here — that
  // literal scope name is what the shared shell's existing dark CSS
  // (career-shell.css) checks to let the shared header/sidebar go dark on
  // career.html; it predates this page and was never renamed to
  // something more generic. Reusing it (same approach already taken by
  // Career Pathways) is the smallest-risk way to get shell chrome dark
  // support here too, fully within the existing shared theme system.
  React.useEffect(() => {
    markDarkScope("student-portfolio", true);
    markDarkScope("resume-builder", true);
    return () => {
      markDarkScope("student-portfolio", false);
      markDarkScope("resume-builder", false);
    };
  }, []);

  // Deliberately not using the native Web Share API here: direct testing
  // showed navigator.share() can block the tab's JS execution entirely
  // with no way for a client-side timeout to recover (it can freeze even
  // setTimeout), which is a worse outcome than not offering it. Clipboard
  // copy is a safe, non-destructive, always-resolving alternative that
  // satisfies the same "share this portfolio" need.
  async function handleShare() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus("Portfolio link copied to clipboard.");
    } catch {
      setShareStatus("Unable to copy automatically. Copy the page URL to share your portfolio.");
    }
  }

  return (
    <div className="sp-page">
      <PortfolioHeader />

      <StudentProfileHero
        editOpen={editOpen}
        onToggleEdit={() => setEditOpen((v) => !v)}
        onShare={handleShare}
        shareStatus={shareStatus}
      />

      {editOpen && (
        <div id="sp-edit-panel" className="sp-card" style={{ marginTop: 16 }}>
          <AvatarUploader />
        </div>
      )}

      <div className="sp-body">
        <div className="sp-col">
          <FeaturedProjects />
          <InterviewPractice />
        </div>

        <div className="sp-col">
          <ProfileStrength onComplete={() => setEditOpen(true)} />
          <CredentialsBadges />
          <CareerReadiness />
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <RecentAchievements />
      </div>
    </div>
  );
}
