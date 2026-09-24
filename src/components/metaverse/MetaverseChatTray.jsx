import React, { useEffect, useRef, useState } from "react";
import MetaverseSafetyMenu from "./MetaverseSafetyMenu.jsx";
import {
  blockParticipant,
  listMessages,
  muteParticipant,
  reportParticipant,
  sendMessage,
} from "@/system/metaverse/metaverseCommunicationClient.js";

const OPEN_POLL_MS = 4000;
const CLOSED_POLL_MS = 15000;

export default function MetaverseChatTray({ room, open, onToggle, currentUserId, roomLabel, directMessagingNote, onUnreadCountChange }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const knownIds = useRef(new Set());
  const closeButtonRef = useRef(null);
  const logRef = useRef(null);

  useEffect(() => {
    knownIds.current = new Set();
    setMessages([]);
    setUnreadCount(0);
    setError("");
  }, [room?.room_id]);

  useEffect(() => {
    if (!room?.room_id) return undefined;
    let cancelled = false;

    const poll = async () => {
      try {
        const result = await listMessages(room.room_id);
        if (cancelled) return;
        const rows = result?.messages || [];
        let incoming = 0;
        for (const message of rows) {
          if (!knownIds.current.has(message.message_id)) {
            knownIds.current.add(message.message_id);
            if (message.sender_user_id !== currentUserId) incoming += 1;
          }
        }
        setMessages(rows);
        if (!open && incoming > 0) setUnreadCount((count) => count + incoming);
      } catch {
        if (!cancelled) setError("Messages are temporarily unavailable.");
      }
    };

    poll();
    const interval = setInterval(poll, open ? OPEN_POLL_MS : CLOSED_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [room?.room_id, open, currentUserId]);

  useEffect(() => {
    if (open) {
      setUnreadCount(0);
      closeButtonRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

  const handleSend = async (event) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !room?.room_id) return;
    setSending(true);
    setError("");
    try {
      await sendMessage(room.room_id, {
        body,
        source_client_id: `met-chat-${room.room_id}`,
      });
      setDraft("");
    } catch (submitError) {
      setError(submitError?.message || "Message could not be sent.");
    } finally {
      setSending(false);
    }
  };

  if (!room?.room_id) return null;

  return (
    <div className="met-chat-tray" data-open={open ? "true" : "false"}>
      <button
        type="button"
        className="met-chat-tray__toggle"
        onClick={() => onToggle(!open)}
        aria-expanded={open}
        aria-controls="met-chat-tray-panel"
      >
        Chat{roomLabel ? `: ${roomLabel}` : ""}
        {!open && unreadCount > 0 ? <span className="met-chat-tray__unread" aria-hidden="true">{unreadCount}</span> : null}
        {!open && unreadCount > 0 ? <span className="met-sr-only">{unreadCount} unread messages</span> : null}
      </button>

      {open ? (
        <section id="met-chat-tray-panel" className="met-chat-tray__panel" aria-label={`Chat: ${roomLabel || "room"}`}>
          <div className="met-chat-tray__head">
            <h2>{roomLabel || "Room chat"}</h2>
            <button type="button" ref={closeButtonRef} onClick={() => onToggle(false)} aria-label="Close chat">×</button>
          </div>

          {directMessagingNote ? <p className="met-chat-tray__policy-note">{directMessagingNote}</p> : null}

          <div className="met-chat-tray__log" role="log" aria-live="polite" aria-relevant="additions" ref={logRef}>
            {messages.length === 0 ? (
              <p className="met-chat-tray__empty">No messages yet. Say hello.</p>
            ) : (
              <ol className="met-chat-tray__messages">
                {messages.map((message) => (
                  <li key={message.message_id} className="met-chat-tray__message" data-own={message.sender_user_id === currentUserId ? "true" : "false"}>
                    <div className="met-chat-tray__message-meta">
                      <span className="met-chat-tray__message-sender">
                        {message.sender_user_id === currentUserId ? "You" : "Participant"}
                      </span>
                      <time dateTime={message.sent_at}>{new Date(message.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
                    </div>
                    <p className="met-chat-tray__message-body">
                      {message.moderation_state === "DELETED" || message.moderation_state === "REDACTED" ? "[message removed]" : message.body}
                    </p>
                    {message.sender_user_id !== currentUserId ? (
                      <MetaverseSafetyMenu
                        targetUserId={message.sender_user_id}
                        targetLabel="this participant"
                        onMute={(targetUserId) => muteParticipant(room.room_id, targetUserId)}
                        onBlock={(targetUserId) => blockParticipant(room.room_id, targetUserId)}
                        onReport={(body) => reportParticipant(room.room_id, { ...body, message_id: message.message_id })}
                      />
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </div>

          {error ? <p role="alert" className="met-chat-tray__error">{error}</p> : null}

          <form className="met-chat-tray__composer" onSubmit={handleSend}>
            <label htmlFor="met-chat-tray-input" className="met-sr-only">Message</label>
            <textarea
              id="met-chat-tray-input"
              value={draft}
              maxLength={1000}
              placeholder="Message this room"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSend(event);
                }
              }}
            />
            <button type="submit" disabled={sending || !draft.trim()}>Send</button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
