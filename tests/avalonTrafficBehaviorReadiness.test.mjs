import test from 'node:test';
import assert from 'node:assert/strict';
import { createTrafficScenario } from './fixtures/trafficControlScenario.mjs';

test('existing controller holds synthetic mapped bumper stops at least two simulation seconds; pause consumes no hold time', () => {
  const s=createTrafficScenario({holdSeconds:2});
  let paused=false;
  for(let i=0;i<4000;i++) {
    const frame=s.step(.02);
    for(const v of frame) if(v.trafficControl.status==='STOPPED') {
      assert.equal(v.trafficControl.speed,0);
      assert.ok(Math.abs(v.progress-.38)<.00003,'100-unit synthetic corridor, 4-unit car bumper at line 40');
      if(!paused) {
        const before=structuredClone(s.controlState), position=frame.map(v=>v.progress);
        for(let j=0;j<200;j++)assert.deepEqual(s.step(0).map(v=>v.progress),position);
        assert.deepEqual(s.controlState,before);paused=true;
      }
    }
    const occupants=frame.filter(v=>v.progress>.380001&&v.progress<.62);
    assert.ok(occupants.length<=1,'exclusive reservation until full rear clearance');
  }
  const events=s.controlState.events;
  const grants=events.filter(e=>e.type==='GRANTED');assert.ok(grants.length>=4);assert.ok(paused);
  for(const grant of grants) {
    const stop=events.filter(e=>e.type==='STOPPED'&&e.key===grant.key&&e.time<=grant.time).at(-1);
    assert.ok(stop);assert.ok(grant.time-stop.time>=2-1e-9);
  }
});
