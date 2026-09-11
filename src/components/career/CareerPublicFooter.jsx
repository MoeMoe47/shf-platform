import React from "react";
import { Link } from "react-router-dom";
import CareerHeartMark from "@/components/career/CareerHeartMark.jsx";

export default function CareerPublicFooter() {
  return <footer className="career-public__footer"><div className="career-public__footerInner"><div className="career-public__footerBrand"><span className="career-public__mark"><CareerHeartMark size={34} /></span><div><strong>Silicon Heartland Foundation</strong><p>Career Center<br />Explore direction. Build what comes next.</p></div></div><nav aria-label="Career Center links"><strong>Careers</strong><Link to="/explore">Explore Careers</Link><Link to="/pathways">Pathways</Link><Link to="/discovery">Career Discovery</Link></nav><nav aria-label="Opportunity links"><strong>Opportunity</strong><Link to="/opportunities">Opportunities</Link><Link to="/employers">Organizations</Link></nav><nav aria-label="Personal and Foundation links"><strong>Continue</strong><Link to="/dashboard">My Career Center</Link><a href="/foundation.html#/top">Foundation</a><a href="mailto:info@siliconheartland.org">Contact SHF</a></nav></div><div className="career-public__footerLegal">© {new Date().getFullYear()} Silicon Heartland Foundation · Public Career Center</div></footer>;
}
