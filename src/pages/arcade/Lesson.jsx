import React from "react";
import LessonBody from "@/components/arcade/LessonBody.jsx";

export default function Lesson(){
  const lesson = {
    id: "intro",
    title: "🕹️ Getting Started",
    overview: "Arcade lesson shell (replace with real content)",
    objectives: ["Open the launcher", "Play your first game"],
    content: ["Welcome to the Arcade module.", "Wire your real lesson data here."]
  };
  return <LessonBody lesson={lesson} />;
}
