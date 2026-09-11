import React from "react";
import "./shs-request-demo.css";

const LOGO_SRC = "/assets/hub/shs-hub-logo.png";

const benefitItems = [
  {
    icon: "▣",
    title: "Personalized Demo",
    text: "See how SHS solves the challenges that matter most to your organization.",
  },
  {
    icon: "♙",
    title: "Tailored to Your Needs",
    text: "We’ll customize the demo to your sector, goals, and reporting requirements.",
  },
  {
    icon: "◷",
    title: "Expert Conversation",
    text: "Speak with our team about your goals, timelines, and implementation.",
  },
  {
    icon: "◇",
    title: "No Obligation",
    text: "This is a no-pressure conversation focused on helping you make the right decision.",
  },
];

const contactItems = [
  {
    icon: "◌",
    title: "Live Chat",
    text: "Chat with our team during business hours.",
    action: "Start Chat →",
  },
  {
    icon: "✉",
    title: "Email Us",
    text: "Send us an email and we’ll respond quickly.",
    action: "hello@siliconheartland.solutions",
  },
  {
    icon: "☎",
    title: "Call Us",
    text: "Monday – Friday\n8:00 AM – 5:00 PM CT",
    action: "(833) 474-7468",
  },
  {
    icon: "⌖",
    title: "Headquarters",
    text: "Silicon Heartland Solutions\nKansas City, Missouri, USA",
    action: "",
  },
];

function Header() {
  return (
    <header className="srd-header">
      <a className="srd-brand" href="#/home" aria-label="Silicon Heartland Solutions">
        <img src={LOGO_SRC} alt="Silicon Heartland Solutions" />
        <span>
          <strong>Silicon Heartland</strong>
          <strong>Solutions</strong>
        </span>
      </a>

      <nav className="srd-nav" aria-label="Primary navigation">
        <a href="#/home">Solutions</a>
        <a href="#/infrastructure">Infrastructure</a>
        <a href="#/platform">Platform</a>
        <a href="#/about">About</a>
        <a href="#/resources">Resources</a>
        <a className="is-active" href="#/request-demo">Contact</a>
      </nav>

      <a className="srd-demo-btn" href="#/request-demo">Request Demo</a>
    </header>
  );
}

function RequestForm() {
  return (
    <section className="srd-form-card" aria-labelledby="request-demo-title">
      <div className="srd-form-heading">
        <div className="srd-form-icon">▣</div>
        <div>
          <h2 id="request-demo-title">Request a Demo</h2>
          <p>
            Tell us about your organization and what you’re looking to achieve.
            We’ll be in touch to schedule your personalized demo.
          </p>
        </div>
      </div>

      <form className="srd-form">
        <div className="srd-field">
          <label>First Name <b>*</b></label>
          <input type="text" placeholder="First name" />
        </div>

        <div className="srd-field">
          <label>Last Name <b>*</b></label>
          <input type="text" placeholder="Last name" />
        </div>

        <div className="srd-field">
          <label>Work Email <b>*</b></label>
          <input type="email" placeholder="name@organization.org" />
        </div>

        <div className="srd-field">
          <label>Phone Number</label>
          <input type="tel" placeholder="(555) 123-4567" />
        </div>

        <div className="srd-field srd-span-2">
          <label>Organization / Company <b>*</b></label>
          <input type="text" placeholder="Your organization" />
        </div>

        <div className="srd-field">
          <label>Organization Type <b>*</b></label>
          <select defaultValue="">
            <option value="" disabled>Select type</option>
            <option>Nonprofit / Community Organization</option>
            <option>Government / County Partner</option>
            <option>Foundation / Funder</option>
            <option>Workforce / Education System</option>
            <option>Program Operator</option>
          </select>
        </div>

        <div className="srd-field">
          <label>Your Role <b>*</b></label>
          <select defaultValue="">
            <option value="" disabled>Select your role</option>
            <option>Executive Leader</option>
            <option>Program Director</option>
            <option>Data / Operations Lead</option>
            <option>Funder / Investor</option>
            <option>Technology Partner</option>
          </select>
        </div>

        <div className="srd-field srd-span-2">
          <label>What problem are you trying to solve with SHS? <b>*</b></label>
          <textarea placeholder="Tell us about your goals, challenges, and what success looks like." />
        </div>

        <div className="srd-field srd-span-2">
          <label>How did you hear about SHS?</label>
          <select defaultValue="">
            <option value="" disabled>Select an option</option>
            <option>Referral</option>
            <option>LinkedIn</option>
            <option>Conference / Event</option>
            <option>Partner Organization</option>
            <option>Search</option>
          </select>
        </div>

        <div className="srd-field srd-span-2">
          <label>Preferred Demo Timeframe</label>
          <div className="srd-timeframe">
            <button type="button" className="is-selected">▣ Within 2 Weeks</button>
            <button type="button">▣ 2–4 Weeks</button>
            <button type="button">▣ 1–2 Months</button>
            <button type="button">◷ Just Exploring</button>
          </div>
        </div>

        <div className="srd-field srd-span-2">
          <label>Anything else we should know?</label>
          <textarea placeholder="Additional context that will help us prepare for your demo." />
        </div>

        <label className="srd-checkbox srd-span-2">
          <input type="checkbox" defaultChecked />
          <span>Yes, I’d like to receive updates, resources, and insights from SHS.</span>
        </label>

        <button type="submit" className="srd-submit srd-span-2">Request Demo</button>

        <p className="srd-privacy srd-span-2">▵ We respect your privacy. Your information is safe with us.</p>
      </form>
    </section>
  );
}

