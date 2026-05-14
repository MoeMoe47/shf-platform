// src/components/BrandLogo.jsx
import React from "react";

const BRAND_MAP = {
  foundation: {
    logo: "/logos/shf-foundation.svg",
    name: "SILICON HEARTLAND",
    sub: "foundation",
  },
  store: {
    logo: "/logos/shf-store.svg",
    name: "SILICON HEARTLAND",
    sub: "store",
  },
  solutions: {
    logo: "/logos/shf-solutions.svg",
    name: "SILICON HEARTLAND",
    sub: "solutions",
  },
  career: {
    logo: "/logos/shf-career.svg",
    name: "SILICON HEARTLAND",
    sub: "career center",
  },
  // add more apps here as you create logos
};

/**
 * BrandLogo
 * app: "store" | "solutions" | "career" | "foundation" | ...
 * className: extra wrapper classes for each app header
 * logoClassName: extra classes for the <img>
 */
export default function BrandLogo({
  app = "foundation",
  className = "",
  logoClassName = "",
  overrideName,
  overrideSub,
}) {
  const brand = BRAND_MAP[app] || BRAND_MAP.foundation;

  const name = overrideName || brand.name;
  const sub = overrideSub || brand.sub;

  return (
    <div className={`sh-brand ${className}`.trim()}>
      <img
        src={brand.logo}
        alt={name}
        className={`sh-brand__logo ${logoClassName}`.trim()}
      />
      <span className="sh-brand__name">{name}</span>
      <span className="sh-brand__sub">{sub}</span>
    </div>
  );
}
