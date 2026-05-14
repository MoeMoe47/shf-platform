// src/pages/solutions/SolutionsMarketplace.jsx
import React from "react";

/* --- adapters + providers (safe fallbacks if undefined) --- */
import { useCatalog } from "@/adapters/catalog.js";
import { useFlags } from "@/context/FlagsContext.jsx";
import { usePolygon } from "@/shared/chain/PolygonProvider.jsx";
import { appendEntry } from "@/utils/creditLedger.js";
import { chargeCard, payWithPolygon } from "@/adapters/payments.mock.js";
import BrandLogo from "@/components/BrandLogo.jsx";

/**
 * SolutionsMarketplace.jsx
 * ------------------------------------------------------------
 * Staff route:  /sales.html#/marketplace   (guarded)
 * Public route: /store.html#/marketplace   (Store app)
 *
 * This version updates all accent reds → International Orange.
 */

export default function SolutionsMarketplace() {
  // --- inject page CSS once ---
  React.useEffect(() => {
    if (!document.getElementById("solutions-marketplace-css")) {
      const el = document.createElement("style");
      el.id = "solutions-marketplace-css";
      el.textContent = CSS;
      document.head.appendChild(el);
    }
  }, []);

  // --- flags + chain provider ---
  const { flags } = useFlags?.() ?? { flags: {} };
  const poly = usePolygon?.();

  // --- catalog (adapter) with fallback to mock data ---
  const catalog = useCatalog?.() ?? [];
  const items = catalog.length ? catalog : React.useMemo(() => MOCK_PRODUCTS, []);

  // --- state ---
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState("new"); // new | price-asc | price-desc | rarity
  const [origin, setOrigin] = React.useState("any"); // any | fresh | recycled
  const [marketFilters, setMarketFilters] = React.useState({
    degenphone: true,
    getgems: false,
    other: false,
  });
  const [rarity, setRarity] = React.useState({
    bronze: false,
    common: true,
    community: true,
    diamond: false,
    gold: false,
    legendary: false,
  });

  // --- computed list ---
  const filtered = React.useMemo(() => {
    return items
      .filter((p) => origin === "any" || p.origin === origin)
      .filter((p) => marketFilters[p.market])
      .filter((p) =>
        Object.entries(rarity).some(([key, on]) => (on ? p.rarity === key : false))
      )
      .filter((p) => {
        if (!query) return true;
        const q = query.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          String(p.number).toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        switch (sort) {
          case "price-asc":
            return a.price - b.price;
          case "price-desc":
            return b.price - a.price;
          case "rarity":
            return (RARITY_RANK[a.rarity] ?? 99) - (RARITY_RANK[b.rarity] ?? 99);
          case "new":
          default:
            return b.id - a.id;
        }
      });
  }, [items, origin, marketFilters, rarity, query, sort]);

  // --- summary stats (mocked) ---
  const totalListed = items.length;
  const owners = 625;
  const floor = 102;
  const totalVolume = "51k";
  const rewardPool = 868.2;

  // --- purchase handler (safe in dev) ---
  async function handlePurchase(product, method = "card") {
    try {
      const amt = product.price;
      if (method === "polygon" && poly?.address) {
        await payWithPolygon(amt, poly.address);
      } else {
        await chargeCard(amt);
      }

      if (flags?.creditLedger !== false) {
        appendEntry({
          app: "store",
          type: "purchase",
          amount: amt,
          meta: {
            number: product.number,
            market: product.market,
            rarity: product.rarity,
          },
        });
      }
      // For now, just log success
      console.log("[market] purchase ok", product);
    } catch (err) {
      console.warn("[market] purchase failed", err);
    }
  }

  // ✅ JSX
  return (
    <div className="smp-wrap">
      {/* Top app bar */}
      <header className="smp-appbar">
        <BrandLogo
          app="solutions"
          className="smp-brand"
          logoClassName="smp-brand-logo"
        />

        <nav className="smp-nav">
          <a href="#/marketplace" className="active">
            Marketplace
          </a>
          <a href="#/catalog">Catalog</a>
        </nav>

        <div className="smp-actions">
          <button className="ghost" type="button">
            Search
          </button>
          <button className="wallet" type="button">
            Connect Wallet
          </button>
        </div>
      </header>

      {/* Secondary nav (Solutions context) */}
      <div className="smp-subnav">
        <div className="smp-subnav-inner">
          <div className="smp-sol-brand">
            <span className="dot" />
            <span className="name">SILICON HEARTLAND</span>
            <span className="sub">SOLUTIONS</span>
          </div>
          <div className="smp-sol-tabs">
            <button className="on">Market</button>
            <button>My Items</button>
            <button>Verify</button>
            <button>Referral</button>
            <button>FAQ</button>
            <button>About</button>
          </div>
          <div className="smp-subnav-search">
            <button aria-label="Search">
              <span className="smp-icon-search" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="smp-main" aria-labelledby="smp-heading">
        <header className="smp-main-header">
          <h1 id="smp-heading">MARKETPLACE</h1>
          <div className="smp-kpi-row">
            <StatCard
              label="Items (listed)"
              value={`${totalListed.toLocaleString()}+`}
              sub="8%"
            />
            <StatCard label="Owners (unique)" value={owners} sub="19%" />
            <StatCard label="Floor" value={floor} sub="fresh / 94 recycled" />
            <StatCard label="Total Volume" value={totalVolume} />
            <StatCard
              label="Reward Pool"
              value={`$${rewardPool.toFixed(2)}`}
              accent
            />
          </div>
        </header>

        <section className="smp-toolbar" aria-label="Search and sort">
          <div className="smp-search-wrap">
            <input
              type="text"
              placeholder="Search number, title..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="smp-order-wrap">
            <label htmlFor="smp-order">Order</label>
            <select
              id="smp-order"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="new">Newest</option>
              <option value="price-asc">Price: low → high</option>
              <option value="price-desc">Price: high → low</option>
              <option value="rarity">Rarity</option>
            </select>
          </div>
        </section>

        <div className="smp-layout">
          {/* Filters column */}
          <aside className="smp-filters" aria-label="Filters">
            <h2 className="flt-title">Filters</h2>

            {/* Origin */}
            <div className="flt-group">
              <p className="flt-label">Origin</p>
              <div className="flt-pills">
                <button
                  type="button"
                  className={origin === "any" ? "pill on" : "pill"}
                  onClick={() => setOrigin("any")}
                >
                  Any
                </button>
                <button
                  type="button"
                  className={origin === "fresh" ? "pill on" : "pill"}
                  onClick={() => setOrigin("fresh")}
                >
                  Fresh
                </button>
                <button
                  type="button"
                  className={origin === "recycled" ? "pill on" : "pill"}
                  onClick={() => setOrigin("recycled")}
                >
                  Recycled
                </button>
              </div>
            </div>

            {/* Marketplace */}
            <div className="flt-group">
              <p className="flt-label">Marketplace</p>
              <div className="flt-pills">
                {["degenphone", "getgems", "other"].map((key) => (
                  <button
                    key={key}
                    type="button"
                    className={marketFilters[key] ? "pill on" : "pill"}
                    onClick={() =>
                      setMarketFilters((prev) => ({
                        ...prev,
                        [key]: !prev[key],
                      }))
                    }
                  >
                    {key === "degenphone" && "Degenphone"}
                    {key === "getgems" && "GetGems"}
                    {key === "other" && "Other"}
                  </button>
                ))}
              </div>
            </div>

            {/* Rarity */}
            <div className="flt-group">
              <p className="flt-label">Rarity</p>
              <div className="flt-pills flt-pills-wrap">
                {Object.keys(rarity).map((key) => (
                  <button
                    key={key}
                    type="button"
                    className={rarity[key] ? "pill on" : "pill"}
                    onClick={() =>
                      setRarity((prev) => ({ ...prev, [key]: !prev[key] }))
                    }
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Results */}
          <section className="smp-results" aria-label="Listings">
            {filtered.length === 0 ? (
              <div className="smp-empty">
                <p>No results. Try clearing filters.</p>
              </div>
            ) : (
              <div className="smp-grid">
                {filtered.map((p) => (
                  <article key={p.id} className="smp-card">
                    {p.badge && (
                      <span className="badge" aria-label={p.badge}>
                        {p.badge}
                      </span>
                    )}
                    <div className="card-header">
                      <p className="card-number">{p.number}</p>
                      <p className="card-title">{p.title}</p>
                    </div>
                    <div className="card-body">
                      <div className="card-chip" data-hue={p.hue} />
                      <dl className="card-meta">
                        <div>
                          <dt>Origin</dt>
                          <dd>{p.origin}</dd>
                        </div>
                        <div>
                          <dt>Market</dt>
                          <dd>{p.market}</dd>
                        </div>
                        <div>
                          <dt>Rarity</dt>
                          <dd className="card-rarity">{p.rarity}</dd>
                        </div>
                      </dl>
                    </div>
                    <footer className="card-footer">
                      <div className="price">
                        <span className="price-main">
                          ${p.price.toFixed(2)}
                        </span>
                        <span className="price-sub">SHF credit eligible</span>
                      </div>
                      <div className="card-actions">
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => handlePurchase(p, "polygon")}
                        >
                          Pay w/ Polygon
                        </button>
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => handlePurchase(p, "card")}
                        >
                          Buy
                        </button>
                      </div>
                    </footer>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

/* ----------------- Small stat card component ----------------- */
function StatCard({ label, value, sub, accent }) {
  return (
    <div className={accent ? "stat-card accent" : "stat-card"}>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {sub && <p className="stat-sub">{sub}</p>}
    </div>
  );
}

/* -------------------------- CSS ------------------------------ */
/* All red accents converted to International Orange (#ff4f00). */

const CSS = `
:root{
  --sol-primary:#ff4f00; /* International Orange */
  --sol-primary-700:#cc3f00;
  --sol-bg:#0b0c0e;      /* near black */
  --sol-surface:#121317; /* card bg */
  --sol-ghost:#1a1c22;   /* rail */
  --sol-line:#23252b;    /* borders */
  --sol-text:#f5f6f7;    /* white */
  --sol-dim:#9aa0aa;     /* gray */
  --sol-good:#00d394;    /* accent for positive */
}

*{box-sizing:border-box}
html,body,#root{height:100%}
body{background:var(--sol-bg);color:var(--sol-text);}

.smp-wrap{max-width:1280px;margin:0 auto;padding:12px 16px 64px}

/* App bar */
.smp-appbar{
  position:sticky;
  top:0;
  z-index:40;
  display:flex;
  align-items:center;
  gap:12px;
  padding:10px 14px;
  margin:-12px -16px 12px;
  border-bottom:1px solid rgba(255,255,255,.04);
  background:linear-gradient(to bottom,rgba(11,12,14,.96),rgba(11,12,14,.88));
  backdrop-filter:blur(10px);
}

/* Brand wrapper (BrandLogo lives inside) */
.smp-brand{margin-right:8px;}
.smp-brand-logo{height:20px;}

.smp-nav{display:flex;gap:14px;margin-left:8px}
.smp-nav a{
  padding:8px 10px;
  border-radius:10px;
  color:var(--sol-dim);
  text-decoration:none;
  border:1px solid transparent;
  font-size:13px;
}
.smp-nav a:hover{
  color:white;
  border-color:var(--sol-line);
}
.smp-nav a.active{
  color:white;
  border-color:var(--sol-primary);
  background:rgba(255,79,0,.08);
}

.smp-actions{
  margin-left:auto;
  display:flex;
  gap:8px;
}
.smp-actions .ghost,
.smp-actions .wallet{
  padding:7px 12px;
  border-radius:999px;
  font-size:13px;
  cursor:pointer;
  border:1px solid transparent;
}
.smp-actions .ghost{
  border-color:var(--sol-line);
  background:var(--sol-ghost);
}
.smp-actions .wallet{
  border:1px solid var(--sol-primary);
  background:var(--sol-primary);
  color:white;
}
.smp-actions .wallet:hover{filter:brightness(.96)}

/* Sub nav (Solutions context) */
.smp-subnav{
  margin:12px 0 18px;
}
.smp-subnav-inner{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  padding:10px 14px;
  border-radius:14px;
  background:radial-gradient(circle at top left,rgba(255,79,0,.2),transparent),
             radial-gradient(circle at bottom right,rgba(0,211,148,.12),transparent),
             #101117;
  border:1px solid rgba(255,255,255,.07);
}
.smp-sol-brand{
  display:flex;
  align-items:baseline;
  gap:8px;
  font-weight:600;
  letter-spacing:.08em;
  text-transform:uppercase;
  font-size:11px;
}
.smp-sol-brand .dot{
  width:8px;
  height:8px;
  border-radius:50%;
  background:var(--sol-primary);
}
.smp-sol-brand .name{color:#fff}
.smp-sol-brand .sub{color:var(--sol-dim)}

.smp-sol-tabs{
  display:flex;
  gap:8px;
  flex-wrap:wrap;
}
.smp-sol-tabs button{
  padding:6px 10px;
  border-radius:999px;
  border:1px solid transparent;
  background:transparent;
  color:var(--sol-dim);
  font-size:12px;
  cursor:pointer;
}
.smp-sol-tabs button.on{
  border-color:var(--sol-primary);
  background:rgba(255,79,0,.08);
  color:#fff;
}
.smp-subnav-search button{
  width:32px;
  height:32px;
  border-radius:999px;
  border:1px solid var(--sol-line);
  background:var(--sol-ghost);
  cursor:pointer;
}

/* Main */
.smp-main{display:flex;flex-direction:column;gap:18px}
.smp-main-header h1{
  font-size:24px;
  letter-spacing:.12em;
  text-transform:uppercase;
  margin:0 0 12px;
}
.smp-kpi-row{
  display:grid;
  grid-template-columns:repeat(5,minmax(0,1fr));
  gap:12px;
}
.stat-card{
  padding:10px 12px;
  border-radius:14px;
  background:var(--sol-surface);
  border:1px solid rgba(255,255,255,.04);
}
.stat-card.accent{
  border-color:var(--sol-primary);
  box-shadow:0 0 0 1px rgba(255,79,0,.15);
}
.stat-label{
  font-size:11px;
  text-transform:uppercase;
  letter-spacing:.08em;
  color:var(--sol-dim);
}
.stat-value{
  margin-top:4px;
  font-size:18px;
  font-weight:600;
}
.stat-sub{
  margin-top:2px;
  font-size:11px;
  color:var(--sol-dim);
}

/* Toolbar */
.smp-toolbar{
  display:flex;
  gap:12px;
  align-items:center;
  margin-top:10px;
}
.smp-search-wrap{flex:1}
.smp-search-wrap input{
  width:100%;
  padding:10px 12px;
  border-radius:999px;
  border:1px solid var(--sol-line);
  background:#11131a;
  color:var(--sol-text);
  font-size:13px;
}
.smp-search-wrap input::placeholder{color:rgba(154,160,170,.7)}

.smp-order-wrap{
  display:flex;
  align-items:center;
  gap:6px;
  font-size:12px;
}
.smp-order-wrap select{
  padding:8px 10px;
  border-radius:999px;
  border:1px solid var(--sol-line);
  background:#11131a;
  color:var(--sol-text);
  font-size:13px;
}

/* Layout */
.smp-layout{
  display:grid;
  grid-template-columns:260px minmax(0,1fr);
  gap:16px;
  margin-top:14px;
}

/* Filters */
.smp-filters{
  padding:12px;
  border-radius:16px;
  background:var(--sol-surface);
  border:1px solid rgba(255,255,255,.04);
}
.flt-title{
  margin:0 0 8px;
  font-size:13px;
  font-weight:600;
}
.flt-group{
  margin-top:10px;
  padding-top:10px;
  border-top:1px solid rgba(255,255,255,.04);
}
.flt-group:first-of-type{
  border-top:none;
  padding-top:2px;
}
.flt-label{
  margin:0 0 6px;
  font-size:11px;
  text-transform:uppercase;
  letter-spacing:.1em;
  color:var(--sol-dim);
}
.flt-pills{
  display:flex;
  flex-wrap:wrap;
  gap:6px;
}
.flt-pills.flt-pills-wrap{row-gap:6px}
.flt-group .pill{
  padding:4px 10px;
  border-radius:999px;
  border:1px solid var(--sol-line);
  background:#14161b;
  color:var(--sol-dim);
  font-size:11px;
  cursor:pointer;
}
.flt-group .pill.on{
  border-color:var(--sol-primary);
  box-shadow:0 0 0 2px rgba(255,79,0,.15) inset;
  color:#fff;
}

/* Results */
.smp-results{min-height:200px}
.smp-empty{
  padding:40px 16px;
  border-radius:16px;
  border:1px dashed rgba(255,255,255,.12);
  text-align:center;
  color:var(--sol-dim);
}
.smp-grid{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:14px;
}

/* Cards */
.smp-card{
  position:relative;
  padding:12px;
  border-radius:16px;
  background:var(--sol-surface);
  border:1px solid rgba(255,255,255,.05);
  display:flex;
  flex-direction:column;
  gap:10px;
}
.badge{
  position:absolute;
  top:10px;
  left:10px;
  background:rgba(255,79,0,.15);
  border:1px solid var(--sol-primary);
  color:white;
  font-size:11px;
  padding:4px 8px;
  border-radius:999px;
  text-transform:uppercase;
  letter-spacing:.06em;
}
.card-header{
  display:flex;
  flex-direction:column;
  gap:2px;
}
.card-number{
  font-family:ui-monospace,Menlo,Consolas,monospace;
  font-size:12px;
  color:var(--sol-dim);
}
.card-title{
  font-size:15px;
  font-weight:600;
}
.card-body{
  display:flex;
  gap:10px;
  align-items:center;
}
.card-chip{
  width:44px;
  height:44px;
  border-radius:14px;
  background:conic-gradient(
    from 180deg,
    rgba(255,79,0,.9),
    rgba(0,211,148,.8),
    rgba(255,255,255,.8),
    rgba(255,79,0,.9)
  );
  opacity:.9;
}
.card-meta{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:6px;
  font-size:11px;
}
.card-meta dt{
  text-transform:uppercase;
  letter-spacing:.08em;
  color:var(--sol-dim);
}
.card-meta dd{
  margin:2px 0 0;
}
.card-rarity{
  text-transform:capitalize;
}

.card-footer{
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:10px;
}
.price-main{
  font-size:16px;
  font-weight:600;
}
.price-sub{
  font-size:11px;
  color:var(--sol-dim);
}
.card-actions{
  display:flex;
  gap:6px;
}
.btn-primary,
.btn-secondary{
  padding:7px 10px;
  border-radius:999px;
  border:1px solid transparent;
  font-size:12px;
  cursor:pointer;
  white-space:nowrap;
}
.btn-primary{
  background:var(--sol-primary);
  border-color:var(--sol-primary);
  color:white;
}
.btn-primary:hover{filter:brightness(.97)}
.btn-secondary{
  background:#14161b;
  border-color:var(--sol-line);
  color:var(--sol-text);
}

/* Responsive */
@media (max-width:1024px){
  .smp-kpi-row{grid-template-columns:repeat(3,minmax(0,1fr))}
  .smp-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media (max-width:768px){
  .smp-layout{grid-template-columns:1fr}
  .smp-filters{order:2}
  .smp-grid{grid-template-columns:1fr}
}
`;

/* ------------------------ Mock data --------------------------- */

const RARITY_RANK = {
  bronze: 5,
  common: 4,
  community: 3,
  gold: 2,
  diamond: 1,
  legendary: 0,
};

const MOCK_PRODUCTS = [
  {
    id: 12,
    title: "OG",
    number: "+372 8149 1170",
    price: 98,
    rarity: "common",
    origin: "fresh",
    market: "degenphone",
    badge: "OG",
    hue: 350,
  },
  {
    id: 11,
    title: "OG",
    number: "+372 5744 8960",
    price: 92,
    rarity: "common",
    origin: "fresh",
    market: "degenphone",
    badge: "OG",
    hue: 5,
  },
  {
    id: 10,
    title: "Community",
    number: "+372 5744 8634",
    price: 79,
    rarity: "community",
    origin: "recycled",
    market: "other",
    badge: "Community",
    hue: 12,
  },
  {
    id: 9,
    title: "Community",
    number: "+372 5744 9261",
    price: 76,
    rarity: "community",
    origin: "recycled",
    market: "getgems",
    badge: "Community",
    hue: 356,
  },
  {
    id: 8,
    title: "OG",
    number: "+372 5749 054",
    price: 88,
    rarity: "common",
    origin: "recycled",
    market: "degenphone",
    badge: "OG",
    hue: 210,
  },
  {
    id: 7,
    title: "OG",
    number: "+372 8143 2392",
    price: 91,
    rarity: "common",
    origin: "fresh",
    market: "degenphone",
    badge: "OG",
    hue: 280,
  },
  {
    id: 6,
    title: "Legendary",
    number: "+1 440 555 0199",
    price: 220,
    rarity: "legendary",
    origin: "fresh",
    market: "other",
    badge: "Legendary",
    hue: 320,
  },
  {
    id: 5,
    title: "Gold",
    number: "+1 216 555 0054",
    price: 160,
    rarity: "gold",
    origin: "fresh",
    market: "getgems",
    badge: "Gold",
    hue: 26,
  },
  {
    id: 4,
    title: "Diamond",
    number: "+1 614 555 0031",
    price: 190,
    rarity: "diamond",
    origin: "recycled",
    market: "degenphone",
    badge: "Diamond",
    hue: 200,
  },
  {
    id: 3,
    title: "Community",
    number: "+1 937 555 0002",
    price: 82,
    rarity: "community",
    origin: "recycled",
    market: "other",
    badge: "Community",
    hue: 350,
  },
  {
    id: 2,
    title: "Common",
    number: "+1 330 555 0142",
    price: 70,
    rarity: "common",
    origin: "fresh",
    market: "degenphone",
    badge: "Common",
    hue: 8,
  },
  {
    id: 1,
    title: "Bronze",
    number: "+1 740 555 0137",
    price: 60,
    rarity: "bronze",
    origin: "fresh",
    market: "other",
    badge: "Bronze",
    hue: 0,
  },
];
