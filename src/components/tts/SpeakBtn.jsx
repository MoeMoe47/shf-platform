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
 *  prominence: "AUTO" | "PROMINENT" | "HIDDEN" — SHF AIEL Phase 4
 *    (learningSupport.readAloudPreference). Controls only how visually
 *    prominent this control is, never whether the read-aloud capability
 *    itself exists — HIDDEN still renders a real, fully keyboard- and
 *    screen-reader-accessible control, just visually quieter, so it is
 *    never a "disable TTS" mode.
 */
export default function SpeakBtn({ text = "", label = "🔊 Speak", prominence = "AUTO" }) {
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

  const isHidden = prominence === "HIDDEN";
  const isProminent = prominence === "PROMINENT";
  const speakButtonClass = isProminent ? "sh-btn" : "sh-btn sh-btn--secondary";
  const speakLabel = speaking ? "⏹ Stop" : label;

  return (
    <div className="sh-actionsRow" aria-label="Text to speech controls">
      <button
        className={isHidden ? "sh-btn is-ghost sh-btn--icon" : speakButtonClass}
        onClick={speaking ? stop : speak}
        disabled={!can || !text.trim()}
        aria-label={isHidden ? speakLabel : undefined}
        title={isHidden ? speakLabel : undefined}
      >
        {isHidden ? (speaking ? "⏹" : "🔊") : speakLabel}
      </button>
      <button
        className={isHidden ? "sh-btn is-ghost sh-btn--icon" : "sh-btn is-ghost"}
        onClick={download}
        disabled={!text.trim()}
        aria-label={isHidden ? "Download transcript" : undefined}
        title={isHidden ? "Download transcript" : undefined}
      >
        {isHidden ? "⬇︎" : "⬇︎ Transcript"}
      </button>
    </div>
  );
}
