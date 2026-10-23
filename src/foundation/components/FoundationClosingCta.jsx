import React from "react";
import "../styles/foundation-closing-cta.css";
import SHFSlogan from "./SHFSlogan.jsx";
import footerImage from "@/assets/brand/shf-footer-landscape-light.webp";

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function ButtonLink({
  href,
  children,
  variant = "primary",
  onClick = undefined,
}) {
  return (
    <a className={`shf-btn shf-btn--${variant}`} href={href} onClick={onClick}>
      {children}
      <ArrowIcon />
    </a>
  );
}

/** Shared, canonical Foundation closing call-to-action owned by the public Foundation layout. */
export default function FoundationClosingCta({ baseHref = "" }) {
  function returnToGift(event) {
    // Preserve native navigation/new-tab behavior and cross-app canonical links.
    if (
      baseHref ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const route = window.location.hash
      .replace(/^#\/?/, "")
      .split("?")[0]
      .replace(/\/$/, "");
    if (route !== "get-involved") return;
    const target = document.getElementById("make-a-gift");
    if (!target) return;
    event.preventDefault();
    const headerHeight =
      document
        .querySelector(".shf-institutional-header")
        ?.getBoundingClientRect().height || 0;
    target.focus({ preventScroll: true });
    window.scrollTo({
      top: Math.max(
        0,
        target.getBoundingClientRect().top + window.scrollY - headerHeight - 16,
      ),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }
  /** @type {React.CSSProperties & {"--shf-footer-image": string}} */
  const artworkStyle = { "--shf-footer-image": `url(${footerImage})` };
  return (
    <section
      aria-label="Support the Silicon Heartland Foundation"
      className="shf-final-cta"
      style={artworkStyle}
    >
      <div className="shf-shell shf-final-cta__inner">
        <div>
          <SHFSlogan
            as="h2"
            lines={["Invest in People.", "Strengthen Communities."]}
            variant="editorial"
            tone="light"
          />
          <p>
            Support education, opportunity and community development across the
            Midwest. Together, we can create lasting impact.
          </p>
        </div>
        <div className="shf-final-cta__actions">
          <ButtonLink href={`${baseHref}#/get-involved`} onClick={returnToGift}>
            Support SHF
          </ButtonLink>
          <ButtonLink href={`${baseHref}#/partners`} variant="outline-light">
            Partner With Us
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
