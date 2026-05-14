import React from "react";

export default function Callout({ type = "tip", title, children }) {
  const map = {
    tip:    { label: "Tip",    icon: "💡" },
    example:{ label: "Example",icon: "📌" },
    caution:{ label: "Heads-up",icon: "⚠️" }
  };
  const meta = map[type] || map.tip;

  return (
    <aside className={`sh-callout sh-callout--${type}`} role="note" aria-label={meta.label}>
      <div className="sh-calloutHead">
        <span className="sh-calloutIcon">{meta.icon}</span>
        <strong className="sh-calloutTitle">{title || meta.label}</strong>
      </div>
      <div className="sh-calloutBody">{children}</div>
    </aside>
  );
}
