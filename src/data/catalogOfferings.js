// src/data/catalogOfferings.js
//
// Canonical data source for the Store app's Catalog page
// (src/pages/store/StoreCatalog.jsx). Single source of truth — the page
// selects/filters/sorts this list, it does not hardcode cards in JSX.
//
// HONESTY NOTE (read before adding real records): every entry below is
// SEED / DEMONSTRATION data, not a verified production SHF/SHS offering.
// No real "packaged offering" data source (programs, curriculum bundles,
// career pathways, organizational solutions, add-ons, services) exists
// anywhere else in this repository — confirmed by search before writing
// this file. The only pre-existing "catalog" data in the repo
// (src/adapters/catalog.js + src/data/marketplace.json) models a
// different, unrelated blockchain-badge trading marketplace (rarity/
// origin/hue), not this product concept, and was not reused here.
//
// This mirrors the established pattern already used elsewhere in this
// codebase for exactly this situation — a UI that needs real-shaped data
// before a backend exists — e.g. CLASSIC_GAMES_DEMO / HALL_OF_FAME_DEMO
// in src/pages/arcade/ClassicalArcadeRoom.jsx: clearly named/labeled
// fixtures, never written into a real ledger, never presented as
// verified truth. Do not remove this comment when adding real records;
// update it to reflect the real data source once one exists.
//
// Field shape:
//   id            stable slug, used for filtering/sorting keys only —
//                 does NOT imply a real detail route exists (see
//                 detailHref/action below)
//   title
//   owner         "Silicon Heartland Foundation" | "Silicon Heartland Solutions"
//   ownerShort    "SHF" | "SHS" — for compact badge display
//   offeringType  "program" | "curriculum-bundle" | "career-pathway" |
//                 "organizational-solution" | "add-on" | "service"
//   access        "free" | "sponsored" | "grant-funded" | "included" |
//                 "premium-addon" | "paid" | "request-access" |
//                 "contact-pricing"
//   audience      array of: "students" | "educators" | "nonprofits" |
//                 "businesses" | "employers" | "community-organizations"
//   description   one short sentence, no unverifiable claims
//   ctaLabel      contextual action text (see CTA_BY_TYPE below — used
//                 as the default; a record can override it)
//   detailHref    a REAL in-app route, or null if none exists yet (see
//                 StoreCatalogCard.jsx — null renders an honest "preview"
//                 dialog instead of a dead link)
//   photo / photoSmall   imported card images at two real resolutions —
//                 1600x900 (photo) and 800x450 (photoSmall) — for
//                 srcset. Image-quality pass: the four featured cards'
//                 photos were originally cropped from the ~1536px-wide
//                 approved reference mock, which meant each card's own
//                 region was only ~180-240px wide — far smaller than
//                 the ~326px the large-card layout displays it at, so
//                 the images were being upscaled up to ~3.7x on retina
//                 displays (visibly blurred). No repo asset matched
//                 these four themes (data center, students, dashboard,
//                 community garden) at real high resolution, so — with
//                 explicit user approval — real photos were sourced
//                 from Unsplash under the standard free Unsplash
//                 License (unsplash.com/license: free for commercial
//                 use, no attribution required), verified individually
//                 as non-Unsplash+/non-premium and free of any visible
//                 third-party logos/branding before use:
//                   data-center:          photo-1564457461758-8ff96e439e83
//                   ai-literacy:          photo-1758270705518-b61b40527e76
//                   impact-reporting:     photo-1551288049-bebda4e38f71
//                   community-incubator:  photo-1524247108137-732e0f642303
//                 Educator PD's photo is unchanged (not in scope for
//                 this image-quality pass — it isn't in the default
//                 featured row).
//   icon          a single emoji shown as a small circular badge
//                 overlapping the photo's bottom-left corner (matches
//                 the mock's circular category icon)
//   accent        CSS color token name (see StoreCatalogCard.jsx) for
//                 the icon badge background
//   featured      boolean — shown in the "Featured Programs & Solutions" rail

import dataCenterPhoto from "@/assets/store/catalog/data-center.webp";
import dataCenterPhotoSmall from "@/assets/store/catalog/data-center-800w.webp";
import aiLiteracyPhoto from "@/assets/store/catalog/ai-literacy.webp";
import aiLiteracyPhotoSmall from "@/assets/store/catalog/ai-literacy-800w.webp";
import impactReportingPhoto from "@/assets/store/catalog/impact-reporting.webp";
import impactReportingPhotoSmall from "@/assets/store/catalog/impact-reporting-800w.webp";
import communityIncubatorPhoto from "@/assets/store/catalog/community-incubator.webp";
import communityIncubatorPhotoSmall from "@/assets/store/catalog/community-incubator-800w.webp";
import educatorPdPhoto from "@/assets/store/catalog/educator-pd.webp";

export const OFFERING_TYPES = [
  { id: "all", label: "All Types" },
  { id: "program", label: "Programs" },
  { id: "curriculum-bundle", label: "Curriculum Bundles" },
  { id: "career-pathway", label: "Career Pathways" },
  { id: "organizational-solution", label: "Organizational Solutions" },
  { id: "add-on", label: "Add-ons" },
  { id: "service", label: "Services" },
];

