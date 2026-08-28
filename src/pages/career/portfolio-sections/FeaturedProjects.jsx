// src/pages/career/portfolio-sections/FeaturedProjects.jsx
import React from "react";
import { BrainIcon, MasterViewIcon } from "@/components/curriculum/icons.jsx";
import ProjectCard from "./ProjectCard.jsx";

/**
 * No connected "student projects" data source exists in the repo.
 * Isolated here so a real source can replace it without touching the
 * row-rendering markup in ProjectCard.jsx.
 */
const PROJECTS = [
  {
    id: "ai-career-coach",
    Icon: BrainIcon,
    title: "AI Career Coach",
    kind: "AI Agent",
    kindTone: "ai",
    status: "Completed",
    description: "An AI-powered tool that helps students explore careers.",
    tech: ["Python", "OpenAI API", "Streamlit"],
  },
  {
    id: "community-website",
    Icon: MasterViewIcon,
    title: "Responsive Community Website",
    kind: "Web Development",
    kindTone: "web",
    status: "In review",
    description: "A modern, mobile-friendly website for a local nonprofit.",
    tech: ["HTML", "CSS", "JavaScript", "GitHub"],
  },
];

export default function FeaturedProjects() {
  return (
    <section className="sp-card" aria-labelledby="sp-projects-h">
      <div className="sp-cardHeadRow">
        <h2 id="sp-projects-h" className="sp-cardTitle">
          Featured Projects
        </h2>
        <button
          type="button"
          className="sp-viewLink"
          aria-disabled="true"
          title="Full project list coming soon"
          onClick={(e) => e.preventDefault()}
        >
          View all
        </button>
      </div>

      <ul className="sp-projectList">
        {PROJECTS.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </ul>
    </section>
  );
}