export default function SHSRequestDemoPage() {
  return (
    <main className="srd-page">
      <Header />

      <section className="srd-main">
        <div className="srd-left">
          <p className="srd-eyebrow">Contact Us</p>
          <h1>Let’s Build Verified Impact Together</h1>
          <p className="srd-lead">
            Ready to see SHS in action? Request a personalized demo to explore how our
            platform helps organizations turn activity into verified outcomes, drive
            better decisions, and build community trust.
          </p>

          <div className="srd-benefits">
            {benefitItems.map((item) => (
              <article className="srd-benefit" key={item.title}>
                <div className="srd-benefit-icon">{item.icon}</div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="srd-corner-globe" aria-hidden="true">
            <div className="srd-globe-core" />
            <span className="srd-node n1" />
            <span className="srd-node n2" />
            <span className="srd-node n3" />
            <span className="srd-node n4" />
          </div>
        </div>

        <RequestForm />
      </section>

      <section className="srd-contact-card">
        <div className="srd-contact-heading">
          <h2>Talk to Our Team</h2>
          <p>Have questions before requesting a demo? We’re here to help.</p>
        </div>

        <div className="srd-contact-grid">
          {contactItems.map((item) => (
            <article className="srd-contact-item" key={item.title}>
              <div className="srd-contact-icon">{item.icon}</div>
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                {item.action ? <strong>{item.action}</strong> : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="srd-footer">
        <div className="srd-footer-main">
          <div className="srd-footer-brand">
            <div className="srd-footer-logo-row">
              <img src={LOGO_SRC} alt="" />
              <div>
                <strong>SHS</strong>
                <span>Silicon Heartland Solutions</span>
              </div>
            </div>
            <p>
              Infrastructure for verified outcomes, partner coordination, and
              decision-ready reporting that communities can trust.
            </p>
          </div>

          <div className="srd-footer-col">
            <h4>Solutions</h4>
            <a href="#/home">Overview</a>
            <a href="#/audiences/nonprofits">For Nonprofits</a>
            <a href="#/audiences/funders">For Funders</a>
            <a href="#/audiences/government">For Government</a>
            <a href="#/audiences/workforce">For Workforce</a>
          </div>

          <div className="srd-footer-col">
            <h4>Platform</h4>
            <a href="#/infrastructure">Infrastructure</a>
            <a href="#/verified-outcomes">Verified Outcomes</a>
            <a href="#/reporting">Reporting & Audit</a>
            <a href="#/integrations">Integrations</a>
            <a href="#/security">Security & Trust</a>
          </div>

          <div className="srd-footer-col">
            <h4>Company</h4>
            <a href="#/about">About Us</a>
            <a href="#/resources">Resources</a>
            <a href="/career.html#/">Careers</a>
            <a href="#/news">News & Updates</a>
          </div>

          <div className="srd-footer-news">
            <h4>Stay Connected</h4>
            <p>Subscribe to get insights on verified outcomes, community impact, and data-driven decision making.</p>
            <div className="srd-news-input">
              <input type="email" placeholder="Work email" />
              <button type="button">→</button>
            </div>
            <div className="srd-socials">
              <span>in</span>
              <span>𝕏</span>
              <span>▶</span>
              <span>✉</span>
            </div>
          </div>
        </div>

        <div className="srd-footer-bottom">
          <span>© 2025 Silicon Heartland Solutions. All rights reserved.</span>
          <div>
            <a href="#/privacy">Privacy Policy</a>
            <a href="#/terms">Terms of Service</a>
            <a href="#/security">Security</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
