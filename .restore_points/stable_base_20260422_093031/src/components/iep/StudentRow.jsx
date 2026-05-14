import React from "react";

export default function StudentRow({
  student,
  isSelected,
  onSelect,
  onRead,
}) {
  return (
    <button
      type="button"
      className={`student-row ${isSelected ? "is-selected" : ""}`}
      onClick={onSelect}
      aria-pressed={isSelected}
    >
      <div className="student-cell">
        <strong>{student.name}</strong>
      </div>

      <div className="student-cell">
        {student.readingProgress}%
      </div>

      <div className="student-cell">
        {student.mathProgress}%
      </div>

      <div className="student-cell student-risk-wrap">
        <span className={`status-chip status-${student.risk.toLowerCase().replace(/\s+/g, "-")}`}>
          {student.risk}
        </span>
        <span className="sr-only">
          {student.alert ? `Alert: ${student.alert}` : "No current alert"}
        </span>
        <button
          type="button"
          className="inline-action"
          onClick={(e) => {
            e.stopPropagation();
            onRead();
          }}
        >
          Explain
        </button>
      </div>
    </button>
  );
}
