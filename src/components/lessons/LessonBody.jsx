// src/components/lessons/LessonBody.jsx
import React from "react";
import MediaRow from "@/components/ui/MediaRow.jsx";
import normalizeLessonMedia from "@/utils/normalizeLessonMedia.js";
import normalizeAssessment from "@/utils/normalizeAssessment.js";
import validateLessonAccessibility from "@/utils/validateLessonAccessibility.js";
import AssessmentRenderer from "./AssessmentRenderer.jsx";
import VocabularyReview from "./VocabularyReview.jsx";
import { markLessonComplete } from "@/shared/progress/progressClient.js";
import { useUser } from "@/context/UserContext.jsx";
import { useRewards } from "@/hooks/useRewards.js";

function Pill({ children }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        fontSize: 12,
        border: "1px solid var(--ring,#e5e7eb)",
        borderRadius: 999,
        background: "#fff",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

export default function LessonBody({
  lesson,
  nextHref,
  curriculum: curriculumProp,
  institutionalCompletion = true,
}) {
  const { email, curriculum: userCurriculum } = useUser();
  const { addPoints } = useRewards();
  const curriculum = curriculumProp || lesson?.curriculum || userCurriculum || "asl";
  const [completed, setCompleted] = React.useState(false);
  const [syncStatus, setSyncStatus] = React.useState("");
  const [syncPending, setSyncPending] = React.useState(false);
  const [showVocabReview, setShowVocabReview] = React.useState(false);
  const actorId = email || "local-student";

  // Phase 2B: dev-only, non-blocking accessibility warnings (§31) — never
  // prevents the lesson from rendering, matches the same console.warn
  // dev-diagnostic pattern already used in MediaRow.jsx.
  React.useEffect(() => {
    if (!lesson || !import.meta.env?.DEV) return;
    const warnings = validateLessonAccessibility(lesson);
    if (warnings.length) {
      console.warn(`[LessonBody] accessibility check found ${warnings.length} issue(s) in "${lesson.title || lesson.slug}":`, warnings);
    }
  }, [lesson]);

  if (!lesson) {
    return (
      <div className="card card--pad">
        <strong>Lesson not found.</strong>{" "}
        <a className="sh-linkBtn" href="/civic.html#/assignments">Back to Assignments</a>
      </div>
    );
  }

  const {
    title,
    estMinutes,
    objectives = [],
    vocab = [],
    sections = [],
  } = lesson;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* Header */}
      <div className="card card--pad">
        <h1 style={{ margin: 0 }}>{title}</h1>
        {estMinutes ? (
          <p className="sh-muted" style={{ marginTop: 6 }}>Estimated time: ~{estMinutes} minutes</p>
        ) : null}
        {/* “table of contents” pills */}
        {!!sections.length && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {sections.map((s, i) => <Pill key={i}>{s.heading || `Section ${i+1}`}</Pill>)}
          </div>
        )}
      </div>

      {/* Objectives */}
      {objectives.length > 0 && (
        <div className="card card--pad">
          <strong>Learning Objectives</strong>
          <ul className="sh-list" style={{ marginTop: 8 }}>
            {objectives.map((o,i)=><li key={i}>{o}</li>)}
          </ul>
        </div>
      )}

      {/* Vocabulary */}
      {vocab.length > 0 && (
        <div className="card card--pad">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <strong>Vocabulary</strong>
            <button type="button" className="sh-btn is-ghost" onClick={() => setShowVocabReview((v) => !v)}>
              {showVocabReview ? "Hide vocabulary review" : "Review vocabulary one at a time"}
            </button>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:8 }}>
            {vocab.map((v,i)=><Pill key={i}>{v.term}</Pill>)}
          </div>
          <ul className="sh-list" style={{ marginTop:8 }}>
            {vocab.map((v,i)=><li key={i}><b>{v.term}</b> — {v.def}</li>)}
          </ul>
        </div>
      )}

      {vocab.length > 0 && showVocabReview && (
        <VocabularyReview
          vocab={vocab}
          curriculum={curriculum}
          slug={lesson.slug || lesson.id || title}
          actorId={actorId}
          onClose={() => setShowVocabReview(false)}
        />
      )}

      {/* Sections */}
      {sections.map((s,i)=>(
        <article key={i} className="card card--pad">
          <h3 style={{ marginTop: 0 }}>{s.heading || `Section ${i+1}`}</h3>
          {s.media ? (
            <MediaRow media={normalizeLessonMedia(s.media)} ratio="16:9" />
          ) : null}
          {typeof s.body === "string" && (
            <div style={{ marginTop: 10, whiteSpace:"pre-wrap" }}
                 dangerouslySetInnerHTML={{ __html: s.body }} />
          )}
        </article>
      ))}

      {/* Knowledge check / quiz / reflection — Phase 2B (SHF Learning
          Experience Infrastructure): real quiz data exists in 72/72 real
          ASL student lessons but was never rendered anywhere a student
          could reach it. normalizeAssessment() adapts the real (4-shape)
          content into one canonical form; AssessmentRenderer renders it
          with real grading/persistence/progress events. */}
      {lesson.quiz && (
        <AssessmentRenderer
          assessment={normalizeAssessment(lesson.quiz)}
          curriculum={curriculum}
          slug={lesson.slug || lesson.id || title}
          actorId={actorId}
        />
      )}

      {/* Sticky footer. Browser-imported lessons are preview-only and must not
          create institutional completion records. */}
      <div
        style={{
          position:"sticky", bottom:0, zIndex:10, padding:"10px 0 2px",
          background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, #fff 28%)"
        }}
      >
        <div className="card card--pad"
             style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ flex:1 }}>
            <div style={{ height:8, background:"#eef2ff", borderRadius: 999, overflow:"hidden" }}>
              <div style={{ width:"40%", height:"100%", background:"var(--brand,#2563eb)", opacity:.4 }} />
            </div>
          </div>
          {institutionalCompletion ? (
            <button
              className="sh-btn"
              disabled={completed || syncPending}
              onClick={() => {
                markLessonComplete({
                  actorId: email || "local-student",
                  curriculum,
                  slug: lesson.slug || lesson.id || title,
                  onSyncStatus: ({ status }) => {
                    setSyncStatus(status);
                    setSyncPending(status === "pending");
                    if (status === "synchronized") {
                      setCompleted(true);
                      addPoints(5);
                    }
                  },
                });
              }}
            >
              {completed ? "Completed ✓" : syncPending ? "Synchronizing…" : "Mark as Complete"}
            </button>
          ) : (
            <span className="sh-muted" role="status">Preview only — completion is unavailable for imported lessons.</span>
          )}
          {institutionalCompletion && syncStatus && (
            <span aria-live="polite" style={{ fontSize: 12, color: syncStatus === "synchronized" ? "#166534" : syncStatus === "rejected" ? "#991b1b" : "#334155" }}>
              {syncStatus === "synchronized" ? "Synchronized" : syncStatus === "rejected" ? "Sync failed" : "Pending sync"}
            </span>
          )}
          <a className="sh-btn is-ghost" href="/civic.html#/assignments">← Back</a>
          {nextHref && <a className="sh-btn is-ghost" href={nextHref}>Next →</a>}
        </div>
      </div>
    </div>
  );
}
