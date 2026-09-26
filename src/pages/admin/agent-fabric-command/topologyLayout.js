// src/pages/admin/agent-fabric-command/topologyLayout.js
// Deterministic geometry for the ecosystem map. Pure: positions are computed
// from the available width, never from data, so status changes never move nodes.
//
// FRAME layout (map width >= FRAME_MIN_WIDTH): the hub sits in the centre, SHS
// (the only upstream ingestion path) at left-middle, LOO at right-middle, and
// every other system on a top or bottom row. Hub dependencies are straight
// spokes into open space, so no edge ever passes behind an unrelated node and
// reads as a relationship that does not exist.
// GRID layout (narrow): nodes in a grid, no drawn edges; path membership is
// labelled on each node instead.
import { HUB_ID } from "./ecosystemTopology.js";

export const FRAME_MIN_WIDTH = 860;
export const TOP_ROW = Object.freeze(["curriculum", "career", "shf", "bos", "truth", "watchtower", "oracle"]);
export const BOTTOM_ROW = Object.freeze(["civicsure", "metaverse", "registry", "guardrails", "reporting", "treasury"]);
export const MID_LEFT = "shs";
export const MID_RIGHT = "loo";
export const GRID_ORDER = Object.freeze([
  "civicsure", "curriculum", "career", "shs",
  "truth", "oracle", "watchtower", "loo", "reporting",
  "registry", "guardrails", "treasury", "shf", "bos", "metaverse",
]);

// 226px is ~25% of a 900px-tall viewport: the map leads the page without
// pushing Recent Operations below the fold at 1440x900.
export const FRAME_HEIGHT = 226;
const NODE_H = 44;
const HUB_W = 176;
const HUB_H = 56;

export function computeLayout(width) {
  const w = Math.max(280, Math.floor(width || 0));
  return w >= FRAME_MIN_WIDTH ? frameLayout(w) : gridLayout(w);
}

function frameLayout(width) {
  const pad = 6;
  const height = FRAME_HEIGHT;
  const yTop = 25;
  const yMid = height / 2;
  const yBot = height - 25;
  const slot = (width - pad * 2) / TOP_ROW.length;
  const nodeW = Math.min(196, Math.floor(slot - 12));
  const bottomSlot = (width - pad * 2) / BOTTOM_ROW.length;
  const nodes = {};
  TOP_ROW.forEach((id, i) => { nodes[id] = { x: pad + slot * (i + 0.5), y: yTop, w: nodeW, h: NODE_H }; });
  BOTTOM_ROW.forEach((id, i) => { nodes[id] = { x: pad + bottomSlot * (i + 0.5), y: yBot, w: nodeW, h: NODE_H }; });
  nodes[MID_LEFT] = { x: pad + slot * 0.5, y: yMid, w: nodeW, h: NODE_H };
  nodes[MID_RIGHT] = { x: pad + slot * (TOP_ROW.length - 0.5), y: yMid, w: nodeW, h: NODE_H };
  nodes[HUB_ID] = { x: width / 2, y: yMid, w: HUB_W, h: HUB_H };
  return { kind: "frame", width, height, nodes, drawsEdges: true };
}

function gridLayout(width) {
  const pad = 4;
  const gap = 8;
  const columns = width >= 560 ? 3 : 2;
  const cellW = (width - pad * 2 - gap * (columns - 1)) / columns;
  const pitch = NODE_H + gap;
  const nodes = {};
  nodes[HUB_ID] = { x: width / 2, y: pad + 26, w: Math.min(width - pad * 2, 260), h: 52 };
  let top = pad + 52 + gap * 2;
  GRID_ORDER.forEach((id, i) => {
    const col = i % columns;
    const row = Math.floor(i / columns);
    nodes[id] = { x: pad + col * (cellW + gap) + cellW / 2, y: top + row * pitch + NODE_H / 2, w: cellW, h: NODE_H };
  });
  const rows = Math.ceil(GRID_ORDER.length / columns);
  const height = top + rows * pitch + pad;
  return { kind: "grid", width, height, nodes, drawsEdges: false };
}

