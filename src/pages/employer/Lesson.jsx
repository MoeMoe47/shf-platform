import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import LessonBody from "@/components/employer/LessonBody.jsx";

function getLessonById(id) {
  return {
    id,
    title: "Structured Interviewing",
    overview: "Consistent questions + rubrics improve fairness and signal quality.",
    objectives: [
      "Draft a 5-question structured interview",
      "Create a 1–5 rubric for two competencies"
    ],
    vocab: [
      { term: "Structured Interview", def: "Every candidate gets the same questions and rubric." },
      { term: "Signal", def: "Evidence that correlates with job success." }
    ],
    content: [
      "Pick 2–3 competencies and ask behavior-based questions.",
      "Score with a rubric to reduce bias and increase reliability."
    ],
    quizzes: [
      { id: "q1", stem: "Best question style?", choices: ["Hypothetical", "Behavior-based", "Trivia"], correctIndex: 1, afterParagraphIndex: 0 }
    ]
  };
}

export default function Lesson() {
  const { id = "1" } = useParams();
  const navigate = useNavigate();
  const [lesson] = React.useState(() => getLessonById(String(id)));

  const [reflection, setReflection] = React.useState(() => localStorage.getItem(`employer:lesson:${id}:reflection`) || "");
  React.useEffect(() => {
    const t = setInterval(() => setReflection(localStorage.getItem(`employer:lesson:${id}:reflection`) || ""), 800);
    return () => clearInterval(t);
  }, [id]);

  const nextId = String(Number(id) + 1);

  return (
    <section aria-labelledby="lesson-heading">
      <header className="db-head" style={{ marginBottom: 12 }}>
        <div>
          <h1 id="lesson-heading" className="db-title">🏢 Lesson</h1>
          <p className="db-subtitle">Hiring craft with notes, TTS, and micro-checks.</p>
        </div>
        <div className="sh-actionsRow">
          <button className="sh-btn" onClick={() => window.dispatchEvent(new CustomEvent("coach:open", { detail: { lessonId: id } }))}>💬 Coach</button>
        </div>
      </header>

      <LessonBody
        lesson={lesson}
        nextId={nextId}
        onGoNext={() => navigate(`/lesson/${nextId}`)}
      />
    </section>
  );
}
