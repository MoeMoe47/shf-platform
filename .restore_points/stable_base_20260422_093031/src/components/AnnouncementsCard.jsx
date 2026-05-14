// src/components/AnnouncementsCard.jsx
import React from "react";

export default function AnnouncementsCard({ items = [] }) {
  return (
    <ul className="sh-feed">
      {items.map((it, i) => (
        <li key={i} className="sh-feedItem">
          <div className="sh-feedTop">
            <div className="sh-feedTitle">{it.title}</div>
            <div className="sh-feedTime">{it.time}</div>
          </div>
          <div className="sh-feedBody">{it.body}</div>
        </li>
      ))}
    </ul>
  );
}
