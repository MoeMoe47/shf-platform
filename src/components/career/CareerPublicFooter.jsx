import React from "react";
import { Link } from "react-router-dom";
import CareerHeartMark from "@/components/career/CareerHeartMark.jsx";

/* Only items with a `to` (internal route) or `href` (external/mailto) render
   as links. Everything else renders as plain, non-clickable text — the mock's
   column structure is preserved without inventing routes that don't exist. */
const FOOTER_COLUMNS = [
  {
    title: "Careers",
    items: [
      { label: "Explore Careers", to: "/explore" },
      { label: "Career Pathways", to: "/pathways" },
      { label: "Career Discovery", to: "/discovery" },
      { label: "In-Demand Careers" },
    ],
  },
  {
    title: "Pathways",
    items: [
      { label: "All Pathways", to: "/pathways" },
      { label: "Pathway Detail" },
      { label: "Education & Training" },
      { label: "Credentials" },
    ],
  },
  {
    title: "Opportunities",
    items: [
      { label: "Jobs", to: "/opportunities" },
      { label: "Internships" },
      { label: "Apprenticeships" },
      { label: "Employer Challenges" },
    ],
  },
  {
    title: "Resources",
    items: [
      { label: "Career Readiness" },
      { label: "Skills Center" },
      { label: "Projects & Experience" },
      { label: "Career Stories" },
    ],
  },
  {
    title: "For",
    items: [
      { label: "Employers", to: "/employers" },
      { label: "Educators" },
      { label: "Families" },
      { label: "Students" },
    ],
  },
  {
    title: "About",
    items: [
      { label: "Our Mission", href: "/foundation.html#/mission" },
      { label: "Our Region" },
      { label: "News & Updates" },
      { label: "Contact", href: "mailto:info@siliconheartland.org" },
    ],
  },
];

function FooterItem({ label, to, href }) {
  if (to) return <li><Link to={to}>{label}</Link></li>;
  if (href) return <li><a href={href}>{label}</a></li>;
  return <li><span>{label}</span></li>;
}

export default function CareerPublicFooter() {
  return (
    <footer className="career-public__footer">
      <div className="career-public__footerInner">
        <div className="career-public__footerBrand">
          <span className="career-public__mark"><CareerHeartMark size={30} solid /></span>
          <div>
            <strong>Silicon Heartland Foundation</strong>
            <p>Career Center<br />Explore direction. Build what comes next.</p>
          </div>
        </div>
        <nav className="career-public__footerCols" aria-label="Career Center footer navigation">
          {FOOTER_COLUMNS.map((col) => (
            <div className="career-public__footerCol" key={col.title}>
              <h4>{col.title}</h4>
              <ul>{col.items.map((item) => <FooterItem key={item.label} {...item} />)}</ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="career-public__footerLegal">
        <span>© {new Date().getFullYear()} Silicon Heartland Foundation · Public Career Center</span>
        <span className="career-public__footerLegalLinks"><span>Privacy</span><span>Terms</span><span>Accessibility</span></span>
      </div>
    </footer>
  );
}
