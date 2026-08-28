import { dispatchPendingIntegrationEvents } from "./dispatcher";

/**
 * One bounded dispatch pass. Deployment should invoke this entrypoint from the
 * repository's managed scheduler or job runner; it must not run in the browser
 * or inside a request handler.
 */
export async function runTrustedReportingWorker(dispatcher = dispatchPendingIntegrationEvents) {
  return dispatcher();
}

export async function runTrustedReportingWorkerLoop(options: {
  dispatch?: typeof dispatchPendingIntegrationEvents;
  pollIntervalMs?: number;
  signal?: AbortSignal;
} = {}) {
  const dispatch = options.dispatch || dispatchPendingIntegrationEvents;
  const pollIntervalMs = options.pollIntervalMs || Number(process.env.SHS_TRUSTED_REPORTING_WORKER_POLL_MS || 5000);
  if (!Number.isFinite(pollIntervalMs) || pollIntervalMs <= 0) throw new Error("worker_poll_interval_invalid");
  while (!options.signal?.aborted) {
    await dispatch();
    if (options.signal?.aborted) break;
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, pollIntervalMs);
      options.signal?.addEventListener("abort", () => { clearTimeout(timer); resolve(); }, { once: true });
    });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const controller = new AbortController();
  const stop = () => controller.abort();
  process.once("SIGTERM", stop);
  process.once("SIGINT", stop);
  runTrustedReportingWorkerLoop({ signal: controller.signal })
    .catch((error: any) => {
      const reason = String(error?.message || "trusted_reporting_worker_failed")
        .replace(/\s+/g, " ")
        .slice(0, 160);
      console.error(JSON.stringify({ error: reason }));
      process.exitCode = 1;
    });
}
