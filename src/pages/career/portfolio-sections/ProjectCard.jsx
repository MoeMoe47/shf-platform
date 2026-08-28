// src/pages/career/portfolio-sections/ProjectCard.jsx
import React from "react";
import { ArrowRightIcon } from "@/components/curriculum/icons.jsx";

export default function ProjectCard({ project }) {
  const { Icon, title, kind, kindTone, status, description, tech } = project;
  const statusClass = status === "Completed" ? "is-complete" : "is-review";

  return (
    <li className="sp-projectRow">
      <span className="sp-projectIcon" aria-hidden="true">
        <Icon size={26} />
      </span>

      <div className="sp-projectMain">
        <div className="sp-projectTitleRow">
          <h3 className="sp-projectTitle">{title}</h3>
          <span className={`sp-tag${kindTone === "web" ? " is-web" : ""}`}>{kind}</span>
        </div>
        <p className="sp-projectDesc">{description}</p>
        <div className="sp-techTags">
          {tech.map((t) => (
            <span key={t} className="sp-techTag">
              {t}
            </span>
          ))}
        </div>
      </div>

      <span className={`sp-statusPill ${statusClass}`}>{status}</span>

      <button
        type="button"
        className="sp-projectNav"
        aria-disabled="true"
        title="Project detail view coming soon"
        onClick={(e) => e.preventDefault()}
      >
        <ArrowRightIcon size={16} />
        <span className="sp-srOnly">{title} — detail view coming soon</span>
      </button>
    </li>
  );
}
