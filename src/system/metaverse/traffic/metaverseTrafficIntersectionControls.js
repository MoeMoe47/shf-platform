// Optional fleet-wide policy for the canonical Traffic Engine. This module
// plans rates/reservations only; the existing lifecycle and sampler move cars.
// Distances use an explicitly calibrated corridor-local unit, never map coords.

/** @typedef {{id:string, routeId:string, stopProgress:number, exitProgress:number, stopControlled:boolean, rightApproachId?:string, opposingApproachId?:string, turn?:string}} Approach */
/** @typedef {{id:string, type:string, holdSeconds?:number, simultaneousWindow?:number, priorityLookahead?:number, approaches:Approach[]}} Intersection */
/** @typedef {{length:number, vehicleLength:number, vehicleLengths?:number[], acceleration?:number, deceleration?:number, minGap?:number, timeHeadway?:number}} Corridor */
/** @typedef {{intersections:Intersection[], corridors:Record<string,Corridor>}} Registry */

const positive = n => Number.isFinite(n) && n > 0;
const nonnegative = n => Number.isFinite(n) && n >= 0;
const validatedRegistries = new WeakSet();
const compareKeys = (a,b) => a === b ? 0 : a < b ? -1 : 1;

/** Validate explicit caller-owned topology; nothing is inferred from artwork.
 * @param {Registry} input @returns {Registry} */
export function createTrafficControlRegistry(input) {
  const registry = structuredClone(input);
  if (!registry || !Array.isArray(registry.intersections) || !registry.corridors) throw Error('Invalid traffic control registry');
  const zones = new Set(), routes = new Set();
  for (const [id, p] of Object.entries(registry.corridors)) {
    if (!positive(p.length) || !positive(p.vehicleLength) || p.vehicleLength >= p.length ||
      p.vehicleLengths?.some(v => !positive(v) || v >= p.length) ||
      !positive(p.acceleration ?? 3) || !positive(p.deceleration ?? 4) ||
      !nonnegative(p.minGap ?? 2) || !nonnegative(p.timeHeadway ?? .8)) throw Error(`Invalid corridor footprint/dynamics: ${id}`);
  }
  for (const zone of registry.intersections) {
    if (!zone.id || zones.has(zone.id) || !['ALL_WAY_STOP', 'TWO_WAY_STOP', 'CROSSWALK'].includes(zone.type) ||
      !zone.approaches?.length || !nonnegative(zone.holdSeconds ?? 1) ||
      !nonnegative(zone.simultaneousWindow ?? .1) || !positive(zone.priorityLookahead ?? 30)) throw Error('Invalid intersection');
    zones.add(zone.id);
    const ids = new Set(zone.approaches.map(a => a.id));
    if (ids.size !== zone.approaches.length) throw Error('Duplicate approach');
    for (const a of zone.approaches) {
      if (!a.id || routes.has(a.routeId) || !registry.corridors[a.routeId] ||
        !positive(a.stopProgress) || a.exitProgress <= a.stopProgress || a.exitProgress >= 1 ||
        !Number.isFinite(a.exitProgress) || typeof a.stopControlled !== 'boolean' ||
        !['STRAIGHT', 'RIGHT', 'LEFT'].includes(a.turn ?? 'STRAIGHT') ||
        (a.rightApproachId && (!ids.has(a.rightApproachId) || a.rightApproachId === a.id)) ||
        (a.opposingApproachId && (!ids.has(a.opposingApproachId) || a.opposingApproachId === a.id))) throw Error('Invalid or duplicate corridor approach');
      routes.add(a.routeId);
    }
    if (zone.type === 'ALL_WAY_STOP' && zone.approaches.some(a => !a.stopControlled)) throw Error('All-way approaches must stop');
    if (zone.type === 'TWO_WAY_STOP' && (!zone.approaches.some(a => a.stopControlled) || !zone.approaches.some(a => !a.stopControlled))) throw Error('Two-way stop requires a priority road');
    if (zone.type === 'CROSSWALK' && zone.approaches.some(a => a.stopControlled)) throw Error('Crosswalk occupancy does not imply a stop sign');
  }
  // Freeze nested caller input too: mid-run topology edits require a new state.
  const freeze = value => { Object.values(value).forEach(v => { if (v && typeof v === 'object') freeze(v); }); return Object.freeze(value); };
  validatedRegistries.add(registry);
  return freeze(registry);
}

