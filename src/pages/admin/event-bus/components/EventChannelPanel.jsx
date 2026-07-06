import React from "react";

export default function EventChannelPanel({ channels, metrics, onSelectChannel }) {
  return (
    <section className="event-bus-panel channels">
      <div className="panel-heading"><p>Channels</p><h2>{channels.length} Channels</h2></div>
      <div className="channel-list">
        {channels.map((channel) => {
          const row = metrics.by_channel.find((item) => item.channel_id === channel.channel_id);
          return (
            <button type="button" key={channel.channel_id} onClick={() => onSelectChannel(channel.channel_id)}>
              <strong>{channel.channel_id}</strong>
              <span>{channel.owner_layer}</span>
              <small>{row?.event_count || 0} events · {row?.subscriber_count || 0} subscribers</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}

