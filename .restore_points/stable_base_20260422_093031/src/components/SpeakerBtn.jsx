import React from "react";

export default function SpeakerBtn({ getText, label = "Listen" }) {
  const [speaking, setSpeaking] = React.useState(false);

  const speak = () => {
    if (!("speechSynthesis" in window)) {
      alert("Speech synthesis not supported in this browser.");
      return;
    }
    const text = (typeof getText === "function" ? getText() : "") || "";
    if (!text.trim()) return;

    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.onend = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  };

  return (
    <button
      type="button"
      className="sh-btn is-ghost"
      onClick={speak}
      aria-label={label}
      title={label}
    >
      🔊 {speaking ? "Playing…" : label}
    </button>
  );
}
