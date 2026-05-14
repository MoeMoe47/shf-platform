import React from "react";

/**
 * Displays an image or video with an optional caption.
 * Props:
 *  - src: string (path to .jpg/.png/.gif/.mp4, etc.)
 *  - alt: string (alt text for images)
 *  - caption: string
 *  - ratio: "16:9" | "4:3" | "1:1"  (defaults to 16:9)
 */
export default function MediaRow({ src, alt = "", caption, ratio = "16:9" }) {
  const isVideo = typeof src === "string" && src.toLowerCase().endsWith(".mp4");
  const ratioClass = `sh-ratio-${ratio.replace(":", "x")}`;

  return (
    <figure className="sh-mediaRow">
      <div className={`sh-mediaBox ${ratioClass}`}>
        {isVideo ? (
          <video
            src={src}
            controls
            playsInline
            style={{ display: "block", width: "100%", height: "100%" }}
          />
        ) : (
          <img
            src={src}
            alt={alt}
            loading="lazy"
            style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
      </div>
      {caption && <figcaption className="sh-mediaCaption">{caption}</figcaption>}
    </figure>
  );
}
