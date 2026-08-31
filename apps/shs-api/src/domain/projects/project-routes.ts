import { requirePermission } from "../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../auth/security-permissions.js";
import { ProjectService } from "./project-service.js";
const service=new ProjectService();
function statusFor(message:string){
  if(message === "submission_version_conflict") return 409;
  if(message.startsWith("invalid_date")) return 400;
  return 403;
}
const reject=(res:any,e:any)=>res.status(statusFor(String(e?.message||""))).json({ok:false,error:{code:String(e?.message||"project_rejected").toUpperCase()}});
export function registerProjectRoutes(app:any){
 app.get("/projects/schedule",requirePermission(SHS_SECURITY_PERMISSIONS.PROJECT_VIEW),async(req:any,res:any)=>{try{return res.json({ok:true,data:{items:await service.listScheduleForActor(req.user)}})}catch(e){return reject(res,e)}});
 app.get("/projects/:projectId/schedule",requirePermission(SHS_SECURITY_PERMISSIONS.PROJECT_VIEW),async(req:any,res:any)=>{try{const item=await service.getScheduleForActor(req.user,req.params.projectId); if(!item) return res.status(404).json({ok:false,error:{code:"PROJECT_NOT_FOUND"}}); return res.json({ok:true,data:item})}catch(e){return reject(res,e)}});
 app.post("/projects",requirePermission(SHS_SECURITY_PERMISSIONS.PROJECT_CREATE),async(req:any,res:any)=>{try{return res.status(201).json({ok:true,data:await service.create(req.user,req.body||{})})}catch(e){return reject(res,e)}});
 app.post("/projects/:projectId/teams",requirePermission(SHS_SECURITY_PERMISSIONS.PROJECT_TEAM_MANAGE),async(req:any,res:any)=>{try{return res.status(201).json({ok:true,data:await service.createTeam(req.user,req.params.projectId,req.body||{})})}catch(e){return reject(res,e)}});
 app.post("/project-teams/:teamId/members",requirePermission(SHS_SECURITY_PERMISSIONS.PROJECT_TEAM_MANAGE),async(req:any,res:any)=>{try{return res.status(201).json({ok:true,data:await service.addMember(req.user,req.params.teamId,req.body||{})})}catch(e){return reject(res,e)}});
 app.post("/project-teams/:teamId/submissions",requirePermission(SHS_SECURITY_PERMISSIONS.PROJECT_SUBMISSION_WRITE),async(req:any,res:any)=>{try{return res.status(201).json({ok:true,data:await service.submit(req.user,req.params.teamId,req.body||{})})}catch(e){return reject(res,e)}});
 app.get("/projects/:projectId/submissions",requirePermission(SHS_SECURITY_PERMISSIONS.PROJECT_SUBMISSION_VIEW),async(req:any,res:any)=>{try{return res.json({ok:true,data:await service.list(req.user,req.params.projectId)})}catch(e){return reject(res,e)}});
 app.post("/project-submissions/:submissionId/review",requirePermission(SHS_SECURITY_PERMISSIONS.PROJECT_SUBMISSION_REVIEW),async(req:any,res:any)=>{try{return res.json({ok:true,data:await service.review(req.user,req.params.submissionId,String(req.body?.status||""))})}catch(e){return reject(res,e)}});
}