// Where a ray from the box centre toward (tx, ty) leaves the box.
function boxExit(box, tx, ty) {
  const dx = tx - box.x;
  const dy = ty - box.y;
  if (dx === 0 && dy === 0) return { x: box.x, y: box.y };
  const sx = dx === 0 ? Infinity : box.w / 2 / Math.abs(dx);
  const sy = dy === 0 ? Infinity : box.h / 2 / Math.abs(dy);
  const s = Math.min(sx, sy);
  return { x: box.x + dx * s, y: box.y + dy * s };
}

const round = (n) => Math.round(n * 10) / 10;

// The midpoint of the node edge that faces the hub. Spokes aim here rather than
// at the node centre so shallow spokes clear the neighbouring node's corner.
function facingPoint(box, hub) {
  if (box.y < hub.y - 10) return { x: box.x, y: box.y + box.h / 2 };
  if (box.y > hub.y + 10) return { x: box.x, y: box.y - box.h / 2 };
  return { x: box.x + (box.x < hub.x ? box.w / 2 : -box.w / 2), y: box.y };
}

// SVG path for an edge. Hub edges are straight spokes. Other edges bow
// perpendicular to their chord, toward the hub row, far enough to clear any node
// between the two ends. `pair` (+1 / -1) separates a reciprocal A->B / B->A pair.
export function edgePath(edge, layout, { pair = 0 } = {}) {
  const a = layout.nodes[edge.from];
  const b = layout.nodes[edge.to];
  if (!a || !b) return null;
  if (edge.from === HUB_ID || edge.to === HUB_ID) {
    const hub = edge.from === HUB_ID ? a : b;
    const other = edge.from === HUB_ID ? b : a;
    const end = facingPoint(other, hub);
    const start = boxExit(hub, end.x, end.y);
    const [p1, p2] = edge.from === HUB_ID ? [start, end] : [end, start];
    return { d: `M${round(p1.x)},${round(p1.y)} L${round(p2.x)},${round(p2.y)}`, mid: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 } };
  }
  const cx = layout.width / 2;
  const cy = layout.height / 2;
  if (Math.abs(a.y - b.y) < 1) {
    // Same row: leave and enter through the edges facing the hub row and dip
    // far enough that the curve clears every node between the two ends.
    const sign = a.y < cy ? 1 : -1;
    const dir = b.x > a.x ? 1 : -1;
    const edgeY = a.y + (sign * a.h) / 2;
    const inset = Math.min(a.w / 4, 20);
    const p1 = { x: a.x + dir * inset, y: edgeY };
    const p2 = { x: b.x - dir * inset, y: edgeY };
    const depth = 22 + Math.abs(b.x - a.x) * 0.08 + pair * 10;
    const qx = (p1.x + p2.x) / 2;
    const qy = edgeY + sign * depth;
    return {
      d: `M${round(p1.x)},${round(p1.y)} Q${round(qx)},${round(qy)} ${round(p2.x)},${round(p2.y)}`,
      mid: { x: qx, y: edgeY + (sign * depth) / 2 },
    };
  }
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dist = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  let nx = -(b.y - a.y) / dist;
  let ny = (b.x - a.x) / dist;
  if (nx * (cx - mx) + ny * (cy - my) < 0) { nx = -nx; ny = -ny; }
  const bow = Math.min(64, 14 + dist * 0.12) + pair * 14;
  const qx = mx + nx * bow;
  const qy = my + ny * bow;
  const p1 = boxExit(a, qx, qy);
  const p2 = boxExit(b, qx, qy);
  // Point on the quadratic curve at t = 0.5 (for labels).
  const mid = { x: 0.25 * p1.x + 0.5 * qx + 0.25 * p2.x, y: 0.25 * p1.y + 0.5 * qy + 0.25 * p2.y };
  return { d: `M${round(p1.x)},${round(p1.y)} Q${round(qx)},${round(qy)} ${round(p2.x)},${round(p2.y)}`, mid };
}
