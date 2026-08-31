// src/components/store/StoreCatalogCard.jsx
//
// Real photography (see catalogOfferings.js's `photo`/`photoSmall`
// fields — 1600x900 and 800x450 real source assets, not upscaled
// thumbnails) with a small circular icon badge overlapping the image's
// bottom-left corner, matching the approved mock. `srcSet`/`sizes` let
// the browser pick the 800w file on narrower/single-column layouts
// instead of always downloading the 1600w one. No favorite/bookmark
// icon — the mock shows one, but no real favorites/bookmark persistence
// system exists anywhere in this codebase for Catalog offerings, and
// this project's own rule throughout has been: a control with no real
// behavior is omitted, not faked.
import React from "react";
import { Link } from "react-router-dom";
import { ACCESS_TYPES, CTA_BY_TYPE, CTA_BY_ACCESS_OVERRIDE } from "@/data/catalogOfferings.js";

const ACCESS_LABEL = Object.fromEntries(ACCESS_TYPES.map((a) => [a.id, a.label]));

// Matches .cs-cardGrid's 4/3/2/1-column breakpoints (store-catalog.css)
// so the browser requests an image sized for the column it's actually
// rendered at, not always the largest variant.
const CARD_IMAGE_SIZES = "(max-width: 767px) 100vw, (max-width: 1023px) 50vw, (max-width: 1279px) 33vw, 326px";

export default function StoreCatalogCard({ offering, onOpenPreview }) {
  const ctaLabel =
    offering.ctaLabel || CTA_BY_ACCESS_OVERRIDE[offering.access] || CTA_BY_TYPE[offering.offeringType] || "See Details";

  return (
    <article className="cs-card">
      <div className="cs-cardMedia">
        <img
          className="cs-cardPhoto"
          src={offering.photo}
          srcSet={offering.photoSmall ? `${offering.photoSmall} 800w, ${offering.photo} 1600w` : undefined}
          sizes={offering.photoSmall ? CARD_IMAGE_SIZES : undefined}
          alt=""
          loading="lazy"
        />
        <span className={`cs-cardIconBadge cs-cardIconBadge--${offering.accent}`} aria-hidden="true">
          {offering.icon}
        </span>
      </div>
      <div className="cs-cardBody">
        <h3 className="cs-cardTitle">{offering.title}</h3>
        <span className="cs-cardOwner">{offering.owner}</span>
        <span className={`cs-cardBadge cs-cardBadge--${offering.access}`}>
          {ACCESS_LABEL[offering.access] || offering.access}
        </span>
        <p className="cs-cardDesc">{offering.description}</p>
        {offering.detailHref ? (
          <Link className="cs-cardCta" to={offering.detailHref}>
            {ctaLabel}
          </Link>
        ) : (
          <button type="button" className="cs-cardCta" onClick={() => onOpenPreview(offering)}>
            {ctaLabel}
          </button>
        )}
      </div>
    </article>
  );
}
