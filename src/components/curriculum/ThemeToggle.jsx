import React from "react";
import { currentTheme, applyTheme, setNoAnchor } from "@/utils/curriculum/theme.js";

export default function ThemeToggle({ showAnchorToggle = true }) {
  const [theme, setTheme] = React.useState(() => currentTheme());
  const [noAnchor, setNoAnchorState] = React.useState(
    () => document.documentElement.classList.contains("no-anchor")
  );

  const flipTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    applyTheme(next);
  };

  const flipAnchor = (e) => {
    setNoAnchorState(e.target.checked);
    setNoAnchor(e.target.checked);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button className="cur-iconBtn" onClick={flipTheme}
        title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>
        {theme === "light" ? "🌙" : "☀️"}
      </button>

      {showAnchorToggle && (
        <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <input type="checkbox" checked={noAnchor} onChange={flipAnchor} />
          <span style={{ fontSize: 12 }}>Hide logo column</span>
        </label>
      )}
    </div>
  );
}
