// src/components/curriculum/lesson/LessonStageRail.jsx
//
// Guided-flow stepper for the Student Lesson Guided Experience (Phase 1).
// Renders only stages src/utils/lessonGuidedStages.js found real data for
// — never a fabricated stage. Behaves as a standard ARIA tabs widget
// (roving tabindex, Left/Right/Home/End) so it is fully keyboard
// operable; each stage button has its own accessible name (label +
// status), and the active stage's status is also announced via
// aria-selected/aria-current so screen-reader users don't rely on color
// alone (International Orange) to know where they are.
import React from "react";
import { CheckCircleIcon, CircleIcon } from "@/components/curriculum/icons.jsx";

export default function LessonStageRail({ stages, activeKey, completedKeys, onSelect, panelId }) {
  const buttonRefs = React.useRef({});

  function handleKeyDown(e, index) {
    const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    let nextIndex = index;
    if (e.key === "ArrowLeft") nextIndex = Math.max(0, index - 1);
    if (e.key === "ArrowRight") nextIndex = Math.min(stages.length - 1, index + 1);
    if (e.key === "Home") nextIndex = 0;
    if (e.key === "End") nextIndex = stages.length - 1;
    const target = stages[nextIndex];
    if (target) {
      onSelect(target.key);
      buttonRefs.current[target.key]?.focus();
    }
  }

  return (
    <div className="ld-stageRail" role="tablist" aria-label="Lesson guided stages">
      {stages.map((stage, i) => {
        const isActive = stage.key === activeKey;
        const isComplete = completedKeys.has(stage.key);
        const status = isActive ? "Current step" : isComplete ? "Completed" : "Not yet started";
        return (
          <button
            key={stage.key}
            ref={(el) => { buttonRefs.current[stage.key] = el; }}
            type="button"
            role="tab"
            id={`lesson-stage-tab-${stage.key}`}
            aria-selected={isActive}
            aria-controls={panelId}
            aria-current={isActive ? "step" : undefined}
            tabIndex={isActive ? 0 : -1}
            className={`ld-stageStep${isActive ? " is-active" : ""}${isComplete ? " is-complete" : ""}`}
            onClick={() => onSelect(stage.key)}
            onKeyDown={(e) => handleKeyDown(e, i)}
          >
            <span className="ld-stageDot" aria-hidden="true">
              {isComplete ? <CheckCircleIcon size={18} /> : <CircleIcon size={18} />}
            </span>
            <span className="ld-stageLabel">
              {stage.label}
              <span className="ld-srOnly">, {status}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
