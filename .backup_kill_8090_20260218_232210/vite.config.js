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
        target: "http://127.0.0.1:8090",
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
        index: path.resolve(__dirname, "index.html"),
        admin: path.resolve(__dirname, "admin.html"),
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
          // ---------------------------
          // Vendor chunking
          // ---------------------------
          if (id.includes("node_modules")) {
            if (id.includes("react")) return "vendor-react";
            if (id.includes("maplibre")) return "vendor-map";
            return "vendor";
          }

          // ---------------------------
          // AI-heavy routes & logic
          // ---------------------------
          if (
            id.includes("/src/pages/ai/") ||
            id.includes("/src/entries/ai") ||
            id.includes("/src/ai/")
          ) {
            return "ai";
          }

          // ---------------------------
          // Lord of Outcomes (LOO)
          // ---------------------------
          if (
            id.includes("/src/pages/lord/") ||
            id.includes("/src/pages/lord-of-outcomes") ||
            id.includes("/src/loo/")
          ) {
            return "loo";
          }

          // ---------------------------
          // Dashboards & analytics views
          // ---------------------------
          if (
            id.includes("/src/pages/") &&
            (id.includes("Dashboard") ||
              id.includes("Reports") ||
              id.includes("Analytics"))
          ) {
            return "dashboards";
          }

          // ---------------------------
          // Core app structure splits
          // ---------------------------
          if (id.includes("/src/pages/")) return "pages";
          if (id.includes("/src/components/")) return "components";
          if (id.includes("/src/shared/")) return "shared";
          if (id.includes("/src/content/")) return "content";

          // everything else: let Rollup decide
        },
      },
    },
  },
});
