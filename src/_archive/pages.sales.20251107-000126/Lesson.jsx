// src/pages/sales/Lesson.jsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import LessonBody from "@/components/sales/LessonBody.jsx";

function getLessonById(id) {
  return {
    id,
    title: "Sales Fundamentals — ICP, Pipeline, and Discovery",
    overview:
      "Define your ideal customer profile (ICP), structure a clean pipeline, and run discovery that finds real pain.",
    objectives: [
      "Describe what makes a strong ICP",
      "Outline key pipeline stages and exit criteria",
      "Use discovery to qualify needs, timing, and budget",
    ],
    vocab: [
      { term: "ICP", def: "Ideal Customer Profile — the segment you win with." },
      { term: "Exit Criteria", def: "Evidence required to move a deal to the next stage." },
      { term: "MEDDICC", def: "Qualification framework covering Metrics, Decision, etc." },
    ],
    content: [
      "Your ICP focuses your effort where win rates and ACV are highest.",
      "A clean pipeline has unambiguous exit criteria to avoid ‘happy ears’.",
      "Great discovery is about questions, silence, and evidence — not pitching.",
      "Document every call: problem, impact, stakeholders, timeline, and next steps.",
    ],
    quizzes: [
      {
        id: "q1",
        stem: "What’s the main purpose of exit criteria in a pipeline?",
        choices: [
          "Make forecasts look better",
          "Ensure deals only advance with evidence",
          "Shorten the sales cycle",
          "Increase discounting flexibility",
        ],
        correctIndex: 1,
        hint: "Think ‘evidence to progress’.",
        afterParagraphIndex: 1,
      },
    ],
    media: { url: "https://www.gong.io/blog/sales-discovery-questions/" },
  };
}

export default function SalesLessonPage() {
  const { id = "1" } = useParams();
  const navigate = useNavigate();

  const lesson = React.useMemo(() => getLessonById(String(id)), [id]);
  const nextId = String(Number(id) + 1);

  const onGoNext = React.useCallback(() => {
    navigate(`/lesson/${nextId}`);
  }, [navigate, nextId]);

  return <LessonBody lesson={lesson} nextId={nextId} onGoNext={onGoNext} />;
}
