import assert from 'node:assert/strict';
import test from 'node:test';
import { createTrafficContinuitySignatures, reconcileTrafficContinuity, isDecodedTrafficPlate } from '../src/system/metaverse/traffic/metaverseTrafficContinuity.js';
import { advanceRouteFleetVehicles } from '../src/system/metaverse/traffic/metaverseTrafficCorridorRuntime.js';
import { AVALON_PHASE3P } from '../src/system/metaverse/avalonTrafficJourneyRecovery.js';

const calibration = AVALON_PHASE3P.DAY;
const signatures = () => createTrafficContinuitySignatures(calibration.routes, calibration.options);
const state = () => ({ vehicleStates: new Map(), previousHeadings: new Map(), routeElapsed: new Map(), slotStates: new Map() });

test('equivalent route arrays preserve actual engine vehicle IDs, progress, spacing and map identity', () => {
  const maps = state();
  const args = { routes: calibration.routes, routeOptions: calibration.options, ...maps };
  const before = advanceRouteFleetVehicles({ ...args, dtSeconds: 8 });
  for (const v of before) maps.slotStates.set(v.key, { model: 'existing-slot' });
  const snapshot = JSON.stringify([...maps.vehicleStates]);
  const previous = signatures();
  const next = createTrafficContinuitySignatures(structuredClone(calibration.routes), structuredClone(calibration.options));
  const result = reconcileTrafficContinuity({ previous, next, ...maps });
  assert.equal(result.retainedRouteIds.length, calibration.routes.length);
  assert.equal(JSON.stringify([...maps.vehicleStates]), snapshot);
  const paused = advanceRouteFleetVehicles({ ...args, dtSeconds: 0 });
  assert.deepEqual(paused.map(({ headingDeg, ...v }) => v), before.map(({ headingDeg, ...v }) => v));
  assert.ok(paused.every((v, i) => Math.abs(v.headingDeg - before[i].headingDeg) < 1e-10));
  assert.equal(maps.slotStates.size, before.length);
  const advanced = advanceRouteFleetVehicles({ ...args, dtSeconds: .02 });
  assert.deepEqual(advanced.map(v => v.key), before.map(v => v.key));
  assert.ok(advanced.every((v, i) => v.progress >= before[i].progress));
});

test('geometry, scale, model and option changes invalidate only affected routes', () => {
  for (const mutate of [
    c => c.routes[0].points[0].x += 1,
    c => c.routes[0].presentationScale = 99,
    c => c.routes[0].eligibleModels = ['unapproved'],
    c => c.options[c.routes[0].id].offsets = [.1, .3],
  ]) {
    const maps = state();
    advanceRouteFleetVehicles({ routes: calibration.routes, routeOptions: calibration.options, ...maps, dtSeconds: 8 });
    const changed = structuredClone(calibration); mutate(changed);
    const result = reconcileTrafficContinuity({ previous: signatures(), next: createTrafficContinuitySignatures(changed.routes, changed.options), ...maps });
    assert.equal(result.invalidatedRouteIds.length, 1);
    assert.equal(maps.routeElapsed.has(calibration.routes[0].id), false);
    assert.ok([...maps.vehicleStates.keys()].every(key => !key.startsWith(calibration.routes[0].id + ':')));
    assert.ok(maps.routeElapsed.has(calibration.routes[1].id));
  }
});

test('current cross-time Avalon maps are incompatible and explicit restart clears all state', () => {
  const maps = state();
  advanceRouteFleetVehicles({ routes: calibration.routes, routeOptions: calibration.options, ...maps, dtSeconds: 8 });
  const evening = AVALON_PHASE3P.DUSK;
  const result = reconcileTrafficContinuity({ previous: signatures(), next: createTrafficContinuitySignatures(evening.routes, evening.options), ...maps });
  assert.equal(result.retainedRouteIds.length, 0);
  assert.equal(maps.vehicleStates.size, 0);
  maps.vehicleStates.set('orphan:0', { progress: .5 });
  reconcileTrafficContinuity({ previous: signatures(), next: signatures(), restart: true, ...maps });
  assert.ok(Object.values(maps).every(map => map.size === 0));
});

test('repeated compatible switches keep maps bounded and old plate decode cannot unlock a new URL/hash', () => {
  const maps = state();
  for (let i = 0; i < 500; i++) {
    advanceRouteFleetVehicles({ routes: calibration.routes, routeOptions: calibration.options, ...maps, dtSeconds: .02 });
    reconcileTrafficContinuity({ previous: signatures(), next: signatures(), ...maps });
  }
  assert.ok(maps.vehicleStates.size <= calibration.routes.length * 4);
  assert.equal(isDecodedTrafficPlate('old-url|hash', 'new-url|hash'), false);
  assert.equal(isDecodedTrafficPlate('url|old-hash', 'url|new-hash'), false);
  assert.equal(isDecodedTrafficPlate(null, 'url|hash'), false);
  assert.equal(isDecodedTrafficPlate('url|hash', 'url|hash'), true);
});
