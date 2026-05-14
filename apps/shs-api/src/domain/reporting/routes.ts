import { addExport, getExports } from "./export-history.store";

export function registerReportingRoutes(app: any) {
  app.get("/reporting/exports", (_req: any, res: any) => {
    res.json({ items: getExports() });
  });

  app.post("/reporting/exports", (req: any, res: any) => {
    const record = {
      id: Date.now().toString(),
      exportKind: req.body.exportKind,
      artifactId: req.body.artifactId,
      status: req.body.status || "generated",
      requestedBy: req.body.requestedBy || "system",
      createdAt: new Date().toISOString(),
    };

    addExport(record);
    res.json({ ok: true, record });
  });
}
