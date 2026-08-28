// Phase 2A Secure Live Learning — provider registry/factory. The only
// place that knows how to turn a `provider` string column value into a
// concrete adapter. Adding Teams/Meet/Webex later means adding one class
// implementing LiveLearningProvider and one line here — nothing else in
// the service, routes, or curriculum code changes.
import type { LiveLearningProvider } from "./live-learning-provider";
import type { LiveLearningProviderName } from "../model/live-session";
import { MockLiveLearningProvider } from "./mock-provider";
import { ZoomLiveLearningProvider } from "./zoom-provider";

const mock = new MockLiveLearningProvider();
const zoom = new ZoomLiveLearningProvider();

export function getProvider(name: LiveLearningProviderName): LiveLearningProvider {
  switch (name) {
    case "mock":
      return mock;
    case "zoom":
      return zoom;
    default:
      throw new Error(`Unknown live learning provider: ${name}`);
  }
}

export function listProviders(): LiveLearningProvider[] {
  return [mock, zoom];
}
