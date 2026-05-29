import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  server: {
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

            if (
              normalizedId.includes("mapbox-gl") ||
              normalizedId.includes("maplibre-gl") ||
              normalizedId.includes("@mapbox") ||
              normalizedId.includes("@maplibre") ||
              normalizedId.includes("supercluster") ||
              normalizedId.includes("geojson")
            ) {
              return "vendor-map";
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