export function createTrafficControlState() {
  return { elapsed: 0, vehicles: new Map(), reservations: new Map(), events: [], registry: null };
}

const emit = (state, type, key, zoneId) => {
  state.events.push({ time: state.elapsed, type, key, zoneId });
  if (state.events.length > 512) state.events.shift();
};

/** Fleet-wide decision, called only by advanceRouteFleetVehicles.
 * @param {{entries:any[], registry:Registry, state:ReturnType<typeof createTrafficControlState>, dt:number, pedestrianOccupancy?:Record<string,boolean>}} args
 */
export function planTrafficControlStep({ entries, registry, state, dt, pedestrianOccupancy = {} }) {
  if (!validatedRegistries.has(registry)) throw Error('Use createTrafficControlRegistry before activation');
  if (state.registry && state.registry !== registry) throw Error('New traffic topology requires a fresh control state');
  state.registry = registry;
  state.elapsed += dt;
  const plans = new Map(), active = [];
  for (const entry of entries) {
    const profile = registry.corridors[entry.routeId];
    if (!profile) continue;
    const zone = registry.intersections.find(z => z.approaches.some(a => a.routeId === entry.routeId));
    if (!zone) continue;
    const approach = zone.approaches.find(a => a.routeId === entry.routeId);
    if (!positive(entry.cruiseSpeed)) throw Error('Controlled corridor requires a positive cruise rate; use stop controls, not a zero-speed profile');
    const length = profile.vehicleLengths?.[entry.slot % profile.vehicleLengths.length] ?? profile.vehicleLength;
    const position = entry.current.progress * profile.length;
    let memory = state.vehicles.get(entry.key);
    if (!memory || entry.current.progress < memory.previousProgress) {
      memory = { speed: 0, stoppedAt: null, granted: false, passed: false, previousProgress: entry.current.progress, status: 'APPROACH' };
      state.vehicles.set(entry.key, memory);
      const front = position + length/2, rear = position-length/2;
      if (front > approach.stopProgress*profile.length + 1e-6 && rear < approach.exitProgress*profile.length) throw Error('Controlled vehicle must spawn before the stop line or after the conflict zone');
      memory.passed = rear >= approach.exitProgress*profile.length;
    }
    if (dt > 0) memory.previousProgress = entry.current.progress;
    const item = { ...entry, profile, zone, approach, length, position, memory,
      front: position+length/2, rear: position-length/2, live: entry.current.respawnRemaining <= 0 && !entry.current.ended };
    active.push(item);
  }
  active.sort((a,b) => compareKeys(a.key,b.key));
  if (dt === 0) return new Map(active.map(e => [e.key, {
    progressPerSecond: 0, speed: e.memory.speed, status: e.memory.status, zoneId: e.zone.id,
  }]));
  for (const zone of registry.intersections) {
    const owner = state.reservations.get(zone.id), vehicle = active.find(e => e.key === owner);
    if (vehicle && pedestrianOccupancy[zone.id] === true &&
      vehicle.front <= vehicle.approach.stopProgress*vehicle.profile.length) {
      state.reservations.delete(zone.id);
      vehicle.memory.granted = false;
      emit(state, 'YIELD_PEDESTRIAN', owner, zone.id);
    }
    if (owner && (!vehicle || !vehicle.live || vehicle.rear >= vehicle.approach.exitProgress*vehicle.profile.length)) {
      state.reservations.delete(zone.id);
      if (vehicle) { vehicle.memory.passed = true; vehicle.memory.granted = false; }
      emit(state, 'CLEARED', owner, zone.id);
    }
  }
  for (const e of active.filter(e => e.live && !e.memory.passed)) {
    const distance = e.approach.stopProgress*e.profile.length-e.front;
    if (e.approach.stopControlled && distance <= .002 && e.memory.speed === 0 && e.memory.stoppedAt === null) {
      e.memory.stoppedAt = state.elapsed;
      emit(state, 'STOPPED', e.key, e.zone.id);
    }
  }
  if (dt > 0) for (const zone of registry.intersections) {
    if (state.reservations.has(zone.id) || pedestrianOccupancy[zone.id] === true) continue;
    const waiting = active.filter(e => e.live && e.zone.id === zone.id && !e.memory.passed && !e.memory.granted);
    const leaders = waiting.filter(e => !waiting.some(other => other.routeId === e.routeId && other.position > e.position));
    const priority = leaders.filter(e => !e.approach.stopControlled &&
      e.approach.stopProgress*e.profile.length-e.front <= (zone.priorityLookahead ?? 30));
    let candidates;
    if (zone.type === 'TWO_WAY_STOP' && priority.length) candidates = priority;
    else candidates = leaders.filter(e => (!e.approach.stopControlled && priority.includes(e)) || e.memory.stoppedAt !== null);
    if (!candidates.length) continue;
    // Priority approaches are admitted before reaching the line. Stopped
    // approaches arbitrate first arrival, then right-hand/turn ties.
    candidates.sort((a,b) => (a.memory.stoppedAt ?? state.elapsed)-(b.memory.stoppedAt ?? state.elapsed) || compareKeys(a.key,b.key));
    const first = candidates[0], time = first.memory.stoppedAt ?? state.elapsed;
    const tied = candidates.filter(e => Math.abs((e.memory.stoppedAt ?? state.elapsed)-time) <= (zone.simultaneousWindow ?? .1));
    if (tied.some(e => e.approach.stopControlled &&
      state.elapsed-e.memory.stoppedAt < Math.max(zone.holdSeconds ?? 1, zone.simultaneousWindow ?? .1))) continue;
    const yields = (a,b) => a.approach.rightApproachId === b.approach.id ||
      ((a.approach.turn === 'LEFT') && a.approach.opposingApproachId === b.approach.id && b.approach.turn !== 'LEFT');
    const unblocked = tied.filter(a => !tied.some(b => b !== a && yields(a,b)));
    // Four simultaneous drivers can form a right-hand cycle. Stable key order
    // breaks only that unresolved tie, guaranteeing progress without overlap.
    const winner = (unblocked.length ? unblocked : tied)[0];
    state.reservations.set(zone.id, winner.key);
    winner.memory.granted = true;
    emit(state, 'GRANTED', winner.key, zone.id);
  }
  for (const e of active) {
    const { profile: p, memory: m } = e;
    const others = active.filter(o => o.live && o.routeId === e.routeId && o.key !== e.key);
    if (!e.live) {
      const blocked = others.some(o => o.rear < e.length/2+(p.minGap ?? 2));
      plans.set(e.key, { progressPerSecond: 0, holdRespawn: blocked, speed: 0, status: 'RESPAWN' });
      m.speed = 0;
      continue;
    }
    const leader = others.filter(o => o.position > e.position || (o.position === e.position && o.key < e.key))
      .sort((a,b) => a.position-b.position || compareKeys(a.key,b.key))[0];
    const physicalGap = leader ? leader.rear-e.front-(p.minGap ?? 2) : Infinity;
    if (physicalGap < -1e-6) throw Error('Controlled fleet has overlapping initial footprints or insufficient following gap');
    let distance = leader ? Math.max(0, physicalGap-(p.timeHeadway ?? .8)*m.speed) : Infinity;
    let status = leader ? 'FOLLOWING' : 'CRUISING';
    if (!m.passed && !m.granted) {
      const stopDistance = Math.max(0, e.approach.stopProgress*p.length-e.front);
      if (stopDistance <= distance) { distance = stopDistance; status = e.approach.stopControlled ? 'APPROACH' : 'YIELDING'; }
    }
    const deceleration = p.deceleration ?? 4, acceleration = p.acceleration ?? 3;
    const target = Math.min(e.cruiseSpeed,
      Math.sqrt((deceleration*dt)**2+2*deceleration*distance)-deceleration*dt);
    let speed = Math.max(m.speed-deceleration*dt, Math.min(m.speed+acceleration*dt, target));
    let travel = speed*dt;
    // Exact bumper latch after smooth braking. Tolerance is .002 corridor
    // units, independent of pixels/perspective and never a permanent profile.
    if (distance <= .002 && m.speed <= deceleration*dt) { speed = 0; travel = distance; }
    travel = Math.min(travel, distance, Math.max(0, physicalGap));
    if (dt > 0) m.speed = speed;
    if (!m.granted && !m.passed && m.stoppedAt !== null) status = 'STOPPED';
    if (m.granted) status = 'CROSSING';
    if (dt > 0) m.status = status;
    plans.set(e.key, { progressPerSecond: dt > 0 ? travel/dt/p.length : 0, speed: m.speed, status: m.status, zoneId: e.zone.id });
  }
  return plans;
}
