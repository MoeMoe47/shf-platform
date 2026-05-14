export function getHashQueryParams(): URLSearchParams {
  const hash = window.location.hash || "";
  const query = hash.includes("?") ? hash.split("?")[1] : "";
  return new URLSearchParams(query);
}

export function getHashQueryParam(key: string): string {
  return getHashQueryParams().get(key) || "";
}

export function getFocusedSourceId(): string {
  return getHashQueryParam("source");
}

export function getFocusedBridgeId(): string {
  return getHashQueryParam("bridge");
}

export function getFocusedVerificationId(): string {
  return getHashQueryParam("verification");
}

export function getFocusedArtifactId(): string {
  return getHashQueryParam("artifact");
}
