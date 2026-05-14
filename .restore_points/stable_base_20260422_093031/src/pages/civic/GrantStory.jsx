import React from "react";
import { loadMasterNarrativeFromStorage } from "@/utils/binderMerge.js";

export default function GrantStory() {
  const [markdown, setMarkdown] = React.useState("");
  const [meta, setMeta] = React.useState({});

  React.useEffect(() => {
    const { markdown: md, meta: m } = loadMasterNarrativeFromStorage();
    setMarkdown(md || "");
    setMeta(m || {});
  }, []);

  const adminCount = meta.adminCount || 0;
  const civicCount = meta.civicCount || 0;
  const totalSessions = adminCount + civicCount;
  const civicShare =
    totalSessions > 0 ? Math.round((civicCount / totalSessions) * 100) : 0;
  const totalTimeHours = meta.totalTimeHours || 0;
  const updatedAt = meta.updatedAt || "—";

  function handleCopy() {
    if (navigator?.clipboard && markdown) {
      navigator.clipboard
        .writeText(markdown)
        .then(() => {
          if (window?.shfToast) {
            window.shfToast("Grant narrative copied to clipboard.");
          } else {
            alert("Grant narrative copied to clipboard.");
          }
        })
        .catch(() => {
          alert("Could not copy. You can still select and copy manually.");
        });
    } else {
      alert("Clipboard API not available. Please select and copy the text.");
    }
  }

  function handleDownload() {
    const blob = new Blob([markdown || ""], {
      type: "text/markdown;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "shf-grant-narrative.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="sh-main">
      <div className="sh-card">
        <div className="sh-cardStripe" />
        <div className="sh-cardBody sh-cardBody--flat">
          <header className="sh-cardHead">
            <div>
              <h2 className="sh-cardTitle">Grant Story</h2>
              <p className="sh-muted">
                This is the read-only grant narrative generated from{" "}
                <strong>Admin AI logs</strong> and <strong>Civic missions</strong>.
                It&apos;s the story funders see about how Silicon Heartland uses AI
                and student work to drive impact.
              </p>
            </div>
            <div className="sh-actionsRow">
              <button
                className="sh-btn sh-btn--secondary"
                type="button"
                onClick={handleCopy}
              >
                Copy for Grant Portal
              </button>
              <button
                className="sh-btn sh-btn--secondary"
                type="button"
                onClick={handleDownload}
              >
                Download .md
              </button>
            </div>
          </header>

          <div className="sh-grid sh-grid--2" style={{ marginTop: 8 }}>
            <div className="sh-metaBox">
              <div className="sh-metaLabel">Last updated</div>
              <div className="sh-metaValue">{updatedAt}</div>
              <p className="sh-hint">
                Updated when Admin runs <strong>Sync with Civic &amp; Update Master Narrative</strong>.
              </p>
            </div>

            <div className="sh-metaBox">
              <div className="sh-metaLabel">Civic contribution</div>
              <div className="sh-metaValue">{civicShare}%</div>
              <p className="sh-hint">
                Civic missions account for <strong>{civicShare}% of all AI-assisted sessions</strong>{" "}
                in this grant story ({civicCount} civic sessions out of {totalSessions || 0} total, about{" "}
                {totalTimeHours || 0} hours overall).
              </p>
            </div>
          </div>

          <div className="sh-metaBox" style={{ marginTop: 16 }}>
            <div className="sh-metaLabel">Master grant narrative (read-only)</div>
            {markdown ? (
              <textarea
                className="sh-inputText"
                style={{ minHeight: 320, fontFamily: "monospace" }}
                value={markdown}
                readOnly
              />
            ) : (
              <p className="sh-hint">
                No master grant narrative stored yet. Ask Admin to open{" "}
                <strong>AI Tool Workflow</strong> and click{" "}
                <strong>Sync with Civic &amp; Update Master Narrative</strong>{" "}
                after logging some sessions.
              </p>
            )}
          </div>

          <p className="sh-hint" style={{ marginTop: 10 }}>
            Students can see how their missions feed the <strong>real grant language</strong> used for Title IV, ESSA,
            and other programs. This turns their work into visible impact, not just class credit.
          </p>
        </div>
      </div>
    </section>
  );
}
