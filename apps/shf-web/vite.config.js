import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": resolve(__dirname, "../../src") } },
  server: {
    // Same-origin SHS API path, mirroring the root vite.config.js: shared
    // SHS clients resolve to "/api" (src/lib/apiClient.js), proxied to the
    // SHS API's canonical local port 8091 with the prefix stripped.
    proxy: {
      "/api": {
        target: process.env.SHS_VITE_API_PROXY_TARGET || "http://127.0.0.1:8091",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
