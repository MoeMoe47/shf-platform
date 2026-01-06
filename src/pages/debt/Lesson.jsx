import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import LessonBody from "@/components/debt/LessonBody.jsx";

function getLessonById(id) {
  return {
    id,
    title: "Snowball vs Avalanche",
    overview: "Two payoff strategies: smallest balance first vs highest APR first.",
    objectives: [
      "Compare snowball and avalanche methods",
      "Pick a method that fits your timeline and psychology"
    ],
    vocab: [
      { term: "APR", def: "Annual Percentage Rate (interest + fees)." },
      { term: "Principal", def: "The amount you still owe excluding interest." }
    ],
    content: [
      "Snowball: quick wins by paying the smallest balance first to build momentum.",
      "Avalanche: mathematically optimal—attack the highest APR first to minimize interest."
    ],
    quizzes: [
      { id: "q1", stem: "Which typically saves more interest?", choices: ["Snowball", "Avalanche", "Equal"], correctIndex: 1, afterParagraphIndex: 1 }
    ]
  };
}

export default function Lesson() {
  const { id = "1" } = useParams();
  const navigate = useNavigate();
  const [lesson] = React.useState(() => getLessonById(String(id)));

  const [reflection, setReflection] = React.useState(() => localStorage.getItem(`debt:lesson:${id}:reflection`) || "");
  React.useEffect(() => {
    const t = setInterval(() => setReflection(localStorage.getItem(`debt:lesson:${id}:reflection`) || ""), 800);
    return () => clearInterval(t);
  }, [id]);

  const nextId = String(Number(id) + 1);

  return (
    <section aria-labelledby="lesson-heading">
      <header className="db-head" style={{ marginBottom: 12 }}>
        <div>
          <h1 id="lesson-heading" className="db-title">📉 Lesson</h1>
          <p className="db-subtitle">Payoff strategies with notes, TTS, and micro-checks.</p>
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
