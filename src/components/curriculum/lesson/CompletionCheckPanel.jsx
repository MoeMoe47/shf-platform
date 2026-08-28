// src/components/curriculum/lesson/CompletionCheckPanel.jsx
//
// Approved mock's "Completion Check" card. Phase 1 compatibility rule
// (guided-experience spec §13, reaffirmed in the fidelity-correction pass
// §7): there is no canonical composite requirement evaluator anywhere in
// this repo, so this must not silently rename the existing "Mark as
// Complete" action into something that implies real requirement
// verification now happens. The actual backend contract is unchanged — a
// direct call to the real, unmodified
// src/shared/progress/progressClient.js's markLessonComplete() — and this
// remains the same institutional completion surface
// src/components/lessons/LessonBody.jsx already uses for the legacy
// /curriculum/lesson/:id route (see
// tests/curriculumLessonCompletionSurface.test.mjs, which pins that
// route/component pair and is intentionally untouched by this work).
//
// Fidelity-correction pass (2026-08-27): the previous "Mark as Complete
// (+5)" button let reward language dominate an institutional completion
// action, and gave no honest explanation of what "Completion Check" means
// when no evaluator exists. The button is now "Mark Lesson Complete" (the
// +5 reward is disclosed as a small secondary note, not the headline), and
// the card explains the current state in plain language, per explicit
// instruction. "View requirements" is a real, non-fabricated affordance —
// it only scrolls to the real (honest, possibly-empty) Requirements panel,
// it does not run any evaluation.
import React from "react";
import { markLessonComplete } from "@/shared/progress/progressClient.js";
import { ClipboardIcon } from "@/components/curriculum/icons.jsx";

export default function CompletionCheckPanel({ lesson, curriculum, actorId, addPoints }) {
  const [completed, setCompleted] = React.useState(false);
  const [syncStatus, setSyncStatus] = React.useState("");

  function handleClick() {
    markLessonComplete({
      actorId,
      curriculum,
      slug: lesson.slug || lesson.id || lesson.title,
      onSyncStatus: ({ status }) => setSyncStatus(status),
    });
    addPoints(5);
    setCompleted(true);
  }

  const syncText =
    syncStatus === "synchronized" ? "Synchronized" : syncStatus === "rejected" ? "Sync failed" : syncStatus ? "Pending sync" : "";

  return (
    <div className="ld-card ld-completionCard">
      <div className="ld-completionTop">
        <span className="ld-completionIcon" aria-hidden="true">
          <ClipboardIcon size={19} />
        </span>
        <div>
          <p className="ld-completionTitle">Completion Check</p>
          <p className="ld-completionDesc">
            Check your progress and see what remains before this lesson can be completed.
          </p>
        </div>
      </div>

      <p className="ld-completionNotice" role="note">
        Requirement verification is not available yet — marking this lesson complete records your own
        progress, not a verified institutional evaluation.
      </p>

      <div className="ld-completionActions">
        <a className="ld-btnGhost" href="#lesson-requirements">View requirements</a>
        <div className="ld-completionActionsRight">
          {syncText && (
            <span className="ld-completionSync" data-status={syncStatus} aria-live="polite">
              {syncText}
            </span>
          )}
          {!completed && <span className="ld-completionReward">+5 pts on completion</span>}
          <button type="button" className="ld-btn ld-btnPrimary" disabled={completed} onClick={handleClick}>
            {completed ? "Lesson Complete ✓" : "Mark Lesson Complete"}
          </button>
        </div>
      </div>
    </div>
  );
}
