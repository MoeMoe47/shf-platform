import React from "react";

const glass = {
  background: "rgba(10,16,24,0.14)",
  border: "1px solid rgba(235,243,255,0.14)",
  boxShadow:
    "0 0 0 1px rgba(255,255,255,0.028) inset, 0 10px 24px rgba(0,0,0,0.16)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  color: "#edf4fb",
};

function FloatingCard({ title, sub, style, large = false }) {
  return (
    <div
      style={{
        ...glass,
        position: "absolute",
        zIndex: 6,
        padding: large ? "14px 18px" : "11px 14px",
        borderRadius: 14,
        minWidth: large ? 248 : 168,
        pointerEvents: "none",
        ...style,
      }}
    >
      <div
        style={{
          fontSize: large ? 16 : 13,
          fontWeight: large ? 800 : 700,
          lineHeight: 1.1,
          color: "#f1f6fb",
        }}
      >
        {title}
      </div>
      <div
        style={{
          marginTop: 5,
          fontSize: large ? 12 : 11,
          color: "rgba(225,236,255,0.72)",
          lineHeight: 1.2,
        }}
      >
        {sub}
      </div>
    </div>
  );
}

function RouteLayer() {
  return (
    <svg
      viewBox="0 0 1200 820"
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 4,
        pointerEvents: "none",
      }}
    >
      <defs>
        <filter id="routeBlueGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.1" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="routeOrangeGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.1" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <path d="M 80 470 Q 360 355 645 390 T 1180 430" fill="none" stroke="rgba(185,225,255,0.10)" strokeWidth="1" />
      <path d="M 120 280 Q 440 195 760 255 T 1180 335" fill="none" stroke="rgba(185,225,255,0.08)" strokeWidth="1" />
      <path d="M 220 655 Q 520 575 820 610 T 1170 670" fill="none" stroke="rgba(185,225,255,0.08)" strokeWidth="1" />

      <path
        d="M 315 600 Q 505 440 790 268"
        fill="none"
        stroke="rgba(118,224,255,0.96)"
        strokeWidth="2"
        filter="url(#routeBlueGlow)"
      />
      <path
        d="M 355 640 Q 575 430 965 150"
        fill="none"
        stroke="rgba(255,170,96,0.96)"
        strokeWidth="2"
        filter="url(#routeOrangeGlow)"
      />
      <path
        d="M 450 648 Q 640 625 960 692"
        fill="none"
        stroke="rgba(255,170,96,0.72)"
        strokeWidth="1.5"
        filter="url(#routeOrangeGlow)"
      />
      <path
        d="M 455 612 Q 635 545 905 525"
        fill="none"
        stroke="rgba(118,224,255,0.84)"
        strokeWidth="1.7"
        filter="url(#routeBlueGlow)"
      />
      <path
        d="M 320 575 Q 490 675 690 740"
        fill="none"
        stroke="rgba(118,224,255,0.56)"
        strokeWidth="1.3"
        filter="url(#routeBlueGlow)"
      />
      <path
        d="M 300 610 Q 425 465 615 330"
        fill="none"
        stroke="rgba(255,170,96,0.66)"
        strokeWidth="1.4"
        filter="url(#routeOrangeGlow)"
      />

      <circle cx="540" cy="556" r="8" fill="rgba(255,208,128,0.95)" />
      <circle cx="540" cy="556" r="20" fill="rgba(255,208,128,0.14)" />
      <circle cx="540" cy="556" r="36" fill="rgba(255,208,128,0.07)" />

      <circle cx="792" cy="268" r="5" fill="rgba(118,224,255,0.95)" />
      <circle cx="905" cy="525" r="5" fill="rgba(118,224,255,0.92)" />
      <circle cx="962" cy="690" r="5" fill="rgba(255,170,96,0.90)" />
      <circle cx="300" cy="610" r="5" fill="rgba(255,170,96,0.88)" />
    </svg>
  );
}

export default function ExchangeSceneStage() {
  return (
    <div
      style={{
        position: "relative",
        minHeight: 760,
        height: "100%",
        overflow: "hidden",
        borderRadius: 14,
        background:
          "radial-gradient(circle at 54% 40%, rgba(72,128,255,0.16) 0%, rgba(20,44,94,0.10) 24%, rgba(3,8,14,0.94) 58%, rgba(3,8,14,1) 100%)",
      }}
    >
      {/* deep-space wash */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          background:
            "radial-gradient(circle at 54% 42%, rgba(95,156,255,0.18) 0%, rgba(48,92,200,0.10) 20%, rgba(0,0,0,0) 56%)",
          filter: "blur(22px)",
        }}
      />

      {/* fallback planet silhouette so scene still reads even if image is missing */}
      <div
        style={{
          position: "absolute",
          right: "-12%",
          top: "-8%",
          width: "92%",
          height: "118%",
          zIndex: 1,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 38% 38%, rgba(48,106,186,0.22) 0%, rgba(18,52,110,0.12) 18%, rgba(2,10,20,0.82) 54%, rgba(0,0,0,0.96) 74%)",
          boxShadow:
            "0 0 120px rgba(100,170,255,0.10), inset -30px 0 120px rgba(0,0,0,0.55)",
        }}
      />

      {/* cinematic globe plate */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          backgroundImage: 'url("/assets/exchange/outcome-globe-plate.png")',
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center center",
          backgroundSize: "cover",
          opacity: 0.98,
          mixBlendMode: "screen",
        }}
      />

      {/* extra halo / polish */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 3,
          background:
            "radial-gradient(circle at 56% 38%, rgba(160,214,255,0.10) 0%, rgba(160,214,255,0.05) 20%, rgba(160,214,255,0) 44%), linear-gradient(90deg, rgba(2,6,12,0.30) 0%, rgba(2,6,12,0.00) 22%, rgba(2,6,12,0.00) 78%, rgba(2,6,12,0.34) 100%)",
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 3,
          pointerEvents: "none",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.00) 6%, rgba(255,255,255,0.00) 94%, rgba(255,255,255,0.02) 100%)",
        }}
      />

      <RouteLayer />

      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 6,
        }}
      >
        <FloatingCard
          title="Workforce Pool"
          sub="funding rail"
          style={{ left: "18%", top: "38%" }}
        />

        <FloatingCard
          title="Franklin County"
          sub="23 participants"
          large
          style={{ left: "31%", top: "47%" }}
        />

        <FloatingCard
          title="Workforce Program"
          sub="outcome track"
          style={{ left: "64%", top: "39%" }}
        />

        <FloatingCard
          title="Hamilton County"
          sub="regional node"
          style={{ left: "61%", top: "62%" }}
        />

        <FloatingCard
          title="Workforce Funding Pool"
          sub="$2,500 escrow"
          style={{ left: "25%", top: "74%" }}
        />
      </div>
    </div>
  );
}
