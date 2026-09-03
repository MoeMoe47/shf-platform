import React from "react";
import { openStudioCollaborationStream, sendStudioCollaborationUpdate } from "./api.js";

function parseEvent(block) {
  const event = block.match(/^event: (.+)$/m)?.[1];
  const data = block.match(/^data: (.+)$/m)?.[1];
  return event && data ? { event, data: JSON.parse(data) } : null;
}

export function useStudioCollaboration({ role, projectId, enabled, onRemoteWork }) {
  const [state, setState] = React.useState({ status: enabled ? "RECONNECTING" : "OFFLINE", collaborators: [], lastRemoteUpdate: null });
  const onRemoteWorkRef = React.useRef(onRemoteWork);
  const publishTimerRef = React.useRef(null);
  onRemoteWorkRef.current = onRemoteWork;

  React.useEffect(() => {
    if (!enabled || !projectId) { setState({ status: "OFFLINE", collaborators: [], lastRemoteUpdate: null }); return undefined; }
    const controller = new AbortController();
    let closed = false;
    let retry;
    async function connect() {
      setState((current) => ({ ...current, status: "RECONNECTING" }));
      try {
        const response = await openStudioCollaborationStream(role, projectId, controller.signal);
        if (!response.ok || !response.body) throw new Error("COLLABORATION_STREAM_UNAVAILABLE");
        setState((current) => ({ ...current, status: "CONNECTED" }));
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (!closed) {
          const next = await reader.read();
          if (next.done) break;
          buffer += decoder.decode(next.value, { stream: true });
          const blocks = buffer.split("\n\n");
          buffer = blocks.pop() || "";
          for (const block of blocks) {
            try {
              const parsed = parseEvent(block);
              if (!parsed) continue;
              if (parsed.event === "presence") setState((current) => ({ ...current, status: "CONNECTED", collaborators: parsed.data.collaborators || [] }));
              if (parsed.event === "remote_update") {
                setState((current) => ({ ...current, lastRemoteUpdate: parsed.data.by || "A collaborator" }));
                onRemoteWorkRef.current?.(parsed.data.work, parsed.data.by || "A collaborator");
              }
            } catch { /* Ignore malformed transient frames and keep the editor usable. */ }
          }
        }
        if (!closed) throw new Error("COLLABORATION_STREAM_CLOSED");
      } catch (error) {
        if (closed || error?.name === "AbortError") return;
        setState((current) => ({ ...current, status: "OFFLINE" }));
        retry = window.setTimeout(connect, 1000);
      }
    }
    connect();
    return () => { closed = true; controller.abort(); window.clearTimeout(retry); window.clearTimeout(publishTimerRef.current); };
  }, [enabled, projectId, role]);

  const publish = React.useCallback((work) => {
    if (!enabled) return;
    window.clearTimeout(publishTimerRef.current);
    publishTimerRef.current = window.setTimeout(() => {
      sendStudioCollaborationUpdate(role, projectId, work).catch(() => setState((current) => ({ ...current, status: "OFFLINE" })));
    }, 100);
  }, [enabled, projectId, role]);
  return { ...state, publish };
}
