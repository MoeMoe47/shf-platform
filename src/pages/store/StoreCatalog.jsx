// src/pages/store/StoreCatalog.jsx
// Route: /store.html#/catalog (via StoreRoutes.jsx → StoreCatalogShell)
//
// Full rebuild replacing the previous parallax-hero "continue your
// course" page (fake inline COURSES array, "Billy Gateson" instructor,
// progress bars) with the approved institutional Catalog: filter row →
// Featured Programs & Solutions card grid → trust strip. Card data comes
// from src/data/catalogOfferings.js (a single real data module, not
// hardcoded JSX) — see that file's header comment for the honest
// "this is seed data, not verified production records" note.
//
// No "Visit the Library" utility link: no real Library resource-browsing
// page exists anywhere in this repo (checked before writing this file —
// the only `library` hits are an unrelated imported-lessons localStorage
// provider and a two-link dev stub, neither matching "browse free
// guides/templates/reports"). Per the task's own instruction to document
// a gap instead of faking a destination, this connection is omitted
// rather than pointed at something that wouldn't deliver what it
// promises.
import React from "react";
import StoreHeader from "@/components/store/StoreHeader.jsx";
import StoreCatalogCard from "@/components/store/StoreCatalogCard.jsx";
import StoreInfoDialog from "@/components/store/StoreInfoDialog.jsx";
import {
  catalogOfferings,
  OFFERING_TYPES,
  ACCESS_TYPES,
  AUDIENCES,
  ECOSYSTEMS,
  SORTS,
} from "@/data/catalogOfferings.js";

function ownerToEcosystem(owner) {
  if (owner === "Silicon Heartland Foundation") return "shf";
  if (owner === "Silicon Heartland Solutions") return "shs";
  return "other";
}

const TRUST_ITEMS = [
  {
    icon: "🛡️",
    title: "Trusted & Verified",
    desc: "Offerings are reviewed for quality, impact, and alignment with SHF standards.",
  },
  {
    icon: "🤝",
    title: "Built for Impact",
    desc: "Programs and solutions are designed to strengthen communities and create opportunity.",
  },
  {
    icon: "♿",
    title: "Accessible for All",
    desc: "Accessibility, inclusion, and equity are considered throughout the experience.",
  },
  {
    icon: "❤️",
    title: "Powering the Heartland",
    desc: "Investing in people. Strengthening communities. Building our future.",
  },
];

