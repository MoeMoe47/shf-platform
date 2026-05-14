// src/pages/sales/DemoQuiz.jsx
import React from "react";
import { Link } from "react-router-dom";
import PageHeaderPortal from "@/components/sales/PageHeaderPortal.jsx";

const QUESTIONS = [
  {
    q: "Active listening at work means…",
    a: ["Waiting to speak", "Taking notes & reflecting back", "Avoiding eye contact", "Checking your phone"],
    correct: 1,
  },
  {
    q: "Best channel for a quick yes/no from your manager?",
    a: ["Long email", "Slack/Teams DM", "Calendar invite", "Printed memo"],
    correct: 1,
  },
  {
    q: "A clear subject line should…",
    a: ["Be vague", "Include project + action", "Use ALL CAPS", "Include emojis only"],
    correct: 1,
  },
  {
    q: "When you disagree, you should…",
    a: ["Ignore it", "Attack the person", "State facts & propose options", "Escalate immediately"],
    correct: 2,
  },
  {
    q: "After a meeting, send…",
    a: ["Memes", "Action recap & owners", "Blank message", "Nothing ever"],
    correct: 1,
  },
];

export default function DemoQuiz() {
  const [i, setI] = React.useState(0);
  const [chosen, setChosen] = React.useState([]);
  const [done, setDone] = React.useState(false);

  const onPick = (idx) => {
    const next = [...chosen];
    next[i] = idx;
    setChosen(next);
  };

  const onNext = () => {
    if (i < QUESTIONS.length - 1) setI(i + 1);
    else setDone(true);
  };

  const score = React.useMemo(() => {
    if (!done) return 0;
    return QUESTIONS.reduce((s, q, idx) => (q.correct === chosen[idx] ? s + 1 : s), 0);
  }, [done, chosen]);

  return (
    <>
      <PageHeaderPortal>
        <section className="lux-hero frost" style={{ padding: "24px 24px 18px" }}>
          <div className="lux-eyebrow">Check for understanding</div>
          <h1 className="lux-title" style={{ margin: "6px 0 6px" }}>
            Quiz: Workplace Communication
          </h1>
          <p className="lux-sub" style={{ margin: 0 }}>
            5 questions · auto-graded
          </p>
        </section>
      </PageHeaderPortal>

      <section className="lux-page" style={{ display: "grid", gap: 16 }}>
        {!done ? (
          <QuestionCard
            index={i}
            total={QUESTIONS.length}
            q={QUESTIONS[i]}
            picked={chosen[i]}
            onPick={onPick}
            onNext={onNext}
          />
        ) : (
          <ResultCard score={score} total={QUESTIONS.length} />
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <Link to="/sales/demo-dashboard" className="sh-btn sh-btn--secondary">Back to Demo</Link>
          <Link to="/sales/brand" className="sh-btn sh-btn--soft">Brand this demo</Link>
        </div>
      </section>
    </>
  );
}

function QuestionCard({ index, total, q, picked, onPick, onNext }) {
  return (
    <section className="card lux-card" style={{ padding: 16 }}>
      <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
        Question {index + 1} of {total}
      </div>
      <h3 style={{ margin: "6px 0 12px" }}>{q.q}</h3>
      <div style={{ display: "grid", gap: 8 }}>
        {q.a.map((opt, idx) => {
          const isPicked = picked === idx;
          return (
            <button
              key={idx}
              className={`sh-btn ${isPicked ? "" : "sh-btn--secondary"}`}
              style={{ textAlign: "left" }}
              onClick={() => onPick(idx)}
            >
              {opt}
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
        <button className="sh-btn" onClick={onNext} disabled={typeof picked !== "number"}>
          {index + 1 === total ? "Finish" : "Next"}
        </button>
      </div>
    </section>
  );
}

function ResultCard({ score, total }) {
  const pct = Math.round((score / total) * 100);
  const pass = pct >= 80;
  return (
    <section className="card lux-card" style={{ padding: 16 }}>
      <h3 style={{ margin: 0 }}>Your Result</h3>
      <p style={{ margin: "8px 0 12px" }}>
        Score: <strong>{score}/{total}</strong> ({pct}%)
      </p>
      <div
        style={{
          height: 10,
          borderRadius: 8,
          background: "var(--ring)",
          overflow: "hidden",
          margin: "8px 0 12px",
        }}
        aria-label="Score bar"
      >
        <div style={{ width: `${pct}%`, height: "100%", background: pass ? "#10b981" : "#e11d2d" }} />
      </div>
      <p style={{ margin: 0 }}>
        {pass ? "Great job! Ready for the next module." : "Let’s review the lesson and try again."}
      </p>
    </section>
  );
}
