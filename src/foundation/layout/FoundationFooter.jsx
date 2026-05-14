import React from "react";

export default function FoundationFooter() {
  return (
    <footer className="shf-footer" id="get-involved">
      <div className="shf-shell shf-footer__grid">
        <div className="shf-footer__contact">
          <div className="shf-footer__line">✉ info@shfoundation.org</div>
          <div className="shf-footer__line">☎ (123) 456-7890</div>
        </div>

        <div className="shf-footer__cols">
          <div>
            <h4>About Us</h4>
            <a href="#about">Our Story</a>
            <a href="#partners">Partners</a>
          </div>
          <div>
            <h4>Programs</h4>
            <a href="#programs">Education & Training</a>
            <a href="#programs">Recovery Support</a>
          </div>
          <div>
            <h4>Resources</h4>
            <a href="#reports">Impact Reports</a>
            <a href="#reports">News & Updates</a>
          </div>
        </div>

        <div className="shf-footer__social">
          <span>f</span>
          <span>x</span>
          <span>in</span>
        </div>
      </div>

      <div className="shf-footer__bottom">
        © 2029 SH Foundation. All rights reserved.
      </div>
    </footer>
  );
}
