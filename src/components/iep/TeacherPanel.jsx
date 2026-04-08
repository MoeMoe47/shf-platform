import React from "react";
import StudentRow from "./StudentRow";
import AlertCard from "./AlertCard";

export default function TeacherPanel({
  students,
  selectedStudentId,
  setSelectedStudentId,
  simpleMode,
  voiceMode,
}) {
  const alerts = students
    .filter((s) => s.alert)
    .map((s) => ({
      id: s.id,
      name: s.name,
      message: s.alert,
      recommendation: s.nextStep,
    }));

  const handleRead = (text) => {
    if (!voiceMode || typeof window === "undefined" || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  return (
    <section className="panel panel-center" aria-labelledby="teacher-panel-title">
      <div className="panel-header">
        <h2 id="teacher-panel-title">Teacher View</h2>
        <button
          type="button"
          className="panel-action"
          onClick={() => handleRead("Teacher dashboard loaded. Review students, risk levels, and alerts.")}
        >
          Read Section
        </button>
      </div>

      <div className="table-card" role="table" aria-label="Student progress table">
        <div className="table-head" role="row">
          <div role="columnheader">Student</div>
          <div role="columnheader">Reading</div>
          <div role="columnheader">Math</div>
          <div role="columnheader">Risk</div>
        </div>

        {students.map((student) => (
          <StudentRow
            key={student.id}
            student={student}
            isSelected={student.id === selectedStudentId}
            onSelect={() => setSelectedStudentId(student.id)}
            simpleMode={simpleMode}
            onRead={() =>
              handleRead(
                `${student.name}. Reading ${student.readingProgress} percent. Math ${student.mathProgress} percent. Risk ${student.risk}. ${student.alert || "No active alert."} Recommended action: ${student.nextStep}.`
              )
            }
          />
        ))}
      </div>

      <div className="stack">
        {alerts.map((alert) => (
          <AlertCard
            key={alert.id}
            title={`Alert: ${alert.name}`}
            message={alert.message}
            recommendation={alert.recommendation}
          />
        ))}
      </div>
    </section>
  );
}
