import { fail, ok } from "../../../api/response-envelope.js";
import { CareerService } from "../service/career-service.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import * as careerPathwayService from "../../career-pathways/service/career-pathway-service.js";
import * as learnerResultService from "../../curriculum/service/learner-result-service.js";

const service = new CareerService();

export function registerCareerRoutes(app: any) {
  app.get("/careers", async (_req: any, res: any, next: any) => {
    try {
      return res.json(ok({ items: await service.listActive() }));
    } catch (error) {
      return next(error);
    }
  });

  // SHF Ecosystem Phase 5 — a learner's own pathway Career(s), derived
  // server-side from ACTIVE Enrollment -> Program -> Career (never a
  // stored/client-suppliable career selection). Registered before
  // /careers/:slug* so "pathway" is never mistaken for a career slug.
  app.get("/careers/pathway/me", requirePermission("enrollment.view"), async (req: any, res: any, next: any) => {
    try {
      const actor = { organization_id: req.user.active_organization_id || req.user.organization_id, user_id: req.user.user_id };
      const pathway = await careerPathwayService.deriveLearnerPathway(actor);
      const learnerResults = await learnerResultService.getLearnerResults({ ...actor, tenant_id: req.user.tenant_id || `tenant:${actor.organization_id}` });
      return res.json(ok({ ...pathway, learnerResultSummary: { mastery: learnerResults.mastery, progress: learnerResults.progress } }));
    } catch (error) {
      return next(error);
    }
  });

  app.get("/careers/:slug/programs", requirePermission("program.read"), async (req: any, res: any, next: any) => {
    try {
      const career = await service.getBySlug(req.params.slug);
      if (!career) return res.status(404).json(fail("NOT_FOUND", "Career not found"));
      const organizationId = req.user.active_organization_id || req.user.organization_id;
      const items = await careerPathwayService.listProgramsForCareerInOrganization(organizationId, career.career_id);
      return res.json(ok({ items }));
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
