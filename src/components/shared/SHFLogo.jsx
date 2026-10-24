import React from "react";
import "./shf-logo.css";

// Exact approved master artwork; section names belong outside this logo.
export default function SHFLogo({ compact = false, mobileCompact = false, width, className = "" }) {
  return (
    <span className={`shf-official-logo ${compact ? "shf-official-logo--compact" : ""} ${mobileCompact ? "shf-official-logo--mobile-compact" : ""} ${className}`.trim()} style={width ? { width } : undefined}>
      <picture>
        {mobileCompact && <source media="(max-width: 680px)" srcSet="/assets/brand/shf-official-heart.png" width="426" height="371" />}
        <img
          src={compact ? "/assets/brand/shf-official-heart.png" : "/assets/brand/shf-official-logo.webp"}
          alt="Silicon Heartland Foundation"
          width={compact ? 426 : 1834}
          height={371}
          decoding="async"
        />
      </picture>
    </span>
  );
}
