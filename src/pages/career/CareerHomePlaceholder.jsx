import React from "react";
import { Link } from "react-router-dom";
import useCanonicalCareers from "@/hooks/useCanonicalCareers.js";
import { CareerCard, CareerPublicCTA, CareerPublicHero, CareerSectionHeader } from "@/components/career/CareerPublicPrimitives.jsx";

export default function CareerHomePlaceholder() {
  const { data: careers = [], loading, error } = useCanonicalCareers();

  return (
    <main className="career-home" aria-labelledby="career-home-title">
      <CareerPublicHero
        eyebrow="Silicon Heartland Foundation"
        title="Find a direction. Build what comes next."
        titleId="career-home-title"
        description="Explore careers, pathways, and learning connections grounded in the Foundation&apos;s career records."
        primary={<Link className="career-public__button career-public__button--primary" to="/explore">Explore Careers <span aria-hidden="true">→</span></Link>}
        secondary={<Link className="career-public__button career-public__button--secondary" to="/pathways">Browse Pathways</Link>}
        aside={<div className="career-homeHero__signal" aria-label="Career catalog status">
          <span className="career-homeHero__signalLabel">Career catalog</span>
          <strong>{loading ? "Loading" : error ? "Unavailable" : `${careers.length} records`}</strong>
          <span className="subtle">Canonical Career API</span>
        </div>}
      />

      <section className="career-public__section" aria-labelledby="career-home-start-title">
        <CareerSectionHeader eyebrow="Start here" title="A clear place to begin" titleId="career-home-start-title" description="Public reference surfaces are separate from personal planning." />
        <div className="career-public__grid">
          <CareerCard title="Explore Careers" description="Browse career families and open the records that interest you." href="#/explore" action="Open Explore Careers" />
          <CareerCard title="Career Pathways" description="See how careers connect to pathway and curriculum references." href="#/pathways" action="Browse Pathways" />
          <CareerCard title="Career Discovery" description="Use a few low-risk selections to find careers worth exploring next." href="#/discovery" action="Start Discovery" />
          <CareerCard title="My Career Center" description="Return to your personal plan, resume, portfolio, calendar, and learning." href="#/dashboard" action="Open My Career Center" />
          <CareerCard title="Opportunities" description="Browse currently published opportunities from participating organizations." href="#/opportunities" action="View Opportunities" />
          <CareerCard title="Organizations" description="Meet organizations represented by public Career Center opportunities." href="#/employers" action="Browse Organizations" />
        </div>
      </section>

      <CareerPublicCTA title="Explore now. Carry it into your plan when you&apos;re ready." description="Career exploration is a public starting point. Personal planning, resume work, portfolio artifacts, credentials, and calendar activity stay in your authenticated Career Center.">
        <Link className="career-public__button career-public__button--primary" to="/dashboard">Continue to My Career Center <span aria-hidden="true">→</span></Link>
      </CareerPublicCTA>
    </main>
  );
}
