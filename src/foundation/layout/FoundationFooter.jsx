import SHFLogo from "@/components/shared/SHFLogo.jsx";
import React from "react";
import "../styles/foundation-footer.css";

export default function FoundationFooter({ baseHref = "" }) {
  React.useEffect(() => {
    // The existing Impact fragment can arrive before Foundation's React tree
    // mounts. Complete that native anchor without changing the route or page.
    let frame = 0;
    const scrollToImpact = () => {
      cancelAnimationFrame(frame);
      if (window.location.hash !== "#impact") return;
      frame = requestAnimationFrame(() => {
        document.getElementById("impact")?.scrollIntoView({ block: "start" });
      });
    };
    scrollToImpact();
    window.addEventListener("hashchange", scrollToImpact);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", scrollToImpact);
    };
  }, []);

  return (
    <footer className="shf-footer" id="get-involved">
      <div className="shf-shell shf-footer__inner">
        <a
          className="shf-footer__brand"
          href="/foundation.html"
          aria-label="Silicon Heartland Foundation home"
        >
          <SHFLogo width={270} />
        </a>

        <nav className="shf-footer__links" aria-label="Foundation footer">
          <a href={`${baseHref}#/about`}>About</a>
          <a href={`${baseHref}#/programs`}>Programs</a>
          <a href={`${baseHref}#impact`}>Impact</a>
          <a href={`${baseHref}#/partners`}>Partners</a>
          <a href={`${baseHref}#/reports`}>Resources</a>
          <a href={`${baseHref}#/reports`}>News</a>
          <a href={`${baseHref}#/get-involved`}>Contact</a>
        </nav>

        <div className="shf-footer__social" aria-hidden="true">
          <span>in</span>
          <span>yt</span>
          <span>x</span>
          <span>ig</span>
        </div>
      </div>
      <div className="shf-footer__bottom">
        <span>A stronger region. A brighter tomorrow.</span>
        <span>© 2026 Silicon Heartland Foundation. All rights reserved.</span>
      </div>
    </footer>
  );
}
