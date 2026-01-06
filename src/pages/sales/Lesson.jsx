// src/pages /sales/Lesson.jsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import LessonBody from "@/components /sales/LessonBody.jsx";
import CoachDrawer from "@/components /sales/CoachDrawer.jsx";
import MicroQuiz from "@/components /sales/MicroQuiz.jsx";
import NotesPanel from "@/components /sales/NotesPanel.jsx";
import { saveArtifact } from "@/utils/exports.js";

/**
 * Assumes you can fetch lesson by id via props or a loader.
 * Replace `getLessonById` with your source.
 */
function getLessonById(id) {
  // placeholder — wire your data
  return {
    id,
    title: "Civic Trade-offs 101",
    overview: "Understand how budgets reflect priorities and trade-offs.",
    objectives: [
      "Explain a budget trade-off in plain language",
      "Identify one impact of shifting funds"
    ],
    vocab: [
      { term: "Appropriation", def: "Legislative authorization to spend money." },
      { term: "Trade-off", def: "Giving up one thing to get another." }
    ],
    content: [
      "Budgets encode value choices. Increasing one line often means decreasing another.",
      "Your goal is to describe the trade-off clearly and suggest a reasonable mitigation."
    ],
    // Optional quiz block (array of { id, q, a[], correct, hint?, explain? })
    // If you already provide quizzes elsewhere, remove/replace this.
    quiz: [
      {
        id: "q1",
        q: "What is a budget trade-off?",
        a: [
          "Increasing every program equally",
          "Choosing to reduce one area to fund another",
          "Ignoring revenue constraints",
          "Spending without legislative approval"
        ],
        correct: 1,
        hint: "It’s about giving up one thing to get another.",
        explain: "Budgets reflect priorities; funding one area may reduce another."
      }
    ]
  };
}

export default function Lesson() {
  const { id = "1" } = useParams();
  const navigate = useNavigate();
  const [lesson] = React.useState(() => getLessonById(String(id)));
  const [coachOpen, setCoachOpen] = React.useState(false);

  // collect mastery for coach (mirror keys used in LessonBody)
  const [mastery, setMastery] = React.useState({});
  React.useEffect(() => {
    const objIds = (lesson?.objectives || []).map((_, i) => `obj${i + 1}`);
    const pairs = objIds.map(o => [o, Number(localStorage.getItem(`civic:lesson:${id}:mastery:${o}`) || "0")]);
    setMastery(Object.fromEntries(pairs));
    const onStorage = (e) => {
      if (e?.key?.startsWith(`civic:lesson:${id}:mastery:`)) {
        const o = e.key.split(":").pop();
        setMastery(m => ({ ...m, [o]: Number(e.newValue || 0) }));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [id, lesson?.objectives]);

  const [reflection, setReflection] = React.useState(() => localStorage.getItem(`civic:lesson:${id}:reflection`) || "");
  React.useEffect(() => {
    const t = setInterval(() => setReflection(localStorage.getItem(`civic:lesson:${id}:reflection`) || ""), 800);
    return () => clearInterval(t);
  }, [id]);

  // 🔹 New: track quiz results + notes mirror for export/portfolio rollups
  const [quizResults, setQuizResults] = React.useState([]);     // [{qid, choice, correct, ts}, ...]
  const [notesState, setNotesState] = React.useState([]);       // optional mirror if your NotesPanel calls onChange

  const nextId = String(Number(id) + 1);

  return (
    <section className="crb-main" aria-labelledby="lesson-heading">
      <header className="db-head" style={{ marginBottom: 12 }}>
        <div>
          <h1 id="lesson-heading" className="db-title">Lesson</h1>
          <p className="db-subtitle">Focused learning with notes, TTS, and micro-checks.</p>
        </div>
        <div className="sh-actionsRow">
          <button className="sh-btn" onClick={() => setCoachOpen(true)} title="Open Coach (Ctrl/⌘+K)">💬 Coach</button>
        </div>
      </header>

      {/* Main lesson body */}
      <LessonBody
        lesson={lesson}
        nextId={nextId}
        onGoNext={() => navigate(`/lesson/${nextId}`)}
      />

      {/* Optional inline quiz (renders only if lesson.quiz exists) */}
      {Array.isArray(lesson?.quiz) && lesson.quiz.length > 0 && (
        <div className="card card--pad" style={{ marginTop: 12 }}>
          <MicroQuiz
            items={lesson.quiz}
            lessonId={lesson.id}
            onUpdate={(res) => setQuizResults(res)}
          />
        </div>
      )}

      {/* Save to Portfolio: captures score% and a timestamp (extend as needed) */}
      <div className="card card--pad" style={{ marginTop: 12 }}>
        <button
          className="sh-btn"
          onClick={() => {
            const scorePct = (() => {
              if (!quizResults?.length) return null;
              const total = quizResults.length;
              const good = quizResults.filter(r => r.correct).length;
              return Math.round((good / total) * 100);
            })();
            saveArtifact({
              type: "lesson-evidence",
              app: "civic",
              lessonId: lesson.id,
              title: lesson.title,
              score: scorePct,
              ts: Date.now()
            });
          }}
        >
          Save to Portfolio
        </button>
      </div>

      {/* Notes side panel (can be repositioned into a sidebar layout if desired) */}
      <div className="card card--pad" style={{ marginTop: 12 }}>
        <NotesPanel lessonId={lesson.id} onChange={setNotesState} />
      </div>

      {/* Coach drawer */}
      <CoachDrawer
        open={coachOpen}
        onClose={() => setCoachOpen(false)}
        lesson={lesson}
        reflection={reflection}
        masteryMap={mastery}
      />
    </section>
  );
}
