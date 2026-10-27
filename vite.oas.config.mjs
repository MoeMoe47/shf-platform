// Focused build of every existing OAS page; normal ecosystem build is unchanged.
import { defineConfig } from 'vite';
import base from './vite.config.js';
const oasInputs = Object.fromEntries(Object.entries(base.build.rollupOptions.input).filter(([key]) => key === 'oas' || key.startsWith('oas-')));
export default defineConfig({
  ...base,
  build: { ...base.build, outDir: '.tmp/oas-build', rollupOptions: { ...base.build.rollupOptions, input: oasInputs } },
});
