import React from "react";
import { announce } from "@/components/ally/A11yTools.jsx";
import { emitCompanionEvent } from "@/companion/companionEvents.js";
import { useEffectiveAccessibilityContext } from "@/context/EffectiveAccessibilityContext.jsx";
import {
  CELEBRATION_EFFECT,
  createCelebrationDeduper,
  evaluateCelebration,
} from "./celebrationPolicy.js";

const CelebrationContext = React.createContext({
  celebrateAchievement: () => null,
  replayCelebration: () => null,
});

export function CelebrationProvider({ children }) {
  // SHF AIEL Phase 3 — reducedMotion/celebrationIntensity now come from
  // the canonical Effective Accessibility Context, not this provider's
  // own direct localStorage reads (docs/SHF_AIEL_PERSISTENCE_API_
  // CONTRACT_V1.md — reduced-motion consolidation).
  const { reducedMotion, celebrationIntensity } = useEffectiveAccessibilityContext();
  const [active, setActive] = React.useState(null);
  const deduper = React.useRef(null);
  const timer = React.useRef(null);

  if (!deduper.current) {
    deduper.current = createCelebrationDeduper(typeof window === "undefined" ? null : window.localStorage);
  }

  React.useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const showDescriptor = React.useCallback((descriptor) => {
    if (!descriptor) return null;
    setActive(descriptor);
    announce(descriptor.message);
    if (descriptor.companionReaction?.eventName) {
      emitCompanionEvent(descriptor.companionReaction.eventName, {
        celebrationKey: descriptor.celebrationKey,
        sourceDomain: descriptor.sourceDomain,
        sourceRecordId: descriptor.sourceRecordId,
      });
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setActive(null);
      timer.current = null;
    }, descriptor.effect === CELEBRATION_EFFECT.MAJOR ? 5200 : 3600);
    return descriptor;
  }, []);

  const celebrateAchievement = React.useCallback((achievement, options = {}) => {
    const descriptor = evaluateCelebration(achievement, {
      reducedMotion,
      intensity: celebrationIntensity,
    });
    if (!descriptor) return null;
    if (!options.replay && deduper.current.has(descriptor.celebrationKey)) return null;
    if (!options.replay) deduper.current.mark(descriptor.celebrationKey);
    return showDescriptor(descriptor);
  }, [reducedMotion, celebrationIntensity, showDescriptor]);

  const replayCelebration = React.useCallback((descriptor) => {
    if (!descriptor) return null;
    return showDescriptor(descriptor);
  }, [showDescriptor]);

  const value = React.useMemo(() => ({
    celebrateAchievement,
    replayCelebration,
  }), [celebrateAchievement, replayCelebration]);

  return (
    <CelebrationContext.Provider value={value}>
      {children}
      <CelebrationHost descriptor={active} onDismiss={() => setActive(null)} />
    </CelebrationContext.Provider>
  );
}

export function useCelebration() {
  return React.useContext(CelebrationContext);
}

function CelebrationHost({ descriptor, onDismiss }) {
  if (!descriptor) return null;
  const effect = descriptor.effect || CELEBRATION_EFFECT.NONE;
  const hasMotion = effect === CELEBRATION_EFFECT.CONFETTI || effect === CELEBRATION_EFFECT.MAJOR;
  return (
    <div className="shf-celebration" role="status" aria-live="polite" aria-atomic="true" data-tier={descriptor.tier}>
      {hasMotion && <CelebrationEffect effect={effect} />}
      <div className="shf-celebration__message">
        <p className="shf-celebration__eyebrow">{descriptor.tier.replace("_", " ")}</p>
        <h2>{descriptor.title}</h2>
        <p>{descriptor.message}</p>
        <button type="button" className="shf-celebration__dismiss" onClick={onDismiss} aria-label="Dismiss celebration">
          Close
        </button>
      </div>
    </div>
  );
}

function CelebrationEffect({ effect }) {
  const pieces = effect === CELEBRATION_EFFECT.MAJOR ? 30 : 20;
  return (
    <div className="shf-celebration__effect" aria-hidden="true" data-effect={effect}>
      {Array.from({ length: pieces }).map((_, index) => {
        const x = `${(index * 37) % 100}vw`;
        const delay = `${(index % 8) * 65}ms`;
        const dx = `${(((index * 19) % 25) - 12) * 12}px`;
        const dy = `${(((index * 31) % 25) - 12) * 10}px`;
        const hue = `${(index * 43) % 360}`;
        return <span key={index} style={{ "--x": x, "--delay": delay, "--dx": dx, "--dy": dy, "--hue": hue }} />;
      })}
    </div>
  );
}
