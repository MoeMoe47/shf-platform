// src/pages/PathwaysExplore.jsx
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { track } from "../utils/analytics.js";
import useCanonicalCareers from "../hooks/useCanonicalCareers.js";
import { CareerPublicHero, CareerSectionHeader } from "../components/career/CareerPublicPrimitives.jsx";

const PathwayDetailDrawer = React.lazy(() => import("../components/PathwayDetailDrawer.jsx"));
const preloadDrawer = () => import("../components/PathwayDetailDrawer.jsx");

/* ---------- shared helpers ---------- */
function groupByCluster(pathways = []) {
  const m = new Map();
  for (const p of pathways) {
    const k = p?.cluster || "Other";
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(p);
  }
  return Array.from(m.entries()).map(([cluster, items]) => ({ cluster, items }));
}

/* ---------- Pathways page: photography ----------
   Cropped directly from the approved Career Pathways mock (see
   /Users/mikeslate/Downloads/ChatGPT Image Sep 12, 2026, 06_23_58 PM.png)
   and stored under public/assets/career/pathways/ so this page uses the
   same imagery as the locked mock rather than a substitute. */
const ASSET = "/assets/career/pathways";

const FAMILY_CARDS = [
  { name: "Technology & IT", description: "Build, connect, and secure the digital world.", img: `${ASSET}/family-technology.jpg`, match: /tech|\bit\b|software|data|comput|digital/i },
  { name: "Healthcare", description: "Care for people and strengthen communities.", img: `${ASSET}/family-healthcare.jpg`, match: /health|medical|nurs|care|clinical/i },
  { name: "Clean Energy", description: "Power a cleaner, more sustainable tomorrow.", img: `${ASSET}/family-clean-energy.jpg`, match: /energy|power|electr|solar|utilit|renewable/i },
  { name: "Advanced Manufacturing", description: "Design, make, and move the world forward.", img: `${ASSET}/family-manufacturing.jpg`, match: /manufactur|industrial|production|mechanic/i },
  { name: "Education", description: "Inspire learning and create opportunity.", img: `${ASSET}/family-education.jpg`, match: /educat|teach|school|learn|child/i },
  { name: "Infrastructure", description: "Build the systems that keep our communities strong.", img: `${ASSET}/family-infrastructure.jpg`, match: /infrastructur|construct|civil|transport|logistic|road|bridge/i },
];

const GRID_VISUALS = [
  { test: /tech|\bit\b|software|data\b|comput|digital/i, img: `${ASSET}/grid-software-development.jpg` },
  { test: /energy|power|electr|solar|utilit|renewable/i, img: `${ASSET}/grid-renewable-energy.jpg` },
  { test: /health|medical|nurs|care|clinical/i, img: `${ASSET}/grid-nursing.jpg` },
  { test: /manufactur|industrial|production|mechanic/i, img: `${ASSET}/grid-advanced-manufacturing.jpg` },
  { test: /educat|teach|school|learn|child/i, img: `${ASSET}/grid-early-childhood.jpg` },
  { test: /infrastructur|construct|civil|transport|logistic|road|bridge/i, img: `${ASSET}/grid-civil-engineering.jpg` },
];
const GRID_FALLBACKS = [`${ASSET}/grid-skilled-trades.jpg`, `${ASSET}/grid-data-analytics.jpg`, `${ASSET}/grid-software-development.jpg`];
function pathwayImage(clusterName, index = 0) {
  const found = GRID_VISUALS.find((v) => v.test.test(clusterName || ""));
  return found ? found.img : GRID_FALLBACKS[index % GRID_FALLBACKS.length];
}

/* Small stroke-icon vocabulary for the About cards and the Explore/Learn/
   Launch journey steps (not used for family/pathway photography anymore). */
