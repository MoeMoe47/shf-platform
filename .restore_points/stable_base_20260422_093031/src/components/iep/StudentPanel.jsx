import React from "react";
import GoalCard from "./GoalCard";
import SummaryCard from "./SummaryCard";

export default function StudentPanel({ student, simpleMode, voiceMode }) {
  const handleRead = (text) => {
    if (!voiceMode || typeof window === "undefined" || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  return (
    <section className="panel" aria-labelledby="student-panel-title">
      <div className="panel-header">
        <h2 id="student-panel-title">Student View</h2>
        <button
          type="button"
          className="panel-action"
          onClick={() =>
            handleRead(`${student.name} dashboard. ${student.goals.length} goals loaded.`)
          }
        >
          Read Section
        </button>
      </div>

      <SummaryCard
        title={`Welcome, ${student.name}`}
        body="This view shows current IEP goals, progress, status, and next steps."
      />

      <div className="stack">
        {student.goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            simpleMode={simpleMode}
            onRead={() =>
              handleRead(
                `${goal.title}. Current ${goal.current} ${goal.unit}. Target ${goal.target} ${goal.unit}. Status ${goal.status}. ${goal.explanation}. Next step: ${goal.nextStep}.`
              )
            }
          />
        ))}
      </div>

      <SummaryCard title="Next Step" body={student.nextStep} />
    </section>
  );
}
