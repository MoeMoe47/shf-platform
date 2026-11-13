import React, { useEffect, useRef } from "react";
import SolarHeroSun from "../solar/SolarHeroSun.jsx";
import EarthHorizonLayer from "./EarthHorizonLayer.jsx";
import TwinkleStarsLayer from "./TwinkleStarsLayer.jsx";
import SolarDustLayer from "./SolarDustLayer.jsx";
import "./cosmic-scene.css";

function Starfield() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    function paint() {
      const r = canvas.getBoundingClientRect();
      const w = Math.max(1, r.width);
      const h = Math.max(1, r.height);
      const dpr = Math.min(devicePixelRatio || 1, 1.5);

      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.fillStyle = "#02050d";
      ctx.fillRect(0, 0, w, h);

      let seed = 1234567;
      const random = () => {
        seed = (1664525 * seed + 1013904223) >>> 0;
        return seed / 4294967296;
      };

      // Diffuse galaxy atmosphere.
      for (let i = 0; i < 170; i++) {
        const x = random() * w;
        const y = (.05 + random() * .59) * h;
        const rad = 12 + random() * 100;

        const cloud = ctx.createRadialGradient(
          x, y, 0, x, y, rad
        );

        cloud.addColorStop(0, "rgba(95,118,154,.018)");
        cloud.addColorStop(1, "rgba(95,118,154,0)");

        ctx.fillStyle = cloud;
        ctx.fillRect(x-rad, y-rad, rad*2, rad*2);
      }

      // Stable stars, not a repeating background tile.
      for (let i = 0; i < 1350; i++) {
        const x = random() * w;
        const y = random() * h;
        const radius = .3 + random() * 1.05;
        const opacity = .18 + random() * .72;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI*2);
        ctx.fillStyle = `rgba(230,239,255,${opacity})`;
        ctx.fill();
      }
    }

    const resize = new ResizeObserver(paint);
    resize.observe(canvas);
    paint();

    return () => resize.disconnect();
  }, []);

  return <canvas ref={ref} className="cosmic-stars" aria-hidden="true" />;
}

export default function CosmicScene() {
  return (
    <div className="cosmic-scene" aria-hidden="true">
      <img className="cosmic-stars" src="/assets/shu/cosmic-v2/cosmic_starfield_no_sun_no_earth.png" alt="" />
      {/* SHUIC_TWINKLING_STARFIELD_V1 */}
        <TwinkleStarsLayer />
        {/* SHUIC_SOLAR_DUST_MOUNT_REPAIR_V3 */}
        <SolarDustLayer />
        <div className="cosmic-sun-position">
        <SolarHeroSun />
      </div>
      <img className="cosmic-earth-foreground" src="/assets/shu/cosmic-v2/earth_monochrome_foreground_preview.png" alt="" />
    </div>
  );
}
