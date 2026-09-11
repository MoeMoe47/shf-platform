import React from "react";

export function CareerPublicHero({ eyebrow, title, description, primary, secondary, image, phrase, children, aside, titleId = "career-public-hero-title", className = "" }) {
  return <section className={`career-public__hero ${className}`.trim()} aria-labelledby={titleId}><div className="career-public__heroCopy"><p className="career-public__eyebrow">{eyebrow}</p><h1 id={titleId}>{title}</h1>{description ? <p>{description}</p> : null}{children}{primary || secondary ? <div className="career-public__heroActions">{primary}{secondary}</div> : null}</div>{aside ? <div className="career-public__heroAside">{aside}</div> : image ? <div className="career-public__heroMedia"><img src={image.src} alt={image.alt || ""} />{phrase ? <p className="career-public__heroPhrase">{phrase}</p> : null}</div> : null}</section>;
}

export function CareerSectionHeader({ eyebrow, title, description, action, titleId }) {
  return <div className="career-public__sectionHeader"><div>{eyebrow ? <p className="career-public__eyebrow">{eyebrow}</p> : null}<h2 id={titleId}>{title}</h2>{description ? <p>{description}</p> : null}</div>{action}</div>;
}

export function CareerSearchBar({ label = "Search", placeholder = "Search careers", onSubmit, value, onChange }) {
  return <form className="career-public__search" role="search" onSubmit={onSubmit}><label htmlFor="career-public-search"><span className="career-public__srOnly">{label}</span><span aria-hidden="true">⌕</span></label><input id="career-public-search" value={value} onChange={onChange} placeholder={placeholder} /><button className="career-public__searchSubmit" type="submit">Search</button></form>;
}

export function CareerFilterBar({ children, resultLabel }) {
  return <div className="career-public__filter" aria-label="Filter results">{children}{resultLabel ? <span className="career-public__filterResults" role="status">{resultLabel}</span> : null}</div>;
}

export function CareerPublicCTA({ title, description, children }) {
  return <section className="career-public__cta" aria-labelledby="career-public-cta-title"><div><h2 id="career-public-cta-title">{title}</h2>{description ? <p>{description}</p> : null}</div><div className="career-public__ctaActions">{children}</div></section>;
}

export function CareerCard({ eyebrow, title, description, href, action = "Explore" }) {
  return <article className="career-public__card">{eyebrow ? <p className="career-public__cardMeta">{eyebrow}</p> : null}<h3>{title}</h3>{description ? <p>{description}</p> : null}{href ? <a className="career-public__button career-public__button--secondary" href={href}>{action} <span aria-hidden="true">→</span></a> : null}</article>;
}

export const PathwayCard = CareerCard;
export const OpportunityCard = CareerCard;
export const EmployerCard = CareerCard;
export const SkillCard = CareerCard;
export const LearningCard = CareerCard;
export const ResourceCard = CareerCard;
export const AudienceCard = CareerCard;
export const InfoCard = CareerCard;
