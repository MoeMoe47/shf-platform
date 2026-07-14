const subscribers = new Set();

export function publishAuthClientEvent(event) {
  const payload = {
    event_type: event?.event_type || "auth_client_event",
    result: event?.result || "observed",
    reason: event?.reason || "",
    timestamp: new Date().toISOString(),
  };
  subscribers.forEach((subscriber) => subscriber(payload));
}

export function subscribeAuthClientEvents(subscriber) {
  subscribers.add(subscriber);
  return () => subscribers.delete(subscriber);
}