export default function StoreCatalog({ mobileNavOpen, onToggleMobileMenu, mobileMenuBtnRef }) {
  const [query, setQuery] = React.useState("");
  const [ecosystem, setEcosystem] = React.useState("all");
  const [offeringType, setOfferingType] = React.useState("all");
  const [audience, setAudience] = React.useState("all");
  const [access, setAccess] = React.useState("all");
  const [sort, setSort] = React.useState("featured");
  const [previewOffering, setPreviewOffering] = React.useState(null);
  const previewTriggerRef = React.useRef(null);

  const filtered = React.useMemo(() => {
    let list = catalogOfferings.filter((o) => {
      if (ecosystem !== "all" && ownerToEcosystem(o.owner) !== ecosystem) return false;
      if (offeringType !== "all" && o.offeringType !== offeringType) return false;
      if (audience !== "all" && !o.audience.includes(audience)) return false;
      if (access !== "all" && o.access !== access) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const haystack = [o.title, o.description, o.offeringType, o.owner, ...o.audience]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sort === "name") return a.title.localeCompare(b.title);
      if (sort === "access") return a.access.localeCompare(b.access);
      if (sort === "newest") return new Date(b.addedAt) - new Date(a.addedAt);
      // "featured": featured items first, then newest within each group
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return new Date(b.addedAt) - new Date(a.addedAt);
    });
    return list;
  }, [ecosystem, offeringType, audience, access, query, sort]);

  // No filter/search active: the "Featured Programs & Solutions" row
  // shows only the curated featured set (currently 4 — see
  // catalogOfferings.js). The moment a real filter or search narrows the
  // list, every match is shown regardless of the featured flag, so
  // nothing becomes unreachable — "View all" (resetFilters) returns to
  // the curated view.
  const isDefaultView =
    ecosystem === "all" && offeringType === "all" && audience === "all" && access === "all" && !query.trim();
  const displayList = isDefaultView ? filtered.filter((o) => o.featured) : filtered;

  function resetFilters() {
    setEcosystem("all");
    setOfferingType("all");
    setAudience("all");
    setAccess("all");
    setQuery("");
  }

  function openPreview(offering) {
    previewTriggerRef.current = document.activeElement;
    setPreviewOffering(offering);
  }

  return (
    <>
      <StoreHeader
        mobileNavOpen={mobileNavOpen}
        onToggleMobileMenu={onToggleMobileMenu}
        mobileMenuBtnRef={mobileMenuBtnRef}
        query={query}
        onSearchChange={setQuery}
      />

      <div className="cs-page">
        <form
          className="cs-filters"
          role="search"
          aria-label="Catalog filters"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="cs-filterField">
            <label htmlFor="cs-filter-ecosystem">Ecosystem</label>
            <select id="cs-filter-ecosystem" value={ecosystem} onChange={(e) => setEcosystem(e.target.value)}>
              {ECOSYSTEMS.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="cs-filterField">
            <label htmlFor="cs-filter-type">Offering Type</label>
            <select id="cs-filter-type" value={offeringType} onChange={(e) => setOfferingType(e.target.value)}>
              {OFFERING_TYPES.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="cs-filterField">
            <label htmlFor="cs-filter-audience">Audience</label>
            <select id="cs-filter-audience" value={audience} onChange={(e) => setAudience(e.target.value)}>
              {AUDIENCES.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="cs-filterField">
            <label htmlFor="cs-filter-access">Access</label>
            <select id="cs-filter-access" value={access} onChange={(e) => setAccess(e.target.value)}>
              {ACCESS_TYPES.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="cs-filterField">
            <label htmlFor="cs-filter-sort">Sort By</label>
            <select id="cs-filter-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
              {SORTS.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
        </form>

        <section aria-labelledby="cs-featured-title">
          <div className="cs-sectionHead">
            <div>
              <h2 id="cs-featured-title" className="cs-sectionTitle">Featured Programs &amp; Solutions</h2>
              <p className="cs-sectionSub">
                Explore handpicked offerings designed to empower learners, organizations, and communities.
              </p>
            </div>
            <button type="button" className="cs-viewAll" onClick={resetFilters}>
              View all →
            </button>
          </div>

          <p className="cs-srOnly" role="status" aria-live="polite">
            {displayList.length} offering{displayList.length === 1 ? "" : "s"} shown.
          </p>

          {displayList.length === 0 ? (
            <p className="cs-sectionSub">No offerings match the current filters. Try clearing a filter above.</p>
          ) : (
            <div className="cs-cardGrid">
              {displayList.map((offering) => (
                <StoreCatalogCard key={offering.id} offering={offering} onOpenPreview={openPreview} />
              ))}
            </div>
          )}
        </section>

        <div className="cs-trustStrip">
          {TRUST_ITEMS.map((item) => (
            <div key={item.title} className="cs-trustItem">
              <span className="cs-trustIcon" aria-hidden="true">{item.icon}</span>
              <div>
                <h3 className="cs-trustTitle">{item.title}</h3>
                <p className="cs-trustDesc">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <StoreInfoDialog
        open={!!previewOffering}
        onClose={() => setPreviewOffering(null)}
        titleId="cs-preview-title"
        title={previewOffering?.title || ""}
        returnFocusRef={previewTriggerRef}
      >
        <p>
          {previewOffering?.description} This is a seed catalog entry — no live detail page exists for it
          yet. Real offerings will link to a real program page once one is built.
        </p>
      </StoreInfoDialog>
    </>
  );
}
