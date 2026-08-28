// src/components/curriculum/lesson/EvidencePanel.jsx
//
// Approved mock's compact "Evidence" panel. Presentation only — reads the
// same real, existing local stores the interactive stages already write
// to (src/shared/quiz/store.js, src/shared/progress/progressClient.js's
// markLessonComplete sync-status record, and VocabularyReview's reviewed
// set) rather than inventing a canonical Evidence source. Every row is
// explicitly labeled local/in-progress unless progressClient itself
// reports a real backend sync status ("Synchronized"), so nothing here is
// presented as institutionally verified fact it hasn't earned. Polls at
// the same 1s interval src/hooks/useRewards.js already uses for the same
// reason (no event bus for these localStorage writes).
import React from "react";
import { readQuizState } from "@/shared/quiz/store.js";
import { CheckCircleIcon, CircleIcon, ClockIcon } from "@/components/curriculum/icons.jsx";

const APP = "curriculum";
const PROGRESS_KEY = "progress:records:v1";

function readVocabReviewed(curriculum, slug) {
  try {
    const raw = localStorage.getItem(`curriculum:vocabReviewed:${curriculum}:${slug}`);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function readReflectionSaved(lessonKey, itemId) {
  try {
    return !!localStorage.getItem(`${APP}:reflection:${lessonKey}:${itemId}`);
  } catch {
    return false;
  }
}

function readCompletionRecord(actorId, curriculum, slug) {
  try {
    const all = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "[]");
    return all.filter((r) => r.actorId === actorId && r.curriculum === curriculum && r.slug === slug).pop() || null;
  } catch {
    return null;
  }
}

function Row({ status, label, detail }) {
  const iconClass = status === "done" ? "is-done" : status === "pending" ? "is-pending" : "is-empty";
  const Icon = status === "done" ? CheckCircleIcon : status === "pending" ? ClockIcon : CircleIcon;
  return (
    <li className="ld-evRow">
      <Icon size={16} className={`ld-evIcon ${iconClass}`} />
      <div>
        <p className="ld-evLabel">{label}</p>
        {detail && <p className="ld-evDetail">{detail}</p>}
      </div>
    </li>
  );
}

export default function EvidencePanel({ lesson, curriculum, slug, actorId, checkItemCount, reflectItems, vocabCount }) {
  const [, forceTick] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 1000);
    const onStorage = () => forceTick((n) => n + 1);
    window.addEventListener("storage", onStorage);
    return () => { clearInterval(id); window.removeEventListener("storage", onStorage); };
  }, []);

  const lessonKey = `${curriculum}:${slug}`;
  const rows = [];

  if (vocabCount > 0) {
    const reviewed = readVocabReviewed(curriculum, slug);
    rows.push(
      <Row
        key="vocab"
        status={reviewed.size >= vocabCount ? "done" : reviewed.size > 0 ? "pending" : "empty"}
        label="Vocabulary review"
        detail={`${reviewed.size} of ${vocabCount} terms reviewed (local)`}
      />
    );
  }

  if (checkItemCount > 0) {
    const state = readQuizState(lessonKey, APP);
    const answered = Object.values(state).filter((v) => v?.answered).length;
    rows.push(
      <Row
        key="check"
        status={answered >= checkItemCount ? "done" : answered > 0 ? "pending" : "empty"}
        label="Knowledge check"
        detail={`${answered} of ${checkItemCount} answered (local)`}
      />
    );
  }

  if (Array.isArray(reflectItems) && reflectItems.length > 0) {
    const savedCount = reflectItems.filter((i) => readReflectionSaved(lessonKey, i.id)).length;
    rows.push(
      <Row
        key="reflect"
        status={savedCount >= reflectItems.length ? "done" : savedCount > 0 ? "pending" : "empty"}
        label="Reflection"
        detail={savedCount > 0 ? `Saved locally — not yet submitted to an instructor` : "Not submitted"}
      />
    );
  }

  const completion = readCompletionRecord(actorId, curriculum, slug);
  rows.push(
    <Row
      key="complete"
      status={completion ? (completion.institutionalSyncStatus === "synchronized" ? "done" : "pending") : "empty"}
      label="Lesson completion"
      detail={
        !completion
          ? "Not marked complete"
          : completion.institutionalSyncStatus === "synchronized"
          ? "Synchronized"
          : completion.institutionalSyncStatus === "rejected"
          ? "Sync failed — will retry"
          : "Marked complete — pending sync"
      }
    />
  );

  return (
    <section className="ld-card ld-panelCard" aria-label="Evidence">
      <div className="ld-panelTitleRow">
        <h2 className="ld-panelTitle">Evidence</h2>
      </div>
      {rows.length === 0 ? (
        <p className="ld-panelNote">No lesson activity yet.</p>
      ) : (
        <ul className="ld-evList">{rows}</ul>
      )}
    </section>
  );
}
