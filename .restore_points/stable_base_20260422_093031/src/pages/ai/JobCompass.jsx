import React from "react";
import MapHero from "@/components/ai-compass/MapHero.jsx";
import Legend from "@/components/ai-compass/Legend.jsx";
import Ticker from "@/components/ai-compass/Ticker.jsx";
import AIScoreModal from "@/components/ai-compass/AIScoreModal.jsx";
import JobClock from "@/components/ai-compass/JobClock.jsx";
import Drawer from "@/components/ai-compass/Drawer.jsx";
import AIPredictPromo from "@/components/ai-compass/AIPredictPromo.jsx";

import "@/styles/ai-compass.css";
import "@/styles/ai-compass.solutions.css";
import "@/styles/ticker.css";
import "@/styles/promo.css";

export default function JobCompass(){
  const [layers, setLayers] = React.useState({ red:true, green:true, orange:true });
  const [selectedMetro, setSelectedMetro] = React.useState(null);
  const [scoreOpen, setScoreOpen] = React.useState(false);

  return (
    <div className="ai-compass ai-compass--solutions">
      <header className="ai-head ai-head--solutions">
        <div className="ai-brand">
          <img src="/src/assets/brand/solutions-logo.svg" alt="Solutions" width="28" height="28" className="ai-brandLogo"/>
          <span className="ai-brandText">AI Job Compass</span>
        </div>
        <div className="ai-tools">
          <button className="ai-btn ai-btn--solutions" onClick={() => setScoreOpen(true)}>Get My AI Score</button>
        </div>
      </header>

      <main className="ai-main">
        <div className="ai-mapWrap">
          <MapHero layers={layers} onSelectMetro={setSelectedMetro} />
          <Legend layers={layers} onToggle={(k)=>setLayers(s=>({ ...s, [k]: !s[k] }))} />
          <JobClock />
          <AIPredictPromo onStart={() => setScoreOpen(true)} />
        </div>
        <Drawer metro={selectedMetro} onClose={()=>setSelectedMetro(null)} />
      </main>

      <Ticker />
      <AIScoreModal open={scoreOpen} onClose={() => setScoreOpen(false)} />
    </div>
  );
}
