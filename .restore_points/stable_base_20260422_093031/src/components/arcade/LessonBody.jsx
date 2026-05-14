import React from "react";
/* Simple soft-surface wrapper for Arcade lessons */
export default function LessonBody({ lesson, children }) {
  return (
    <div className="lesson-body" data-surface="soft">
      <div className="lesson-surface">
        {children ?? (
          <div className="sh-grid" style={{ gap: 12 }}>
            <header className="sh-card">
              <div className="sh-cardBody sh-cardBody--flat">
                <h1 className="sh-title" style={{ marginTop: 0 }}>{lesson?.title || "🕹️ Arcade Lesson"}</h1>
                {lesson?.overview && <p className="sh-sub" style={{ marginTop: 6 }}>{lesson.overview}</p>}
              </div>
            </header>
          </div>
        )}
      </div>
    </div>
  );
}
