import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import CareerHeartMark from "@/components/career/CareerHeartMark.jsx";

/* Visible primary labels match the approved public header mock (Skills,
   Resources) while keeping their underlying routes unchanged — Career
   Discovery and the Organizations/Employers directory are not deleted,
   just presented under mock-matching labels here. */
const NAV = [
  ["Explore Careers", "/explore", (path) => path === "/explore" || path.startsWith("/careers/")],
  ["Pathways", "/pathways", (path) => path === "/pathways" || path.startsWith("/pathways/")],
  ["Opportunities", "/opportunities", (path) => path === "/opportunities" || path.startsWith("/opportunities/")],
  ["Skills", "/discovery", (path) => path === "/discovery"],
  ["Resources", "/employers", (path) => path === "/employers" || path.startsWith("/employers/")],
];

export default function CareerPublicHeader() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return <header className="career-public__header">
    <Link className="career-public__brand" to="/" onClick={close} aria-label="Silicon Heartland Foundation Career Center home"><span className="career-public__mark"><CareerHeartMark size={22} solid /></span><span className="career-public__brandText"><strong>Silicon Heartland Foundation</strong><span>Career Center</span></span></Link>
    <nav className={`career-public__nav${open ? " is-open" : ""}`} aria-label="Career Center public navigation">{NAV.map(([label, to, active]) => <Link key={to} to={to} onClick={close} aria-current={active(location.pathname) ? "page" : undefined}>{label}</Link>)}</nav>
    <div className="career-public__actions"><Link className="career-public__searchLink" to="/explore" onClick={close} aria-label="Search careers"><span aria-hidden="true">⌕</span><span className="career-public__srOnly">Search</span></Link><Link className="career-public__button career-public__button--primary" to="/dashboard" onClick={close}>My Career Center <span aria-hidden="true">→</span></Link><button className="career-public__menu" type="button" aria-label={open ? "Close public navigation menu" : "Open public navigation menu"} aria-expanded={open} onClick={() => setOpen((value) => !value)}>Menu</button></div>
  </header>;
}
