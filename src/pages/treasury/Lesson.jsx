import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import LessonBody from "@/components/treasury/LessonBody.jsx";

function getLessonById(id) {
  return {
    id,
    title: "Ledger Anatomy",
    overview: "Understand entries, categories, and proofs for transparency.",
    objectives: [
      "Explain debit vs credit in plain language",
      "Trace a transaction from event → ledger → proof"
    ],
    vocab: [
      { term: "Ledger", def: "Record of all financial transactions." },
      { term: "Proof", def: "Artifact that verifies a ledger entry (receipt, hash, etc.)." }
    ],
    content: [
      "Every entry has a date, memo, amount, and category.",
      "Proofs increase trust—attach a receipt or on-chain hash."
    ],
    quizzes: [
      { id: "q1", stem: "Why attach proofs?", choices: ["Looks nice", "Builds trust/verification", "Optional paperwork"], correctIndex: 1, afterParagraphIndex: 1 }
    ]
  };
}

export default function Lesson() {
  const { id = "1" } = useParams();
  const navigate = useNavigate();
  const [lesson] = React.useState(() => getLessonById(String(id)));

  const [reflection, setReflection] = React.useState(() => localStorage.getItem(`treasury:lesson:${id}:reflection`) || "");
  React.useEffect(() => {
    const t = setInterval(() => setReflection(localStorage.getItem(`treasury:lesson:${id}:reflection`) || ""), 800);
    return () => clearInterval(t);
  }, [id]);

  const nextId = String(Number(id) + 1);

  return (
    <section aria-labelledby="lesson-heading">
      <header className="db-head" style={{ marginBottom: 12 }}>
        <div>
          <h1 id="lesson-heading" className="db-title">🏛️ Lesson</h1>
          <p className="db-subtitle">Transparent finance with notes, TTS, and micro-checks.</p>
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
