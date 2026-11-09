import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createSeasonalTrafficCalibration,
} from '../src/system/metaverse/avalonSeasonalTrafficCalibration.js';

import {
  eligibleSeasonalCalibration,
  seasonalVehicleBody,
  seasonalSpriteBounds,
  seasonalBoundsVisible,
} from '../src/system/metaverse/avalonSeasonalTrafficVerification.js';

import {
  advanceRouteFleetVehicles,
} from '../src/system/metaverse/traffic/metaverseTrafficCorridorRuntime.js';

import {
  createAvalonG3Schedule,
} from '../src/system/metaverse/avalonTrafficG3Scheduler.js';

import { separate } from './helpers/avalonTrafficGeometry.mjs';
import { metaversePrivatePreview } from '../scripts/metaverse/privatePreview.mjs';

const plugin = metaversePrivatePreview();
plugin.configResolved({
  command: 'serve',
  mode: 'development',
  isProduction: false,
  base: '/',
});

const source = plugin.load(
  plugin.resolveId('virtual:avalon-phase3h-vehicles')
);
const assets = JSON.parse(
  source.replace(/^export default /, '').slice(0, -1)
);

const scenes = [
  'AUTUMN/DAY',
  'AUTUMN/DUSK',
  'AUTUMN/NIGHT',
  'WINTER/DAY',
  'WINTER/DUSK',
  'WINTER/NIGHT',
];

test('G3 engine respects individual slot activation', () => {
  const c = eligibleSeasonalCalibration(
    createSeasonalTrafficCalibration('AUTUMN/DAY'),
    assets
  );

  const schedule = createAvalonG3Schedule(c.routes);
  const slotActivation = new Map();

  for (const entries of schedule.values()) {
    for (const entry of entries) {
      slotActivation.set(entry.key, entry.activateAtSeconds);
    }
  }

  const state = {
    vehicleStates: new Map(),
    previousHeadings: new Map(),
    routeElapsed: new Map(),
  };

  const options = Object.fromEntries(
    c.routes.map(route => [
      route.id,
      {
        ...c.options[route.id],
        offsets: Array(schedule.get(route.id).length).fill(0),
        startDelay: 0,
      },
    ])
  );

  const tick = dtSeconds => advanceRouteFleetVehicles({
    routes: c.routes,
    routeOptions: options,
    vehicleCountPerRoute: 3,
    slotActivation,
    dtSeconds,
    ...state,
  });

  const first = tick(0);
  assert.equal(first.length, c.routes.length);

  const before = tick(8);
  assert.equal(before.length, c.routes.length);

  const after = tick(1);
  assert.ok(after.length > before.length);

  for (const entries of schedule.values()) {
    for (const entry of entries) {
      if (entry.activateAtSeconds > 9) {
        assert.equal(state.vehicleStates.has(entry.key), false);
      }
    }
  }
});

for (const scene of scenes) {
  test(`G3 continuous geometry: ${scene}`, () => {
    const c = eligibleSeasonalCalibration(
      createSeasonalTrafficCalibration(scene),
      assets
    );

    const schedule = createAvalonG3Schedule(c.routes);
    const slotActivation = new Map();

    for (const entries of schedule.values()) {
      for (const entry of entries) {
        slotActivation.set(entry.key, entry.activateAtSeconds);
      }
    }

    const options = Object.fromEntries(
      c.routes.map(route => [
        route.id,
        {
          ...c.options[route.id],
          offsets: Array(schedule.get(route.id).length).fill(0),
          startDelay: 0,
        },
      ])
    );

    const state = {
      vehicleStates: new Map(),
      previousHeadings: new Map(),
      routeElapsed: new Map(),
    };

    let peakVisible = 0;
    let peakActive = 0;

    for (let frame = 0; frame < 1800; frame++) {
      const vehicles = advanceRouteFleetVehicles({
        routes: c.routes,
        routeOptions: options,
        vehicleCountPerRoute: 3,
        slotActivation,
        dtSeconds: 0.1,
        ...state,
      });

      peakActive = Math.max(peakActive, vehicles.length);

      const visible = vehicles.filter(v => {
        const route = c.routes.find(r => r.id === v.routeId);
        return route.eligibleModels.some(id =>
          seasonalBoundsVisible(
            seasonalSpriteBounds(
              route,
              assets[id][route.view],
              v.progress
            )
          )
        );
      });

      peakVisible = Math.max(peakVisible, visible.length);

      for (let a = 0; a < visible.length; a++) {
        for (let b = a + 1; b < visible.length; b++) {
          const va = visible[a];
          const vb = visible[b];
          const ra = c.routes.find(r => r.id === va.routeId);
          const rb = c.routes.find(r => r.id === vb.routeId);

          for (const ia of ra.eligibleModels) {
            for (const ib of rb.eligibleModels) {
              assert.ok(
                separate(
                  seasonalVehicleBody(
                    ra, assets[ia][ra.view], va.progress
                  ),
                  seasonalVehicleBody(
                    rb, assets[ib][rb.view], vb.progress
                  )
                ),
                `${scene}: collision at frame ${frame}, ` +
                `${va.key}/${ia} vs ${vb.key}/${ib}`
              );
            }
          }
        }
      }
    }

    const expected = c.routes.reduce(
      (sum, route) => sum + schedule.get(route.id).length,
      0
    );

    assert.equal(peakActive, expected);

    console.log(
      `${scene}: active=${peakActive}, ` +
      `peakVisible=${peakVisible}, expected=${expected}`
    );
  });
}
