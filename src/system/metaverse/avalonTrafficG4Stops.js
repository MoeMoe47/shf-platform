import {
  createTrafficControlRegistry,
  createTrafficControlState
} from './traffic/metaverseTrafficIntersectionControls.js';

// Private G4 candidate geometry. NOT approved for live activation.
// Controller stopProgress represents FRONT BUMPER, not vehicle center.
// Corridor length is normalized to 1.
const CANDIDATES = Object.freeze({
  'AUTUMN/DAY': {
    'rear-west': { center: 0.32988, entry: 0.3852, exit: 0.4340 },
    'front-garden': { center: 0.38061, entry: 0.4112, exit: 0.4485 }
  },
  'AUTUMN/DUSK': {
    'rear-west': { center: 0.33347, entry: 0.3878, exit: 0.4360 },
    'front-garden': { center: 0.37893, entry: 0.4091, exit: 0.4456 }
  },
  'AUTUMN/NIGHT': {
    'rear-west': { center: 0.33139, entry: 0.3861, exit: 0.4346 },
    'front-garden': { center: 0.37941, entry: 0.4094, exit: 0.4458 }
  },
  'WINTER/DAY': {
    'front-garden': { center: 0.38077, entry: 0.4116, exit: 0.4491 }
  },
  'WINTER/DUSK': {
    'front-garden': { center: 0.38073, entry: 0.4116, exit: 0.4490 }
  },
  'WINTER/NIGHT': {
    'front-garden': { center: 0.38062, entry: 0.4115, exit: 0.4491 }
  }
});

export function createAvalonG4Stops(scene, routes) {
  const candidates = CANDIDATES[scene];
  if (!candidates || !Array.isArray(routes)) {
    throw Error('Unverified Avalon G4 scene or routes');
  }

  const corridors = {};
  const intersections = [];

  for (const route of routes) {
    const geometry = candidates[route.view];
    if (!geometry) {
      throw Error('No verified G4 candidate for ' + route.view);
    }

    // Provisional model: the controller uses a constant vehicle
    // footprint; actual perspective-scaled body verification is
    // required before live activation.
    const vehicleLength = 0.012;
    const stopProgress = geometry.center + vehicleLength / 2;

    if (!(stopProgress < geometry.entry &&
          geometry.entry < geometry.exit)) {
      throw Error('Unsafe G4 stop geometry');
    }

    corridors[route.id] = {
      length: 1,
      vehicleLength,
      minGap: 0.008,
      timeHeadway: 0.8,
      acceleration: 0.015,
      deceleration: 0.025
    };

    intersections.push({
      id: 'avalon-g4-' + route.view,
      type: 'ALL_WAY_STOP',
      holdSeconds: 2,
      approaches: [{
        id: route.view,
        routeId: route.id,
        stopProgress,
        exitProgress: geometry.exit,
        stopControlled: true,
        turn: 'STRAIGHT'
      }]
    });
  }

  return {
    registry: createTrafficControlRegistry({
      corridors,
      intersections
    }),
    state: createTrafficControlState(),
    pedestrianOccupancy: {}
  };
}
