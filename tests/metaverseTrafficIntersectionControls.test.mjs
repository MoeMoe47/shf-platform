import test from 'node:test';
import assert from 'node:assert/strict';
import { createTrafficScenario } from './fixtures/trafficControlScenario.mjs';
import { createTrafficControlRegistry } from '../src/system/metaverse/traffic/metaverseTrafficIntersectionControls.js';
import { advanceRouteFleetVehicles } from '../src/system/metaverse/traffic/metaverseTrafficCorridorRuntime.js';
import fs from 'node:fs';

// Execute the preserved pre-change implementation with its original real
// collaborators. This is an independent behavior oracle, never app code.
const legacySource = fs.readFileSync('private-assets/metaverse/avalon-village/phase3i-b-controls/runtime-before.js', 'utf8')
  .replaceAll('"./metaverseTrafficAuthoringModel.js"', JSON.stringify(new URL('../src/system/metaverse/traffic/metaverseTrafficAuthoringModel.js', import.meta.url).href))
  .replaceAll('"./metaverseTrafficLivePreviewModel.js"', JSON.stringify(new URL('../src/system/metaverse/traffic/metaverseTrafficLivePreviewModel.js', import.meta.url).href));
const legacy = (await import('data:text/javascript;base64,'+Buffer.from(legacySource).toString('base64'))).advanceRouteFleetVehicles;

const run = (s, seconds = 35, dt = .02) => {
  const trace = [];
  for (let t = 0; t < seconds; t += dt) trace.push(s.step(dt));
  return trace;
};
const grants = s => s.controlState.events.filter(e => e.type === 'GRANTED');

test('complete bumper stop, configurable hold and bounded acceleration/deceleration precede release', () => {
  const s = createTrafficScenario({ approaches: ['north'], holdSeconds: 1.2 });
  const frames = run(s, 20), v = frames.flat();
  const stopped = v.filter(v => v.trafficControl.status === 'STOPPED');
  assert.ok(stopped.length >= 50);
  assert.ok(stopped.every(v => v.trafficControl.speed === 0 && Math.abs(v.progress-.38) < .00003));
  const stop = s.controlState.events.find(e => e.type === 'STOPPED'), grant = grants(s)[0];
  assert.ok(grant.time-stop.time >= 1.2-1e-9);
  assert.ok(v.some(v => v.progress > .7), 'Vehicle resumes and clears');
  for (let i = 1; i < v.length; i++) if (v[i].progress >= v[i-1].progress) {
    const delta = v[i].trafficControl.speed-v[i-1].trafficControl.speed;
    assert.ok(delta <= 3*.02+1e-8 && delta >= -4*.02-.011, `Unbounded speed change ${delta}`);
  }
});

test('queue body footprints maintain following gap, hold separately, and all eventually release', () => {
  const s = createTrafficScenario({ approaches: ['north'], offsets: { north: [.05,.15,.25] } });
  const frames = run(s, 80);
  for (const frame of frames) {
    const cars = frame.slice().sort((a,b) => a.progress-b.progress);
    for (let i = 1; i < cars.length; i++) assert.ok((cars[i].progress-cars[i-1].progress)*100 >= 6-1e-6, 'Bumper gap at least 2 units');
  }
  assert.ok(grants(s).length >= 6);
  for (const key of ['north:0','north:1','north:2']) assert.ok(grants(s).some(e => e.key === key));
});

test('mixed vehicle lengths queue and re-enter without body overlap', () => {
  const lengths=[4,6,5];
  const s=createTrafficScenario({approaches:['north'],offsets:{north:[.05,.17,.3]},vehicleLengths:lengths});
  for (const frame of run(s,80)) {
    const cars=frame.slice().sort((a,b)=>a.progress-b.progress);
    for(let i=1;i<cars.length;i++) {
      const length=v=>lengths[Number(v.key.split(':')[1])];
      const bumperGap=(cars[i].progress-cars[i-1].progress)*100-(length(cars[i])+length(cars[i-1]))/2;
      assert.ok(bumperGap>=2-1e-6,'Vehicle-specific body lengths preserve the following gap');
    }
  }
  for(const key of ['north:0','north:1','north:2']) assert.ok(grants(s).filter(e=>e.key===key).length>=2);
});

test('all-way stop first arrival wins; simultaneous arrivals yield to the right independent of route order', () => {
  const first = createTrafficScenario({ offsets: { north: [.2], east: [.05] } }); run(first);
  assert.equal(grants(first)[0].key, 'north:0');
  for (const reverse of [false,true]) {
    const tie = createTrafficScenario({ reverse }); run(tie);
    assert.equal(grants(tie)[0].key, 'north:0', 'East yields to north on its right');
  }
  const nearTie = createTrafficScenario({offsets:{north:[.1],east:[.104]}}); run(nearTie);
  assert.equal(grants(nearTie)[0].key,'north:0','Right-hand tie includes a slightly later arrival that must finish its hold');
});

test('simultaneous opposing left turn yields to straight or right movement', () => {
  for (const turn of ['STRAIGHT','RIGHT']) {
    const s = createTrafficScenario({ approaches: ['north','south'], turns: { north: 'LEFT', south: turn } }); run(s);
    assert.equal(grants(s)[0].key, 'south:0');
  }
});

test('four-way simultaneous right-hand cycle clears deterministically without conflict overlap or deadlock', () => {
  const make = reverse => createTrafficScenario({ approaches: ['north','east','south','west'], reverse });
  const a = make(false), b = make(true);
  const frames = run(a, 100); run(b, 100);
  assert.deepEqual(a.controlState.events, b.controlState.events);
  for (const frame of frames) {
    const occupants = frame.filter(v => v.progress*100+2 > 40+1e-6 && v.progress*100-2 < 60);
    assert.ok(occupants.length <= 1, 'Conflict zone exclusive until rear clearance');
  }
  for (const id of ['north','east','south','west']) assert.ok(grants(a).some(e => e.key === id+':0'));
  assert.ok(grants(a).length >= 8);
});