function PwIcon({ name }) {
  const p = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" };
  switch (name) {
    case "trend":
      return <svg {...p}><path d="m3 17 6-6 4 4 8-8" /><path d="M15 6h6v6" /></svg>;
    case "link":
      return <svg {...p}><rect x="3" y="8" width="9" height="9" rx="3" /><rect x="12" y="7" width="9" height="9" rx="3" /></svg>;
    case "doors":
      return <svg {...p}><rect x="3" y="4" width="6" height="16" rx="1" /><rect x="15" y="4" width="6" height="16" rx="1" /><path d="M9 12h6" /></svg>;
    case "badge":
      return <svg {...p}><circle cx="12" cy="10" r="7" /><path d="m9 10 2 2 4-4" /><path d="M8.5 16.5 7 21l5-2 5 2-1.5-4.5" /></svg>;
    case "book":
      return <svg {...p}><path d="M4 5c3 0 6 1 8 3 2-2 5-3 8-3v14c-3 0-6 1-8 3-2-2-5-3-8-3Z" /><path d="M12 8v14" /></svg>;
    case "rocket":
      return <svg {...p}><path d="M12 2c3 2 5 6 5 10 0 2-1 4-2 5l-3 3-3-3c-1-1-2-3-2-5 0-4 2-8 5-10Z" /><circle cx="12" cy="10" r="1.6" /><path d="M9 17l-2 4M15 17l2 4" /></svg>;
    case "search":
    default:
      return <svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4-4" /></svg>;
  }
}

const POPULAR_SEARCHES = ["Technology", "Healthcare", "Clean Energy", "Manufacturing", "Education"];

function PwHero({ searchTerm, onSearchChange, onSearchSubmit, onChipClick }) {
  return (
    <section className="pwHero" aria-labelledby="career-pathways-title">
      <div className="pwHero__inner pwHero__grid">
        <div className="pwHero__copy">
          <p className="career-public__eyebrow">Real pathways. Brighter tomorrows.</p>
          <h1 id="career-pathways-title">Career Pathways</h1>
          <p className="pwHero__lede">A pathway connects related careers, the skills that carry between them, and the learning and opportunities that move you forward. Start with a family that interests you, or search for something specific.</p>
          <form className="pwHero__search" role="search" onSubmit={onSearchSubmit}>
            <label htmlFor="pw-search"><span className="career-public__srOnly">Search pathways, careers, or keywords</span><span className="pwHero__searchIcon" aria-hidden="true">⌕</span></label>
            <input id="pw-search" type="search" value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} placeholder="Search pathways, careers, or keywords..." />
            <button type="submit" className="pwHero__searchSubmit" aria-label="Search pathways"><span aria-hidden="true">→</span></button>
          </form>
          <div className="pwHero__chips" role="group" aria-label="Popular searches">
            <span className="pwHero__chipsLabel">Popular:</span>
            {POPULAR_SEARCHES.map((term) => (
              <button type="button" key={term} className="pwHero__chip" onClick={() => onChipClick(term)}>{term}</button>
            ))}
          </div>
        </div>
        <div className="pwHero__media">
          <img src={`${ASSET}/hero.jpg`} alt="A young woman with a backpack smiling in front of a city skyline. Handwritten text reads: Different paths, a brighter tomorrow. A Heartland-region state outline reads: A stronger Heartland for what's next." />
        </div>
      </div>
    </section>
  );
}

/* ---------- /explore: existing cluster browser (unchanged) ---------- */
function PathwayRow({ pathway, onOpen }) {
  return (
    <div className="pathRow" role="group" aria-label={pathway?.title || "Pathway"}>
      <div>
        <div style={{ fontWeight: 600 }}>{pathway.title}</div>
        {pathway?.canonicalCareer ? <div className="subtle">Career family record</div> : null}
      </div>
      <div>
        <div className="sh-actionsRow">
          <Link className="sh-btn sh-btn--primary" to={`/pathways/${encodeURIComponent(pathway.slug)}`}>View pathway</Link>
          <Link className="sh-btn sh-btn--secondary" to={`/careers/${encodeURIComponent(pathway.slug)}`}>View career</Link>
          <button className="sh-btn sh-btn--secondary" onMouseEnter={preloadDrawer} onFocus={preloadDrawer}
                  onClick={onOpen} aria-label={`Preview ${pathway.title}`}>Preview</button>
        </div>
      </div>
    </div>
  );
}

