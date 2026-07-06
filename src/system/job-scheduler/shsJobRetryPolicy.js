export const SHS_JOB_DEFAULT_RETRY_POLICY = Object.freeze({
  max_retries: 3,
  base_delay_seconds: 60,
  backoff: "linear_preview",
  timeout_seconds: 300,
  preview_only: true,
});

export function createRetryPreview(job = {}, policy = SHS_JOB_DEFAULT_RETRY_POLICY) {
  const maxRetries = Number(job.max_retries ?? policy.max_retries);
  const currentRetry = Number(job.retry_count || 0);
  return Array.from({ length: Math.max(0, maxRetries - currentRetry) }, (_, index) => ({
    retry_number: currentRetry + index + 1,
    delay_seconds: policy.base_delay_seconds * (index + 1),
    timeout_seconds: Number(job.timeout_seconds || policy.timeout_seconds),
    preview_only: true,
    execution_enabled: false,
  }));
}

