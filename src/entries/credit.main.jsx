import "@/styles/unified-shell.css";
// src/entries/credit.main.jsx

// (optional) Register service worker when supported (no hard failure in dev)
if ('serviceWorker' in navigator) {
// (dev) disabled SW import
}

// Dev mocks: install early so they intercept fetch; no top-level await
if (import.meta.env.DEV) {
  import('@/dev/mockApi.js').catch(() => {});
}

// Tag <html> for app-scoped styles before CSS loads
try {
  const html = document.documentElement;
  html.setAttribute('data-app', 'credit');
  // If you want a default theme here:
  // html.setAttribute('data-theme', 'foundation'); // or 'solutions'
} catch {}

/* ---------------- CSS (order matters; keep your look) ---------------- */
import '@/styles/foundation.css';
import '@/styles/global.css';
import '@/styles/emoji.css';
import '@/styles/lesson-soft.css';
import '@/styles/shell.css';
import '@/styles/skeleton.css';
import '@/styles/util-wash.css';
import '@/styles/dashboard-shared.css';
import '@/components/credit/credit-shell.css'; // you already have this

/* ---------------- React / Router ---------------- */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';

/* ---------------- App bits ---------------- */
import RootProviders from '@/entries/RootProviders.jsx';
import CreditRoutes from '@/router/CreditRoutes.jsx';
import GlobalErrorBoundary from '@/components/GlobalErrorBoundary.jsx';

/* Robust mount finder (works with data-app or fallback ids) */
function getMount() {
  return (
    document.querySelector('[data-app="credit"]') ||
    document.getElementById('root') ||
    document.getElementById('app')
  );
}

const rootEl = getMount();
if (!rootEl) {
  console.error(
    '[ENTRY:credit] mount not found. credit.html must include <div id="root" data-app="credit"></div> and load /src/entries/credit.main.jsx.'
  );
} else {
  createRoot(rootEl).render(
    <React.StrictMode>
      <GlobalErrorBoundary>
        {/* appScope tells providers & theming which app is active */}
        <RootProviders appScope="credit">
          <HashRouter>
            <CreditRoutes />
          </HashRouter>
        </RootProviders>
      </GlobalErrorBoundary>
    </React.StrictMode>
  );
}
