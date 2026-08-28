import React from "react";
import normalizeLessonMedia from "@/utils/normalizeLessonMedia.js";
import { useAccessibilityPreferences } from "@/context/AccessibilityPreferences.jsx";

/**
 * Displays lesson media (video, image, audio, or an iframe embed) through
 * one normalized path — see src/utils/normalizeLessonMedia.js.
 *
 * Phase 1 media repair (SHF Curriculum Infrastructure Audit §31/§32):
 * previously the only component that actually rendered when a student
 * opened a lesson (LessonBody.jsx) checked for a `media.embed` field that
 * doesn't exist anywhere in the real, populated lesson content (which uses
 * `{ type: "video", url: "..." }`), so no lesson video ever rendered. This
 * component was the correct, already-built native <video>/<img> renderer —
 * it just had zero callers. It is now the single normalized media path.
 *
 * Preferred usage (normalized, from lesson content):
 *   <MediaRow media={normalizeLessonMedia(section.media)} />
 *
 * Legacy/manual usage (unchanged, still supported):
 *   <MediaRow src="/path.jpg" alt="..." caption="..." ratio="16:9" />
 *
 * Props:
 *  - media: normalized media object from normalizeLessonMedia(), OR
 *  - src/alt/caption: manual flat props (back-compat)
 *  - ratio: "16:9" | "4:3" | "1:1"  (defaults to 16:9)
 */
export default function MediaRow({ media, src, alt = "", caption, transcript, ratio = "16:9" }) {
  // Accept either a pre-normalized `media` object or the legacy flat props.
  const m = media || (src ? { type: /\.mp4$/i.test(src) ? "video" : "image", src, alt, caption, transcript } : null);

  const { prefs } = useAccessibilityPreferences();
  const [failed, setFailed] = React.useState(false);
  const [showTranscript, setShowTranscript] = React.useState(!!prefs.transcriptPreferred);

  React.useEffect(() => {
    setFailed(false);
  }, [m?.src]);

  const ratioClass = `sh-ratio-${ratio.replace(":", "x")}`;
  const resolvedCaption = m?.caption ?? caption;
  const resolvedTranscript = m?.transcript ?? transcript;

  if (!m || !m.src) {
    // No media referenced at all — nothing to render, not an error state.
    return null;
  }

  function handleMediaError() {
    // Dev diagnostic only — never thrown, never surfaced as a console
    // "error" (which several regression suites assert is zero); this is an
    // expected, handled condition for a referenced-but-missing asset.
    if (import.meta.env?.DEV) {
      console.warn(`[MediaRow] media failed to load (asset likely missing): ${m.src}`);
    }
    setFailed(true);
  }

  return (
    <figure className="sh-mediaRow">
      <div className={`sh-mediaBox ${ratioClass}`}>
        {failed ? (
          <div className="sh-mediaUnavailable" role="status">
            <span className="sh-mediaUnavailable__icon" aria-hidden="true">🎬</span>
            <span>Media unavailable</span>
          </div>
        ) : m.type === "video" ? (
          <video
            src={m.src}
            poster={m.poster || undefined}
            controls
            playsInline
            preload="metadata"
            style={{ display: "block", width: "100%", height: "100%" }}
            onError={handleMediaError}
          >
            {/* Phase 2B: real WebVTT captions when the source data
                actually provides a captionsTrack — never a fabricated
                or auto-generated track. See normalizeLessonMedia.js. */}
            {m.captionsTrack && (
              <track kind="captions" src={m.captionsTrack} srcLang="en" label="English captions" default />
            )}
            Your browser does not support embedded video.
          </video>
        ) : m.type === "audio" ? (
          <div className="sh-mediaAudioWrap">
            <audio
              src={m.src}
              controls
              preload="metadata"
              style={{ width: "100%" }}
              onError={handleMediaError}
            >
              Your browser does not support embedded audio.
            </audio>
          </div>
        ) : m.type === "embed" ? (
          <iframe
            title={resolvedCaption || "Lesson media"}
            src={m.src}
            style={{ width: "100%", height: "100%", border: 0 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            onError={handleMediaError}
          />
        ) : (
          <img
            src={m.src}
            alt={m.alt || ""}
            loading="lazy"
            style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
            onError={handleMediaError}
          />
        )}
      </div>

      {resolvedCaption && <figcaption className="sh-mediaCaption">{resolvedCaption}</figcaption>}

      {m.type === "video" && !m.captionsTrack && !resolvedTranscript && (
        <p className="sh-mediaA11yNotice" role="note">
          Captions and transcript are not yet available for this video.
        </p>
      )}

      {resolvedTranscript && (
        <div className="sh-mediaTranscript">
          <button
            type="button"
            className="sh-mediaTranscript__toggle"
            aria-expanded={showTranscript}
            onClick={() => setShowTranscript((v) => !v)}
          >
            {showTranscript ? "Hide transcript" : "Show transcript"}
          </button>
          {showTranscript && <p className="sh-mediaTranscript__text">{resolvedTranscript}</p>}
        </div>
      )}
    </figure>
  );
}
