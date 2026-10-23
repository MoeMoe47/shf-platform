import React from "react";
import "../styles/foundation-slogans.css";

/** Selectable Foundation lettering; decorative strokes stay out of the reading order. */
/** @param {{lines: string[], variant?: string, tone?: string, as?: React.ElementType, className?: string}} props */
export default function SHFSlogan(props) {
  const {
    lines,
    variant = "structured",
    tone = "ink",
    as: Tag = "p",
    className = "",
  } = props;
  return (
    <Tag
      className={`shf-slogan shf-slogan--${variant} shf-slogan--${tone} ${className}`}
    >
      {lines.map((line, index) => (
        <React.Fragment key={line}>
          {index > 0 ? " " : null}
          <span className="shf-slogan__line">{line}</span>
        </React.Fragment>
      ))}
      {variant === "editorial" ? (
        <svg
          className="shf-slogan__underline"
          viewBox="0 0 240 16"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M5 11 C57 5 133 10 234 4 M19 14 C91 9 155 12 221 7" />
        </svg>
      ) : null}
    </Tag>
  );
}
