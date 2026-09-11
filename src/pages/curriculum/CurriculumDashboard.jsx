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

export default function CurriculumDashboard() {
  return (
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
  );
}
