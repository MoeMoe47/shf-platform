import React from "react";
import CatalogCard from "./CatalogCard.jsx";
import partners from "@/data/partners.json";

const internal = [
  { id:"ai-intro", title:"Intro to AI", providerType:"internal", providerName:"Billy Gateson", duration:"2 hours" },
  { id:"cloud-basics", title:"Cloud Computing Basics", providerType:"internal", providerName:"Billy Gateson", duration:"2 hours" },
];

export default function CatalogGrid({ onProof }) {
  const courses = [...internal, ...partners];
  return (
    <section className="cat-grid" aria-label="Catalog items">
      {courses.map(c => (
        <CatalogCard key={c.id || c.courseId} course={c} onProof={onProof} />
      ))}
    </section>
  );
}
