import React from "react";

/** SectionTTS
 * - Web Speech API (graceful no-op if unsupported)
 * - Queue reads array or string
 * - Transcript toggle
 */
export default function SectionTTS({ text, lang = "en-US", rate = 1, pitch = 1 }) {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  const [open, setOpen] = React.useState(false);
  const [speaking, setSpeaking] = React.useState(false);

  const chunks = React.useMemo(() => {
    if (!text) return [];
    if (Array.isArray(text)) return text.filter(Boolean).map(String);
    return String(text).split(/\n{2,}/).filter(Boolean);
  }, [text]);

  const stopAll = React.useCallback(() => {
    try { window.speechSynthesis?.cancel?.(); } catch {}
    setSpeaking(false);
  }, []);

  React.useEffect(() => () => stopAll(), [stopAll]);

  function speakAll() {
    if (!supported || !chunks.length) return;
    stopAll();
    const q = chunks.map(t => {
      const u = new SpeechSynthesisUtterance(t);
      u.lang = lang; u.rate = rate; u.pitch = pitch;
      u.onend = () => {};
      return u;
    });
    setSpeaking(true);
    q.forEach((u, i) => {
      if (i === q.length - 1) u.onend = () => setSpeaking(false);
      window.speechSynthesis.speak(u);
    });
  }
  function pause() {
    try { window.speechSynthesis?.pause?.(); } catch {}
  }
  function resume() {
    try { window.speechSynthesis?.resume?.(); } catch {}
  }

  if (!chunks.length) return null;

  return (
    <div className="sh-callout sh-callout--example" style={{ marginTop: 10 }}>
      <div className="sh-calloutHead" style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span className="sh-calloutIcon" aria-hidden>🔊</span>
        <strong>Section Audio</strong>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {supported ? (
            speaking ? (
              <>
                <button className="sh-btn sh-btn--secondary" onClick={pause} title="Pause">Pause</button>
                <button className="sh-btn sh-btn--secondary" onClick={resume} title="Resume">Resume</button>
                <button className="sh-btn sh-btn--secondary" onClick={stopAll} title="Stop">Stop</button>
              </>
            ) : (
              <button className="sh-btn sh-btn--secondary" onClick={speakAll} title="Play">Play</button>
            )
          ) : (
            <span className="sh-hint">TTS not supported</span>
          )}
          <button className="sh-btn sh-btn--secondary" onClick={() => setOpen(v => !v)} aria-expanded={open}>
            {open ? "Hide Transcript" : "Show Transcript"}
          </button>
        </div>
      </div>
      {open && (
        <div className="sh-calloutBody" style={{ whiteSpace: "pre-wrap" }}>
          {chunks.join("\n\n")}
        </div>
      )}
    </div>
  );
}
