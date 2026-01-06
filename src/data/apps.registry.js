// src/data/apps.registry.js
// Public-facing Apps list

export const foundationApps = [
  {
    id: "career",
    name: "Career Center",
    tagline: "Plan careers, track skills, and prove readiness.",
    href: "/career.html#/dashboard",
    category: "Students",
    featured: true,

    // 🔹 Media
    mediaType: "video",
    mediaSrc: "/media/career-center.mp4",
    image: "/assets/apps/career-hero.webp", // fallback still frame
  },

  {
    id: "curriculum",
    name: "Curriculum Hub",
    tagline: "Accredited courses with portfolio evidence baked in.",
    href: "/curriculum.html#/dashboard",
    category: "Learning",

    mediaType: "image",
    image: "/assets/apps/curriculum-hero.webp",
  },

  {
    id: "arcade",
    name: "Workforce Arcade",
    tagline: "Skill-building games with real-world badges.",
    href: "/arcade.html#/",
    category: "Games",

    mediaType: "video",
    mediaSrc: "/media/workforce-arcade.mp4",
    image: "/assets/apps/arcade-hero.webp",
  },

  {
    id: "civic",
    name: "Civic Lab",
    tagline: "Build civic DNA, missions, and impact portfolios.",
    href: "/civic.html#/dashboard",
    category: "Civic",

    // JPEG / still only
    mediaType: "image",
    image: "/assets/apps/civic-hero.webp",
  },

  {
    id: "credit",
    name: "Credit Lab",
    tagline: "Simulate reports, disputes, and score moves.",
    href: "/credit.html#/dashboard",
    category: "Finance",

    mediaType: "image",
    image: "/assets/apps/credit-hero.webp",
  },

  {
    id: "debt",
    name: "Debt Clock",
    tagline: "See the path out of debt in real time.",
    href: "/debt.html#/dashboard",
    category: "Finance",

    mediaType: "image",
    image: "/assets/apps/debt-hero.webp",
  },

  {
    id: "treasury",
    name: "Treasury",
    tagline: "Track grants, donations, and blockchain proofs.",
    href: "/treasury.html#/dashboard",
    category: "Admin",

    mediaType: "video",
    mediaSrc: "/media/treasury.mp4",
    image: "/assets/apps/treasury-hero.webp",
  },

  {
    id: "employer",
    name: "Employer Hub",
    tagline: "Internships, reimbursement, and hiring pipelines.",
    href: "/employer.html#/dashboard",
    category: "Employers",

    mediaType: "video",
    mediaSrc: "/media/employer-hero-columbus-day.mp4",
    image: "/assets/apps/employer-hero.webp",
  },

  {
    id: "ai",
    name: "AI Job Compass",
    tagline: "See which jobs AI will change and how to react.",
    href: "/ai.html#/job-compass",
    category: "AI",

    mediaType: "video",
    mediaSrc: "/media/ai-job-compass.mp4",
    image: "/assets/apps/ai-hero.webp",
  },

  {
    id: "launch",
    name: "Launchpad",
    tagline: "Turn projects into real-world launches.",
    href: "/launch.html#/overview",
    category: "Launch",

    mediaType: "video",
    mediaSrc: "/media/launchpad-hero.mp4",
    image: "/assets/apps/launch-hero.webp",
  },

  {
    id: "sales",
    name: "Sales Studio",
    tagline: "Leads, pipelines, and impact-driven sales.",
    href: "/sales.html#/dashboard",
    category: "Sales",

    mediaType: "image",
    image: "/assets/apps/sales-hero.webp",
  },

  {
    id: "solutions",
    name: "Solutions Marketplace",
    tagline: "Products and services built on Silicon Heartland.",
    href: "/solutions.html#/marketplace",
    category: "Marketplace",

    mediaType: "image",
    image: "/assets/apps/solutions-hero.webp",
  },

  {
    id: "store",
    name: "Store",
    tagline: "Merch, bundles, and supporter gear.",
    href: "/store.html#/catalog",
    category: "Store",

    mediaType: "image",
    image: "/assets/apps/store-hero.webp",
  },

  {
    id: "foundation",
    name: "Foundation Dashboard",
    tagline: "Top-level view of programs and impact.",
    href: "/foundation.html#/top",
    category: "Admin",

    mediaType: "image",
    image: "/assets/apps/foundation-hero.webp",
  },

  {
    id: "admin",
    name: "Admin App Gallery",
    tagline: "Placement, investor, and attribution dashboards.",
    href: "/foundation.html#/admin/apps-gallery",
    category: "Admin",

    mediaType: "image",
    image: "/assets/apps/admin-hero.webp",
  },
];
