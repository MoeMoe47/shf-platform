import React from "react";

export default function EventSubscriberPanel({ subscribers, onUnsubscribe }) {
  return (
    <section className="event-bus-panel subscribers">
      <div className="panel-heading"><p>Subscribers</p><h2>Subscriber Registry</h2></div>
      <div className="subscriber-list">
        {subscribers.map((subscriber) => (
          <article key={subscriber.subscriber_id} className={subscriber.active ? "" : "is-muted"}>
            <div>
              <strong>{subscriber.layer}</strong>
              <span>{subscriber.channel_id}</span>
              <small>{subscriber.delivery_mode} · {subscriber.active ? "active" : "inactive"}</small>
            </div>
            {subscriber.active && <button type="button" onClick={() => onUnsubscribe(subscriber.subscriber_id)}>Unsubscribe Local Layer</button>}
          </article>
        ))}
      </div>
    </section>
  );
}

