import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { cpSync, mkdirSync } from "node:fs";
const root = fileURLToPath(new URL(".", import.meta.url));
// Independent of the broader application's configuration and incoming work.
export default defineConfig(({ command }) => {
  let output;
  return {
    root, plugins: [react(), {
      name: "oas-public-assets",
      configResolved(config) { output = resolve(root, config.build.outDir); },
      closeBundle() {
        if (command !== "build") return;
        mkdirSync(resolve(output, "assets"), { recursive: true });
        cpSync(resolve(root, "public/oas"), resolve(output, "oas"), { recursive: true });
        cpSync(resolve(root, "public/assets/oas"), resolve(output, "assets/oas"), { recursive: true });
      },
    }],
    resolve: { alias: { "@": resolve(root, "src") } },
    build: {
      outDir: "dist-oas-website", copyPublicDir: false,
      rollupOptions: { input: Object.fromEntries(["oas", "oas-1", "oas-control-domains", "oas-purpose-boundaries", "oas-risk-classification"].map(name => [name, resolve(root, `${name}.html`)])) },
    },
  };
});
