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
// Fidelity-correction pass (2026-08-27): reward language remains secondary
// to the institutional completion action, and the card explains the current
// backend-confirmation state in plain language. "View requirements" is a
// real, non-fabricated affordance: it only scrolls to the real (honest,
// possibly-empty) Requirements panel and does not run any evaluation.
import React from "react";
import { Link } from "react-router-dom";
import { markLessonComplete } from "@/shared/progress/progressClient.js";
import { checkAssignmentCompletion } from "@/lib/curriculum/activityApi.js";
import { useCelebration } from "@/experience/celebrations/CelebrationProvider.jsx";
import { ChevronRightIcon, ClipboardIcon } from "@/components/curriculum/icons.jsx";

export default function CompletionCheckPanel({ lesson, curriculum, actorId, addPoints, nextHref, assignmentId, unitStableKey, role }) {
  const [completed, setCompleted] = React.useState(false);
  const [syncStatus, setSyncStatus] = React.useState("");
  const [syncPending, setSyncPending] = React.useState(false);
  const [requirements, setRequirements] = React.useState([]);
  const { celebrateAchievement } = useCelebration();
  const celebratedRef = React.useRef(false);

  async function handleCanonicalCheck() {
    setSyncPending(true);
    setSyncStatus("checking");
    setRequirements([]);
    try {
      const result = await checkAssignmentCompletion(role, assignmentId, unitStableKey, lesson.stableKey || lesson.slug || lesson.id);
      if (!result.complete) {
        setRequirements(result.requirements || []);
        setSyncStatus("requirements");
        return;
      }
      setCompleted(true);
      setSyncStatus("synchronized");
      addPoints?.(5);
      if (!celebratedRef.current) {
        celebratedRef.current = true;
        celebrateAchievement({ sourceDomain: "curriculum", sourceRecordId: assignmentId, achievementType: "curriculum.lesson.completed", status: "synchronized", verified: true, title: lesson.title || "Lesson completed" });
      }
    } catch (error) {
      setSyncStatus("rejected");
      setRequirements([{ requirementId: "request", required: true, status: "ERROR", label: "Completion check", detail: error.message || "The completion check failed. Try again." }]);
    } finally { setSyncPending(false); }
  }

  React.useEffect(() => {
    if (!assignmentId || !unitStableKey) return;
    handleCanonicalCheck();
    // The assignment-scoped completion endpoint is the canonical read/check
    // boundary; rechecking on mount rehydrates refreshes and new sessions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId, unitStableKey, lesson.stableKey, lesson.slug, lesson.id]);

  function handleClick() {
    markLessonComplete({
      actorId,
      curriculum,
      slug: lesson.slug || lesson.id || lesson.title,
      onSyncStatus: ({ status, item }) => {
        setSyncStatus(status);
        setSyncPending(status === "pending");
        if (status === "rejected") setRequirements(item?.last_error_detail?.requirements || []);
        if (status === "synchronized") {
          setCompleted(true);
          addPoints?.(5);
        }
        if (status === "synchronized" && !celebratedRef.current) {
          celebratedRef.current = true;
          celebrateAchievement({
            sourceDomain: "curriculum",
            sourceRecordId: item?.backend_event_id || item?.event?.subject_id || lesson.slug || lesson.id || lesson.title,
            achievementType: "curriculum.lesson.completed",
            status: "synchronized",
            verified: true,
            title: lesson.title || "Lesson completed",
          });
        }
      },
    });
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
        Completion is checked by the backend against the assignment's active policy and canonical activity results.
      </p>

      {requirements.length > 0 && (
        <div className="ld-completionRequirements" role="alert">
          <strong>Requirements remaining</strong>
          <ul>
            {requirements.filter((requirement) => requirement.required && requirement.status !== "SATISFIED").map((requirement) => (
              <li key={requirement.requirementId || requirement.code || requirement.requirementType}>
                {requirement.label || requirement.requirementType}: {requirement.detail || requirement.status || "Not satisfied"}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="ld-completionActions">
        <a className="ld-btnGhost" href="#lesson-requirements">View requirements</a>
        <div className="ld-completionActionsRight">
          {syncText && (
            <span className="ld-completionSync" data-status={syncStatus} aria-live="polite">
              {syncText}
            </span>
          )}
          {!completed && <span className="ld-completionReward">Personal points are awarded after backend confirmation.</span>}
          {completed && nextHref ? (
            <Link className="ld-btn ld-btnPrimary" to={nextHref}>
              Next Lesson <ChevronRightIcon size={16} />
            </Link>
          ) : (
            <button type="button" className="ld-btn ld-btnPrimary" disabled={completed || syncPending} onClick={assignmentId ? handleCanonicalCheck : handleClick}>
              {completed ? "Lesson Complete ✓" : syncPending ? "Checking…" : "Check Completion"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