export const ACCESS_TYPES = [
  { id: "all", label: "All Access Types" },
  { id: "free", label: "Free" },
  { id: "sponsored", label: "Sponsored" },
  { id: "grant-funded", label: "Grant Funded" },
  { id: "included", label: "Included" },
  { id: "premium-addon", label: "Premium Add-on" },
  { id: "paid", label: "Paid" },
  { id: "request-access", label: "Request Access" },
  { id: "contact-pricing", label: "Contact for Pricing" },
];

export const AUDIENCES = [
  { id: "all", label: "All Audiences" },
  { id: "students", label: "Students" },
  { id: "educators", label: "Educators" },
  { id: "nonprofits", label: "Nonprofits" },
  { id: "businesses", label: "Businesses" },
  { id: "employers", label: "Employers" },
  { id: "community-organizations", label: "Community Organizations" },
];

export const ECOSYSTEMS = [
  { id: "all", label: "All Ecosystems" },
  { id: "shf", label: "Silicon Heartland Foundation" },
  { id: "shs", label: "Silicon Heartland Solutions" },
];

export const SORTS = [
  { id: "featured", label: "Featured" },
  { id: "newest", label: "Newest" },
  { id: "name", label: "Name" },
  { id: "access", label: "Access Type" },
];

export const CTA_BY_TYPE = {
  program: "View Program",
  "curriculum-bundle": "View Bundle",
  "career-pathway": "View Pathway",
  "organizational-solution": "View Package",
  "add-on": "See Details",
  service: "See Details",
};

export const CTA_BY_ACCESS_OVERRIDE = {
  "request-access": "Request Access",
  "contact-pricing": "Contact Sales",
};

// addedAt is an ISO date used only for the "Newest" sort — arbitrary,
// seed-only ordering, not a real creation timestamp from any system.
export const catalogOfferings = [
  {
    id: "data-center-career-pathway",
    title: "Data Center Career Pathway",
    owner: "Silicon Heartland Foundation",
    ownerShort: "SHF",
    offeringType: "career-pathway",
    access: "sponsored",
    audience: ["students", "employers"],
    description: "A 12-week workforce pathway leading to in-demand data center careers.",
    detailHref: null,
    photo: dataCenterPhoto,
    photoSmall: dataCenterPhotoSmall,
    icon: "🖥️",
    accent: "blue",
    featured: true,
    addedAt: "2026-06-01",
  },
  {
    id: "ai-literacy-for-youth",
    title: "AI Literacy for Youth",
    owner: "Silicon Heartland Foundation",
    ownerShort: "SHF",
    offeringType: "program",
    access: "free",
    audience: ["students", "educators"],
    description: "A self-paced course introducing AI concepts, ethics, and real-world use.",
    detailHref: null,
    photo: aiLiteracyPhoto,
    photoSmall: aiLiteracyPhotoSmall,
    icon: "🎓",
    accent: "orange",
    featured: true,
    addedAt: "2026-05-12",
  },
  {
    id: "advanced-impact-reporting",
    title: "Advanced Impact Reporting",
    owner: "Silicon Heartland Solutions",
    ownerShort: "SHS",
    offeringType: "add-on",
    access: "premium-addon",
    audience: ["nonprofits", "businesses"],
    description: "Advanced dashboards, custom reports, and institutional exports.",
    detailHref: null,
    photo: impactReportingPhoto,
    photoSmall: impactReportingPhotoSmall,
    icon: "📊",
    accent: "teal",
    featured: true,
    addedAt: "2026-04-20",
  },
  {
    id: "community-program-incubator",
    title: "Community Program Incubator",
    owner: "Silicon Heartland Foundation",
    ownerShort: "SHF",
    offeringType: "organizational-solution",
    access: "request-access",
    audience: ["nonprofits", "community-organizations"],
    description: "Build, test, and launch community initiatives with guided support.",
    detailHref: null,
    photo: communityIncubatorPhoto,
    photoSmall: communityIncubatorPhotoSmall,
    icon: "🤝",
    accent: "green",
    featured: true,
    addedAt: "2026-03-15",
  },
  {
    id: "educator-professional-development-bundle",
    title: "Educator Professional Development Bundle",
    owner: "Silicon Heartland Foundation",
    ownerShort: "SHF",
    offeringType: "curriculum-bundle",
    access: "included",
    audience: ["educators"],
    description: "Training and resources to elevate classroom practice and outcomes.",
    detailHref: null,
    photo: educatorPdPhoto,
    icon: "🧑‍🏫",
    accent: "purple",
    // Not in the primary "Featured Programs & Solutions" row (kept to 4
    // curated cards, per the large-card fidelity update) — still fully
    // reachable via any filter/search/sort, or "View all". See
    // StoreCatalog.jsx's isDefaultView logic.
    featured: false,
    addedAt: "2026-02-28",
  },
];
