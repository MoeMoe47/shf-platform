// src/pages/Lessons.jsx
import React from "react";
import { Link, useParams } from "react-router-dom";
import { href, inApp } from "@/router/paths.js";

export default function Lessons() {
  // Tolerate either :curriculum or legacy :cur; default to "asl"
  const params = useParams();
  const curriculum = (params.curriculum || params.cur || "asl").toLowerCase();

  // Build contextual Fuel Tank submit URL for CH1
  const from = typeof window !== "undefined" ? window.location.href : "";
  const pitchCH1Url =
    `${href.fuel("/submit")}` +
    `?title=${encodeURIComponent(`Pitch: ${curriculum.toUpperCase()} CH1`)}` +
    `&slug=${encodeURIComponent("ch1")}` +
    `&from=${encodeURIComponent(from)}`;

  return (
    <section style={{ padding: 20 }}>
      <h1>Lessons</h1>
      <ul>
        {/* Cross-app demo goes through Sales */}
        <li>
          <a href={href.sales(inApp.sales.demoLesson(curriculum, "ch1"))}>
            Open CH1 (Sales demo)
          </a>
        </li>
        {/* Canonical in-app plural detail route */}
        <li>
          <Link to={`/${curriculum}/lessons/ch1`}>Open CH1 (live API)</Link>
        </li>
      </ul>

      {/* 🚀 Contextual Fuel Tank CTA for this lesson */}
      <div style={{ marginTop: 16 }}>
        <a
          href={pitchCH1Url}
          title="Pitch this lesson in Fuel Tank"
          className="btn pill"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            border: "1px solid var(--ring, #e5e7eb)",
            borderRadius: 999,
            background: "#fff",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          🚀 Pitch CH1 in Fuel Tank
        </a>

        {/* ⛽ Quick link to Fuel Tank Top */}
        <a href={href.fuel("/top")} className="btn pill" style={{ marginLeft: 8 }}>
          ⛽ Open Fuel Tank
        </a>
      </div>

      <p style={{ color: "#666", marginTop: 16 }}>
        Sales demo is a lightweight preview (no API). Live API uses{" "}
        <code>/api/merged/{curriculum}/ch1</code>.
      </p>
    </section>
  );
}

/* --- SHF: Unit/module completion award --- */
(() => {
  if (typeof window === "undefined" || window.__shfHook_unit) return; window.__shfHook_unit = true;

  const once = (k) => { if (!k) return true; if (localStorage.getItem(k)) return false; localStorage.setItem(k,"1"); return true; };

  // fire when all lessons in a unit are done:
  //   window.dispatchEvent(new CustomEvent("unit:complete", { detail:{ unitId, title } }))
  window.addEventListener("unit:complete", (e) => {
    const d = (e && e.detail) || {};
    const key = d.unitId ? `shf.award.unit.${d.unitId}` : "";
    if (!once(key)) return;
    try {
      window.shfCredit?.earn?.({
        action: "unit.complete",
        rewards: { heart: 1 }, // ❤️
        scoreDelta: 15,
        meta: { unitId: d.unitId, title: d.title }
      });
      window.shToast?.("🏁 Unit completed · +1 ❤️ · +15 score");
    } catch {}
  });
})();
