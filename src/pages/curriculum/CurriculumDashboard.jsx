// src/pages/curriculum/CurriculumDashboard.jsx
import React from "react";
import CurrentPathwayCard from "./sections/CurrentPathwayCard.jsx";
import WeeklySummaryCard from "./sections/WeeklySummaryCard.jsx";
import LearningProgressCard from "./sections/LearningProgressCard.jsx";
import WalletRewardsCard from "./sections/WalletRewardsCard.jsx";
import UpcomingAssignmentsCard from "./sections/UpcomingAssignmentsCard.jsx";
import CurriculumCalendar from "./sections/CurriculumCalendar.jsx";
import SpecializationAssignmentPanel from "../../components/curriculum/SpecializationAssignmentPanel.jsx";

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
      </div>
    </div>
  );
}
