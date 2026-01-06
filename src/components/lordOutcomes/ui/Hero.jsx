import React from "react";

export default function Hero({ title, subtitle }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h1 style={{
        fontSize: 52,
        fontWeight: 900,
        letterSpacing: "-0.03em",
        marginBottom: 10
      }}>
        {title}
      </h1>

      {subtitle && (
        <p style={{
          maxWidth: 640,
          fontSize: 16,
          lineHeight: 1.55,
          color: "rgba(255,255,255,0.62)"
        }}>
          {subtitle}
        </p>
      )}
    </section>
  );
}
