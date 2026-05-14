import React from "react";

/**
 * Accessible Emoji
 * - name: mapped short-name (preferred), or pass children="🔥"
 * - label: aria-label override (falls back to name)
 * - size: inline style fontSize (e.g., 18, 20)
 * - className: additional classes (e.g., "emoji--pulse")
 */
const EMOJI_MAP = {
  // Brand / system
  rocket: "🚀",
  heart: "❤️",
  corn: "🌽",
  wheat: "🌾",
  shield: "🛡️",
  spark: "✨",

  // Civic
  ballot: "🗳️",
  capitol: "🏛️",
  gavel: "⚖️",
  handshake: "🤝",
  megaphone: "📣",
  map: "🗺️",
  vote: "✅",
  budget: "💸",
  chart: "📈",
  city: "🏙️",

  // Learning UX
  hint: "💡",
  note: "🖊️",
  audio: "🔊",
  transcript: "📜",
  quiz: "🧠",
  star: "⭐",
  check: "✔️",
  info: "ℹ️",

  // Status
  success: "✅",
  error: "❌",
  warn: "⚠️",
  pulse: "🔆",
};

export default function Emoji({
  name,
  label,
  children,
  size,
  className = "",
  style,
  ...rest
}) {
  const glyph = children || EMOJI_MAP[name] || "❖";
  const aria = (label || name || "icon")?.replace?.(/_/g, " ") ?? "icon";
  return (
    <span
      role="img"
      aria-label={aria}
      className={`emoji ${className}`}
      style={{ fontSize: size ? \`\${size}px\` : undefined, lineHeight: 1, ...style }}
      {...rest}
    >
      {glyph}
    </span>
  );
}

export const EMOJI = EMOJI_MAP;
