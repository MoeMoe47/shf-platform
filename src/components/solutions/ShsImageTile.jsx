import React from "react";

/**
 * Renders a real photo when `src` is provided. Falls back to a stylized
 * duotone + icon treatment when no suitable real asset exists — the repo
 * has no un-branded photography for every slot (see
 * docs/SHS_HOME_AND_BOS_MIGRATION.md for the exact list of slots still
 * pending real production assets). Swap the fallback for real photography
 * as soon as it exists.
 */
export default function ShsImageTile({ variant, icon, label, src, className = "" }) {
  if (src) {
    return (
      <div className={`shs-tile shs-tile--photo ${className}`}>
        <img src={src} alt="" loading="lazy" />
      </div>
    );
  }

  return (
    <div className={`shs-tile shs-tile--${variant} ${className}`} role="img" aria-label={label || ""}>
      <span className="shs-tile-icon" aria-hidden="true">
        {icon}
      </span>
    </div>
  );
}
