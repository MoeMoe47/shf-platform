import React from "react";
import { useReadingLevel } from "@/context/ReadingLevelProvider.jsx";

const LEVELS = ["default","simple","advanced"];

export default function ReadingLevelSwitch(){
  const { level, setLevel } = useReadingLevel?.() || { level: "default", setLevel: () => {} };
  return (
    <div className="sh-row" role="group" aria-label="Reading level">
      {LEVELS.map(l => (
        <button key={l}
          className="sh-btn sh-btn--tiny"
          aria-pressed={level===l}
          onClick={() => setLevel(l)}
          title={`Reading level: ${l}`}
        >
          {label(l)}
        </button>
      ))}
    </div>
  );
}
function label(l){ return l==="default" ? "Std" : l==="simple" ? "Easy" : "Adv"; }
