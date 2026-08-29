import { fail, ok } from "../../../api/response-envelope.js";
import { CareerService } from "../service/career-service.js";

const service = new CareerService();

export function registerCareerRoutes(app: any) {
  app.get("/careers", async (_req: any, res: any, next: any) => {
    try {
      return res.json(ok({ items: await service.listActive() }));
    } catch (error) {
      return next(error);
    }
  });

  app.get("/careers/:slug/curriculum", async (req: any, res: any, next: any) => {
    try {
      const result = await service.getCurriculumRequirements(req.params.slug);
      if (!result) return res.status(404).json(fail("NOT_FOUND", "Career not found"));
      return res.json(ok(result));
    } catch (error: any) {
      if (error?.message === "invalid_career_slug") return res.status(400).json(fail("INVALID_CAREER_SLUG", "Invalid career slug"));
      return next(error);
    }
  });

  app.get("/careers/:slug", async (req: any, res: any, next: any) => {
    try {
      const career = await service.getBySlug(req.params.slug);
      if (!career) return res.status(404).json(fail("NOT_FOUND", "Career not found"));
      return res.json(ok(career));
    } catch (error: any) {
      if (error?.message === "invalid_career_slug") return res.status(400).json(fail("INVALID_CAREER_SLUG", "Invalid career slug"));
      return next(error);
    }
  });
}
