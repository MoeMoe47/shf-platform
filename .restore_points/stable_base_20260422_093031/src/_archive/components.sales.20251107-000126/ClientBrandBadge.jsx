// src/components/sales/ClientBrandBadge.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useBrandKit } from "@/hooks/useBrandKit.js";

export default function ClientBrandBadge() {
  const { brand } = useBrandKit();
  const initials = (brand.name || "Brand").trim().split(/\s+/).map(s => s[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Link
      to="/sales/brand"
      className="sal-brandBadge"
      aria-label="Open Client Brand Kit"
      title={brand.name ? `Brand: ${brand.name}` : "Set client brand"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        textDecoration: "none",
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid rgba(0,0,0,.12)",
        background: "var(--client-brand-accent)",
        color: "var(--client-brand-secondary)",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          overflow: "hidden",
          display: "grid",
          placeItems: "center",
          background: "var(--client-brand-primary)",
          color: "var(--client-brand-accent)",
          fontWeight: 800,
          fontSize: 12,
        }}
      >
        {brand.logoDataUrl ? (
          <img
            src={brand.logoDataUrl}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          initials
        )}
      </span>

      <span
        className="sal-brandBadgeLabel"
        style={{ fontWeight: 700, lineHeight: 1 }}
      >
        {brand.name || "Brand Kit"}
      </span>
    </Link>
  );
}
