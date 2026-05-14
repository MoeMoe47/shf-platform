// src/components/BadgesCard.jsx
import React from "react";
export default function BadgesCard(){
  const badges = ["📚 Starter", "🚀 Streak 7", "🌽 SH Core"];
  return (
    <div className="sh-card" role="region" aria-label="Badges">
      <div className="sh-cardStripe" />
      <div className="sh-cardBody">
        <h4 className="sh-cardTitle" style={{ margin: 0 }}>Badges</h4>
        <div className="sh-cardContent">
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {badges.map((b,i)=><li key={i}>{b}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}
