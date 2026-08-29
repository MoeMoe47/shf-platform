// Phase 2A Secure Live Learning — MockLiveLearningProvider.
//
// Simulates the provider contract end-to-end with zero external calls.
// Used when no real provider is configured, and in tests/CI so nothing
// depends on a live Zoom account. Its launch URLs are always an inert
// `about:blank#...` fragment, clearly labeled as a mock — this must never
// be presented to a user as a real, working meeting link.
import type {
  LiveLearningProvider,
  ProviderCreateInput,
  ProviderUpdateInput,
  ProviderSession,
  JoinAuthorization,
  ProviderHealth,
} from "./live-learning-provider.js";

let counter = 0;
function nextId() {
  counter += 1;
  return `mock_${Date.now().toString(36)}_${counter}`;
}

const sessions = new Map<string, ProviderSession & { title: string; startsAt: string; durationMinutes: number }>();

export class MockLiveLearningProvider implements LiveLearningProvider {
  readonly name = "mock";

  async createSession(input: ProviderCreateInput): Promise<ProviderSession> {
    const providerSessionId = nextId();
    const session = {
      providerSessionId,
      title: input.title,
      startsAt: input.startsAt,
      durationMinutes: input.durationMinutes,
      metadata: { mock: true, hostId: input.hostId },
    };
    sessions.set(providerSessionId, session);
    return { providerSessionId, metadata: session.metadata };
  }

  async updateSession(providerSessionId: string, patch: ProviderUpdateInput): Promise<ProviderSession> {
    const existing = sessions.get(providerSessionId);
    if (!existing) throw new Error("Mock session not found.");
    if (patch.title) existing.title = patch.title;
    if (patch.startsAt) existing.startsAt = patch.startsAt;
    if (patch.durationMinutes) existing.durationMinutes = patch.durationMinutes;
    return { providerSessionId, metadata: existing.metadata };
  }

  async cancelSession(providerSessionId: string): Promise<void> {
    sessions.delete(providerSessionId);
  }

  async getSession(providerSessionId: string): Promise<ProviderSession | null> {
    const existing = sessions.get(providerSessionId);
    return existing ? { providerSessionId, metadata: existing.metadata } : null;
  }

  async issueJoinAccess(providerSessionId: string, userId: string): Promise<JoinAuthorization> {
    const existing = sessions.get(providerSessionId);
    if (!existing) {
      return { allowed: false, reason: "Mock session not found." };
    }
    return {
      allowed: true,
      // Deliberately inert — never a working meeting link. Clearly
      // labeled so the frontend cannot mistake this for a real Zoom
      // launch (see ZoomCard.jsx / LiveSessions.jsx phase 2A wiring).
      launchUrl: `about:blank#mock-live-session-${providerSessionId}-${userId}`,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    };
  }

  async getRecordingMetadata(_providerSessionId: string): Promise<Record<string, unknown> | null> {
    return null; // mock provider never has recordings
  }

  async healthCheck(): Promise<ProviderHealth> {
    return "available";
  }
}
