import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        // lightweight / marketing / utility pages
        index: resolve(__dirname, "index.html"),
        ai: resolve(__dirname, "ai.html"),
        fuel: resolve(__dirname, "fuel.html"),
        launch: resolve(__dirname, "launch.html"),
        store: resolve(__dirname, "store.html"),
        catalog: resolve(__dirname, "catalog.html"),

        // unified-shell apps (dashboard-style)
        admin: resolve(__dirname, "admin.html"),
        arcade: resolve(__dirname, "arcade.html"),
        catalogApp: resolve(__dirname, "catalog.html"), // optional alias
        civic: resolve(__dirname, "civic.html"),
        credit: resolve(__dirname, "credit.html"),
        curriculum: resolve(__dirname, "curriculum.html"),
        debt: resolve(__dirname, "debt.html"),
        employer: resolve(__dirname, "employer.html"),
        foundation: resolve(__dirname, "foundation.html"),
        ledger: resolve(__dirname, "ledger.html"),
        lordOutcomes: resolve(__dirname, "lord-of-outcomes.html"),
        sales: resolve(__dirname, "sales.html"),
        solutions: resolve(__dirname, "solutions.html"),
        treasury: resolve(__dirname, "treasury.html"),
        verifier: resolve(__dirname, "verifier.html"),
      },
    },
  },
});
