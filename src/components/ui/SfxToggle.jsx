import React, { useEffect, useState } from "react";
import { armSfx, isSfxEnabled, setSfxEnabled, sfxClick } from "@/shared/sfx/sfx.js";

export default function SfxToggle({ className = "" }) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(isSfxEnabled());
  }, []);

  const toggle = async () => {
    // Must arm on a gesture to unlock audio
    await armSfx();
    const next = !on;
    setSfxEnabled(next);
    setOn(next);
    sfxClick();
  };

  return (
    <button
      type="button"
      className={`got-sfx-toggle ${on ? "is-on" : "is-off"} ${className}`.trim()}
      onClick={toggle}
      title={on ? "Sound: On" : "Sound: Off"}
      aria-pressed={on}
    >
      <span className="dot" aria-hidden="true" />
      <span className="label">{on ? "Sound On" : "Sound Off"}</span>
    </button>
  );
}
