import React from "react";

export default function HtmlFallback({ src, title = "Lesson HTML" }) {
  return (
    <div className="card card--pad" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--line,#e5e7eb)" }}>
        <span style={{ opacity: 0.7 }}>Using HTML fallback</span>
        <span style={{ opacity: 0.7, marginLeft: 12 }}>
          • expected file: <code>/public{src}</code>
        </span>
      </div>
      <iframe
        title={title}
        src={src}
        style={{ width: "100%", height: "70vh", border: 0, display: "block" }}
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
      />
    </div>
  );
}
