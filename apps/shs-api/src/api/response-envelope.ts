export function ok(data: unknown, correlation_id: string = "corr_dev") {
  return { ok: true, data, correlation_id };
}

export function fail(
  code: string,
  message: string,
  correlation_id: string = "corr_dev",
  extra: Record<string, unknown> = {}
) {
  return {
    ok: false,
    error: { code, message, ...extra },
    correlation_id,
  };
}
