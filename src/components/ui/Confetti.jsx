// src/components/ui/Confetti.jsx
import React from "react";

export default function Confetti() {
  const [pieces, setPieces] = React.useState([]);

  React.useEffect(() => {
    const handler = () => {
      const colors = ["#ff4f00","#10b981","#3b82f6","#f59e0b","#ef4444","#a855f7"];
      const n = 80;
      const now = Date.now();
      const next = Array.from({ length: n }, (_, i) => ({
        id: `${now}-${i}`,
        left: Math.random() * 100,                         // vw
        delay: Math.random() * 200,                        // ms
        durFall: 1200 + Math.random() * 1400,              // ms
        durSpin: 600 + Math.random() * 900,                // ms
        size: 6 + Math.random() * 6,                       // px
        color: colors[Math.floor(Math.random() * colors.length)],
      }));
      setPieces(next);
      // clear after the longest fall
      setTimeout(() => setPieces([]), 3000);
    };
    window.addEventListener("sh:complete", handler);
    return () => window.removeEventListener("sh:complete", handler);
  }, []);

  return (
    <div className="sh-confetti" aria-hidden="true">
      {pieces.map(p => (
        <span
          key={p.id}
          className="sh-confettiPiece"
          style={{
            left: `${p.left}vw`,
            width: p.size,
            height: p.size * 2,
            background: p.color,
            animationDuration: `${p.durFall}ms, ${p.durSpin}ms`,
            animationDelay: `${p.delay}ms, 0ms`,
          }}
        />
      ))}
    </div>
  );
}
