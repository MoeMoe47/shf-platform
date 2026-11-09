import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createAvalonG3Schedule,
  activeAvalonG3Slots,
} from '../src/system/metaverse/avalonTrafficG3Scheduler.js';

const routes = [
  { id: 'rear', view: 'rear-west' },
  { id: 'front', view: 'front-garden' },
];

test('G3 schedules two rear and three front vehicles', () => {
  const schedule = createAvalonG3Schedule(routes);
  assert.equal(schedule.get('rear').length, 2);
  assert.equal(schedule.get('front').length, 3);
});

test('G3 vehicles activate individually from progress zero', () => {
  const schedule = createAvalonG3Schedule(routes);

  assert.equal(activeAvalonG3Slots(schedule, 'front', 0).length, 1);
  assert.equal(activeAvalonG3Slots(schedule, 'front', 8).length, 1);
  assert.equal(activeAvalonG3Slots(schedule, 'front', 9).length, 2);
  assert.equal(activeAvalonG3Slots(schedule, 'front', 18).length, 3);

  for (const entries of schedule.values()) {
    for (const entry of entries) {
      assert.equal(entry.startProgress, 0);
    }
  }
});

test('G3 rejects invalid scheduling rates', () => {
  assert.throws(() =>
    createAvalonG3Schedule(routes, { progressPerSecond: 0 })
  );
  assert.throws(() =>
    createAvalonG3Schedule(routes, { spacingProgress: 1 })
  );
});

test('G3 handles unavailable routes without inventing them', () => {
  const schedule = createAvalonG3Schedule([routes[1]]);
  assert.equal(schedule.has('rear'), false);
  assert.equal(schedule.get('front').length, 3);
});
