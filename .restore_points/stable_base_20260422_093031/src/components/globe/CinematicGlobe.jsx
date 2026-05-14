import React from "react";

const sparkLines = [
  { left: "57.5%", top: "57.5%", width: 70, rotate: -18, delay: "0s" },
  { left: "62.5%", top: "52.5%", width: 54, rotate: 10, delay: "1.6s" },
  { left: "53.5%", top: "63%", width: 50, rotate: 34, delay: "2.8s" },
];

export default function CinematicGlobe() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: "#020711"
      }}
    >
      <style>{`
        @keyframes landPulse {
          0%, 100% {
            opacity: 0.10;
            transform: scale(1);
          }
          50% {
            opacity: 0.24;
            transform: scale(1.01);
          }
        }

        @keyframes atmosphereShift {
          0%, 100% {
            opacity: 0.24;
            transform: translateX(0px);
          }
          50% {
            opacity: 0.38;
            transform: translateX(6px);
          }
        }

        @keyframes sparkTravel {
          0% {
            opacity: 0;
            transform: translateX(-12%) scaleX(0.7);
          }
          20% {
            opacity: 0.55;
          }
          100% {
            opacity: 0;
            transform: translateX(104%) scaleX(1.08);
          }
        }

        @keyframes starDrift {
          0% { transform: translateY(0px); opacity: 0.35; }
          50% { transform: translateY(5px); opacity: 0.58; }
          100% { transform: translateY(0px); opacity: 0.35; }
        }
      `}</style>

      <img
        src="/assets/globe/executive-globe.png"
        alt="Cinematic executive globe"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center center",
          userSelect: "none",
          pointerEvents: "none"
        }}
      />

      {/* Embedded landmass breathing glow over North America */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          mixBlendMode: "screen",
          animation: "landPulse 4.8s ease-in-out infinite",
          background: `
            radial-gradient(circle at 66% 50%, rgba(255,210,145,0.22) 0%, rgba(255,210,145,0.08) 5%, rgba(0,0,0,0) 12%),
            radial-gradient(circle at 63% 55%, rgba(255,196,122,0.18) 0%, rgba(255,196,122,0.07) 4.5%, rgba(0,0,0,0) 10%),
            radial-gradient(circle at 60% 60%, rgba(255,186,112,0.16) 0%, rgba(255,186,112,0.06) 4%, rgba(0,0,0,0) 9%),
            radial-gradient(circle at 57% 64%, rgba(255,178,104,0.14) 0%, rgba(255,178,104,0.05) 4%, rgba(0,0,0,0) 8%),
            radial-gradient(circle at 53% 67%, rgba(255,172,98,0.12) 0%, rgba(255,172,98,0.04) 3.5%, rgba(0,0,0,0) 7%),
            radial-gradient(circle at 61% 48%, rgba(255,206,134,0.14) 0%, rgba(255,206,134,0.05) 3.5%, rgba(0,0,0,0) 8%),
            radial-gradient(circle at 64% 46%, rgba(255,202,128,0.12) 0%, rgba(255,202,128,0.04) 3%, rgba(0,0,0,0) 7%),
            radial-gradient(circle at 55% 58%, rgba(255,188,118,0.12) 0%, rgba(255,188,118,0.04) 3%, rgba(0,0,0,0) 7%)
          `
        }}
      />

      {/* Soft atmospheric shimmer */}
      <div
        style={{
          position: "absolute",
          right: "-4%",
          top: "3%",
          width: "34%",
          height: "92%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 30% 50%, rgba(116,214,255,0.12) 0%, rgba(116,214,255,0.05) 18%, rgba(116,214,255,0.02) 34%, rgba(0,0,0,0) 70%)",
          filter: "blur(10px)",
          animation: "atmosphereShift 6s ease-in-out infinite",
          pointerEvents: "none",
          mixBlendMode: "screen"
        }}
      />

      {/* Very light spark motion */}
      {sparkLines.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: s.left,
            top: s.top,
            width: s.width,
            height: 1.5,
            transform: `rotate(${s.rotate}deg)`,
            transformOrigin: "left center",
            overflow: "hidden",
            pointerEvents: "none"
          }}
        >
          <div
            style={{
              width: "34%",
              height: "100%",
              borderRadius: 999,
              background:
                "linear-gradient(90deg, rgba(120,210,255,0) 0%, rgba(120,210,255,0.38) 45%, rgba(255,208,140,0.45) 100%)",
              filter: "blur(0.35px)",
              animation: `sparkTravel 5.6s linear ${s.delay} infinite`
            }}
          />
        </div>
      ))}

      {[...Array(10)].map((_, i) => (
        <div
          key={`star-${i}`}
          style={{
            position: "absolute",
            left: `${8 + i * 8}%`,
            top: `${10 + (i % 4) * 11}%`,
            width: i % 3 === 0 ? 2 : 1,
            height: i % 3 === 0 ? 2 : 1,
            borderRadius: "50%",
            background: "rgba(170,220,255,0.8)",
            boxShadow: "0 0 6px rgba(120,210,255,0.28)",
            animation: `starDrift ${5 + (i % 4)}s ease-in-out ${i * 0.4}s infinite`,
            pointerEvents: "none"
          }}
        />
      ))}

      <div
        style={{
          position: "absolute",
          inset: 0,
          boxShadow: "inset 0 0 90px rgba(0,0,0,0.16)",
          pointerEvents: "none"
        }}
      />
    </div>
  );
}
