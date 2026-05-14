// src/pages/sales/BrandKit.jsx
import React from "react";
import { useBrandKit } from "@/hooks/useBrandKit.js";

export default function BrandKit() {
  const { brand, update, reset } = useBrandKit();
  const inputRef = React.useRef(null);

  const onPickLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\//.test(file.type)) return alert("Please choose an image file.");
    if (file.size > 600 * 1024) {
      // ~600KB guard to keep localStorage safe in demos
      return alert("Please upload an image under ~600KB for demos.");
    }
    const fr = new FileReader();
    fr.onload = () => update({ logoDataUrl: String(fr.result || "") });
    fr.readAsDataURL(file);
  };

  const removeLogo = () => update({ logoDataUrl: "" });

  return (
    <div className="page pad" style={{ display: "grid", gap: 16 }}>
      <header className="card card--pad">
        <h1 style={{ margin: 0, fontSize: 22 }}>Client Brand Kit</h1>
        <p style={{ margin: "6px 0 0", color: "var(--ink-soft)" }}>
          Drop a logo, set colors, and instantly brand your Sales demos.
        </p>
      </header>

      <section className="card card--pad" style={{ display: "grid", gap: 14 }}>
        <div
          style={{
            display: "grid",
            gap: 10,
            gridTemplateColumns: "1fr 1fr",
            alignItems: "end",
          }}
        >
          <div>
            <label className="sh-label">Client name</label>
            <input
              className="sh-input"
              placeholder="Acme Robotics"
              value={brand.name || ""}
              onChange={(e) => update({ name: e.target.value })}
            />
          </div>
          <div>
            <label className="sh-label">Tagline (optional)</label>
            <input
              className="sh-input"
              placeholder="Future of manufacturing"
              value={brand.tagline || ""}
              onChange={(e) => update({ tagline: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <label className="sh-label">Logo</label>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="sh-btn" onClick={() => inputRef.current?.click()}>
              {brand.logoDataUrl ? "Replace logo" : "Upload logo"}
            </button>
            {brand.logoDataUrl && (
              <button className="sh-btn sh-btn--secondary" onClick={removeLogo}>
                Remove
              </button>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={onPickLogo}
              style={{ display: "none" }}
            />
            {brand.logoDataUrl && (
              <div
                style={{
                  width: 120,
                  height: 60,
                  borderRadius: 8,
                  overflow: "hidden",
                  border: "1px solid rgba(0,0,0,.1)",
                }}
                aria-label="Logo preview"
              >
                <img
                  src={brand.logoDataUrl}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    background: "#fff",
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: 10,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          <ColorPicker
            label="Primary"
            value={brand.primary || "#cc0000"}
            onChange={(v) => update({ primary: v })}
          />
          <ColorPicker
            label="Secondary"
            value={brand.secondary || "#111111"}
            onChange={(v) => update({ secondary: v })}
          />
          <ColorPicker
            label="Accent"
            value={brand.accent || "#ffffff"}
            onChange={(v) => update({ accent: v })}
          />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="sh-btn"
            onClick={() => alert("Saved locally. Ready to demo!")}
          >
            Save
          </button>
          <button className="sh-btn sh-btn--secondary" onClick={reset}>
            Reset
          </button>
        </div>
      </section>

      {/* Live preview */}
      <section className="card card--pad">
        <h2 style={{ margin: 0, fontSize: 18 }}>Live Preview</h2>
        <div
          style={{
            marginTop: 10,
            padding: 18,
            borderRadius: 12,
            background: "var(--client-brand-primary)",
            color: "var(--client-brand-accent)",
            display: "grid",
            gap: 10,
            gridTemplateColumns: "auto 1fr",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 10,
              overflow: "hidden",
              background: "var(--client-brand-secondary)",
              display: "grid",
              placeItems: "center",
            }}
          >
            {brand.logoDataUrl ? (
              <img
                src={brand.logoDataUrl}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span
                style={{ color: "var(--client-brand-accent)", fontWeight: 800 }}
              >
                {(brand.name || "Brand").slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20 }}>
              {brand.name || "Your Client"}
            </div>
            {brand.tagline && (
              <div style={{ opacity: 0.85, marginTop: 2 }}>{brand.tagline}</div>
            )}
            <div
              style={{
                marginTop: 10,
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <a href="/sales.html#/sales/demo" className="sh-btn">
                Open Demo Hub
              </a>
              <a
                href="/sales.html#/sales/proposal"
                className="sh-btn sh-btn--secondary"
              >
                Open Proposal
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ColorPicker({ label, value, onChange }) {
  return (
    <label className="sh-label" style={{ display: "grid", gap: 6 }}>
      {label}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          aria-label={`${label} color`}
          style={{ width: 40, height: 28, border: "none", background: "transparent" }}
        />
        <input
          className="sh-input"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder="#RRGGBB"
        />
      </div>
    </label>
  );
}
