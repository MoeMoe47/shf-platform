import { runMirrorSyncDispatch } from "./external-calendar-mirror-dispatcher.js";

/**
 * One bounded dispatch pass. Deployment should invoke this entrypoint from
 * the repository's managed scheduler or job runner (same contract as
 * trusted-reporting/worker.ts); it must not run in the browser or inside a
 * request handler.
 */
export async function runExternalCalendarMirrorWorker(dispatch = runMirrorSyncDispatch) {
  return dispatch();
}

export async function runExternalCalendarMirrorWorkerLoop(options: {
  dispatch?: typeof runMirrorSyncDispatch;
  pollIntervalMs?: number;
  signal?: AbortSignal;
} = {}) {
  const dispatch = options.dispatch || runMirrorSyncDispatch;
  // Default 15 minutes (phase brief §12): mirror freshness is a
  // convenience, not a correctness requirement (on-demand sync via
  // POST /external-accounts/:provider/sync already covers correctness
  // immediately) — no operational need justifies a tighter interval.
  const pollIntervalMs = options.pollIntervalMs || Number(process.env.SHF_EXTERNAL_CALENDAR_SYNC_POLL_MS || 15 * 60 * 1000);
  if (!Number.isFinite(pollIntervalMs) || pollIntervalMs <= 0) throw new Error("external_calendar_sync_poll_interval_invalid");
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
  runExternalCalendarMirrorWorkerLoop({ signal: controller.signal })
    .catch((error: any) => {
      const reason = String(error?.message || "external_calendar_mirror_worker_failed")
        .replace(/\s+/g, " ")
        .slice(0, 160);
      console.error(JSON.stringify({ error: reason }));
      process.exitCode = 1;
    });
}
