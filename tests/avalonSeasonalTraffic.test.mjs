import test from 'node:test';
import assert from 'node:assert/strict';
import { AVALON_SEASONAL_ROADS, createSeasonalTrafficCalibration } from '../src/system/metaverse/avalonSeasonalTrafficCalibration.js';
import { eligibleSeasonalCalibration, verifySeasonalRoute, seasonalVehicleBody, seasonalSpriteBounds, seasonalBoundsVisible } from '../src/system/metaverse/avalonSeasonalTrafficVerification.js';
import { seasonalTrafficPreviewAllowed } from '../src/system/metaverse/avalonSeasonalTrafficPreview.js';
import { advanceRouteFleetVehicles } from '../src/system/metaverse/traffic/metaverseTrafficCorridorRuntime.js';
import { separate } from './helpers/avalonTrafficGeometry.mjs';
import { metaversePrivatePreview } from '../scripts/metaverse/privatePreview.mjs';
const plugin=metaversePrivatePreview();plugin.configResolved({command:'serve',mode:'development',isProduction:false,base:'/'});
const assets=JSON.parse(plugin.load(plugin.resolveId('virtual:avalon-phase3h-vehicles')).replace(/^export default /,'').slice(0,-1));

test('six independently hash-bound calibrations provide at least one safe route; no global or wildcard gate', () => {
  for (const key of Object.keys(AVALON_SEASONAL_ROADS)) {
    const c = eligibleSeasonalCalibration(createSeasonalTrafficCalibration(key), assets);
    assert.ok(c.routes.length > 0, key);
    const [season, time] = key.split('/');
    const background = { seasonalPreviewSelected: true, seasonalSeason: season, resolvedTimeOfDay: time, sourceHashes: { [time]: c.sha256 } };
    const search = `?metaverseDev=1&worldTimePreview=1&destination=avalon-village&avalonSeasonalTraffic=${key.replace('/', '-').toLowerCase()}`;
    assert.equal(seasonalTrafficPreviewAllowed({ isDev: true, search, background }), true);
    for (const input of [{ isDev: false }, { search: search.replace('avalonSeasonalTraffic=', 'other=') }, { search: search.replace(key.replace('/', '-').toLowerCase(), 'all') }, { background: { ...background, sourceHashes: { [time]: 'changed' } } }]) {
      assert.equal(seasonalTrafficPreviewAllowed({ isDev: true, search, background, ...input }), false);
    }
  }
});

test('unverified models, interior spawn offsets, changed geometry and oversized vehicles fail closed', () => {
  const c = createSeasonalTrafficCalibration('WINTER/DAY'), rear = c.routes[0], east = c.routes[1];
  assert.equal(verifySeasonalRoute(rear, c, assets['sedan-blue'][rear.view]).enabled, false);
  assert.equal(verifySeasonalRoute(east, c, {}).enabled, false);
  assert.equal(verifySeasonalRoute(east, c, { ...assets['sedan-blue'][east.view], baseScale: 3 }).enabled, false);
  assert.equal(verifySeasonalRoute({ ...east, points: east.points.map(p => ({ ...p, y: p.y - 25 })) }, c, assets['sedan-blue'][east.view]).enabled, false);
  assert.equal(verifySeasonalRoute(east, { ...c, options: { [east.id]: { offsets: [.5] } } }, assets['sedan-blue'][east.view]).enabled, false);
});

test('shared engine completes repeat journeys without body collisions, visible fades or interior respawn', () => {
  for (const key of Object.keys(AVALON_SEASONAL_ROADS)) {
    const c = eligibleSeasonalCalibration(createSeasonalTrafficCalibration(key), assets);
    const state = { vehicleStates: new Map(), previousHeadings: new Map(), routeElapsed: new Map() };
    for (let i = 0; i < 1800; i++) {
      const vehicles = advanceRouteFleetVehicles({ routes: c.routes, routeOptions: c.options, ...state, dtSeconds: .1 });
      for (const v of vehicles) {
        const route = c.routes.find(r => r.id === v.routeId);
        for (const id of route.eligibleModels) if (seasonalBoundsVisible(seasonalSpriteBounds(route, assets[id][route.view], v.progress))) assert.equal(v.opacity, 1, `${key} visible fade`);
      }
      for (let a = 0; a < vehicles.length; a++) for (let b = a + 1; b < vehicles.length; b++) {
        const ra = c.routes.find(r => r.id === vehicles[a].routeId), rb = c.routes.find(r => r.id === vehicles[b].routeId);
        for (const ia of ra.eligibleModels) for (const ib of rb.eligibleModels) assert.ok(separate(seasonalVehicleBody(ra, assets[ia][ra.view], vehicles[a].progress), seasonalVehicleBody(rb, assets[ib][rb.view], vehicles[b].progress)), `${key} collision`);
      }
    }
    const paused = JSON.stringify([...state.vehicleStates]);
    advanceRouteFleetVehicles({ routes: c.routes, routeOptions: c.options, ...state, dtSeconds: 0 });
    assert.equal(JSON.stringify([...state.vehicleStates]), paused);
  }
});
