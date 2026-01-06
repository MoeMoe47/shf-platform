// src/pages/career/Lesson.jsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import LessonBody from "@/components/career/LessonBody.jsx";

// TODO: replace with real loader (API/content file)
function getLessonById(id) {
  return {
    id,
    title: "Career Strategy — Target Role & Gaps",
    overview: "Define your target role, map current skills, and plan your next 2 moves.",
    objectives: [
      "Choose a target role and title",
      "Identify your top 3 skill gaps",
      "Draft next two actions (project or cert)"
    ],
    vocab: [
      { term: "Competency Map", def: "A grid of skills required for a role." },
      { term: "Artifact", def: "A tangible proof item (project, demo, repo)." }
    ],
    content: [
      "Pick one target role. Specific beats broad (e.g., 'Data Analyst' vs 'Tech').",
      "Scan real job posts to extract 6–10 recurring skills.",
      "Circle 3 gaps. Choose actions you can complete in 2–4 weeks.",
    ],
    quizzes: [
      {
        id: "q1",
        stem: "What’s the best way to pick your next action?",
        choices: [
          "Whatever is trending on social media",
          "An action that closes a gap and creates a portfolio artifact",
          "A random course with a cool thumbnail"
        ],
        correctIndex: 1,
        hint: "Actions should reduce gaps and create proof."
      }
    ],
    media: { url: "https://example.com/career-roadmap" }
  };
}

export default function CareerLessonPage() {
  const { id = "1" } = useParams();
  const navigate = useNavigate();

  const lesson = React.useMemo(() => getLessonById(String(id)), [id]);
  const nextId = String(Number(id) + 1);

  const onGoNext = React.useCallback(() => {
    navigate(`/lesson/${nextId}`);
  }, [navigate, nextId]);

  return (
    <LessonBody
      lesson={lesson}
      nextId={nextId}
      onGoNext={onGoNext}
    />
  );
}
