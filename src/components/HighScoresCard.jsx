// src/components/HighScoresCard.jsx
import React from "react";
export default function HighScoresCard(){
  const scores = [
    { game: "CDL Driver", score: 1280 },
    { game: "Fade Under Pressure", score: 940 },
  ];
  return (
    <div className="sh-card" role="region" aria-label="High Scores">
      <div className="sh-cardStripe" />
      <div className="sh-cardBody">
        <h4 className="sh-cardTitle" style={{ margin: 0 }}>High Scores</h4>
        <div className="sh-cardContent">
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {scores.map((s,i)=>(
              <li key={i}><strong>{s.score}</strong> — {s.game}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