test('two-way stop yields to priority road and releases only after rear clearance', () => {
  const s = createTrafficScenario({ type: 'TWO_WAY_STOP', offsets: {north:[.25], east:[.1]} });
  const frames = run(s, 30);
  assert.equal(grants(s)[0].key, 'east:0');
  assert.ok(!s.controlState.events.some(e => e.key === 'east:0' && e.type === 'STOPPED'));
  assert.ok(s.controlState.events.some(e => e.key === 'north:0' && e.type === 'STOPPED'));
  const clear = s.controlState.events.find(e => e.key === 'east:0' && e.type === 'CLEARED');
  assert.ok(grants(s).find(e => e.key === 'north:0').time >= clear.time);
  for (const frame of frames) assert.ok(frame.filter(v => v.progress > .38+1e-6 && v.progress < .62).length <= 1);
});

test('crosswalk consumes explicit real occupancy input; no fabricated or mandatory stop when empty', () => {
  const s = createTrafficScenario({ type:'CROSSWALK', approaches:['north'] });
  s.pedestrianOccupancy['isolated-junction'] = true;
  const blocked = run(s, 12).flat();
  assert.ok(blocked.every(v => v.progress <= .38+1e-6));
  assert.equal(grants(s).length, 0);
  s.pedestrianOccupancy['isolated-junction'] = false;
  assert.ok(run(s, 12).flat().some(v => v.progress > .65));
  const empty = createTrafficScenario({type:'CROSSWALK', approaches:['north']}); run(empty,15);
  assert.ok(!empty.controlState.events.some(e => e.type==='STOPPED'));
});

test('pause preserves position/holds; large dt substeps retain conflict safety and release', () => {
  const s = createTrafficScenario(); run(s,5);
  const before = structuredClone(s.controlState), frame = s.step(0);
  assert.deepEqual(s.step(0), frame);
  assert.equal(s.controlState.elapsed, before.elapsed);
  assert.deepEqual(s.controlState, before);
  const frames = run(s,40,1);
  assert.ok(grants(s).length>=2);
  assert.ok(frames.every(f=>f.filter(v=>v.progress>.380001&&v.progress<.62).length<=1));
});

test('no controls preserve exact legacy behavior, output shape and lifecycle', () => {
  const a = createTrafficScenario(), b = createTrafficScenario();
  for (let i=0;i<3000;i++) {
    const dtSeconds = [0,.016,.05,.19][i%4];
    assert.deepEqual(a.step(dtSeconds,false), legacy({routes:b.routes,routeOptions:b.routeOptions,...b.engine,dtSeconds}));
    assert.ok(a.step(0,false).every(v=>!('trafficControl' in v)));
  }
});

test('uncontrolled route in a mixed fleet remains byte-for-byte behavior compatible', () => {
  const a = createTrafficScenario(), b = createTrafficScenario();
  const input = structuredClone(a.registry);
  input.intersections[0].approaches = input.intersections[0].approaches.filter(a => a.routeId==='north');
  delete input.intersections[0].approaches[0].rightApproachId;
  const registry = createTrafficControlRegistry(input);
  // A varying speed profile and nonzero route-index delay make accidental
  // substepping/reindexing of uncontrolled routes observable.
  for (const s of [a,b]) { s.routeOptions.east.speedProfile=[{t:0,scale:.4},{t:1,scale:1}]; delete s.routeOptions.east.startDelay; }
  for (let i=0;i<1000;i++) {
    const dtSeconds=[.03,.2,.11][i%3];
    const actual=advanceRouteFleetVehicles({routes:a.routes,routeOptions:a.routeOptions,...a.engine,dtSeconds,intersectionControls:{registry,state:a.controlState}});
    const expected=legacy({routes:b.routes,routeOptions:b.routeOptions,...b.engine,dtSeconds});
    assert.deepEqual(actual.filter(v=>v.routeId==='east'),expected.filter(v=>v.routeId==='east'));
  }
});

test('pedestrian occupancy detected during approach revokes an upstream reservation and releases when clear', () => {
  const s=createTrafficScenario({type:'CROSSWALK',approaches:['north']});
  run(s,2);
  s.pedestrianOccupancy['isolated-junction']=true;
  const blocked=run(s,10).flat();
  assert.ok(blocked.every(v=>v.progress<=.380001));
  s.pedestrianOccupancy['isolated-junction']=false;
  assert.ok(run(s,15).flat().some(v=>v.progress>.7));
});

test('invalid topology, footprints and unsafe initial placement fail explicitly', () => {
  const base = createTrafficScenario();
  const bad = structuredClone(base.registry);
  bad.intersections[0].approaches[0].exitProgress = .2;
  assert.throws(()=>createTrafficControlRegistry(bad), /Invalid/);
  assert.throws(()=>createTrafficScenario({approaches:['north'],offsets:{north:[.5]}}).step(), /spawn before/);
  assert.throws(()=>createTrafficScenario({approaches:['north'],offsets:{north:[.1,.12]}}).step(), /overlapping/);
  assert.throws(()=>createTrafficScenario({approaches:['north'],offsets:{north:[.1,.1]}}).step(), /overlapping/);
  const zero = createTrafficScenario(); zero.routeOptions.north.progressPerSecond = 0;
  assert.throws(()=>zero.step(), /positive cruise/);
});
