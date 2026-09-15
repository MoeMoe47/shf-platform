export const METAVERSE_REALTIME_REPOSITORY_AUDIT = {
  websocketDependencyPresent: false,
  socketIoDependencyPresent: false,
  serverSentEventsImplementationFound: false,
  redisDependencyPresent: false,
  durableOutboxPresent: true,
  existingPollingPatternsPresent: true,
  recommendation: "Start future implementation with authenticated short polling or bounded SSE projection over server-authoritative presence state; only add WebSocket/Redis after scale and bidirectional requirements are proven.",
} as const;

export interface MetaverseCommunicationTransport {
  readonly transport_id: string;
  publishPresenceProjection(roomOrScopeId: string, payload: unknown): Promise<void>;
  publishRoomEvent(roomId: string, payload: unknown): Promise<void>;
  disconnectUser(userId: string, reason: "SIGN_OUT" | "REVOCATION" | "STALE" | "MODERATION"): Promise<void>;
}
