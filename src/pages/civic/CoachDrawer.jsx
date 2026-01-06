// src/components/civic/CoachDrawer.jsx
import React from "react";
import { useLocale } from "@/context/LocaleProvider.jsx";
import { useToasts } from "@/context/Toasts.jsx";

/**
 * CoachDrawer
 * Opens from right edge when user clicks “Ask Coach”
 * Future: connect to Billy Gateson / AI tutor endpoint
 */
export default function CoachDrawer() {
  const { t, locale } = useLocale?.() || { t: (s) => s, locale: "en" };
  const { toast } = useToasts?.() || { toast: (m) => alert(m) };

  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState("");
  const [reply, setReply] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // open listener (fired from LessonBody)
  React.useEffect(() => {
    const onOpen = (e) => {
      const { lessonId } = e.detail || {};
      setReply("");
      setText("");
      setOpen(true);
      toast?.(`Coach opened for lesson ${lessonId}`, { type: "info" });
    };
    window.addEventListener("coach:open", onOpen);
    return () => window.removeEventListener("coach:open", onOpen);
  }, [toast]);

  // stub “AI” reply
  async function handleAsk() {
    if (!text.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setReply(t("That’s a great observation! Try summarizing the key takeaway in your own words."));
    setLoading(false);
  }

  return (
    <div
      className="kb-overlay"
      style={{
        display: open ? "flex" : "none",
        justifyContent: "flex-end",
        background: "rgba(0,0,0,.4)",
        zIndex: 1000,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div
        className="kb-card"
        style={{
          width: "min(420px, 95vw)",
          height: "100vh",
          borderRadius: 0,
          borderLeft: "1px solid var(--ring)",
          display: "flex",
          flexDirection: "column",
          background: "var(--card)",
        }}
      >
        <header style={{ padding: 12, borderBottom: "1px solid var(--ring)" }}>
          <strong>🎓 {t("Ask Coach")}</strong>
          <button
            className="sh-btn is-ghost"
            style={{ float: "right" }}
            onClick={() => setOpen(false)}
          >
            ✕
          </button>
        </header>
        <main style={{ flex: 1, padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          <textarea
            className="sh-inputText"
            rows={4}
            placeholder={t("Type your question or thought...")}
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ resize: "vertical", flexShrink: 0 }}
          />
          <button
            className="sh-btn sh-btn--primary"
            onClick={handleAsk}
            disabled={loading || !text.trim()}
          >
            {loading ? t("Thinking...") : t("Ask")}
          </button>
          {reply && (
            <div className="sh-callout sh-callout--tip" style={{ marginTop: 8 }}>
              <div className="sh-calloutHead"><strong>{t("Coach says")}:</strong></div>
              <div className="sh-calloutBody">{reply}</div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
