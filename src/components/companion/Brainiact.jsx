// src/components/companion/Brainiact.jsx
// The one shared SHF Learning Companion component, mounted once (via
// RootProviders.jsx) for both Curriculum and Career Center. This replaces
// the previous two separate triggers — Career's floating `.coach-fab` and
// Curriculum's `AITutorButton` — with a single character that still opens
// the same shared CoachSlideOver for long-form chat, so no capability is
// lost, only re-skinned (per explicit product decision: "replace ai
// assistant with mascot named Brainiact").
import React, { useEffect, useId, useRef, useState } from "react";
import CoachSlideOver from "@/components/CoachSlideOver.jsx";
import CompanionFace from "./CompanionFace.jsx";
import CompanionBubble from "./CompanionBubble.jsx";
import { useCompanion } from "@/hooks/useCompanion.js";
import { COMPANION_MODES } from "@/companion/companionReducer.js";

const MODE_LABEL = {
  [COMPANION_MODES.IDLE]: "Idle",
  [COMPANION_MODES.HINT]: "Hint Mode",
  [COMPANION_MODES.CHARADES]: "Charades Mode",
  [COMPANION_MODES.COACH]: "Coach Mode",
  [COMPANION_MODES.CAREER]: "Career Mode",
  [COMPANION_MODES.CELEBRATION]: "Celebrating",
  [COMPANION_MODES.FOCUS]: "Focus Mode",
};

export default function Brainiact() {
  const companion = useCompanion();
  const { state } = companion;
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const titleId = useId();
  const [breathe, setBreathe] = useState(false);

  const reduceMotion = state.systemReducedMotion || state.reduceAnimation;
  const motionState = reduceMotion ? "reduced" : "full";
  const isIdle = state.mode === COMPANION_MODES.IDLE;

  // Occasional, not constant: a single ~1.3s breathe pulse every 7-9s while
  // genuinely idle, instead of a perpetual CSS loop. See companion.css for
  // why an `infinite` animation was actively wrong here, not just a style
  // choice — it also broke real click-actionability on the button.
  useEffect(() => {
    if (!isIdle || reduceMotion || state.hidden) return;
    let pulseTimeout;
    const schedule = () => {
      const delay = 7000 + Math.random() * 2000;
      return setTimeout(() => {
        setBreathe(true);
        pulseTimeout = setTimeout(() => setBreathe(false), 1300);
        intervalId = schedule();
      }, delay);
    };
    let intervalId = schedule();
    return () => {
      clearTimeout(intervalId);
      clearTimeout(pulseTimeout);
    };
  }, [isIdle, reduceMotion, state.hidden]);

  // Outside-click / Escape close the expanded bubble — same pattern as
  // ThemeSwitch.jsx / AppSwitcher.jsx elsewhere in this app.
  useEffect(() => {
    if (!state.expanded) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        companion.setExpanded(false);
      }
    };
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) companion.setExpanded(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDocClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDocClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.expanded]);

  const modeLabel = MODE_LABEL[state.mode] || "Idle";
  const accessibleLabel = state.faceMessage
    ? `Brainiact — ${modeLabel}: ${state.faceMessage}`
    : `Brainiact — ${modeLabel}`;

  // CoachSlideOver is rendered as a sibling of `.brainiact-root`, never a
  // descendant — deliberately. `.brainiact-root` is what
  // `body[data-coach-suppress~="resume-workspace"]` (companion.css) hides
  // on the Resume Builder route, and what the `hidden` branch below
  // replaces with the reveal button. If the chat panel were nested inside
  // it, both of those would have silently made an *open* Coach panel
  // invisible too (confirmed via a real regression this fix closes) —
  // Coach chat must stay reachable regardless of the character's own
  // visibility.
  const coachPanel = <CoachSlideOver open={state.coachOpen} onClose={() => companion.closeCoach()} />;

  if (state.hidden) {
    return (
      <>
        <button
          type="button"
          className="brainiact-revealBtn"
          onClick={() => companion.setHidden(false)}
        >
          Show Brainiact
        </button>
        {coachPanel}
      </>
    );
  }

  return (
    <>
      <div
        ref={rootRef}
        className="brainiact-root"
        data-companion-mode={state.mode}
        data-companion-persona={state.persona}
        data-motion={motionState}
      >
        {state.expanded && (
          <CompanionBubble
            mode={state.mode}
            faceMessage={state.faceMessage}
            hint={state.hint}
            focus={state.focus}
            reduceAnimation={state.reduceAnimation}
            titleId={titleId}
            onRequestHint={() => companion.requestHint({ conceptId: "gravity" })}
            onAnotherClue={() => companion.showAnotherClue()}
            onExplain={() => companion.explainIt()}
            onDismissHint={() => companion.dismissHint()}
            onToggleFocus={() => companion.setFocus(!state.focus)}
            onToggleReduceAnimation={() => companion.setReduceAnimation(!state.reduceAnimation)}
            onHide={() => companion.setHidden(true)}
            onOpenCoach={() => companion.openCoach()}
            onClose={() => {
              companion.setExpanded(false);
              triggerRef.current?.focus?.({ preventScroll: true });
            }}
          />
        )}

        <button
          ref={triggerRef}
          type="button"
          className="brainiact-fab"
          data-anim={state.mode === COMPANION_MODES.CELEBRATION ? state.animation : "idle"}
          data-breathe={breathe ? "1" : undefined}
          aria-haspopup="dialog"
          aria-expanded={state.expanded}
          aria-label={accessibleLabel}
          onClick={() => companion.setExpanded(!state.expanded)}
        >
          <CompanionFace animation={state.mode === COMPANION_MODES.CELEBRATION ? state.animation : "idle"} />
          {state.faceMessage && !state.expanded && (
            <span className="brainiact-faceChip" aria-hidden="true">{state.faceMessage}</span>
          )}
        </button>
      </div>
      {coachPanel}
    </>
  );
}
