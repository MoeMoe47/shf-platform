// src/components/rewards/CelebrationLayer.jsx
import React from "react";
import { useToasts } from "@/context/Toasts.jsx";

/**
 * CelebrationLayer
 * Reacts to:
 *  - achievements:award  (detail: { id, unlockedAt })
 *  - rewards:earned      (detail: { points, kind, id })
 *  - rewards:changed     (detail: { scope, points, badges, lastBadge? })
 *
 * Requires CSS hooks:
 *  .sh-confetti          (position:fixed; inset:0; pointer-events:none; overflow:hidden)
 *  .sh-confettiPiece     (will-animate fall + drift; see your foundation/theme CSS)
 */
export default function CelebrationLayer() {
  const ctx = typeof useToasts === "function" ? useToasts() : null;
  const toast =
    (ctx && typeof ctx.toast === "function")
      ? ctx.toast
      : (msg) => console.log("[toast]", msg);

  const [pieces, setPieces] = React.useState([]);
  const reducedMotion = React.useMemo(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
    catch { return false; }
  }, []);

  // spawn N confetti pieces (no-op if reduced motion)
  const burst = React.useCallback((n = 36) => {
    if (reducedMotion) return;
    const now = Date.now();
    const arr = Array.from({ length: n }, (_, i) => ({
      id: `cf_${now}_${i}`,
      left: Math.random() * 100,             // vw%
      dur: 1100 + Math.random() * 1300,      // ms
      size: 6 + Math.floor(Math.random() * 8),
      rot: Math.random() * 360,
      hue: Math.floor(Math.random() * 360),
      delay: Math.random() * 140,            // ms
    }));
    setPieces((prev) => [...prev, ...arr]);
    // cleanup the ones we just added
    window.setTimeout(() => {
      setPieces((prev) => prev.filter((p) => !arr.includes(p)));
    }, 2800);
  }, [reducedMotion]);

  React.useEffect(() => {
    const onAward = (e) => {
      const id = e?.detail?.id || "achievement";
      toast(`🏅 Unlocked: ${String(id).replace(/[_:-]/g, " ")}`, { type: "success" });
      burst(44);
    };

    // Legacy/simple points event
    const onEarned = (e) => {
      const pts = Number(e?.detail?.points ?? 0);
      const kind = e?.detail?.kind || "reward";
      if (pts > 0) toast(`+${pts} points • ${kind}`, { type: "info" });
      burst(26);
    };

    // New unified rewards event from useRewards()
    // Fires on any change; show subtle toast if points rose or a badge appeared.
    let lastPoints = 0;
    const onChanged = (e) => {
      const d = e?.detail || {};
      const pts = Number(d.points ?? 0);
      const gained = Math.max(0, pts - lastPoints);
      lastPoints = pts;

      if (d.lastBadge) {
        toast(`🏅 Badge unlocked: ${String(d.lastBadge).replace(/[_:-]/g, " ")}`, { type: "success" });
        burst(36);
        return;
      }
      if (gained > 0) {
        toast(`+${gained} points`, { type: "info" });
        burst(20);
      }
    };

    window.addEventListener("achievements:award", onAward);
    window.addEventListener("rewards:earned", onEarned);
    window.addEventListener("rewards:changed", onChanged);
    return () => {
      window.removeEventListener("achievements:award", onAward);
      window.removeEventListener("rewards:earned", onEarned);
      window.removeEventListener("rewards:changed", onChanged);
    };
  }, [toast, burst]);

  return (
    <div className="sh-confetti" aria-hidden>
      {pieces.map((p) => (
        <div
          key={p.id}
          className="sh-confettiPiece"
          style={{
            left: `${p.left}vw`,
            width: p.size,
            height: p.size * 2,
            background: `hsl(${p.hue} 90% 55%)`,
            animationDuration: `${p.dur}ms, ${800 + Math.random() * 900}ms`,
            animationDelay: `${p.delay}ms, 0ms`,
            transform: `rotate(${p.rot}deg)`,
          }}
        />
      ))}
    </div>
  );
}
