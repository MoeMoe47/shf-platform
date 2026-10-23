import { build, loadConfigFromFile } from "vite";
import { resolve } from "node:path";

// Run from the repository root. Compile only existing Foundation entry points.
// Keep shared public assets in place; their loading is checked by browser tests.
const loaded = await loadConfigFromFile({
  command: "build",
  mode: "production",
});
loaded.config.build.rollupOptions.input = {
  foundation: resolve("foundation.html"),
  shf: resolve("shf.html"),
};
await build({
  ...loaded.config,
  configFile: false,
  build: {
    ...loaded.config.build,
    outDir: "/private/tmp/shf-donation-build",
    emptyOutDir: true,
    copyPublicDir: false,
  },
});
