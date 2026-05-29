import { requirePermission } from "../../auth/permission-guard";
import { SHS_SECURITY_PERMISSIONS } from "../../auth/security-permissions";
import { addExport, getExports } from "./export-history.store";
import { writeSecurityAuditEvent } from "../../auth/security-audit";

export function registerReportingRoutes(app: any) {
  app.get(
    "/reporting/exports",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_VIEW),
    (_req: any, res: any) => {
      res.json({ items: getExports() });
    }
  );

  app.post(
    "/reporting/exports",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_EXPORT),
    async (req: any, res: any) => {
      const record = {
        id: Date.now().toString(),
        exportKind: req.body.exportKind,
        artifactId: req.body.artifactId,
        status: req.body.status || "generated",
        requestedBy: req.body.requestedBy || req.user?.user_id || req.user?.id || "system",
        createdAt: new Date().toISOString(),
      };

      addExport(record);

      await writeSecurityAuditEvent(req, {
        action_type: "reports.export",
        target_object_type: "report_artifact",
        target_object_id: record.artifactId || record.id,
        new_state_json: record,
        reason_code: String(record.exportKind || "report_export"),
        reason_text: `Report export generated: ${record.exportKind || "unknown"}`,
      });

      res.json({ ok: true, record });
    }
  );
}
