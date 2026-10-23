import React, { useState } from "react";
import Icon from "./FoundationDonationIcon.jsx";

export default function FoundationDonationNav() {
  const [active, setActive] = useState("make-a-gift");
  return (
    <nav
      className="shf-donation-nav shf-donation-shell"
      aria-label="Donation page sections"
    >
      {[
        ["heart", "Make a Gift", "make-a-gift"],
        ["gift", "Ways to Give", "ways-to-give"],
        ["chart", "Where It Goes", "where-it-goes"],
      ].map(([icon, label, id]) => (
        <button
          key={id}
          type="button"
          aria-current={active === id ? "location" : undefined}
          onClick={() => {
            const target = document.getElementById(id);
            if (!target) return;
            setActive(id);
            const header = document.querySelector(".shf-institutional-header");
            const headerHeight = header?.getBoundingClientRect().height || 0;
            target.focus({ preventScroll: true });
            window.scrollTo({
              top: Math.max(
                0,
                target.getBoundingClientRect().top +
                  window.scrollY -
                  headerHeight -
                  16,
              ),
              behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                .matches
                ? "instant"
                : "smooth",
            });
          }}
        >
          <Icon name={icon} />
          {label}
        </button>
      ))}
      <a href="#impact">
        <Icon name="people" />
        Impact Stories
      </a>
      <a href="#/partners">
        <Icon name="partner" />
        Partner With Us
      </a>
    </nav>
  );
}
