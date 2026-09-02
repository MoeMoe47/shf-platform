// SHF AIEL Phase 4 — Curriculum & Lesson Accessibility Integration tests.
//
// Follows this repo's established convention for frontend-adjacent tests
// (see tests/curriculumLessonCompletionSurface.test.mjs): plain
// node:test, no React renderer/JSDOM available in this repo, so JSX-
// bearing files are verified via source-pattern assertions while the two
// plain-JS utility modules touched this phase (normalizeLessonMedia.js,
// validateLessonAccessibility.js) are imported and exercised directly as
// real logic tests.
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import normalizeLessonMedia from "../src/utils/normalizeLessonMedia.js";
import validateLessonAccessibility from "../src/utils/validateLessonAccessibility.js";

function read(relPath) {
  return fs.readFileSync(new URL(`../${relPath}`, import.meta.url), "utf8");
}

// ---------------------------------------------------------------------
// Real logic tests — normalizeLessonMedia.js / validateLessonAccessibility.js
// ---------------------------------------------------------------------

test("11/12. a decorative image never fabricates hasAccessibleAlternative and never gets flagged as missing alt text", () => {
  const decorative = normalizeLessonMedia({ type: "image", url: "/img/divider.svg", decorative: true });
  assert.equal(decorative.decorative, true);
  assert.equal(decorative.alt, "");
  assert.equal(decorative.hasAccessibleAlternative, true, "an explicitly decorative image is a real, honest accessible state, not a gap");

  const warnings = validateLessonAccessibility({
    title: "t",
    sections: [{ heading: "h", media: { type: "image", url: "/img/divider.svg", decorative: true } }],
  });
  assert.equal(warnings.some((w) => w.code === "missing-alt"), false);
});

test("12. a real instructional image with no alt text and no decorative flag is still honestly flagged (never silently marked compliant)", () => {
  const media = normalizeLessonMedia({ type: "image", url: "/img/diagram.png" });
  assert.equal(media.hasAccessibleAlternative, false);

  const warnings = validateLessonAccessibility({
    title: "t",
    sections: [{ heading: "h", media: { type: "image", url: "/img/diagram.png" } }],
  });
  assert.equal(warnings.some((w) => w.code === "missing-alt"), true);
});

test("normalizeLessonMedia never infers decorative from absence — only an explicit true counts", () => {
  const media = normalizeLessonMedia({ type: "image", url: "/img/x.png", decorative: "yes" });
  assert.equal(media.decorative, false, "a truthy-but-non-boolean value must not be treated as an explicit decorative declaration");
});

// ---------------------------------------------------------------------
// Text scale — Step 2 / acceptance criterion A
// ---------------------------------------------------------------------

