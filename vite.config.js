import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  server: {
    // Explicit IPv4 host, matching the same convention already used by
    // the other local dev servers this app links to/from
    // (autonomous-registry, the Universe reference implementation both
    // pass --host 127.0.0.1) and by .env.example's documented cross-app
    // origins (all 127.0.0.1). Without this, Vite's default host binds
    // IPv6 loopback ([::1]) only on this machine — any cross-app link
    // built from a 127.0.0.1 origin (e.g. Foundation/Solutions' "Return
    // to Universe", found live: it 404'd/connection-refused with
    // chrome-error://chromewebdata) would silently fail to reach this
    // server even though "localhost:5173" worked.
    host: "127.0.0.1",
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8091",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },

  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    // raise warning threshold slightly (no functional impact)
      modulePreload: {
        resolveDependencies(filename, deps, context) {
          // SHS_CAPITAL_MAPBOX_PRELOAD_FILTER_PATCH
          // Capital should not preload Mapbox until a Mapbox route actually needs it.
          const normalizedFileName = String(filename || "");
          const normalizedHostId = String(context?.hostId || "");
          const isCapitalPreloadHost =
            normalizedFileName.includes("capital") ||
            normalizedHostId.includes("/src/entries/capital") ||
            normalizedHostId.includes("capital.main");

          if (!isCapitalPreloadHost) {
            return deps;
          }

          return deps.filter((dep) => {
            const normalizedDep = String(dep || "");
            return !normalizedDep.includes("vendor-mapbox-");
          });
        },
      },

    chunkSizeWarningLimit: 700,

    rollupOptions: {
      // ✅ Multi-page build inputs (restores all your apps)
      input: {
      capital: path.resolve(__dirname, "capital.html"),
        index: path.resolve(__dirname, "index.html"),
        admin: path.resolve(__dirname, "admin.html"),
        allocation: path.resolve(__dirname, "allocation.html"),
        ai: path.resolve(__dirname, "ai.html"),
        arcade: path.resolve(__dirname, "arcade.html"),
        career: path.resolve(__dirname, "career.html"),
        catalog: path.resolve(__dirname, "catalog.html"),
        civic: path.resolve(__dirname, "civic.html"),
        credit: path.resolve(__dirname, "credit.html"),
        curriculum: path.resolve(__dirname, "curriculum.html"),
        debt: path.resolve(__dirname, "debt.html"),
        employer: path.resolve(__dirname, "employer.html"),
        foundation: path.resolve(__dirname, "foundation.html"),
        fuel: path.resolve(__dirname, "fuel.html"),
        launch: path.resolve(__dirname, "launch.html"),
        ledger: path.resolve(__dirname, "ledger.html"),
        "lord-of-outcomes": path.resolve(__dirname, "lord-of-outcomes.html"),
        sales: path.resolve(__dirname, "sales.html"),
        solutions: path.resolve(__dirname, "solutions.html"),
        store: path.resolve(__dirname, "store.html"),
        treasury: path.resolve(__dirname, "treasury.html"),
        universe: path.resolve(__dirname, "universe.html"),
        verifier: path.resolve(__dirname, "verifier.html"),
      },

      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, "/");

          if (normalizedId.includes("/node_modules/")) {
            if (
              normalizedId.includes("/react/") ||
              normalizedId.includes("/react-dom/") ||
              normalizedId.includes("/react-router") ||
              normalizedId.includes("/scheduler/")
            ) {
              return "vendor-react";
            }

            if (normalizedId.includes("mapbox-gl")) {
              return "vendor-mapbox";
            }

            if (normalizedId.includes("maplibre-gl")) {
              return "vendor-maplibre";
            }

            if (
              normalizedId.includes("supercluster") ||
              normalizedId.includes("geojson")
            ) {
              return "vendor-geo";
            }

            if (
              normalizedId.includes("@mapbox") ||
              normalizedId.includes("@maplibre")
            ) {
              return "vendor-map-support";
            }

            if (
              normalizedId.includes("recharts") ||
              normalizedId.includes("d3") ||
              normalizedId.includes("victory") ||
              normalizedId.includes("chart.js")
            ) {
              return "vendor-charts";
            }

            if (
              normalizedId.includes("framer-motion") ||
              normalizedId.includes("@motionone")
            ) {
              return "vendor-motion";
            }

            if (
              normalizedId.includes("lucide-react") ||
              normalizedId.includes("@radix-ui") ||
              normalizedId.includes("clsx") ||
              normalizedId.includes("tailwind-merge") ||
              normalizedId.includes("class-variance-authority")
            ) {
              return "vendor-ui";
            }

            if (
              normalizedId.includes("html2canvas") ||
              normalizedId.includes("jspdf") ||
              normalizedId.includes("pdf-lib") ||
              normalizedId.includes("xlsx") ||
              normalizedId.includes("file-saver")
            ) {
              return "vendor-export";
            }

            if (
              normalizedId.includes("@tanstack") ||
              normalizedId.includes("axios") ||
              normalizedId.includes("zod")
            ) {
              return "vendor-data";
            }

            return "vendor";
          }

          if (normalizedId.includes("/src/pages/exchange/")) return "pages-exchange";
          if (normalizedId.includes("/src/pages/admin/")) return "pages-admin";
          if (normalizedId.includes("/src/pages/hub/")) return "pages-hub";
          if (normalizedId.includes("/src/pages/shf-command/")) return "pages-foundation";
          if (normalizedId.includes("/src/foundation/")) return "pages-foundation";
          if (normalizedId.includes("/src/pages/public/")) return "pages-public";
          if (
            normalizedId.includes("/src/pages/lord/") ||
            normalizedId.includes("/src/pages/lord-of-outcomes") ||
            normalizedId.includes("/src/pages/lordOutcomes/")
          ) {
            return "pages-lord";
          }

          if (normalizedId.includes("/src/pages/")) return "pages";
          if (normalizedId.includes("/src/components/")) return "components";
          if (normalizedId.includes("/src/shared/")) return "shared";

          return undefined;
        },
      },
    },
  },
});
