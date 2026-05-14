import React from "react";
import { audit } from "@/shared/audit/auditClient.js";

export default function LessonBody({ sections = [], onComplete, onQuizSubmit, lessonId = "lesson:unknown" }) {
  const KEY_SEEN = `seen:${lessonId}`;
  const KEY_REFLECT = `reflect:${lessonId}`;
  const [seen, setSeen] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY_SEEN) || "{}"); } catch { return {}; }
  });
  const [reflection, setReflection] = React.useState(() => {
    try { return localStorage.getItem(KEY_REFLECT) || ""; } catch { return ""; }
  });

  const containerRef = React.useRef(null);
  const total = sections.length;
  const seenCount = Object.values(seen).filter(Boolean).length;
  const progress = total ? Math.round((seenCount / total) * 100) : 0;

  React.useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const io = new IntersectionObserver((entries) => {
      const next = { ...seen }; let changed = false;
      for (const ent of entries) {
        if (ent.isIntersecting) {
          const id = ent.target.getAttribute("data-sec");
          if (id && !next[id]) { next[id] = true; changed = true; }
        }
      }
      if (changed) {
        setSeen(next);
        localStorage.setItem(KEY_SEEN, JSON.stringify(next));
        audit("section_seen", { lessonId, seen: Object.keys(next).length });
      }
    }, { rootMargin: "0px 0px -40% 0px", threshold: 0.2 });

    [...root.querySelectorAll("[data-sec]")].forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [lessonId]); // eslint-disable-line

  React.useEffect(() => {
    if (total && seenCount >= total && onComplete) {
      onComplete({ lessonId, progress: 100 });
      audit("lesson_complete", { lessonId });
    }
  }, [seenCount, total]); // eslint-disable-line

  const onRefChange = (e) => {
    const v = e.target.value;
    setReflection(v);
    try { localStorage.setItem(KEY_REFLECT, v); } catch {}
  };

  const handleQuiz = async (answers) => {
    if (!onQuizSubmit) return;
    const result = await onQuizSubmit(answers);
    audit("quiz_submit", { lessonId, result });
    return result;
  };

  return (
    <div ref={containerRef} className="sh-lesson">
      <div className="sh-progress" role="progressbar" aria-valuenow={progress}
           aria-valuemin={0} aria-valuemax={100} aria-label="Lesson progress">
        <div className="sh-progressFill" style={{width: `${progress}%`}} />
        <span className="sh-progressText">{progress}%</span>
      </div>

      {sections.map((sec) => (
        <article key={sec.id} data-sec={sec.id} className="sh-card" aria-labelledby={`sec-${sec.id}`}>
          <header className="sh-cardHead">
            <h2 id={`sec-${sec.id}`} className="sh-cardTitle">{sec.title}</h2>
          </header>
          <div className="sh-cardBody">
            {sec.jsx ?? <div dangerouslySetInnerHTML={{ __html: sec.html || "" }} />}
            {sec.type === "quiz" && sec.quiz && (
              <div className="sh-quiz">{sec.quiz.render({ onSubmit: handleQuiz })}</div>
            )}
          </div>
        </article>
      ))}

      <section className="sh-card" aria-labelledby="sec-reflection">
        <header className="sh-cardHead"><h2 id="sec-reflection">Reflection</h2></header>
        <div className="sh-cardBody">
          <label htmlFor="reflection" className="sr-only">Reflection</label>
          <textarea id="reflection" value={reflection} onChange={onRefChange}
            placeholder="What did you learn? What would you try next?" rows={6} style={{width:"100%"}} />
          <p className="sh-hint">Autosaved locally.</p>
        </div>
      </section>
    </div>
  );
}
