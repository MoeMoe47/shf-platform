import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(new URL("../src/pages/metaverse/MetaverseCityPage.jsx", import.meta.url), "utf8");
const clientSource = readFileSync(new URL("../src/system/metaverse/metaverseCommunicationClient.js", import.meta.url), "utf8");
const hudSource = readFileSync(new URL("../src/components/metaverse/MetaversePresenceHud.jsx", import.meta.url), "utf8");
const chatSource = readFileSync(new URL("../src/components/metaverse/MetaverseChatTray.jsx", import.meta.url), "utf8");
const participantsSource = readFileSync(new URL("../src/components/metaverse/MetaverseParticipantList.jsx", import.meta.url), "utf8");
const safetyMenuSource = readFileSync(new URL("../src/components/metaverse/MetaverseSafetyMenu.jsx", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../src/pages/metaverse/metaverse-city.css", import.meta.url), "utf8");

test("MET-6 communication client talks to the real presence/room API only", () => {
  assert.match(clientSource, /\/metaverse\/presence/);
  assert.match(clientSource, /\/metaverse\/rooms/);
  assert.match(clientSource, /credentials: "include"/);
  assert.equal(/organization_id\s*:/.test(clientSource), false);
  assert.equal(/role\s*:\s*["']/.test(clientSource), false);
});

test("MET-6 city page wires presence lifecycle through the runtime client", () => {
  assert.match(pageSource, /startPresence\(/);
  assert.match(pageSource, /heartbeatPresence\(/);
  assert.match(pageSource, /revokePresence\(/);
  assert.match(pageSource, /getCityPresence\(/);
});

test("MET-6 no fake or hardcoded presence counts in source", () => {
  assert.doesNotMatch(pageSource, /\d+\s+online|student-\d|fake online/i);
  assert.doesNotMatch(hudSource, /\d+\s+online|student-\d|fake online/i);
  assert.match(hudSource, /counts\s*\|\|\s*\[\]/);
});

test("MET-6 city overview never requests identity-level participants", () => {
  // Aggregate-only projection: the presence HUD renders totals derived
  // from getCityPresence() counts, never a room/participants call.
  assert.doesNotMatch(hudSource, /getRoomParticipants|getParticipants/);
});

test("MET-6 participant list renders only server-provided rows, never fabricates a roster", () => {
  assert.match(participantsSource, /participants \|\| \[\]/);
  assert.doesNotMatch(participantsSource, /student-\d|fake/i);
});

test("MET-6 chat room is created through server-authorized FACILITY_ROOM, not a client-declared room", () => {
  assert.match(pageSource, /getOrCreateRoom\(\{ room_type: "FACILITY_ROOM"/);
});

test("MET-6 student direct messaging remains disabled by default in the UI", () => {
  assert.match(pageSource, /getRoomsPolicy/);
  assert.doesNotMatch(pageSource, /room_type:\s*["']DIRECT_MESSAGE["']/);
  assert.doesNotMatch(chatSource, /DIRECT_MESSAGE/);
});

test("MET-6 chat tray never forges sender identity on submit", () => {
  assert.match(chatSource, /sendMessage\(room\.room_id/);
  assert.doesNotMatch(chatSource, /sender_user_id\s*:/);
  assert.doesNotMatch(chatSource, /client_claimed_sender_user_id/);
});

test("MET-6 chat tray provides mute, block, and report actions per message", () => {
  assert.match(chatSource, /muteParticipant\(room\.room_id/);
  assert.match(chatSource, /blockParticipant\(room\.room_id/);
  assert.match(chatSource, /reportParticipant\(room\.room_id/);
  assert.match(chatSource, /MetaverseSafetyMenu/);
});

test("MET-6 safety menu supports mute, block, and report with a reviewable reason", () => {
  assert.match(safetyMenuSource, /onMute\(targetUserId\)/);
  assert.match(safetyMenuSource, /onBlock\(targetUserId\)/);
  assert.match(safetyMenuSource, /onReport\(/);
  assert.match(safetyMenuSource, /category/);
});

test("MET-6 chat message body is bounded client-side to match server limit", () => {
  assert.match(chatSource, /maxLength=\{1000\}/);
});

test("MET-6 accessibility: chat log, live regions, and focus management exist", () => {
  assert.match(chatSource, /role="log"/);
  assert.match(chatSource, /aria-live="polite"/);
  assert.match(chatSource, /closeButtonRef\.current\?\.focus\(\)/);
  assert.match(safetyMenuSource, /aria-haspopup="menu"/);
  assert.match(participantsSource, /met-sr-only/);
});

test("MET-6 accessibility: presence status is not color-only", () => {
  assert.match(hudSource, /<select/);
  assert.match(hudSource, /aria-label="Set your presence status"/);
  assert.match(participantsSource, /met-status-dot/);
});

test("MET-6 mobile/tablet chat and participant surfaces are responsive", () => {
  assert.match(cssSource, /@media \(max-width:\s*620px\)/);
  assert.match(cssSource, /\.met-chat-tray__panel/);
  assert.match(cssSource, /\.met-participants/);
});

test("MET-6 reduced motion shell still applies to the communication overlay", () => {
  assert.match(pageSource, /data-reduced-motion=/);
});

test("MET-6 presence HUD reflects server-authoritative status lifecycle, not a client toggle of authority", () => {
  assert.match(pageSource, /handleStatusChange/);
  assert.match(pageSource, /heartbeatPresence\(presenceSessionId/);
});
