import React from "react";
import { ExplorerIcon } from "../explorerIcons.jsx";

export default function ProgramResultCard({ program }) {
  const href = `#/explorer/projections/${encodeURIComponent(program.id)}`;

  return (
    <article className="cse-program-card">
      <div className="cse-program-card__thumb" aria-hidden="true">
        <ExplorerIcon name={thumbIconFor(program.thumbnailIcon)} />
      </div>

      <div className="cse-program-card__body">
        <div className="cse-program-card__title-row">
          <h3 className="cse-program-card__title">
            <a href={href} className="cse-program-card__title-link">
              {program.name}
            </a>
          </h3>
          <span className="cse-pill">{program.status}</span>
        </div>
        <p className="cse-program-card__meta">
          {program.county} | {program.category}
        </p>
        <p className="cse-program-card__desc">{program.description}</p>
        <ul className="cse-tag-row" aria-label={`Tags for ${program.name}`}>
          {program.tags.map((tag) => (
            <li className="cse-tag" key={tag}>
              {tag}
            </li>
          ))}
        </ul>
      </div>

      <a href={href} className="cse-program-card__action" aria-label={`View ${program.name}`}>
        <ExplorerIcon name="chevronRight" />
      </a>
    </article>
  );
}

// Thumbnails are restrained icon placeholders, not fabricated stock
// photography — see docs/ui/CIVICSURE_EXPLORER_FRAME.md.
function thumbIconFor(key) {
  switch (key) {
    case "students":
      return "book";
    case "housing":
      return "home";
    case "counseling":
      return "userCheck";
    case "workforce":
      return "building";
    default:
      return "grid";
  }
}
