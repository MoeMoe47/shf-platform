import React from "react";
import Icon from "./FoundationDonationIcon.jsx";

const cards = [
  {
    title: "One-Time Gift",
    description: "Make an immediate difference.",
    imageSlot: "one-time-gift",
    image: "/assets/foundation/donation/donation-one-time-gift.webp",
    alt: "Student studying and writing at a desk",
    gift: true,
  },
  {
    title: "Monthly Giving",
    description: "Provide ongoing support.",
    imageSlot: "monthly-giving",
    image: "/assets/foundation/donation/donation-monthly-giving.webp",
    alt: "Students collaborating around a laptop outdoors",
    preview:
      "Choose Monthly in Make a Gift to support SHF through Stripe-hosted checkout. Each monthly gift depends on a successful payment. Contact SHF to cancel future gifts. Secure giving requires the approved provider to be configured.",
  },
  {
    title: "Corporate Support",
    description: "Partner with us to expand opportunity.",
    imageSlot: "corporate-support",
    image: "/assets/foundation/donation/donation-corporate-support.webp",
    alt: "Professionals discussing career and business support",
    href: "#/partners",
  },
  {
    title: "Grants & Foundations",
    description: "Support larger initiatives.",
    imageSlot: "grants-foundations",
    image: "/assets/foundation/donation/donation-grants-foundations.webp",
    alt: "Community and education partners meeting outdoors",
    preview:
      "Grant and foundation giving information is not yet published. SHF has not provided application instructions or a dedicated funder contact on this page.",
  },
  {
    title: "Employer Partnerships",
    description: "Invest in workforce development.",
    imageSlot: "employer-partnerships",
    image: "/assets/foundation/donation/donation-employer-partnerships.webp",
    alt: "Workforce partners planning with students and professionals",
    href: "#/partners",
  },
  {
    title: "Planned Giving",
    description: "Leave a lasting legacy.",
    imageSlot: "planned-giving",
    image: "/assets/foundation/donation/donation-planned-giving.webp",
    alt: "Young people overlooking a city skyline at sunset",
    preview:
      "Planned giving instructions are not yet available. No legal, tax or gift-acceptance guidance is provided here.",
  },
];

export default function FoundationWaysToGive({ onPreview }) {
  return (
    <section
      id="ways-to-give"
      tabIndex={-1}
      className="shf-donation-ways shf-donation-shell"
      aria-labelledby="ways-title"
    >
      <p className="shf-donation-eyebrow">WAYS TO GIVE</p>
      <h2 id="ways-title">More Ways to Make an Impact.</h2>
      <p>
        There are many ways to support the mission of Silicon Heartland
        Foundation.
      </p>
      <div className="shf-giving-cards">
        {cards.map((card) => {
          const titleId = `giving-${card.imageSlot}-title`;
          const descriptionId = `giving-${card.imageSlot}-description`;
          const arrow = (
            <span className="shf-giving-arrow" aria-hidden="true">
              <Icon name="arrow" />
            </span>
          );
          return (
            <article
              key={card.title}
              className="shf-giving-card"
              aria-labelledby={titleId}
            >
              <img
                className="shf-giving-card__image"
                data-photo-slot={card.imageSlot}
                data-photo-status="owner-approved"
                src={card.image}
                alt={card.alt}
                loading="lazy"
              />
              <div className="shf-giving-card__body">
                <h3 id={titleId}>{card.title}</h3>
                <p id={descriptionId}>{card.description}</p>
                {card.href ? (
                  <a
                    className="shf-giving-action"
                    href={card.href}
                    aria-labelledby={titleId}
                    aria-describedby={descriptionId}
                  >
                    {arrow}
                  </a>
                ) : (
                  <button
                    type="button"
                    className="shf-giving-action"
                    aria-labelledby={titleId}
                    aria-describedby={descriptionId}
                    onClick={() => {
                      if (card.gift) {
                        const target = document.getElementById("make-a-gift");
                        document
                          .getElementById("shf-custom-amount")
                          ?.focus({ preventScroll: true });
                        if (!target) return;
                        const headerHeight =
                          document
                            .querySelector(".shf-institutional-header")
                            ?.getBoundingClientRect().height || 0;
                        window.scrollTo({
                          top: Math.max(
                            0,
                            target.getBoundingClientRect().top +
                              window.scrollY -
                              headerHeight -
                              16,
                          ),
                          behavior: window.matchMedia(
                            "(prefers-reduced-motion: reduce)",
                          ).matches
                            ? "instant"
                            : "smooth",
                        });
                      } else
                        onPreview({
                          title: card.title,
                          description: card.preview,
                        });
                    }}
                  >
                    {arrow}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
