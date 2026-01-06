export function prefetch(cb){ try { cb && cb(); } catch(e){ /* ignore */ } }
export const prefetchSales = {
  dashboard: () => import("@/pages/sales/SalesDashboard.jsx").catch(()=>({})),
  leads:     () => import("@/pages/sales/Leads.jsx").catch(()=>({})),
  proposal:  () => import("@/pages/sales/Proposal.jsx").catch(()=>({})),
  revenue:   () => import("@/pages/sales/Revenue.jsx").catch(()=>({})),
  team:      () => import("@/pages/sales/Team.jsx").catch(()=>({})),
};
