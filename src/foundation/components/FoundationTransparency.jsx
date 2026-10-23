import React from "react";
import Icon from "./FoundationDonationIcon.jsx";

export default function FoundationTransparency({ onPreview }) {
  return (
    <section
      className="shf-donation-transparency shf-donation-shell"
      aria-labelledby="transparency-title"
    >
      <div>
        <p className="shf-donation-eyebrow">TRUST & TRANSPARENCY</p>
        <h2 id="transparency-title">Your Support. Our Responsibility.</h2>
        <p>
          We are committed to transparent reporting and responsible stewardship
          of every contribution.
        </p>
      </div>
      <div
        className="shf-transparency-actions"
        role="group"
        aria-label="Foundation transparency information"
      >
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={() =>
            onPreview({
              title: "Financial Reports",
              description:
                "Approved financial reports are not currently published in SHF’s public resources. No financial statements or allocation percentages are presented on this page.",
            })
          }
        >
          <Icon name="file" />
          Financial Reports
        </button>
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={() =>
            onPreview({
              title: "Governance Overview",
              description:
                "A dedicated public governance overview is not yet available. SHF’s public resources describe its evidence and disclosure approach; this page does not substitute for approved governance documents.",
            })
          }
        >
          <Icon name="shield" />
          Governance Overview
        </button>
        <a href="#/reports">
          <Icon name="chart" />
          Impact Reporting
        </a>
      </div>
    </section>
  );
}
