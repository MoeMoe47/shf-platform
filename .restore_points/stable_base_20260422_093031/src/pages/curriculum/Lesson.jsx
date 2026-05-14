import React from "react";
import { useParams, Link } from "react-router-dom";
// Try your shared LessonBody first (adjust import if you prefer another)
import LessonBody from "@/components/lessons/LessonBody.jsx";

const KEY = "cur:lessons";

export default function CurriculumLesson() {
  const { id } = useParams();
  const [lesson, setLesson] = React.useState(null);

  React.useEffect(() => {
    try {
      const all = JSON.parse(localStorage.getItem(KEY) || "[]");
      const match = all.find(l => String(l.id) === String(id));
      setLesson(match || null);
    } catch { setLesson(null); }
  }, [id]);

  if (!lesson) {
    return (
      <div className="page pad">
        <h1>Lesson not found</h1>
        <p>We couldn’t find a stored lesson with id <code>{id}</code>.</p>
        <p><Link to="/lessons">← Back to My Lessons</Link></p>
      </div>
    );
  }

  const title = lesson.title || lesson.raw?.title || "Untitled Lesson";

  return (
    <div className="page pad">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
        <h1 style={{margin:0}}>{title}</h1>
        <Link className="btn" to="/lessons">My Lessons</Link>
      </div>

      {/* Preferred renderer */}
      {lesson.raw ? (
        <LessonBody lesson={lesson.raw} />
      ) : (
        <pre className="card" style={{padding:16,overflow:"auto"}}>{JSON.stringify(lesson, null, 2)}</pre>
      )}
    </div>
  );
}
