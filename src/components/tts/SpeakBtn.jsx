import React from "react";
import { downloadTextFile } from "./TranscriptUtils.js";

/**
 * SpeakBtn
 * - Uses Web Speech API (if available)
 * - Reads given text; lets user download transcript (.txt)
 *
 * Props:
 *  text: string
 *  label: string (button label)
 */
export default function SpeakBtn({ text = "", label = "🔊 Speak" }) {
  const [speaking, setSpeaking] = React.useState(false);
  const can = typeof window !== "undefined" && "speechSynthesis" in window;

  function speak() {
    if (!can || !text.trim()) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = Number(localStorage.getItem("civic:tts:rate") || 1);
      u.voice = (speechSynthesis.getVoices() || []).find(v => v.lang?.startsWith(localStorage.getItem("civic:tts:lang") || "en")) || null;
      u.onstart = () => setSpeaking(true);
      u.onend = () => setSpeaking(false);
      speechSynthesis.speak(u);
      window.dispatchEvent(new CustomEvent("analytics:ping", { detail: { name: "tts:start" } }));
    } catch {}
  }
  function stop() { try { speechSynthesis.cancel(); setSpeaking(false); } catch {} }
  function download() {
    downloadTextFile("lesson-section-transcript.txt", text);
    window.dispatchEvent(new CustomEvent("analytics:ping", { detail: { name: "tts:download" } }));
  }

  return (
    <div className="sh-actionsRow" aria-label="Text to speech controls">
      <button className="sh-btn sh-btn--secondary" onClick={speaking ? stop : speak} disabled={!can || !text.trim()}>
        {speaking ? "⏹ Stop" : label}
      </button>
      <button className="sh-btn is-ghost" onClick={download} disabled={!text.trim()}>
        ⬇︎ Transcript
      </button>
    </div>
  );
}
