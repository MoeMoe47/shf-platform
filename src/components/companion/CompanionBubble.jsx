// src/components/companion/CompanionBubble.jsx
// The "expanded" interaction state — short contextual assistance, hint
// controls, Focus control, hide control. Deliberately small and
// institutional, not a chatbot panel (see spec: "maintain the simple
// institutional SHF design language").
import React from "react";
import { getHint } from "@/companion/visualHintEngine.js";

function HintPanel({ hint, onAnotherClue, onExplain, onDismiss }) {
  const content = hint ? getHint(hint.conceptId, hint.level) : null;
  return (
    <div className="brainiact-hintPanel">
      <div className="brainiact-hintLevel">Level: {hint?.level || "gesture"}</div>
      {content?.gestures && (
        <p className="brainiact-hintText">
          Watch closely: {content.gestures.join(", ")}
        </p>
      )}
      {content?.clues?.length > 0 && (
        <p className="brainiact-hintText">{content.clues[0]}</p>
      )}
      {content?.explanation && <p className="brainiact-hintText">{content.explanation}</p>}
      {content?.accessibilityAlternatives?.length > 0 && (
        <details className="brainiact-a11yAlt">
          <summary>Text description of this clue</summary>
          <ul>
            {content.accessibilityAlternatives.map((alt, i) => <li key={i}>{alt}</li>)}
          </ul>
        </details>
      )}
      <div className="brainiact-hintActions">
        {hint?.level !== "explanation" && (
          <button type="button" className="brainiact-btn" onClick={onAnotherClue}>Show another clue</button>
        )}
        {hint?.level !== "explanation" && (
          <button type="button" className="brainiact-btn" onClick={onExplain}>Explain it</button>
        )}
        <button type="button" className="brainiact-btn brainiact-btn--quiet" onClick={onDismiss}>I&rsquo;m good</button>
      </div>
    </div>
  );
}

export default function CompanionBubble({
  mode,
  faceMessage,
  hint,
  focus,
  reduceAnimation,
  onRequestHint,
  onAnotherClue,
  onExplain,
  onDismissHint,
  onToggleFocus,
  onToggleReduceAnimation,
  onHide,
  onClose,
  onOpenCoach,
  titleId,
}) {
  return (
    <div className="brainiact-bubble" role="dialog" aria-modal="false" aria-labelledby={titleId}>
      <div className="brainiact-bubbleHead">
        <strong id={titleId} className="brainiact-bubbleTitle">Brainiact</strong>
        <button type="button" className="brainiact-iconBtn" onClick={onClose} aria-label="Minimize Brainiact">✕</button>
      </div>

      {faceMessage && mode !== "hint" && (
        <p className="brainiact-faceMessage">{faceMessage}</p>
      )}

      {mode === "hint" && hint ? (
        <HintPanel hint={hint} onAnotherClue={onAnotherClue} onExplain={onExplain} onDismiss={onDismissHint} />
      ) : (
        <div className="brainiact-quickActions">
          <button type="button" className="brainiact-btn" onClick={onRequestHint}>Hint?</button>
          <button type="button" className="brainiact-btn brainiact-btn--quiet" onClick={onOpenCoach}>
            Ask Coach →
          </button>
        </div>
      )}

      <div className="brainiact-settingsRow">
        <button
          type="button"
          className="brainiact-toggle"
          aria-pressed={focus}
          onClick={onToggleFocus}
        >
          {focus ? "Focus: On" : "Focus Mode"}
        </button>
        <button
          type="button"
          className="brainiact-toggle"
          aria-pressed={reduceAnimation}
          onClick={onToggleReduceAnimation}
        >
          Reduce motion
        </button>
        <button type="button" className="brainiact-toggle" onClick={onHide}>
          Hide
        </button>
      </div>
    </div>
  );
}
