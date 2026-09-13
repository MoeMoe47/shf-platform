// src/pages/curriculum/CurriculumDashboard.jsx
import React from "react";
import CurrentPathwayCard from "./sections/CurrentPathwayCard.jsx";
import WeeklySummaryCard from "./sections/WeeklySummaryCard.jsx";
import LearningProgressCard from "./sections/LearningProgressCard.jsx";
import WalletRewardsCard from "./sections/WalletRewardsCard.jsx";
import UpcomingAssignmentsCard from "./sections/UpcomingAssignmentsCard.jsx";
import CurriculumCalendar from "./sections/CurriculumCalendar.jsx";
import SpecializationAssignmentPanel from "../../components/curriculum/SpecializationAssignmentPanel.jsx";
import { Link } from "react-router-dom";
import { SeaDashboardSection, SeaHelpRegion, SeaNextAction } from "@/components/sea/SeaDashboardPrimitives.jsx";

export default function CurriculumDashboard() {
  return (
    <div className="sea-dashboardPage" data-ogl-anchor="curriculum-workspace">
      <SeaDashboardSection title="Current learning context" eyebrow="Curriculum" className="sea-dashboardContext">
        <p>Continue your active program, course, and assigned learning work.</p>
      </SeaDashboardSection>
      <SeaNextAction
        label="Open current assignments"
        description="The curriculum projection determines which assignment or lesson is next for you."
        href="/curriculum/asl/assignments"
        source="DOMAIN_PROJECTION"
      />
      <div className="ld-dashGrid">
      <div className="ld-dashCol ld-dashColMain">
        <SpecializationAssignmentPanel />
        <CurrentPathwayCard />
        <LearningProgressCard />
        <UpcomingAssignmentsCard />
      </div>
      <div className="ld-dashCol ld-dashColSide">
        <WeeklySummaryCard />
        <WalletRewardsCard />
        <CurriculumCalendar />
        <section className="ld-card ld-careerBridge" aria-labelledby="ld-career-bridge-title">
          <p className="ld-eyebrow">Learning to career</p>
          <h2 id="ld-career-bridge-title" className="ld-cardTitle">Connect your learning</h2>
          <p className="ld-mutedLine">Explore pathways, see related skills, and choose a next step when you are ready.</p>
          <div className="ld-careerBridgeActions">
            <a className="ld-btn ld-btnPrimary" href="/career.html#/dashboard">Open Career Center</a>
            <a className="ld-viewLink" href="/career.html#/pathways">Explore pathways</a>
            <Link className="ld-viewLink" to="/asl/portfolio">View portfolio</Link>
          </div>
        </section>
      </div>
      </div>
      <SeaHelpRegion>
        <p>Use the Guidance Center and Companion for contextual help without changing learning state.</p>
      </SeaHelpRegion>
    </div>
  );
}
