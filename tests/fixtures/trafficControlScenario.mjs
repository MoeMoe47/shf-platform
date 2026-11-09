import { advanceRouteFleetVehicles } from '../../src/system/metaverse/traffic/metaverseTrafficCorridorRuntime.js';
import { createTrafficControlRegistry, createTrafficControlState } from '../../src/system/metaverse/traffic/metaverseTrafficIntersectionControls.js';

// Synthetic isolated geometry; never imported by Avalon or any app registry.
export function createTrafficScenario({ type = 'ALL_WAY_STOP', approaches = ['north', 'east'], offsets = {}, turns = {}, holdSeconds = .6, reverse = false, vehicleLengths } = {}) {
  const lines = { north: [[50,0],[50,100]], east: [[100,50],[0,50]], south: [[50,100],[50,0]], west: [[0,50],[100,50]] };
  const right = { north: 'west', west: 'south', south: 'east', east: 'north' };
  const opposing = { north: 'south', south: 'north', east: 'west', west: 'east' };
  const registry = createTrafficControlRegistry({
    corridors: Object.fromEntries(approaches.map(id => [id, { length: 100, vehicleLength: 4, vehicleLengths, minGap: 2, timeHeadway: .6, acceleration: 3, deceleration: 4 }])),
    intersections: [{ id: 'isolated-junction', type, holdSeconds, priorityLookahead: 25,
      approaches: approaches.map(id => ({ id, routeId: id, stopProgress: .4, exitProgress: .6,
        stopControlled: type === 'ALL_WAY_STOP' || (type === 'TWO_WAY_STOP' && ['north','south'].includes(id)),
        rightApproachId: approaches.includes(right[id]) ? right[id] : undefined,
        opposingApproachId: approaches.includes(opposing[id]) ? opposing[id] : undefined,
        turn: turns[id] ?? 'STRAIGHT' })) }],
  });
  const routes = approaches.map(id => ({ id, status: 'APPROVED', direction: 'FORWARD', vehicle_classes: ['CAR'], speed_class: 'URBAN_SLOW', points: lines[id].map(([x,y]) => ({x,y})), perspective: [{t:0,scale:1},{t:1,scale:1}] }));
  if (reverse) routes.reverse();
  const routeOptions = Object.fromEntries(approaches.map(id => [id, { offsets: offsets[id] ?? [.1], startDelay: 0, progressPerSecond: .08 }]));
  const engine = { vehicleStates: new Map(), previousHeadings: new Map(), routeElapsed: new Map() };
  const controlState = createTrafficControlState(), pedestrianOccupancy = {};
  const step = (dt = .02, controlled = true) => advanceRouteFleetVehicles({ routes, routeOptions, ...engine, dtSeconds: dt,
    ...(controlled ? { intersectionControls: { registry, state: controlState, pedestrianOccupancy } } : {}) });
  return { routes, routeOptions, engine, registry, controlState, pedestrianOccupancy, step };
}
