// src/entries/index.main.jsx
import React from "react";
import { createRoot } from "react-dom/client";

// Your shared global styles (these exist in your tree)
import "@/styles/global.css";
import "@/styles/shell.css";
import "@/styles/unified-shell.css";

// Providers wrapper (exists in your tree: src/entries/RootProviders.jsx)
import RootProviders from "@/entries/RootProviders.jsx";

/**
 * Simple, safe Launcher that routes users to the correct multi-entry HTML pages.
 * This avoids accidental fall-through to verifier.html and makes dev navigation fast.
 */
function Launcher() {
  const apps = [
    { key: "foundation", label: "Foundation", href: "/foundation.html#/" },
    { key: "solutions", label: "Solutions", href: "/solutions.html#/" },
    { key: "sales", label: "Sales", href: "/sales.html#/" },

    { key: "career", label: "Career Center", href: "/career.html#/" },
    { key: "curriculum", label: "Curriculum", href: "/curriculum.html#/" },
    { key: "civic", label: "Civic", href: "/civic.html#/" },

    { key: "credit", label: "Credit Bureau", href: "/credit.html#/" },
    { key: "debt", label: "Debt Clock", href: "/debt.html#/" },
    { key: "treasury", label: "Treasury", href: "/treasury.html#/" },

    { key: "arcade", label: "Arcade", href: "/arcade.html#/" },
    { key: "fuel", label: "Fuel Tank", href: "/fuel.html#/" },
    { key: "store", label: "Store", href: "/store.html#/" },

    { key: "lord", label: "Lord of Outcomes™", href: "/lord-of-outcomes.html#/" },
    { key: "verifier", label: "Verifier", href: "/verifier.html#/" },
  ];

  return (
    <div className="wash wash--page" style={{ minHeight: "100vh", padding: 24 }}>
      <div
        className="card"
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: 20,
          borderRadius: 18,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26 }}>SHF Launcher</h1>
            <p style={{ marginTop: 8, opacity: 0.8 }}>
              Open an app by visiting its dedicated <code>*.html</code> entry.
            </p>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Dev shortcut</div>
            <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontSize: 12 }}>
              {typeof window !== "undefined" ? window.location.origin : ""}
            </div>
          </div>
        </div>

        <hr style={{ margin: "16px 0", opacity: 0.2 }} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 12,
          }}
        >
          {apps.map((a) => (
            <a
              key={a.key}
              href={a.href}
              className="btn btn--soft"
              style={{
                textDecoration: "none",
                padding: 14,
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
              title={a.href}
            >
              <span style={{ fontWeight: 700 }}>{a.label}</span>
              <span style={{ opacity: 0.65, fontSize: 12 }}>Open →</span>
            </a>
          ))}
        </div>

        <div style={{ marginTop: 18, opacity: 0.75, fontSize: 12, lineHeight: 1.5 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Tip</div>
          <div>
            If you ever get “blank page,” open DevTools Console. Most blanks are a missing import path or a missing CSS file.
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  // mark app scope (you already use this pattern in other entries)
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-app", "index");
  }
  return (
    <RootProviders>
      <Launcher />
    </RootProviders>
  );
}

const el = document.getElementById("root");
if (!el) {
  // fail loudly instead of blank screen
  throw new Error("Root element #root not found in index.html");
}

createRoot(el).render(<App />);
