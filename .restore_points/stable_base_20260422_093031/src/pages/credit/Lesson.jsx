// src/pages/credit/Lesson.jsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import LessonBody from "@/components/credit/LessonBody.jsx";

function getLessonById(id) {
  return {
    id,
    title: "Credit Strategy — Understanding Utilization",
    overview: "Learn how your credit utilization impacts your overall credit score.",
    objectives: [
      "Define credit utilization and how it’s calculated",
      "Describe how high utilization can lower scores",
      "Identify steps to maintain a healthy ratio"
    ],
    vocab: [
      { term: "Utilization", def: "The percentage of credit limit currently used." },
      { term: "Revolving Credit", def: "Accounts like credit cards that renew monthly." }
    ],
    content: [
      "Credit utilization measures how much of your available credit you’re using. A lower percentage typically helps your credit score.",
      "Experts recommend keeping utilization below 30%, ideally closer to 10%.",
      "Paying down balances, increasing credit limits, and avoiding maxed-out cards are effective strategies."
    ],
    quizzes: [
      {
        id: "q1",
        stem: "What’s the recommended max credit utilization ratio?",
        choices: ["10%", "30%", "50%", "75%"],
        correctIndex: 1,
        hint: "Below this percentage is generally considered healthy."
      }
    ],
    media: { url: "https://www.consumerfinance.gov/ask-cfpb/" }
  };
}

export default function CreditLessonPage() {
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
