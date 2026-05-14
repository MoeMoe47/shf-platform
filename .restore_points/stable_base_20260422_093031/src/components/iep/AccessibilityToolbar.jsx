import React from "react";

export default function AccessibilityToolbar({
  highContrast,
  setHighContrast,
  simpleMode,
  setSimpleMode,
  sensoryMode,
  setSensoryMode,
  voiceMode,
  setVoiceMode,
  textScale,
  setTextScale,
}) {
  return (
    <section className="access-toolbar" aria-label="Accessibility controls">
      <button
        type="button"
        className="access-btn"
        aria-pressed={highContrast}
        onClick={() => setHighContrast((v) => !v)}
      >
        High Contrast
      </button>

      <button
        type="button"
        className="access-btn"
        aria-pressed={simpleMode}
        onClick={() => setSimpleMode((v) => !v)}
      >
        Simple Mode
      </button>

      <button
        type="button"
        className="access-btn"
        aria-pressed={sensoryMode}
        onClick={() => setSensoryMode((v) => !v)}
      >
        Sensory Safe
      </button>

      <button
        type="button"
        className="access-btn"
        aria-pressed={voiceMode}
        onClick={() => setVoiceMode((v) => !v)}
      >
        Voice Mode
      </button>

      <label className="access-scale">
        <span>Text Size</span>
        <select
          value={textScale}
          onChange={(e) => setTextScale(Number(e.target.value))}
          aria-label="Text size"
        >
          <option value={100}>100%</option>
          <option value={125}>125%</option>
          <option value={150}>150%</option>
          <option value={175}>175%</option>
          <option value={200}>200%</option>
        </select>
      </label>
    </section>
  );
}
