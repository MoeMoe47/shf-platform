// src/utils/normalizeLessonMedia.js
//
// Phase 1 media repair (SHF Curriculum Infrastructure Audit §31/§32): the
// real, populated lesson content in src/content/lessons/asl-student/*.json
// uses `section.media = { type: "video", url: "/media/asl/*.mp4" }` (146
// real occurrences, confirmed live in the repo), but the renderer that
// actually mounts when a student opens a lesson
// (src/components/lessons/LessonBody.jsx) only ever checked for
// `section.media.embed` — a field that does not exist anywhere in real
// content — so no lesson video has ever rendered.
//
// This adapter translates whatever shape a lesson's `media` field is in
// today into one internal representation, so the renderer only has to
// understand one shape. It does not rewrite any lesson JSON files.
//
// Supported input shapes (real + legacy-tolerant):
//   { type: "video"|"image"|"audio", url }          <- real, current shape
//   { type: "video"|"image"|"audio", src }          <- alt key name
//   { embed: "<iframe-able url>" }                  <- legacy/tolerated shape
//   { src }  (no type)                               <- inferred from extension
//
// Output shape (always this, or null if there is nothing to render):
//   {
//     type: "video" | "image" | "audio" | "embed",
//     src: string,
//     poster: string | null,
//     caption: string | null,          <- figure caption TEXT (a label),
//                                          e.g. "Figure 1: ...". NOT the
//                                          same thing as closed captions.
//     alt: string | null,
//     transcript: string | null,
//     captionsTrack: string | null,    <- Phase 2B: WebVTT URL for real
//                                          closed captions (<track
//                                          kind="captions">), only ever
//                                          set from real accessibility
//                                          metadata — never fabricated.
//     audioDescription: string | null, <- Phase 2B: URL to an audio-
//                                          described alternate track,
//                                          when the source data has one.
//     hasAccessibleAlternative: boolean, <- Phase 2B: true if captions,
//                                          transcript, or audio
//                                          description is present —
//                                          consumed by
//                                          validateLessonAccessibility.js.
//   }

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|avif)(\?.*)?$/i;
const VIDEO_EXT = /\.(mp4|webm|mov|m4v)(\?.*)?$/i;
const AUDIO_EXT = /\.(mp3|wav|ogg|m4a|aac)(\?.*)?$/i;

function inferTypeFromUrl(url) {
  if (!url || typeof url !== "string") return null;
  if (IMAGE_EXT.test(url)) return "image";
  if (VIDEO_EXT.test(url)) return "video";
  if (AUDIO_EXT.test(url)) return "audio";
  return null;
}

export function normalizeLessonMedia(media) {
  if (!media || typeof media !== "object") return null;

  // Legacy/tolerated iframe-embed shape.
  if (typeof media.embed === "string" && media.embed) {
    const transcript = media.transcript || null;
    return {
      type: "embed",
      src: media.embed,
      poster: null,
      caption: media.caption || media.title || null,
      alt: null,
      transcript,
      captionsTrack: null, // iframe embeds cannot carry a <track> — the
      // embedded player (if any) is responsible for its own captions.
      audioDescription: media.audioDescription || null,
      hasAccessibleAlternative: !!(transcript || media.audioDescription),
    };
  }

  const src = media.url || media.src || null;
  if (!src) return null;

  const type = media.type || inferTypeFromUrl(src) || "video";
  const captionsTrack = media.captionsTrack || media.captions || media.vtt || null;
  const transcript = media.transcript || null;
  const audioDescription = media.audioDescription || null;

  return {
    type,
    src,
    poster: media.poster || null,
    caption: media.caption || null,
    alt: media.alt || (type === "image" ? "" : null),
    transcript,
    captionsTrack,
    audioDescription,
    hasAccessibleAlternative: !!(captionsTrack || transcript || audioDescription || (type === "image" && media.alt)),
  };
}

export default normalizeLessonMedia;
