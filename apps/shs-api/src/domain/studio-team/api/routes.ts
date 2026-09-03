import { ok, fail } from "../../../api/response-envelope.js";
import { StudioTeamService } from "../service/studio-team-service.js";
const service = new StudioTeamService();
const reject = (res: any, error: any) => { const code = String(error?.message || "TEAM_REQUEST_REJECTED"); const status = ["TEAM_NOT_FOUND", "TEAM_MEMBER_NOT_FOUND"].includes(code) ? 404 : 403; return res.status(status).json(fail(code, code)); };
export function registerStudioTeamRoutes(app: any) {
  app.get("/studio/teams", async (req: any, res: any) => { try { return res.json(ok({ items: await service.list(req.user) })); } catch (e) { return reject(res, e); } });
  app.get("/studio/teams/:teamId", async (req: any, res: any) => { try { return res.json(ok(await service.get(req.user, req.params.teamId))); } catch (e) { return reject(res, e); } });
  app.post("/studio/teams", async (req: any, res: any) => { try { return res.status(201).json(ok(await service.create(req.user, req.body || {}))); } catch (e) { return reject(res, e); } });
  app.post("/studio/teams/:teamId/members", async (req: any, res: any) => { try { return res.status(201).json(ok(await service.addMember(req.user, req.params.teamId, req.body || {}))); } catch (e) { return reject(res, e); } });
  app.delete("/studio/teams/:teamId/members/:userId", async (req: any, res: any) => { try { return res.json(ok(await service.removeMember(req.user, req.params.teamId, req.params.userId))); } catch (e) { return reject(res, e); } });
  app.post("/studio/teams/:teamId/archive", async (req: any, res: any) => { try { return res.json(ok(await service.archive(req.user, req.params.teamId))); } catch (e) { return reject(res, e); } });
}
