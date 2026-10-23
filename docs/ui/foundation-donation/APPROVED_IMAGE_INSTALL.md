# Approved Donation photography installation — SHF-DONATION-IMAGE-002

Owner authority: explicit approval of the nine described images in this conversation. All source identities were checked against visible content and dimensions, not filename alone. The supplied collage is reference only; it was not sliced or installed. Source files are preserved in Downloads; application code uses only production asset URLs.

Conversion: existing Pillow WebP capability, RGB, quality 95, method 6, no resizing or destructive crop. Full source/output dimensions are identical. The machine-readable manifest records source/output SHA-256, source modification time, installed URL, dimensions and byte size. No image generation performed.

| Slot                  | Source file (under `/Users/mikeslate/Downloads/`) | Installed file (under `/assets/foundation/donation/`) | Source → output dimensions | Status                     |
| --------------------- | ------------------------------------------------- | ----------------------------------------------------- | -------------------------- | -------------------------- |
| hero                  | `Hopeful Gaze Over the City.png`                  | `donation-hero.webp`                                  | 1672 × 941 → 1672 × 941    | OWNER APPROVED — INSTALLED |
| support-impact        | `Hopeful Horizons at Sunset.png`                  | `donation-impact-support.webp`                        | 1122 × 1402 → 1122 × 1402  | OWNER APPROVED — INSTALLED |
| one-time-gift         | `Focused Student Studying in a Warm Library.png`  | `donation-one-time-gift.webp`                         | 1536 × 1024 → 1536 × 1024  | OWNER APPROVED — INSTALLED |
| monthly-giving        | `Collaborative Campus Study Session.png`          | `donation-monthly-giving.webp`                        | 1536 × 1024 → 1536 × 1024  | OWNER APPROVED — INSTALLED |
| corporate-support     | `Mentorship Conversation in a Warm Office.png`    | `donation-corporate-support.webp`                     | 1536 × 1024 → 1536 × 1024  | OWNER APPROVED — INSTALLED |
| grants-foundations    | `Golden-Hour Campus Study Circle.png`             | `donation-grants-foundations.webp`                    | 1536 × 1024 → 1536 × 1024  | OWNER APPROVED — INSTALLED |
| employer-partnerships | `Workforce Development Partnership Meeting.png`   | `donation-employer-partnerships.webp`                 | 1536 × 1024 → 1536 × 1024  | OWNER APPROVED — INSTALLED |
| planned-giving        | `Young Dreamers Watching the Sunset.png`          | `donation-planned-giving.webp`                        | 1536 × 1024 → 1536 × 1024  | OWNER APPROVED — INSTALLED |
| gift-impact           | `Real Skills, Real Impact.png`                    | `donation-impact-banner.webp`                         | 2007 × 783 → 2007 × 783    | OWNER APPROVED — INSTALLED |

## Visual identity / source selection

- Hero: Hopeful Gaze Over the City, a clean text-free image of the braided young woman in a dark hoodie/backpack at the sunset city/riverfront. Earlier timestamp 2026-10-23 13:42 matches the owner's reference to the clean Hero generated earlier. All HTML hero copy and handwriting remain unchanged.
- Support portrait: Hopeful Horizons at Sunset, two young people looking toward sunset; vertical original, 2026-10-23 13:48.
- One-Time through Planned: the six individually supplied PNGs, source times 2026-10-23 13:59–14:06, matched visually to the six approved descriptions. Planned Giving specifically uses Young Dreamers Watching the Sunset, not either earlier unapproved panorama.
- Impact banner: Real Skills, Real Impact, 2007 × 783; visually inspected and matched to the owner's explicit four-person sunset banner with “REAL SKILLS. REAL PEOPLE. REAL IMPACT.” and “OPPORTUNITY CHANGES LIVES.” Its earlier 2026-10-22 timestamp does not override this explicit content approval.

## Display and crop

These are installation-time notes. Completed Sections 02, 04, 05 and 06 in HANDOFF.md supersede their crop/height values. Current source-verified behavior and the full-page verdict are documented in [FINAL_PRODUCTION_READINESS.md](FINAL_PRODUCTION_READINESS.md); asset identities and file dimensions remain unchanged.

Hero retains cover, center 47% desktop / 60% center mobile. Support retains cover with desktop position 30% center, mobile center 38%. Cards retain consistent existing 120px desktop / 110px mobile heights, cover/center, no reordering or action/text changes. Output image files contain no crop.

The impact photo region retains its place in the three-part navy band, but its image aspect ratio is 2007 / 783 with minimum height zero and centered self-alignment. This image-only aspect-ratio refinement shows the entire wide approved banner instead of cutting off its baked-in slogans or stretching/letterboxing inside the image box. The existing image dimming filter is removed to preserve the approved asset's lettering. The old “REAL SUPPORT. REAL OPPORTUNITY.” HTML text remains accessible using the existing visually-hidden utility, avoiding an overlapping visual overlay. The image alt describes the scene and transcribes both baked-in slogans. No other page copy changed.

## Verification

See the latest IMAGE-002 section in HANDOFF.md for fresh test/build/browser results. Full browser crop/overflow verification at 1440/1280/768/390px remains required if Chromium cannot launch. Asset approval and installation are distinct from a final visual lock.