test("A. every font-size in the real Curriculum lesson/dashboard CSS is wrapped in the shared --ld-text-scale lever", () => {
  const lessonCss = read("src/styles/curriculum-lesson.css");
  const dashboardCss = read("src/styles/curriculum-dashboard.css");
  for (const [name, css] of [["curriculum-lesson.css", lessonCss], ["curriculum-dashboard.css", dashboardCss]]) {
    const declarations = css.match(/font-size:\s*[^;]+;/g) || [];
    assert.ok(declarations.length > 0, `${name} should still declare explicit font-sizes`);
    for (const decl of declarations) {
      assert.match(decl, /var\(--ld-text-scale/, `${name}: "${decl}" is not driven by the shared text-scale variable`);
    }
  }
});

test("A. curriculum-a11y.css defines the DEFAULT/LARGE/EXTRA_LARGE text-scale lever and cascades it from .ld-main", () => {
  const css = read("src/styles/curriculum-a11y.css");
  assert.match(css, /:root\[data-app="curriculum"\]\s*{\s*--ld-text-scale:\s*1;/);
  assert.match(css, /\[data-a11y-text-scale="LARGE"\]\s*{\s*--ld-text-scale:\s*1\.15;/);
  assert.match(css, /\[data-a11y-text-scale="EXTRA_LARGE"\]\s*{\s*--ld-text-scale:\s*1\.3;/);
  assert.match(css, /\.ld-main\s*{\s*font-size:\s*calc\(100%\s*\*\s*var\(--ld-text-scale/);
});

// ---------------------------------------------------------------------
// Contrast — Step 3 / acceptance criterion B
// ---------------------------------------------------------------------

test("B. HIGH contrast is implemented for both light and dark Curriculum themes and respects forced-colors", () => {
  const css = read("src/styles/curriculum-a11y.css");
  assert.match(css, /\[data-a11y-contrast="HIGH"\]\s*{\s*--ld-ink:\s*#000000;/);
  assert.match(css, /\[data-theme="dark"\]\[data-a11y-contrast="HIGH"\]\s*{\s*--ld-ink:\s*#ffffff;/);
  assert.match(css, /@media \(forced-colors: active\)/);
});

// ---------------------------------------------------------------------
// Focus emphasis — Step 4 / acceptance criterion C
// ---------------------------------------------------------------------

test("C. ENHANCED focus emphasis strengthens :focus-visible with a real outline, never removing default focus", () => {
  const css = read("src/styles/curriculum-a11y.css");
  assert.match(css, /\[data-a11y-focus="ENHANCED"\][\s\S]*?:focus-visible[\s\S]*?outline:\s*3px solid/);
  assert.doesNotMatch(css, /outline:\s*none/, "must never remove focus outlines anywhere in this stylesheet");
});

// ---------------------------------------------------------------------
// Target size — Step 5 / acceptance criterion D
// ---------------------------------------------------------------------

test("D. LARGE target size widens real interactive controls to at least 44x44 without replacing semantic elements", () => {
  const css = read("src/styles/curriculum-a11y.css");
  assert.match(css, /\[data-a11y-target-size="LARGE"\][\s\S]*?button[\s\S]*?min-height:\s*44px/);
  assert.match(css, /input\[type="checkbox"\]/);
  assert.match(css, /input\[type="radio"\]/);
});

// ---------------------------------------------------------------------
// Data-attribute wiring — the bridge from profile to CSS
// ---------------------------------------------------------------------

test("the effective context syncs textScale/contrastMode/focusEmphasis/targetSize onto document.documentElement", () => {
  const ctx = read("src/context/EffectiveAccessibilityContext.jsx");
  assert.match(ctx, /root\.dataset\.a11yTextScale\s*=\s*value\.textScale/);
  assert.match(ctx, /root\.dataset\.a11yContrast\s*=\s*value\.contrastMode/);
  assert.match(ctx, /root\.dataset\.a11yFocus\s*=\s*value\.focusEmphasis/);
  assert.match(ctx, /root\.dataset\.a11yTargetSize\s*=\s*value\.targetSize/);
});

// ---------------------------------------------------------------------
// Captions / transcript — Steps 6-7 / acceptance criteria E, F
// ---------------------------------------------------------------------

test("E. caption <track> default-on state follows captionPreference instead of being unconditional", () => {
  const mediaRow = read("src/components/ui/MediaRow.jsx");
  assert.doesNotMatch(mediaRow, /label="English captions" default(?!=)/, "default must no longer be an unconditional boolean attribute");
  assert.match(mediaRow, /default=\{captionsDefaultOn\}/);
  assert.match(mediaRow, /captionsDefaultOn\s*=\s*captionPreference\s*!==\s*"DO_NOT_AUTO_SHOW"/);
});

test("F. transcript default-open state uses the real three-value transcriptPreference, and manual toggles are never overridden by a later preference change", () => {
  const mediaRow = read("src/components/ui/MediaRow.jsx");
  assert.match(mediaRow, /useState\(transcriptPreference === "PREFER"\)/);
  assert.match(mediaRow, /transcriptManuallyToggled/);
  assert.doesNotMatch(mediaRow, /useAccessibilityPreferences/, "MediaRow must read the real 3-state enum, not the lossy legacy boolean adapter");
});

test("E/F. caption/transcript absence notice is unchanged — still an honest, capability-only check", () => {
  const mediaRow = read("src/components/ui/MediaRow.jsx");
  assert.match(mediaRow, /Captions and transcript are not yet available for this video\./);
});

// ---------------------------------------------------------------------
// Reading support reconciliation — Step 8 / acceptance criterion G
// ---------------------------------------------------------------------

test("G. ReadingLevelProvider defers to the canonical profile only when it is actually available, and never double-writes localStorage in that case", () => {
  const provider = read("src/context/ReadingLevelProvider.jsx");
  assert.match(provider, /canonicalAvailable\s*=\s*!!profile\.isAvailable/);
  assert.match(provider, /if \(canonicalAvailable\) return; \/\/ canonical profile owns persistence/);
  assert.match(provider, /profile\.patch\(\{ learningSupport: \{ preferredReadingSupport: next\.toUpperCase\(\) \} \}\)/);
});

test("G. apps that mount ReadingLevelProvider outside the canonical profile tree are structurally unaffected (civic.main.jsx nesting unchanged)", () => {
  const civicMain = read("src/entries/civic.main.jsx");
  const readingIdx = civicMain.indexOf("<ReadingLevelProvider>");
  const rootProvidersIdx = civicMain.indexOf("<RootProviders");
  assert.ok(readingIdx !== -1 && rootProvidersIdx !== -1);
  assert.ok(readingIdx < rootProvidersIdx, "civic must still nest ReadingLevelProvider OUTSIDE RootProviders so it never sees the canonical profile");
});

test("isAvailable is false on the default AccessibilityProfileContext stub and true on the real provider's value", () => {
  const ctxFile = read("src/context/AccessibilityProfileContext.jsx");
  assert.match(ctxFile, /isAvailable:\s*false,\s*\n\}\);/);
  assert.match(ctxFile, /isAvailable:\s*true\s*\}\)/);
});

// ---------------------------------------------------------------------
// simplifiedReading retirement — Step 9 / acceptance criterion H
// ---------------------------------------------------------------------

test("H. simplifiedReading is fully retired — no residual field, storage key, or UI row", () => {
  const adapter = read("src/context/AccessibilityPreferences.jsx");
  const panel = read("src/components/lessons/AccessibilityPreferencesPanel.jsx");
  for (const file of [adapter, panel]) {
    assert.doesNotMatch(file, /simplifiedReading/i);
  }
  assert.doesNotMatch(adapter, /curriculum:a11yPrefs:simplifiedReading/);
  assert.match(adapter, /preferredReadingSupport/);
  assert.match(panel, /preferredReadingSupport/);
  assert.match(panel, /<option value="CORE">/);
  assert.match(panel, /<option value="SIMPLE">/);
  assert.match(panel, /<option value="ADVANCED">/);
});

// ---------------------------------------------------------------------
// TTS consolidation — Step 10 / acceptance criteria I, J
// ---------------------------------------------------------------------

test("I. Curriculum's real lesson path has exactly one TTS component (SpeakBtn), never SpeakerBtn/SectionTTS", () => {
  const vocab = read("src/components/lessons/VocabularyReview.jsx");
  assert.match(vocab, /from "@\/components\/tts\/SpeakBtn\.jsx"/);
  assert.doesNotMatch(vocab, /SpeakerBtn|SectionTTS/);
  const guided = read("src/components/curriculum/lesson/GuidedLessonExperience.jsx");
  assert.doesNotMatch(guided, /SpeakerBtn|SectionTTS/);
});

test("I. HIDDEN read-aloud prominence never removes the speak or transcript-download control, only shrinks them", () => {
  const speakBtn = read("src/components/tts/SpeakBtn.jsx");
  assert.match(speakBtn, /isHidden \? \(speaking \? "⏹" : "🔊"\) : speakLabel/);
  assert.match(speakBtn, /isHidden \? "⬇︎" : "⬇︎ Transcript"/);
  // Both buttons must still be present in JSX regardless of prominence —
  // no conditional that fully unmounts either control.
  const buttonCount = (speakBtn.match(/<button/g) || []).length;
  assert.equal(buttonCount, 2, "exactly two buttons (speak, download) must always render");
});

test("J. no speculative speech rate/voice/language persistence was added", () => {
  const speakBtn = read("src/components/tts/SpeakBtn.jsx");
  assert.doesNotMatch(speakBtn, /localStorage\.setItem\(.*tts/i, "SpeakBtn must not gain a new persisted TTS setting");
  const vocab = read("src/components/lessons/VocabularyReview.jsx");
  assert.doesNotMatch(vocab, /speechRate|voicePreference|ttsLanguage/i);
});

// ---------------------------------------------------------------------
// Ownership boundary — Steps 11/19 / acceptance criterion K
// ---------------------------------------------------------------------

test("K. content capability metadata (normalizeLessonMedia, validateLessonAccessibility) is owned under src/utils/, not the AIEL context layer", () => {
  assert.ok(fs.existsSync(new URL("../src/utils/normalizeLessonMedia.js", import.meta.url)));
  assert.ok(fs.existsSync(new URL("../src/utils/validateLessonAccessibility.js", import.meta.url)));
  assert.ok(!fs.existsSync(new URL("../src/context/normalizeLessonMedia.js", import.meta.url)));
});

// ---------------------------------------------------------------------
// Completion / assessment truth unchanged — acceptance criteria L, M
// ---------------------------------------------------------------------

test("L/M. lesson completion and quiz-grading call sites are byte-present and unmodified by this phase", () => {
  const completion = read("src/components/curriculum/lesson/CompletionCheckPanel.jsx");
  assert.match(completion, /import \{ markLessonComplete \} from "@\/shared\/progress\/progressClient\.js";/);
  assert.match(completion, /markLessonComplete\(/);

  const assessment = read("src/components/lessons/AssessmentRenderer.jsx");
  assert.match(assessment, /gradeMCQ\(selected, item\.correctIndex\)/);
  assert.match(assessment, /recordQuizCompleted\(/);
});

// ---------------------------------------------------------------------
// Privacy / Truth boundary — Step 18 / acceptance criterion N
// ---------------------------------------------------------------------

test("N. no file touched this phase sends a presentation preference into Truth Spine/Evidence/Operational Events/Metric Registry", () => {
  const touchedFiles = [
    "src/context/AccessibilityProfileContext.jsx",
    "src/context/EffectiveAccessibilityContext.jsx",
    "src/context/AccessibilityPreferences.jsx",
    "src/context/ReadingLevelProvider.jsx",
    "src/components/lessons/AccessibilityPreferencesPanel.jsx",
    "src/components/ui/MediaRow.jsx",
    "src/components/lessons/VocabularyReview.jsx",
    "src/components/tts/SpeakBtn.jsx",
    "src/utils/normalizeLessonMedia.js",
    "src/utils/validateLessonAccessibility.js",
    "src/layouts/CurriculumLayout.jsx",
  ];
  const forbidden = /truth[\s_-]?spine|operational[\s_-]?event|evidence[\s_-]?(record|package|fact)|metric[\s_-]?registry/i;
  for (const file of touchedFiles) {
    const content = read(file);
    assert.doesNotMatch(content, forbidden, `${file} must not reference any Truth Spine/Evidence/Operational Event/Metric Registry sink`);
  }
});

// ---------------------------------------------------------------------
// Route focus — Step 14
// ---------------------------------------------------------------------

test("route-change focus moves to #curriculum-main, compares pathname values (StrictMode-safe) rather than counting effect invocations", () => {
  const layout = read("src/layouts/CurriculumLayout.jsx");
  assert.match(layout, /previousPathnameRef/);
  assert.match(layout, /previousPathname !== null && previousPathname !== pathname/);
  assert.match(layout, /mainRef\.current\?\.focus\(\)/);
  assert.match(layout, /id="curriculum-main" className="ld-main" tabIndex=\{-1\} ref=\{mainRef\}/);
  assert.doesNotMatch(layout, /isInitialRouteRef/, "the boolean-flag guard is StrictMode-unsafe and must not return");
});
