import React from "react";
import Hero from "@/components/lordOutcomes/ui/Hero.jsx";
import MetricTile from "@/components/lordOutcomes/ui/MetricTile.jsx";

export default function LordOutcomesHome(){
  return (
    <>
      <Hero
        title="Lord of Outcomes"
        subtitle="Regional outcome intelligence, funding performance, and pilot-ready metrics."
      />

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 18
      }}>
        <MetricTile label="Total Participants" value="12,480" />
        <MetricTile label="Programs Active" value="42" />
        <MetricTile label="Placements Verified" value="3,912" />
        <MetricTile label="Retention Rate" value="78%" />
        <MetricTile label="Funding Efficiency" value="$1.42 / $1" hint="ROI per dollar" />
        <MetricTile label="Pilots Running" value="7" />
      </div>
    </>
  );
}
