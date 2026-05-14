// server/routes/merged.js
import { Router } from "express";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// repo root -> /server/content/<curriculum>/chapters_merged
const repoRoot = path.resolve(__dirname, "..", "..");
const contentRoot = path.join(repoRoot, "server", "content");

// small guard
const exists = (p) => {
  try { return fs.existsSync(p); } catch { return false; }
};

function normalizeSlug(s) {
  if (!s) return "ch1";
  s = String(s).toLowerCase();
  if (/^\d+$/.test(s)) return `ch${Number(s)}`;
  if (/^ch\d+$/.test(s)) return s;
  return s;
}

export default function mergedRouter() {
  const router = Router();

  // List curricula by scanning server/content/*
  router.get("/api/curricula", async (_req, res) => {
    try {
      if (!exists(contentRoot)) return res.json([]);
      const dirs = (await fsp.readdir(contentRoot, { withFileTypes: true }))
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .filter((name) => exists(path.join(contentRoot, name, "chapters_merged")));
      res.setHeader("Cache-Control", "no-store");
      return res.json(dirs);
    } catch (e) {
      console.error("[/api/curricula] Failed:", e);
      return res.status(500).json({ error: "Failed to list curricula", detail: String(e) });
    }
  });

  // List lesson slugs for a curriculum (e.g., ch1, ch2…)
  router.get("/api/merged/:curriculum/index", async (req, res) => {
    try {
      const { curriculum } = req.params;
      const baseDir = path.join(contentRoot, curriculum, "chapters_merged");
      if (!exists(baseDir)) {
        return res.status(404).json({ error: "Curriculum not found" });
      }

      const files = (await fsp.readdir(baseDir))
        .filter((f) => f.endsWith(".merged.json"))
        .sort((a, b) => {
          const na = parseInt(a.match(/\d+/)?.[0] ?? "0", 10);
          const nb = parseInt(b.match(/\d+/)?.[0] ?? "0", 10);
          return na - nb || a.localeCompare(b);
        });

      const slugs = files.map((f) => f.replace(/\.merged\.json$/i, ""));
      res.setHeader("Cache-Control", "no-store");
      return res.json({ slugs, count: slugs.length });
    } catch (e) {
      console.error(`[/api/merged/${req.params.curriculum}/index] Failed:`, e);
      return res.status(500).json({ error: "Failed to list lessons", detail: String(e) });
    }
  });

  // Get one merged lesson JSON
  router.get("/api/merged/:curriculum/:slug", async (req, res) => {
    try {
      const { curriculum } = req.params;
      const slug = normalizeSlug(req.params.slug);
      const baseDir = path.join(contentRoot, curriculum, "chapters_merged");

      const candidates = [
        path.join(baseDir, `${slug}.merged.json`),
        path.join(baseDir, `${slug}.json`),
      ];
      const file = candidates.find(exists);
      if (!file) {
        return res.status(404).json({ error: `Lesson "${slug}" not found in ${curriculum}` });
      }

      try {
        const stat = await fsp.stat(file);
        res.setHeader("Last-Modified", stat.mtime.toUTCString());
      } catch {
        // ignore stat errors; not critical
      }

      res.setHeader("Cache-Control", "no-store");
      res.type("application/json");
      return res.send(await fsp.readFile(file, "utf8"));
    } catch (e) {
      console.error(`[/api/merged/${req.params.curriculum}/${req.params.slug}] Failed:`, e);
      return res.status(500).json({ error: "Failed to read lesson", detail: String(e) });
    }
  });

  return router;
}
