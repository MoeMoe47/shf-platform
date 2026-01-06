// src/pages/ged/GedWritingChapterStudent.jsx

import React from "react";
import { useParams, Link } from "react-router-dom";
import {
  getGedWritingChapterByNumber,
  getGedWritingChapterList,
} from "@/config/gedWritingSyllabus";

export default function GedWritingChapterStudent() {
  const { number } = useParams();
  const chapter = getGedWritingChapterByNumber(number);
  const chapters = getGedWritingChapterList();

  if (!chapter) {
    return (
      <div className="shf-lesson-root">
        <p>Chapter not found.</p>
        <Link to="/curriculum">Back to Curriculum</Link>
      </div>
    );
  }

  return (
    <div className="shf-lesson-root shf-lesson-root--student">
      <header className="shf-lesson-header">
        <div className="shf-lesson-header-left">
          <Link to="/curriculum" className="shf-breadcrumb-link">
            ← Back to Curriculum
          </Link>

          <div className="shf-lesson-title-block">
            <p className="shf-lesson-eyebrow">Student View · GED Writing</p>
            <h1>
              <span className="shf-lesson-ch-label">Chapter {chapter.number}</span>
              <span className="shf-lesson-ch-title">{chapter.title}</span>
            </h1>
          </div>
        </div>

        <div className="shf-lesson-header-right">
          <div className="shf-badge shf-badge--student">STUDENT</div>
          <div className="shf-progress-pill">
            <span className="shf-progress-label">Course Progress</span>
            <span className="shf-progress-value">{chapter.progressPercent}%</span>
          </div>
        </div>
      </header>

      <main className="shf-lesson-layout">
        <aside className="shf-lesson-sidebar">
          <div className="shf-sidebar-card">
            <h2 className="shf-sidebar-title">GED Writing Chapters</h2>
            <ol className="shf-sidebar-steps">
              {chapters.map((ch) => (
                <li
                  key={ch.number}
                  className={ch.number === chapter.number ? "is-current" : ""}
                >
                  <span>{ch.number}.</span>
                  <Link to={`/curriculum/ged-writing/ch/${ch.number}`}>
                    {ch.title}
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </aside>

        <section className="shf-lesson-content">
          <iframe
            title={chapter.title}
            src={chapter.studentFile}
            className="shf-html-iframe"
          />
        </section>
      </main>
    </div>
  );
}

