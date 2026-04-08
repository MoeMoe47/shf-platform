// src/layouts/FoundationLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";

const ID = "foundation-css-reset";
const CSS = `
html[data-app="foundation"] body {
  margin: 0;
  background: #f6f0e6;
}

html[data-app="foundation"] #root,
html[data-app="foundation"] #app {
  min-height: 100vh;
}

.fd-clean-shell {
  min-height: 100vh;
}
`;

function ensureCss() {
  if (document.getElementById(ID)) return;
  const el = document.createElement("style");
  el.id = ID;
  el.textContent = CSS;
  document.head.appendChild(el);
}

export default function FoundationLayout() {
  React.useEffect(() => {
    document.documentElement.dataset.app = "foundation";
    ensureCss();
  }, []);

  return (
    <div className="fd-clean-shell">
      <Outlet />
    </div>
  );
}
