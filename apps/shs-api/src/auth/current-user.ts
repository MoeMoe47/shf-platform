export function getCurrentUser(req: any) {
  return req.user || null;
}

export function parseDevToken(authHeader?: string) {
  if (!authHeader) return null;
  const raw = authHeader.replace("Bearer ", "").trim();
  if (!raw.startsWith("dev-token:")) return null;
  const userId = raw.split(":")[1];
  return userId || null;
}
