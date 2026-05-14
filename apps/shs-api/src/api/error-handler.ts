export function errorHandler(err: any, _req: any, res: any, _next: any) {
  const message = err?.message || "Internal error";
  res.status(500).json({
    ok: false,
    error: { code: "INTERNAL_ERROR", message },
    correlation_id: "corr_dev",
  });
}
