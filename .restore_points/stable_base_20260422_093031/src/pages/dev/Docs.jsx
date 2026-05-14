import React from "react";

/**
 * DevDocsViewer
 * - Simple dev/preview-only markdown viewer.
 * - Fetches plain .md files from /docs/** (your repo root).
 * - Not bundled for prod use; meant for local + preview.
 */

const DOCS = [
  { group: "Maintenance", items: [
    { label: "Maintenance Home", path: "/docs/maintenance/index.md" },
    { label: "Checklists",       path: "/docs/maintenance/checklists.md" },
    { label: "Troubleshooting",  path: "/docs/maintenance/troubleshooting.md" },
  ]},
  { group: "Runbooks", items: [
    { label: "Add Wash Tint",    path: "/docs/maintenance/runbooks/add-wash-tint.md" },
    { label: "Add New App",      path: "/docs/maintenance/runbooks/add-new-app.md" },
    { label: "Theme & Tokens",   path: "/docs/maintenance/runbooks/theme-and-tokens.md" },
  ]},
  { group: "App Guides", items: [
    { label: "Template",   path: "/docs/maintenance/app-guides/_template.md" },
    { label: "Career",     path: "/docs/maintenance/app-guides/career.md" },
    { label: "Curriculum", path: "/docs/maintenance/app-guides/curriculum.md" },
    { label: "Credit",     path: "/docs/maintenance/app-guides/credit.md" },
    { label: "Debt",       path: "/docs/maintenance/app-guides/debt.md" },
    { label: "Employer",   path: "/docs/maintenance/app-guides/employer.md" },
    { label: "Arcade",     path: "/docs/maintenance/app-guides/arcade.md" },
    { label: "Fuel",       path: "/docs/maintenance/app-guides/fuel.md" },
    { label: "Foundation", path: "/docs/maintenance/app-guides/foundation.md" },
    { label: "Launch",     path: "/docs/maintenance/app-guides/launch.md" },
    { label: "Solutions",  path: "/docs/maintenance/app-guides/solutions.md" },
    { label: "Store",      path: "/docs/maintenance/app-guides/store.md" },
  ]},
  { group: "UI", items: [
    { label: "Wash Utilities",   path: "/docs/ui/wash-utilities.md" },
  ]},
];

export default function DevDocsViewer() {
  const [path, setPath] = React.useState(DOCS[0].items[0].path);
  const [text, setText] = React.useState("");
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    let alive = true;
    setErr("");
    setText("Loading…");
    fetch(path, { cache: "no-store" })
      .then(r => r.ok ? r.text() : Promise.reject(new Error(`${r.status} ${r.statusText}`)))
      .then(t => { if (alive) setText(t); })
      .catch(e => { if (alive) setErr(String(e)); });
    return () => { alive = false; };
  }, [path]);

  return (
    <div style={styles.wrap}>
      <aside style={styles.sidebar}>
        <div style={styles.title}>Dev Docs</div>
        {DOCS.map(section => (
          <div key={section.group} style={{ marginTop: 12 }}>
            <div style={styles.group}>{section.group}</div>
            <ul style={styles.list}>
              {section.items.map(item => (
                <li key={item.path}>
                  <button
                    style={path === item.path ? styles.linkActive : styles.link}
                    onClick={() => setPath(item.path)}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div style={{marginTop: "auto", fontSize: 12, color: "var(--ink-soft)"}}>
          Tip: these files live outside <code>src/</code> in <code>/docs</code>.  
          They’re meant for dev/preview.
        </div>
      </aside>

      <main style={styles.main}>
        <header style={styles.mainHead}>
          <code style={{opacity: 0.8}}>{path}</code>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <a className="btn" href={path} target="_blank" rel="noreferrer" style={styles.btn}>Open raw</a>
            <button
              onClick={() => navigator.clipboard.writeText(text)}
              style={styles.btn}
              title="Copy to clipboard"
            >Copy</button>
          </div>
        </header>

        {err ? (
          <div style={{ color: "var(--danger)", padding: 12 }}>
            Failed to load <code>{path}</code><br/>{err}
          </div>
        ) : (
          <pre style={styles.pre}>{text}</pre>
        )}
      </main>
    </div>
  );
}

const styles = {
  wrap: {
    display: "grid",
    gridTemplateColumns: "260px 1fr",
    minHeight: "calc(100vh - 20px)",
    gap: 0,
    background: "var(--bg, #f8f5ef)",
  },
  sidebar: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: 16,
    borderRight: "1px solid var(--ring, #e5e7eb)",
    background: "var(--canvas, #fff)",
  },
  title: { fontWeight: 800, fontSize: 18 },
  group: { fontSize: 12, fontWeight: 700, opacity: 0.7, margin: "8px 0 6px" },
  list: { listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 4 },
  link: {
    display: "block", width: "100%", textAlign: "left",
    padding: "6px 8px", borderRadius: 8, border: "1px solid transparent",
    background: "transparent", cursor: "pointer"
  },
  linkActive: {
    display: "block", width: "100%", textAlign: "left",
    padding: "6px 8px", borderRadius: 8,
    border: "1px solid var(--ring, #e5e7eb)",
    background: "var(--canvas, #fff)",
    boxShadow: "0 1px 2px rgb(16 24 40 / 6%)",
    cursor: "default"
  },
  main: { display: "flex", flexDirection: "column" , padding: 0, minWidth: 0 },
  mainHead: {
    display: "flex", alignItems: "center", gap: 8,
    padding: 12, borderBottom: "1px solid var(--ring, #e5e7eb)",
    background: "var(--canvas, #fff)"
  },
  pre: {
    margin: 0, padding: 16, whiteSpace: "pre-wrap", wordBreak: "break-word",
    lineHeight: 1.5, fontSize: 14, background: "transparent"
  },
  btn: {
    padding: "6px 10px", borderRadius: 8, border: "1px solid var(--ring, #e5e7eb)",
    background: "var(--canvas, #fff)", cursor: "pointer", fontWeight: 600
  }
};