function ClusterDrawer({ open, title, onClose, children }) {
  React.useEffect(() => {
    if (!open) return;
    const opener = document.activeElement;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      opener?.focus?.();
    };
  }, [open, onClose]);

  const closeBtnRef = React.useRef(null);
  React.useEffect(() => {
    if (open) {
      const t = setTimeout(() => closeBtnRef.current?.focus?.({ preventScroll: true }), 0);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!open) return null;
  return (
    <>
      <div className={`app-scrim ${open ? "is-visible" : ""}`} onClick={onClose} aria-hidden="true" />
      <aside id="cluster-browser" className="clusterDrawer" role="dialog" aria-modal="true"
             aria-label={title || "Cluster"} onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
        <header className="sh-row" style={{ alignItems: "center", justifyContent: "space-between", gap: 8, padding: 12, borderBottom: "1px solid var(--ring)" }}>
          <strong style={{ color: "var(--ink)" }}>{title}</strong>
          <button type="button" ref={closeBtnRef} className="sh-btn sh-btn--secondary" onClick={onClose}
                  aria-label="Close cluster browser">✕ Close</button>
        </header>
        <div style={{ padding: 12, overflow: "auto" }}>{children}</div>
      </aside>
      <style>{`.clusterDrawer{position:fixed;inset:0 0 0 auto;width:min(92vw,520px);background:var(--card,#fff);border-left:1px solid var(--ring,#e5e7eb);box-shadow:0 10px 30px rgba(0,0,0,.18);z-index:60;display:flex;flex-direction:column;}`}</style>
    </>
  );
}

export default function PathwaysExplore() {
  useEffect(() => { try { track("pathways_explore_viewed", {}, { silent: true }); } catch {} }, []);
  const location = useLocation();
  const isPathways = location.pathname === "/pathways";
  const { data: pathways = [], loading, error, loadCareer } = useCanonicalCareers();

  /* ---- state shared by the /pathways rich composition ---- */
  const [searchTerm, setSearchTerm] = useState("");
  const [familyFilter, setFamilyFilter] = useState("all");
  const gridRef = useRef(null);

  const families = useMemo(() => groupByCluster(pathways).map(({ cluster, items }) => ({ name: cluster, items })), [pathways]);
  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return pathways.filter((p) => {
      if (familyFilter !== "all" && (p.cluster || "Other") !== familyFilter) return false;
      if (!term) return true;
      return [p.title, p.description, p.cluster].some((v) => String(v || "").toLowerCase().includes(term));
    });
  }, [pathways, familyFilter, searchTerm]);

  const scrollToGrid = () => {
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    gridRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };
  const handleHeroSearchSubmit = (e) => { e.preventDefault(); scrollToGrid(); };
  const handleChipClick = (term) => { setSearchTerm(term); scrollToGrid(); };
  const handleFamilyExplore = (card) => {
    const canonicalMatch = families.find((f) => card.match.test(f.name || ""));
    if (canonicalMatch) {
      setFamilyFilter(canonicalMatch.name);
      setSearchTerm("");
    } else {
      setFamilyFilter("all");
      setSearchTerm(card.name);
    }
    scrollToGrid();
  };
  const handleClearFilters = () => { setSearchTerm(""); setFamilyFilter("all"); };

  /* ---- /explore-only state (declared unconditionally: this component
     instance stays mounted on one route for its whole lifetime, but hooks
     must still be called in the same order every render) ---- */
  const [activeCluster, setActiveCluster] = useState(null);
  const [activePathway, setActivePathway] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const exploreClusters = useMemo(() => groupByCluster(pathways), [pathways]);
  const activeClusterItems = useMemo(
    () => exploreClusters.find((c) => c.cluster === activeCluster)?.items ?? [],
    [exploreClusters, activeCluster]
  );
  const handleViewPathwayCard = async (p) => {
    preloadDrawer();
    try {
      setActivePathway((await loadCareer(p.slug)) || p);
    } catch {
      setActivePathway(p);
    }
    setDrawerOpen(true);
    try { track("pathway_drawer_opened", { pathwayId: p?.id, from: "explore_card" }); } catch {}
  };

  /* ---- /pathways: rich, mock-fidelity composition ---- */
  if (isPathways) {
    return (
      <main className="pwPage" aria-labelledby="career-pathways-title">
        <PwHero searchTerm={searchTerm} onSearchChange={setSearchTerm} onSearchSubmit={handleHeroSearchSubmit} onChipClick={handleChipClick} />

        <div className="pwPage__inner">
          <section className="pwSection" aria-labelledby="pw-families-title">
            <CareerSectionHeader
              eyebrow="Career families"
              title="Featured Pathway Families"
              titleId="pw-families-title"
              description="Explore the core pathway families connecting careers, skills, and opportunity across the region."
              action={<a href="#pw-all-pathways">View All Pathways <span aria-hidden="true">→</span></a>}
            />
            <div className="pwFamGrid" role="list">
              {FAMILY_CARDS.map((card) => (
                <article className="pwFamCard" role="listitem" key={card.name}>
                  <div className="pwFamCard__media"><img src={card.img} alt="" /></div>
                  <div className="pwFamCard__body">
                    <h3>{card.name}</h3>
                    <p>{card.description}</p>
                    <button type="button" className="pwFamCard__link" onClick={() => handleFamilyExplore(card)}>
                      Explore Pathways <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="pwSection" id="pw-all-pathways" aria-labelledby="pw-grid-title">
            <CareerSectionHeader eyebrow="Full catalog" title="All Career Pathways" titleId="pw-grid-title" description="Browse every canonical Career record, or narrow the list with the filters below." />

            <div className="pwFilterBar" role="search" aria-label="Filter career pathways">
              <div className="pwFilterField">
                <label htmlFor="pw-filter-family">Pathway Family</label>
                <select id="pw-filter-family" value={familyFilter} onChange={(e) => setFamilyFilter(e.target.value)}>
                  <option value="all">All pathway families</option>
                  {families.map(({ name }) => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
              <div className="pwFilterField">
                <label htmlFor="pw-filter-education">Education Level</label>
                <select id="pw-filter-education" disabled title="Additional filters are coming soon"><option>All (coming soon)</option></select>
              </div>
              <div className="pwFilterField">
                <label htmlFor="pw-filter-cluster">Career Cluster</label>
                <select id="pw-filter-cluster" disabled title="Additional filters are coming soon"><option>All (coming soon)</option></select>
              </div>
              <div className="pwFilterField">
                <label htmlFor="pw-filter-workstyle">Work Style</label>
                <select id="pw-filter-workstyle" disabled title="Additional filters are coming soon"><option>All (coming soon)</option></select>
              </div>
              <div className="pwFilterField">
                <label htmlFor="pw-filter-interest">Interest Area</label>
                <select id="pw-filter-interest" disabled title="Additional filters are coming soon"><option>All (coming soon)</option></select>
              </div>
              <div className="pwFilterBar__submit">
                <button type="button" className="career-public__button career-public__button--primary" onClick={scrollToGrid}>Show Pathways</button>
              </div>
              <p className="pwFilterNote">Pathway Family filtering uses live Career Center records. Additional filters are coming soon.</p>
            </div>

            <p className="pwFilterResults" role="status">
              {loading ? "Loading pathways…" : error ? "" : `${filtered.length} ${filtered.length === 1 ? "pathway" : "pathways"} shown`}
            </p>

            {!loading && error && (
              <div className="pwGridUnavailable" ref={gridRef} role="alert">
                {Array.from({ length: 8 }).map((_, i) => <div className="pwGridUnavailable__tile" key={i} aria-hidden="true" />)}
                <div className="pwGridUnavailable__message">
                  <strong>Career pathway information is temporarily unavailable.</strong>
                  <span>The canonical Career API could not be reached. Please check back soon — this section will repopulate automatically once it is.</span>
                </div>
              </div>
            )}

            {(loading || !error) && (
              <div className="pwGrid" ref={gridRef}>
                {loading && Array.from({ length: 8 }).map((_, i) => <div className="pwSkeleton" key={i} aria-hidden="true" />)}
                {!loading && !error && !pathways.length && (
                  <div className="pwUnavailable" role="status"><strong>No active career pathways are published yet.</strong></div>
                )}
                {!loading && !error && pathways.length > 0 && !filtered.length && (
                  <div className="pwUnavailable" role="status">
                    <strong>No pathways match your filters.</strong>
                    <button type="button" className="pwFamCard__link" onClick={handleClearFilters}>Clear filters</button>
                  </div>
                )}
                {!loading && !error && filtered.map((pathway, i) => (
                    <article className="pwCard" key={pathway.id}>
                      <div className="pwCard__media"><img src={pathwayImage(pathway.cluster, i)} alt="" /></div>
                      <div className="pwCard__body">
                        <p className="pwCard__meta">{pathway.cluster}</p>
                        <h3>{pathway.title}</h3>
                        <p>{pathway.description || "Canonical Career Center record."}</p>
                        <div className="pwCard__footer">
                          <Link className="pwCard__link" to={`/pathways/${encodeURIComponent(pathway.slug)}`}>View pathway <span aria-hidden="true">→</span></Link>
                          <span className="pwCard__arrow" aria-hidden="true">→</span>
                        </div>
                      </div>
                    </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="pwSection pwSection--tint" aria-labelledby="pw-about-title">
          <div className="pwPage__inner">
            <CareerSectionHeader eyebrow="How pathways work" title="About Our Pathway Categories" titleId="pw-about-title" description="A pathway groups related careers, skills, and learning so one starting point can lead to several real directions." />
            <div className="pwAboutGrid">
              <div className="pwAboutCard"><span className="pwAboutCard__icon"><PwIcon name="trend" /></span><h3>In-Demand Careers</h3><p>Pathways are built around careers connected to real Career Center records.</p></div>
              <div className="pwAboutCard"><span className="pwAboutCard__icon"><PwIcon name="link" /></span><h3>Transferable Skills</h3><p>Skills built in one career often carry directly into related careers on the same pathway.</p></div>
              <div className="pwAboutCard"><span className="pwAboutCard__icon"><PwIcon name="doors" /></span><h3>Multiple Entry Points</h3><p>Every pathway supports more than one way in, whether you are starting fresh or building on experience.</p></div>
              <div className="pwAboutCard"><span className="pwAboutCard__icon"><PwIcon name="badge" /></span><h3>Real Opportunities</h3><p>Pathways connect exploration to published opportunities and learning inside the Career Center.</p></div>
            </div>
          </div>
        </section>

        <section className="pwJourney" aria-labelledby="pw-journey-title">
          <div className="pwPage__inner pwJourney__grid">
            <div className="pwJourney__media">
              <img src={`${ASSET}/journey.jpg`} alt="A young man smiling in front of a city skyline. Handwritten text reads: Tools today, brighter tomorrows." />
            </div>
            <div>
              <CareerSectionHeader eyebrow="Your next step" title="A Pathway for Every Goal" titleId="pw-journey-title" description="Every pathway follows the same simple shape, from first look to next step." />
              <div className="pwSteps">
                <div className="pwStep">
                  <span className="pwStep__badge pwStep__badge--explore"><PwIcon name="search" /></span>
                  <h3>Explore</h3>
                  <p>Discover career options connected to a pathway that interests you.</p>
                  <span className="pwStep__arrow" aria-hidden="true">→</span>
                </div>
                <div className="pwStep">
                  <span className="pwStep__badge pwStep__badge--learn"><PwIcon name="book" /></span>
                  <h3>Learn</h3>
                  <p>Build skills and gain experience through connected resources.</p>
                  <span className="pwStep__arrow" aria-hidden="true">→</span>
                </div>
                <div className="pwStep">
                  <span className="pwStep__badge pwStep__badge--launch"><PwIcon name="rocket" /></span>
                  <h3>Launch</h3>
                  <p>Connect to opportunities and take the next real step.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pwCtaBanner" aria-labelledby="pw-cta-title">
          <div className="pwCtaBanner__row">
            <img className="pwCtaBanner__photo pwCtaBanner__photo--left" src={`${ASSET}/cta-people.jpg`} alt="Three young people with backpacks walking together at sunset in front of a city skyline" />
            <div className="pwCtaBanner__textZone">
              <h2 id="pw-cta-title">Your future is closer than you think.</h2>
              <p>Explore pathways. Build skills. Create opportunity.</p>
              <div className="pwCtaBanner__actions">
                <a className="career-public__button career-public__button--primary" href="#pw-all-pathways">Explore Pathways <span aria-hidden="true">→</span></a>
                <Link className="career-public__button career-public__button--secondary pwCtaBanner__outlineBtn" to="/dashboard">My Career Center</Link>
              </div>
            </div>
            <img className="pwCtaBanner__photo pwCtaBanner__photo--right" src={`${ASSET}/cta-skyline.jpg`} alt="City skyline at golden hour. Handwritten text reads: Same region, brighter tomorrows." />
          </div>
        </section>
      </main>
    );
  }

  /* ---- /explore: existing cluster browser (unchanged) ---- */
  return (
    <main className="career-explore" aria-labelledby="career-explore-title">
      <CareerPublicHero
        eyebrow="Explore careers"
        title="Explore careers with a clear next step."
        titleId="career-explore-title"
        description="Browse canonical Career records by family, then open a public detail page when a direction interests you."
      />
      <CareerSectionHeader eyebrow="Career catalog" title="Explore by career family" description="These groupings are drawn from the active Career API catalog." />
      {loading && <p role="status">Loading careers…</p>}
      {error && <p role="alert">Career information is temporarily unavailable.</p>}
      {!loading && !error && !pathways.length && <p>No active careers are available.</p>}
      <section className="career-public__card career-exploreCatalog" aria-label="Career family catalog">
        <div className="sh-row" style={{ alignItems: "center" }}>
          <h3 className="h3" style={{ margin: 0 }}>Explore by Cluster</h3>
          <div style={{ flex: 1 }} />
          {activeCluster ? (
            <span className="sh-chip" title="Active cluster filter">
              {activeCluster}
              <button type="button" className="sh-btn sh-btn--tiny" style={{ marginLeft: 8, padding: "2px 6px" }}
                      aria-label={`Remove ${activeCluster}`} onClick={() => setActiveCluster(null)}>✕</button>
            </span>
          ) : null}
        </div>

        <div className="clusterGrid" role="list" style={{ marginTop: 8 }}>
          {exploreClusters.map(({ cluster, items }) => (
            <div key={cluster} role="listitem" className="clusterCard">
              <div className="sh-row" style={{ justifyContent: "space-between", gap: 8 }}>
                <div className="sh-row" style={{ gap: 8 }}>
                  <span className="sh-chip">{cluster}</span>
                  <span className="subtle">{items.length} pathways</span>
                </div>
                <div className="sh-actionsRow">
                  <button className="sh-btn sh-btn--secondary"
                          onClick={() => setActiveCluster(cluster)}
                          aria-haspopup="dialog"
                          aria-expanded={activeCluster === cluster ? "true" : "false"}
                          aria-controls="cluster-browser">
                    Browse
                  </button>
                </div>
              </div>

              <div className="clusterList" aria-live="polite">
                {items.slice(0, 3).map((p) => (
                  <PathwayRow key={p.id} pathway={p} onOpen={() => handleViewPathwayCard(p)} />
                ))}
                {items.length > 3 ? (
                  <button className="sh-linkBtn" onClick={() => setActiveCluster(cluster)}
                          aria-label={`View all ${items.length} in ${cluster}`} style={{ marginTop: 4 }}>
                    View all {items.length}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Drawer for individual pathway */}
      <Suspense fallback={null}>
        <PathwayDetailDrawer open={drawerOpen} pathway={activePathway}
                             onClose={() => setDrawerOpen(false)} onStart={() => setDrawerOpen(false)} />
      </Suspense>

      {/* Cluster drawer */}
      <ClusterDrawer open={!!activeCluster} title={activeCluster ? `Cluster: ${activeCluster}` : ""} onClose={() => setActiveCluster(null)}>
        {!activeClusterItems.length ? (
          <p className="subtle">No items in this cluster.</p>
        ) : (
          <ul className="sh-listPlain">
            {activeClusterItems.map((p) => (
              <li key={p.id} className="pathRow" style={{ marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{p.title}</div>
                  <div className="subtle">Career family record</div>
                </div>
                <div className="sh-actionsRow">
                  <Link className="sh-btn sh-btn--primary" to={`/pathways/${encodeURIComponent(p.slug)}`}>View pathway</Link>
                  <Link className="sh-btn sh-btn--secondary" to={`/careers/${encodeURIComponent(p.slug)}`}>View career</Link>
                  <button className="sh-btn sh-btn--secondary" onClick={() => handleViewPathwayCard(p)} aria-label={`Preview ${p.title}`}>Preview</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ClusterDrawer>

      <style>{`
        .clusterGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;}
        .clusterCard{border:1px solid var(--ring,#e5e7eb);border-radius:12px;padding:10px;background:var(--card,#fff);}
        .clusterList{display:grid;gap:6px;margin-top:8px;}
        .pathRow{display:grid;grid-template-columns:1fr auto;align-items:center;gap:8px;border:1px solid var(--ring,#e5e7eb);border-radius:10px;padding:8px;background:var(--card,#fff);}
      `}</style>
    </main>
  );
}

/* --- SHF: Pathway selected (drop-in listener stays) --- */
(() => {
  if (typeof window === "undefined" || window.__shfHook_pathway) return; window.__shfHook_pathway = true;
  const once = (k) => { if (!k) return true; if (localStorage.getItem(k)) return false; localStorage.setItem(k,"1"); return true; };
  window.addEventListener("pathway:selected", (e) => {
    const d = (e && e.detail) || {};
    const key = d.pathwayId ? `shf.award.path.${d.pathwayId}` : "";
    if (!once(key)) return;
    try {
      window.shfCredit?.earn?.({ action: "pathway.select", rewards: { corn: 2 }, scoreDelta: 4, meta: { pathwayId: d.pathwayId, name: d.name } });
      window.shToast?.(`🛣️ Pathway chosen: ${d.name || d.pathwayId} · +2 🌽 · +4 score`);
    } catch {}
  });
})();
